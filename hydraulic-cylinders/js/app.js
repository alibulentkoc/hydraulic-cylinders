(function () {
  const $ = id => document.getElementById(id);
  const TYPES = window.CYLINDERS.list;
  const v2 = new CylEngine.View2D($('sec')), v3 = new CylEngine.View3D($('v3d'));
  let type = null, opts = {}, u = 0, dir = 1, playing = !matchMedia('(prefers-reduced-motion: reduce)').matches, hold = 0, flipAfterHold = false, target = null, mode = '2d', units = 'si';
  const inputs = {};

  /* ---------- units ---------- */
  const CONS = { si: { len: ['m', 1], area: ['m²', 1], p: ['Pa', 1], F: ['N', 1], Q: ['m³/s', 1], v: ['m/s', 1], k: ['N/m', 1] },
    us: { len: ['in', 1 / 0.0254], area: ['in²', 1 / 0.00064516], p: ['psi', 1 / 6894.757], F: ['lbf', 1 / 4.448222], Q: ['in³/s', 1 / 1.6387064e-5], v: ['in/s', 1 / 0.0254], k: ['lbf/in', 0.0254 / 4.448222] } };
  const EVERY = { si: { len: ['mm', 1000, 0], area: ['cm²', 1e4, 1], p: ['bar', 1e-5, 1], F: ['kN', 1e-3, 2], Q: ['L/min', 60000, 1], v: ['mm/s', 1000, 0], k: ['N/mm', 1e-3, 1] },
    us: { len: ['in', 1 / 0.0254, 2], area: ['in²', 1 / 0.00064516, 2], p: ['psi', 1 / 6894.757, 0], F: ['lbf', 1 / 4.448222, 0], Q: ['gpm', 15850.32, 2], v: ['in/s', 1 / 0.0254, 2], k: ['lbf/in', 0.0254 / 4.448222, 1] } };
  const fmt = (x, d) => (isFinite(x) ? x : 0).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  const SUP = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
  const sg = x => { if (!isFinite(x) || x === 0) return '0'; const a = Math.abs(x);
    if (a >= 1e-3 && a < 1e6) { const d = a >= 10000 ? 0 : a >= 1000 ? 1 : a >= 100 ? 1 : a >= 10 ? 2 : a >= 1 ? 3 : Math.max(4, 3 - Math.floor(Math.log10(a))); return fmt(x, d); }
    const e = Math.floor(Math.log10(a)); return `${(x / 10 ** e).toFixed(3)} × 10${String(e).split('').map(c => SUP[c]).join('')}`; };
  const H = {
    n: (x, k) => { const t = sg(x * CONS[units][k][1]); return t.includes('×') ? `(${t})` : t; },
    e: (x, k) => { const E = EVERY[units][k]; return `${fmt(x * E[1], E[2])} ${E[0]}`; },
    r: (x, k) => `${sg(x * CONS[units][k][1])} ${CONS[units][k][0]} = <b>${H.e(x, k)}</b>`,
    f: (x, d) => fmt(x, d)
  };

  /* ---------- type list ---------- */
  const ul = $('typeList');
  TYPES.forEach(t => { const li = document.createElement('li');
    li.innerHTML = `<button class="typebtn" data-type="${t.id}"><svg viewBox="0 0 220 90" aria-hidden="true">${t.symbol}</svg><span>${t.name}</span></button>`; ul.appendChild(li); });
  const li = document.createElement('li');
  li.innerHTML = '<a class="typebtn" href="seals.html"><svg viewBox="0 0 220 90" aria-hidden="true"><rect x="30" y="20" width="120" height="40"/><circle cx="60" cy="20" r="6"/><circle cx="60" cy="60" r="6"/></svg><span>Seals: static and dynamic</span></a>';
  ul.appendChild(li);
  ul.addEventListener('click', e => { const b = e.target.closest('[data-type]'); if (b) { location.hash = b.dataset.type; } });
  window.addEventListener('hashchange', () => select(location.hash.slice(1)));

  function select(id) {
    type = TYPES.find(t => t.id === id) || TYPES[0];
    document.querySelectorAll('[data-type]').forEach(b => { if (b.dataset.type === type.id) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
    opts = {}; (type.options || []).forEach(o => opts[o.id] = o.def);
    u = 0; dir = 1; target = null; hold = 0;
    $('typeName').textContent = type.name;
    $('summary').textContent = type.summary; $('uses').textContent = type.uses; $('watch').textContent = type.watch;
    $('steps').innerHTML = type.steps.map(s => `<li>${s}</li>`).join('');
    $('symbol').innerHTML = type.symbol;
    buildExtra(); rebuild(); buildCalc();
    document.title = `${type.name} cylinder: animated cross-section`;
  }
  function rebuild() { v2.build(type, opts); if (mode === '3d') v3.build(type, opts); else v3.dirty = true; }
  function buildExtra() {
    const ex = $('extra'); ex.innerHTML = '';
    (type.options || []).forEach(o => { const l = document.createElement('label'); l.innerHTML = `<input type="checkbox" ${opts[o.id] ? 'checked' : ''}> ${o.label}`;
      l.querySelector('input').addEventListener('change', e => { opts[o.id] = e.target.checked; rebuild(); }); ex.appendChild(l); });
    if (type.positions) { const g = document.createElement('span'); g.className = 'seg'; g.setAttribute('role', 'group'); g.setAttribute('aria-label', 'Go to position');
      type.positions.forEach(p => { const b = document.createElement('button'); b.textContent = p.label; b.addEventListener('click', () => { target = p.u; hold = 0; flipAfterHold = false; playing = false; syncPlay(); }); g.appendChild(b); });
      ex.appendChild(g); }
  }

  /* ---------- calculator ---------- */
  function buildCalc() {
    const box = $('calcIn'); box.innerHTML = '';
    for (const k in inputs) delete inputs[k];
    type.calc.inputs.forEach(([id, label, kind, def]) => {
      inputs[id] = { kind, si: def };
      const l = document.createElement('label');
      l.innerHTML = `${label}<span class="in"><input type="number" step="any" id="ci-${id}"><span class="u" id="cu-${id}"></span></span>`;
      box.appendChild(l);
      l.querySelector('input').addEventListener('change', e => { const x = parseFloat(e.target.value); if (isFinite(x)) inputs[id].si = x / EVERY[units][kind][1]; calc(); });
    });
    syncCalcInputs(); calc();
  }
  function syncCalcInputs() { for (const id in inputs) { const { kind, si } = inputs[id], E = EVERY[units][kind]; $('ci-' + id).value = +(si * E[1]).toFixed(Math.max(E[2], 2)); $('cu-' + id).textContent = E[0]; } }
  function calc() {
    const v = {}; for (const id in inputs) v[id] = inputs[id].si;
    const rows = type.calc.compute(v, H);
    $('calcOut').innerHTML = rows.map(r => `<tr><td>${r.label}</td><td class="eq">${r.eq}</td><td class="sub">${r.sub}</td><td class="res">${r.res}</td></tr>`).join('');
    $('calcNote').textContent = units === 'us' ? 'Consistent US units in the substitutions: lbf, inches, seconds (psi, in², in³/s, in/s). Results are also shown in everyday units.'
      : 'Consistent SI units in the substitutions: newtons, metres, seconds (Pa, m², m³/s, m/s). Results are also shown in everyday units. Ideal model: friction and leakage are ignored.';
  }
  document.querySelectorAll('[data-units]').forEach(b => b.addEventListener('click', () => { units = b.dataset.units;
    document.querySelectorAll('[data-units]').forEach(x => x.setAttribute('aria-pressed', x === b)); syncCalcInputs(); calc(); }));

  /* ---------- view mode and controls ---------- */
  document.querySelectorAll('[data-mode]').forEach(b => b.addEventListener('click', () => { mode = b.dataset.mode;
    document.querySelectorAll('[data-mode]').forEach(x => x.setAttribute('aria-pressed', x === b));
    $('sec').style.display = mode === '3d' ? 'none' : ''; $('v3d').hidden = mode !== '3d';
    if (mode === '3d') { if (v3.dirty || !v3.root) { v3.build(type, opts); v3.dirty = false; } v3.resize(); } }));
  document.querySelectorAll('[data-v3]').forEach(b => b.addEventListener('click', () => { v3.setView(b.dataset.v3); document.querySelectorAll('[data-v3]').forEach(x => x.setAttribute('aria-pressed', x === b)); }));
  v3.onManual = () => document.querySelectorAll('[data-v3]').forEach(x => x.setAttribute('aria-pressed', 'false'));
  const syncPlay = () => { $('play').textContent = playing ? 'Pause' : 'Play'; $('play').setAttribute('aria-pressed', playing); };
  syncPlay();
  $('play').addEventListener('click', () => { playing = !playing; target = null; syncPlay(); });
  $('rev').addEventListener('click', () => { dir *= -1; hold = 0; flipAfterHold = false; });
  $('pos').addEventListener('input', e => { playing = false; target = null; syncPlay(); const nu = +e.target.value; if (nu !== u) dir = nu > u ? 1 : -1; u = nu; });
  $('labels').addEventListener('change', e => { $('sec').classList.toggle('nolabels', !e.target.checked); $('v3d').classList.toggle('nolabels', !e.target.checked); });

  /* ---------- loop ---------- */
  let last = performance.now(), lastStatus = '';
  function frame(t) {
    const dt = Math.min((t - last) / 1000, 0.05); last = t;
    const T = +$('spd').value; let moving = false;
    if (target !== null) {
      const d = target - u;
      if (Math.abs(d) < 1e-4) { u = target; target = null; }
      else { dir = Math.sign(d); u += dir * Math.min(Math.abs(d), dt / T); moving = true; }
    } else if (playing) {
      if (hold > 0) { hold -= dt; if (hold <= 0 && flipAfterHold) { dir *= -1; flipAfterHold = false; } }
      else {
        const nu = u + dir * dt / T, hs = type.holds || [];
        const crossed = hs.find(h => (u < h && nu >= h) || (u > h && nu <= h));
        if (crossed !== undefined && Math.abs(u - crossed) > 1e-6) { u = crossed; hold = 0.6; }
        else u = Math.min(1, Math.max(0, nu));
        if (u >= 1 && dir > 0) { hold = 0.9; flipAfterHold = true; }
        else if (u <= 0 && dir < 0) { hold = 0.9; flipAfterHold = true; }
        moving = true;
      }
    }
    $('pos').value = u;
    const st = type.state(u, dir, opts);
    if (mode === '2d') v2.update(st, moving, dt); else v3.update(st, moving, dt);
    if (st.status !== lastStatus) { $('status').textContent = st.status; lastStatus = st.status; }
    requestAnimationFrame(frame);
  }
  select(location.hash.slice(1));
  requestAnimationFrame(frame);
})();

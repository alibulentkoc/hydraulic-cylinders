/* Drawing engine: one model, two views (2D section in SVG, 3D cutaway in three.js). */
window.CylEngine = (function () {
  const NS = 'http://www.w3.org/2000/svg';
  const S = 6; // px per model unit in the 2D view
  const el = (tag, attrs, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; };
  const pts = (profile, sign) => profile.map(([r, a]) => `${(a * S).toFixed(2)},${(sign * r * S).toFixed(2)}`).join(' ');
  const css = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();

  /* bounds over the whole stroke */
  function bounds(type, model, opts) {
    let aMin = Infinity, aMax = -Infinity, rMax = 0;
    const span = (p, da) => {
      if (p.kind === 'solid' || p.kind === 'tie') { aMin = Math.min(aMin, p.a0 + da); aMax = Math.max(aMax, p.a1 + da); rMax = Math.max(rMax, p.r); }
      else if (p.kind === 'eye') { aMin = Math.min(aMin, p.a - p.r + da); aMax = Math.max(aMax, p.a + p.r + da); }
      else p.profile.forEach(([r, a]) => { aMin = Math.min(aMin, a + da); aMax = Math.max(aMax, a + da); rMax = Math.max(rMax, r); });
    };
    for (let i = 0; i <= 8; i++) {
      const st = type.state(i / 8, 1, opts);
      model.parts.forEach(p => span(p, p.g === 'fixed' ? 0 : (st.groups[p.g] || {}).da || 0));
    }
    return { aMin, aMax, rMax: model.rMaxOverride || Math.min(rMax, 14) };
  }

  /* ---------------- 2D ---------------- */
  class View2D {
    constructor(svg) { this.svg = svg; }
    build(type, opts) {
      this.type = type; this.opts = opts;
      const m = this.model = type.build(opts);
      const b = this.b = bounds(type, m, opts);
      const svg = this.svg; svg.innerHTML = '';
      const R = b.rMax;
      this.yPortTop = -(R + 4.2) * S; this.yPortLab = -(R + 5.4) * S; this.yTopLab = -(R + 10.4) * S;
      this.yDim = (R + 2.6) * S; this.yBot = [(R + 7.8) * S, (R + 10.2) * S];
      const x0 = b.aMin * S - 80, w = (b.aMax - b.aMin) * S + 160, y0 = -(R + 12.4) * S, h = (R + 12.4) * S + (R + 11.8) * S;
      svg.setAttribute('viewBox', `${x0.toFixed(0)} ${y0.toFixed(0)} ${w.toFixed(0)} ${h.toFixed(0)}`);
      this.bx = [x0 + 6, x0 + w - 6];
      const defs = el('defs', {}, svg);
      const pat = el('pattern', { id: 'hatch', width: 7, height: 7, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' }, defs);
      el('rect', { width: 7, height: 7, class: 'hatch-bg' }, pat); el('line', { x1: 0, y1: 0, x2: 0, y2: 7, class: 'hatch-line' }, pat);
      const gr = el('linearGradient', { id: 'rodgrad', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
      [['0', '--rod'], ['.4', '--rod-hi'], ['1', '--steel']].forEach(([o, c]) => el('stop', { offset: o, style: `stop-color:var(${c})` }, gr));
      const mk = el('marker', { id: 'arrowhead', viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 6, markerHeight: 6, orient: 'auto-start-reverse' }, defs);
      el('path', { d: 'M0,0 L10,5 L0,10 z', class: 'arrowfill' }, mk);
      this.L = {}; ['ch', 'ports', 'parts', 'springs', 'dims', 'labels'].forEach(k => this.L[k] = el('g', {}, svg));
      // groups
      this.G = { fixed: el('g', {}, this.L.parts) };
      Object.keys(m.groups).forEach(id => this.G[id] = el('g', {}, this.L.parts));
      const order = { tie: 0, solid: 1, eye: 2, cut: 3, dyn: 4, stat: 5 };
      const sorted = m.parts.slice().sort((p, q) => order[p.kind] - order[q.kind]);
      sorted.forEach(p => {
        const g = this.G[p.g];
        if (p.kind === 'solid') { el('rect', { x: p.a0 * S, y: -p.r * S, width: (p.a1 - p.a0) * S, height: 2 * p.r * S, class: 'rod' }, g); }
        else if (p.kind === 'tie') { [-1, 1].forEach(sg => { el('rect', { x: p.a0 * S, y: (sg * p.r - 0.35) * S, width: (p.a1 - p.a0) * S, height: 0.7 * S, class: 'tierod' }, g);
          el('rect', { x: (p.a0 - 1.2) * S, y: (sg * p.r - 1) * S, width: 1.2 * S, height: 2 * S, class: 'nut' }, g); el('rect', { x: p.a1 * S, y: (sg * p.r - 1) * S, width: 1.2 * S, height: 2 * S, class: 'nut' }, g); }); }
        else if (p.kind === 'eye') { el('circle', { cx: p.a * S, cy: 0, r: p.r * S, class: 'eye' }, g); el('circle', { cx: p.a * S, cy: 0, r: p.r * 0.45 * S, class: 'eyehole' }, g); }
        else { const cls = p.kind === 'cut' ? 'cut' : p.kind === 'dyn' ? 's-dyn' : 's-stat';
          el('polygon', { points: pts(p.profile, -1), class: cls }, g); el('polygon', { points: pts(p.profile, 1), class: cls }, g); }
      });
      // ports
      this.portEls = {};
      let lastX = -1e9, lift = 0;
      m.ports.slice().sort((p, q) => p.a - q.a).forEach(pt => {
        const x = pt.a * S, rT = -(pt.r || R) * S;
        lift = (x - lastX < pt.label.length * 6.8 + 8 && lift === 0) ? 15 : 0; lastX = x;
        const d = `M${x},${this.yPortTop} V${rT + 2}`;
        el('path', { d, class: 'pipe-wall' }, this.L.ports);
        const fl = el('path', { d, class: 'pipe-lp' }, this.L.ports);
        const fw = el('path', { d, class: 'flow' }, this.L.ports);
        const t = el('text', { x, y: this.yPortLab - lift, class: 'lbl lbl-bg', 'text-anchor': 'middle' }, this.L.ports); t.textContent = pt.label;
        this.portEls[pt.id] = { fl, fw };
      });
      // chambers pool
      this.chEls = [];
      // labels
      this.labEls = m.labels.map(lb => {
        const leader = el('path', { class: 'leader' }, this.L.labels);
        const t = el('text', { class: 'lbl lbl-bg', 'text-anchor': 'middle' }, this.L.labels); t.textContent = lb.text;
        return { lb, leader, t, w: lb.text.length * 6.6 + 10 };
      });
      this.springEls = []; this.dimEls = []; this.flowOff = 0;
    }
    update(st, moving, dt) {
      const svg = this.svg, b = this.b;
      // groups
      for (const id in st.groups) { const g = st.groups[id], el2 = this.G[id]; if (!el2) continue;
        const piv = (this.model.groups[id] || {}).pivot;
        el2.setAttribute('transform', (g.tilt && piv !== undefined ? `rotate(${g.tilt} ${piv * S} 0) ` : '') + `translate(${(g.da || 0) * S} 0)`); }
      // chambers
      while (this.chEls.length < st.chambers.length) this.chEls.push([el('rect', {}, this.L.ch), el('rect', {}, this.L.ch)]);
      this.chEls.forEach((pair, i) => { const c = st.chambers[i];
        pair.forEach((r, k) => { if (!c || c.a1 <= c.a0) { r.setAttribute('width', 0); return; }
          r.setAttribute('x', c.a0 * S); r.setAttribute('width', (c.a1 - c.a0) * S); r.setAttribute('height', (c.rOut - c.rIn) * S);
          r.setAttribute('y', k === 0 ? -c.rOut * S : c.rIn * S); r.setAttribute('class', 'ch-' + c.f); }); });
      // ports
      this.flowOff += dt * 40;
      for (const id in this.portEls) { const s = (st.ports || {})[id] || { f: 'lp', flow: 0 }, e = this.portEls[id];
        e.fl.setAttribute('class', 'pipe-' + s.f); e.fw.style.strokeDashoffset = (moving ? -s.flow : 0) * this.flowOff; e.fw.style.opacity = moving && s.flow ? 1 : 0; }
      // springs
      const sp = st.springs || [];
      while (this.springEls.length < sp.length) this.springEls.push(el('polyline', { class: 'spring' }, this.L.springs));
      this.springEls.forEach((pl, i) => { const s = sp[i]; if (!s) { pl.setAttribute('points', ''); return; }
        const n = s.turns * 2, P = [];
        for (let j = 0; j <= n; j++) P.push(`${((s.a0 + (s.a1 - s.a0) * j / n) * S).toFixed(1)},${((j % 2 ? 1 : -1) * s.rc * S).toFixed(1)}`);
        pl.setAttribute('points', P.join(' ')); pl.style.strokeWidth = s.wire * S; });
      // dims
      const dims = st.dims || [];
      while (this.dimEls.length < dims.length) { const g = el('g', {}, this.L.dims); this.dimEls.push({ line: el('line', { class: 'dim', 'marker-start': 'url(#arrowhead)', 'marker-end': 'url(#arrowhead)' }, g), t: el('text', { class: 'dimtxt', 'text-anchor': 'middle' }, g), e1: el('line', { class: 'ext' }, g), e2: el('line', { class: 'ext' }, g) }); }
      this.dimEls.forEach((d, i) => { const dm = dims[i]; const show = dm && dm.a1 - dm.a0 > 0.5;
        [d.line, d.t, d.e1, d.e2].forEach(x => { x.style.display = show ? '' : 'none'; x.setAttribute('visibility', show ? 'visible' : 'hidden'); }); if (!show) return;
        const y = this.yDim + (dm.row || 0) * 2.3 * S, x1 = dm.a0 * S, x2 = dm.a1 * S;
        d.line.setAttribute('x1', x1); d.line.setAttribute('x2', x2); d.line.setAttribute('y1', y); d.line.setAttribute('y2', y);
        d.e1.setAttribute('x1', x1); d.e1.setAttribute('x2', x1); d.e1.setAttribute('y1', y - 8); d.e1.setAttribute('y2', y + 4);
        d.e2.setAttribute('x1', x2); d.e2.setAttribute('x2', x2); d.e2.setAttribute('y1', y - 8); d.e2.setAttribute('y2', y + 4);
        d.t.setAttribute('x', (x1 + x2) / 2); d.t.setAttribute('y', y - 4); d.t.textContent = dm.text; });
      // labels: spread along each side
      ['top', 'bot'].forEach(side => {
        const L = this.labEls.filter(l => l.lb.side === side).map(l => { const g = st.groups[l.lb.g] || {}; return { l, ax: (l.lb.a + (l.lb.g === 'fixed' ? 0 : g.da || 0)) * S, ay: (side === 'top' ? -1 : 1) * l.lb.r * S }; });
        L.sort((p, q) => p.ax - q.ax);
        L.forEach((o, i) => { o.row = side === 'top' ? 0 : i % 2; o.x = o.ax; });
        const rows = side === 'top' ? [0] : [0, 1];
        rows.forEach(rw => { const R = L.filter(o => o.row === rw); for (let i = 1; i < R.length; i++) { const min = R[i - 1].x + (R[i - 1].l.w + R[i].l.w) / 2 + 6; if (R[i].x < min) R[i].x = min; }
          const over = R.length ? R[R.length - 1].x + R[R.length - 1].l.w / 2 - this.bx[1] : 0; if (over > 0) R.forEach(o => o.x -= over);
          for (let i = 0; i < R.length; i++) { const lo = this.bx[0] + R[i].l.w / 2; if (R[i].x < lo) R[i].x = lo; } });
        L.forEach(o => { const ty = side === 'top' ? this.yTopLab : this.yBot[o.row];
          o.l.t.setAttribute('x', o.x); o.l.t.setAttribute('y', ty + (side === 'top' ? 0 : 4));
          o.l.leader.setAttribute('d', `M${o.ax},${o.ay} L${o.x},${ty + (side === 'top' ? 4 : -10)}`); });
      });
    }
  }

  /* ---------------- 3D ---------------- */
  class View3D {
    constructor(box) { this.box = box; this.ready = false; }
    init() {
      if (this.ready) return; this.ready = true;
      const box = this.box;
      const r = this.renderer = new THREE.WebGLRenderer({ antialias: true });
      r.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)); box.appendChild(r.domElement);
      r.domElement.tabIndex = 0; r.domElement.setAttribute('aria-label', '3D cutaway view. Drag to rotate, scroll or pinch to zoom, arrow keys to rotate.');
      this.scene = new THREE.Scene(); this.camera = new THREE.PerspectiveCamera(30, 2, 0.1, 2000);
      this.scene.add(new THREE.HemisphereLight(0xffffff, 0x606870, 0.8));
      const k = new THREE.DirectionalLight(0xffffff, 0.75); k.position.set(40, 80, 100); this.scene.add(k);
      const f = new THREE.DirectionalLight(0xffffff, 0.3); f.position.set(-80, -30, -60); this.scene.add(f);
      const std = o => new THREE.MeshStandardMaterial(Object.assign({ side: THREE.DoubleSide, metalness: .35, roughness: .5 }, o));
      this.M = { steel: std({}), cut: std({ metalness: .1, roughness: .8 }), rod: std({ metalness: .75, roughness: .22 }), dark: std({ metalness: .2, roughness: .6 }),
        dyn: std({ metalness: 0, roughness: .6 }), stat: std({ metalness: 0, roughness: .6 }), spring: std({ metalness: .3, roughness: .4 }),
        hp: std({ transparent: true, opacity: .5, depthWrite: false, roughness: .8 }), lp: std({ transparent: true, opacity: .4, depthWrite: false, roughness: .8 }),
        air: std({ transparent: true, opacity: .25, depthWrite: false, roughness: .8 }) };
      this.colors();
      matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => this.colors());
      this.cam = { az: 0.55, el: 0.38, dist: 200, taz: 0.55, tel: 0.38, tdist: 200 };
      this.orbit();
      new ResizeObserver(() => this.resize()).observe(box); this.resize();
    }
    colors() { const M = this.M; if (this.scene) this.scene.background = new THREE.Color(css('--scene'));
      M.steel.color.set(css('--steel')); M.cut.color.set(css('--steel-light')); M.rod.color.set(css('--rod')); M.dark.color.set(css('--steel-dark'));
      M.dyn.color.set(css('--dyn')); M.stat.color.set(css('--stat')); M.spring.color.set(css('--spring'));
      M.hp.color.set(css('--hp')); M.lp.color.set(css('--lp')); M.air.color.set(css('--air')); }
    resize() { if (!this.ready) return; const w = this.box.clientWidth, h = this.box.clientHeight; if (!w || !h) return; this.renderer.setSize(w, h, false); this.camera.aspect = w / h; this.camera.updateProjectionMatrix(); }
    lathe(profile, mat, capMat) {
      const PHL = Math.PI * 1.5, g = new THREE.Group();
      const v = profile.map(p => new THREE.Vector2(Math.max(0, p[0]), p[1])); v.push(v[0].clone());
      g.add(new THREE.Mesh(new THREE.LatheGeometry(v, 96, 0, PHL), mat));
      const sg = new THREE.ShapeGeometry(new THREE.Shape(profile.map(p => new THREE.Vector2(p[0], p[1]))));
      const c1 = new THREE.Mesh(sg, capMat || mat); c1.rotation.y = -Math.PI / 2; g.add(c1);
      const c2 = new THREE.Mesh(sg, capMat || mat); c2.rotation.y = PHL - Math.PI / 2; g.add(c2);
      return g;
    }
    build(type, opts) {
      this.init();
      const M = this.M;
      if (this.root) { this.scene.remove(this.root); this.root.traverse(o => { if (o.geometry) o.geometry.dispose(); }); }
      (this.labels || []).concat(this.portLabels || []).forEach(l => l.el.remove());
      const m = this.model = type.build(opts), b = this.b = bounds(type, m, opts);
      const root = this.root = new THREE.Group(); root.rotation.z = -Math.PI / 2; root.position.x = -(b.aMin + b.aMax) / 2; this.scene.add(root);
      this.G = { fixed: root };
      Object.keys(m.groups).forEach(id => { const piv = m.groups[id].pivot || 0; const outer = new THREE.Group(); outer.position.y = piv; const inner = new THREE.Group(); inner.position.y = -piv; outer.add(inner); root.add(outer); this.G[id] = inner; inner.userData = { outer, piv }; });
      m.parts.forEach(p => {
        const g = this.G[p.g];
        if (p.kind === 'solid') { const c = new THREE.Mesh(new THREE.CylinderGeometry(p.r, p.r, p.a1 - p.a0, 48), M.rod); c.position.y = (p.a0 + p.a1) / 2; g.add(c); }
        else if (p.kind === 'tie') { [[1, 1], [1, -1], [-1, -1]].forEach(([x, z]) => { const t = new THREE.Mesh(new THREE.CylinderGeometry(.5, .5, p.a1 - p.a0, 16), M.dark); const rr = p.r * 1.05 / Math.SQRT2; t.position.set(x * rr * 1.0, (p.a0 + p.a1) / 2, z * rr * 1.0); g.add(t);
          [p.a0 - 0.6, p.a1 + 0.6].forEach(a => { const n = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1.2, 6), M.dark); n.position.set(x * rr, a, z * rr); g.add(n); }); }); }
        else if (p.kind === 'eye') { const t = new THREE.Mesh(new THREE.TorusGeometry(p.r * 0.72, p.r * 0.28, 16, 40), M.steel); t.position.set(0, p.a, 0); g.add(t); }
        else g.add(this.lathe(p.profile, p.kind === 'cut' ? M.steel : M[p.kind], p.kind === 'cut' ? M.cut : M[p.kind]));
      });
      // ports (on top)
      this.portMats = {};
      m.ports.forEach(pt => { const R = pt.r || b.rMax, gp = new THREE.Group(); const mat = M.lp.clone(); mat.transparent = false; mat.opacity = 1; mat.depthWrite = true;
        const o = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 4.5, 24), M.steel), i = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.0, 4.6, 24), mat);
        gp.add(o, i); gp.rotation.z = Math.PI / 2; gp.position.set(-(R + 2.2), pt.a, 0); root.add(gp); this.portMats[pt.id] = mat; });
      // chamber pool and springs
      this.chPool = []; this.springMeshes = [];
      // labels
      this.labels = m.labels.map(lb => { const d = document.createElement('div'); d.className = 'lab3'; d.textContent = lb.text; this.box.appendChild(d); return { lb, el: d }; });
      this.portLabels = m.ports.map(pt => { const d = document.createElement('div'); d.className = 'lab3 port'; d.textContent = pt.label; this.box.appendChild(d); return { pt, el: d }; });
      this.cam.tdist = (b.aMax - b.aMin) * 1.55 + 30; if (!this.fitted) { this.cam.dist = this.cam.tdist; this.fitted = true; }
      this.resize();
    }
    chamberMesh(i, c) {
      let e = this.chPool[i];
      const key = c.rIn + '|' + c.rOut;
      if (!e || e.key !== key) { if (e) { this.root.remove(e.g); e.g.traverse(o => o.geometry && o.geometry.dispose()); }
        const g = this.lathe([[c.rIn + 0.02, 0], [c.rOut - 0.02, 0], [c.rOut - 0.02, 1], [c.rIn + 0.02, 1]], this.M.lp); this.root.add(g); e = this.chPool[i] = { g, key }; }
      return e;
    }
    update(st, moving, dt) {
      if (!this.ready || !this.root) return;
      const M = this.M;
      for (const id in st.groups) { const g = this.G[id]; if (!g) continue; const s = st.groups[id];
        g.position.y = -g.userData.piv + (s.da || 0); g.userData.outer.rotation.z = -(s.tilt || 0) * Math.PI / 180; }
      st.chambers.forEach((c, i) => { const e = this.chamberMesh(i, c); const len = c.a1 - c.a0; e.g.visible = len > 0.05; e.g.position.y = c.a0; e.g.scale.y = Math.max(0.01, len);
        e.g.traverse(o => { if (o.isMesh) o.material = M[c.f]; }); });
      for (let i = st.chambers.length; i < this.chPool.length; i++) this.chPool[i].g.visible = false;
      for (const id in this.portMats) { const s = (st.ports || {})[id]; if (s) this.portMats[id].color.set(css('--' + s.f)); }
      // springs: helix of unit length scaled to fit
      const sp = st.springs || [];
      sp.forEach((s, i) => { let m = this.springMeshes[i];
        if (!m) { const pts = []; const N = s.turns * 40; for (let j = 0; j <= N; j++) { const t = j / N, ang = t * s.turns * 2 * Math.PI; pts.push(new THREE.Vector3(s.rc * Math.sin(ang), t, s.rc * Math.cos(ang))); }
          const curve = new THREE.CatmullRomCurve3(pts); m = new THREE.Mesh(new THREE.TubeGeometry(curve, N, s.wire / 2, 8, false), M.spring); this.root.add(m); this.springMeshes[i] = m; }
        m.position.y = s.a0; m.scale.y = s.a1 - s.a0; });
      // camera
      const c = this.cam; c.az += (c.taz - c.az) * 0.12; c.el += (c.tel - c.el) * 0.12; c.dist += (c.tdist - c.dist) * 0.12;
      const cam = this.camera; cam.position.set(c.dist * Math.cos(c.el) * Math.sin(c.az), c.dist * Math.sin(c.el), c.dist * Math.cos(c.el) * Math.cos(c.az));
      cam.up.set(0, 1, 0); if (Math.abs(c.el) > 1.5) cam.up.set(0, 0, -1); cam.lookAt(0, 0, 0);
      this.renderer.render(this.scene, cam);
      // labels on the cut face facing the viewer (local point (-r, a, 0))
      const W = this.box.clientWidth, H = this.box.clientHeight, hide = this.box.classList.contains('nolabels');
      const place = (d, v) => { const p = v.project(cam); if (hide || p.z > 1 || p.z < -1) { d.style.display = 'none'; return; } d.style.display = ''; d.style.transform = `translate(${(p.x + 1) / 2 * W}px,${(1 - p.y) / 2 * H}px) translate(-50%,-50%)`; };
      this.labels.forEach(({ lb, el: d }) => { const g = this.G[lb.g] || this.root; place(d, g.localToWorld(new THREE.Vector3(-(lb.r + 0.4), lb.a, 0))); });
      this.portLabels.forEach(({ pt, el: d }) => place(d, this.root.localToWorld(new THREE.Vector3(-((pt.r || this.b.rMax) + 6), pt.a, 0))));
    }
    orbit() {
      const el2 = this.renderer.domElement, c = this.cam, ptrs = new Map(); let pinch = null;
      el2.addEventListener('pointerdown', e => { el2.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY }); });
      el2.addEventListener('pointermove', e => { if (!ptrs.has(e.pointerId)) return; const p = ptrs.get(e.pointerId); ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
        if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y); if (pinch) c.tdist = Math.min(800, Math.max(40, c.tdist * pinch / d)); pinch = d; return; }
        c.taz -= (e.clientX - p.x) * 0.008; c.tel = Math.max(-1.5, Math.min(1.55, c.tel + (e.clientY - p.y) * 0.008)); this.onManual && this.onManual(); });
      const up = e => { ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch = null; };
      el2.addEventListener('pointerup', up); el2.addEventListener('pointercancel', up);
      el2.addEventListener('wheel', e => { e.preventDefault(); c.tdist = Math.min(800, Math.max(40, c.tdist * (1 + Math.sign(e.deltaY) * 0.1))); }, { passive: false });
      el2.addEventListener('keydown', e => { const k = e.key; let u = true;
        if (k === 'ArrowLeft') c.taz += 0.1; else if (k === 'ArrowRight') c.taz -= 0.1; else if (k === 'ArrowUp') c.tel = Math.min(1.55, c.tel + 0.1); else if (k === 'ArrowDown') c.tel = Math.max(-1.5, c.tel - 0.1);
        else if (k === '+' || k === '=') c.tdist *= 0.9; else if (k === '-') c.tdist *= 1.1; else u = false; if (u) { e.preventDefault(); this.onManual && this.onManual(); } });
    }
    setView(v) { const V = { persp: [0.55, 0.38], front: [0, 0], top: [0.0001, Math.PI / 2 - 0.01], end: [Math.PI / 2 - 0.3, 0.2] }[v]; this.cam.taz = V[0]; this.cam.tel = V[1]; }
  }
  return { View2D, View3D };
})();

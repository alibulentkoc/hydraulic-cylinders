/* Cylinder type definitions.
   Geometry is rotationally symmetric: every profile is a list of [r, a] points
   (r = radius, a = position along the axis). The same data draws the 2D section
   and the 3D cutaway. To add a new type, copy one of the entries below. */
window.CYLINDERS = (function () {
  const C = { R: 10, W: 1.4, FL: 13, ROD: 3, RB: 3.2, PL: 7, SP: 1.5 };
  const circ = (r0, a0, rad, n = 18) => Array.from({ length: n }, (_, i) => [r0 + rad * Math.cos(i / n * 2 * Math.PI), a0 + rad * Math.sin(i / n * 2 * Math.PI)]);
  const ring = (rIn, rOut, a0, a1) => [[rIn, a0], [rOut, a0], [rOut, a1], [rIn, a1]];
  const part = (kind, g, profile, extra) => Object.assign({ kind, g, profile }, extra || {});
  const blindCap = (a0, a1) => [
    part('cut', 'fixed', [[0, a0], [C.FL, a0], [C.FL, a1], [C.R, a1], [C.R, a1 + C.SP], [0, a1 + C.SP]]),
    part('stat', 'fixed', circ(C.R - 0.4, a1 + C.SP / 2, 0.38))];
  const headR = (a0, a1) => [
    part('cut', 'fixed', [[C.RB, a0 - C.SP], [C.R, a0 - C.SP], [C.R, a0], [C.FL, a0], [C.FL, a1], [C.RB, a1]]),
    part('stat', 'fixed', circ(C.R - 0.4, a0 - C.SP / 2, 0.38)),
    part('dyn', 'fixed', ring(C.ROD, C.ROD + 1, a0 + 1.2, a0 + 2.8)),
    part('dyn', 'fixed', [[C.ROD, a1 - 1.4], [C.ROD + 1, a1 - 1.4], [C.ROD + 1, a1], [C.ROD + 0.3, a1]])];
  const headL = (a0, a1) => [
    part('cut', 'fixed', [[C.RB, a0], [C.FL, a0], [C.FL, a1], [C.R, a1], [C.R, a1 + C.SP], [C.RB, a1 + C.SP]]),
    part('stat', 'fixed', circ(C.R - 0.4, a1 + C.SP / 2, 0.38)),
    part('dyn', 'fixed', ring(C.ROD, C.ROD + 1, a1 - 2.8, a1 - 1.2)),
    part('dyn', 'fixed', [[C.ROD + 0.3, a0], [C.ROD + 1, a0], [C.ROD + 1, a0 + 1.4], [C.ROD, a0 + 1.4]])];
  const headC = (a0, a1) => [
    part('cut', 'fixed', [[C.RB, a0 - C.SP], [C.R, a0 - C.SP], [C.R, a0], [C.FL, a0], [C.FL, a1], [C.R, a1], [C.R, a1 + C.SP], [C.RB, a1 + C.SP]]),
    part('stat', 'fixed', circ(C.R - 0.4, a0 - C.SP / 2, 0.38)), part('stat', 'fixed', circ(C.R - 0.4, a1 + C.SP / 2, 0.38)),
    part('dyn', 'fixed', ring(C.ROD, C.ROD + 1, (a0 + a1) / 2 - 0.8, (a0 + a1) / 2 + 0.8))];
  const barrel = (a0, a1) => part('cut', 'fixed', ring(C.R, C.R + C.W, a0, a1));
  const piston = (p, g, rIn = 0) => [part('cut', g, ring(rIn, C.R - 0.05, p, p + C.PL)),
    part('dyn', g, ring(C.R - 0.75, C.R, p + 1.3, p + 2.5)), part('dyn', g, ring(C.R - 0.75, C.R, p + 4.5, p + 5.7))];
  const rod = (a0, a1, g, r = C.ROD) => ({ kind: 'solid', g, r, a0, a1 });
  const tie = (a0, a1) => ({ kind: 'tie', g: 'fixed', r: C.FL + 0.9, a0, a1 });
  const flowIf = (on, f, dir) => ({ f, flow: on ? dir : 0 });

  /* ---------- symbols (ISO-style, simplified) ---------- */
  const SYM = {
    da: '<rect x="30" y="20" width="120" height="40"/><line x1="70" y1="20" x2="70" y2="60" class="thick"/><line x1="70" y1="40" x2="195" y2="40"/><rect x="38" y="60" width="8" height="6"/><rect x="134" y="60" width="8" height="6"/>',
    sa: '<rect x="30" y="20" width="120" height="40"/><line x1="60" y1="20" x2="60" y2="60" class="thick"/><polyline points="62,58 72,22 82,58 92,22 102,58 112,22 122,58 132,22 142,58 148,30" fill="none"/><line x1="60" y1="40" x2="195" y2="40"/><rect x="38" y="60" width="8" height="6"/>',
    dr: '<rect x="50" y="20" width="120" height="40"/><line x1="110" y1="20" x2="110" y2="60" class="thick"/><line x1="10" y1="40" x2="210" y2="40"/><rect x="58" y="60" width="8" height="6"/><rect x="154" y="60" width="8" height="6"/>',
    tandem: '<rect x="20" y="20" width="80" height="40"/><rect x="104" y="20" width="80" height="40"/><line x1="100" y1="20" x2="100" y2="60" class="thick"/><line x1="104" y1="20" x2="104" y2="60" class="thick"/><line x1="48" y1="20" x2="48" y2="60" class="thick"/><line x1="132" y1="20" x2="132" y2="60" class="thick"/><line x1="48" y1="40" x2="210" y2="40"/><rect x="26" y="60" width="7" height="6"/><rect x="88" y="60" width="7" height="6"/><rect x="110" y="60" width="7" height="6"/><rect x="172" y="60" width="7" height="6"/>',
    duplex: '<rect x="20" y="20" width="80" height="40"/><rect x="104" y="20" width="80" height="40"/><line x1="100" y1="20" x2="100" y2="60" class="thick"/><line x1="104" y1="20" x2="104" y2="60" class="thick"/><line x1="48" y1="20" x2="48" y2="60" class="thick"/><line x1="132" y1="20" x2="132" y2="60" class="thick"/><line x1="48" y1="40" x2="96" y2="40"/><line x1="132" y1="40" x2="210" y2="40"/><rect x="26" y="60" width="7" height="6"/><rect x="88" y="60" width="7" height="6"/><rect x="110" y="60" width="7" height="6"/><rect x="172" y="60" width="7" height="6"/>',
    tele: '<rect x="80" y="58" width="60" height="26"/><rect x="88" y="40" width="44" height="18"/><rect x="96" y="24" width="28" height="16"/><rect x="104" y="8" width="12" height="16"/><rect x="74" y="72" width="6" height="6"/>',
  };

  /* ---------- 1. Double-acting ---------- */
  const doubleActing = {
    id: 'double-acting', name: 'Double-acting', symbol: SYM.da,
    summary: 'Oil can push the piston both ways: into the cap-end port to extend, and into the rod-end port to retract.',
    steps: ['Extend: pressure oil enters the cap-end port and pushes on the full piston area. Oil on the rod side is pushed out of the rod-end port to tank.',
      'Retract: the valve swaps the ports. Pressure oil enters the rod-end port and pushes on the annulus (piston area minus rod area); cap-side oil returns to tank.',
      'The rod takes up area on one side, so the cylinder retracts faster but with less force than it extends.'],
    uses: 'Loaders, compactors, excavators, presses: anywhere the load must be pushed and pulled.',
    watch: 'Piston rings stop oil slipping across the piston; the rod seal and wiper keep oil in and dirt out.',
    build() {
      const parts = [...blindCap(0, 9), barrel(9, 79), ...headR(79, 89), tie(0, 89), rod(14, 95, 'g1'), ...piston(10.5, 'g1')];
      const labels = [
        { text: 'End cap (cap end)', g: 'fixed', r: C.FL, a: 4.5, side: 'bot' },
        { text: 'Cylinder barrel', g: 'fixed', r: C.R + C.W, a: 40, side: 'bot' },
        { text: 'Piston rings', g: 'g1', r: C.R, a: 12.4, side: 'bot' },
        { text: 'Piston', g: 'g1', r: C.R - 3, a: 14, side: 'top' },
        { text: 'Rod seal', g: 'fixed', r: C.ROD + 1, a: 81, side: 'bot' },
        { text: 'End cap (rod end)', g: 'fixed', r: C.FL, a: 86, side: 'bot' },
        { text: 'Rod wiper', g: 'fixed', r: C.ROD + 1, a: 88.3, side: 'top' },
        { text: 'Rod', g: 'g1', r: C.ROD, a: 93, side: 'top' },
        { text: 'Tie rod', g: 'fixed', r: C.FL + 1.2, a: 30, side: 'top' }];
      const ports = [{ id: 'A', a: 4.5, label: 'Cap-end port' }, { id: 'B', a: 84, label: 'Rod-end port' }];
      return { parts, labels, ports, groups: { g1: {} } };
    },
    state(u, dir) {
      const da = 60 * u, p = 10.5 + da, ext = dir > 0;
      return {
        groups: { g1: { da } },
        chambers: [{ rIn: 0, rOut: C.R, a0: 10.5, a1: p, f: ext ? 'hp' : 'lp' }, { rIn: C.ROD, rOut: C.R, a0: p + C.PL, a1: 77.5, f: ext ? 'lp' : 'hp' }],
        ports: { A: flowIf(1, ext ? 'hp' : 'lp', ext ? 1 : -1), B: flowIf(1, ext ? 'lp' : 'hp', ext ? -1 : 1) },
        status: ext ? 'Extending: pressure oil (red) enters the cap-end port and pushes on the whole piston face. Oil in the rod end (blue) is pushed back to tank.'
          : 'Retracting: pressure oil now enters the rod-end port and pushes on the ring-shaped area around the rod. Cap-end oil returns to tank.'
      };
    },
    calc: {
      inputs: [['D', 'Bore diameter D', 'len', 0.08], ['d', 'Rod diameter d', 'len', 0.045], ['p', 'Pressure p', 'p', 1e7], ['Q', 'Flow Q', 'Q', 30 / 60000]],
      compute(v, H) {
        if (v.d >= v.D) return [{ label: 'Check inputs', eq: '', sub: 'The rod must be smaller than the bore.', res: '' }];
        const A = Math.PI * v.D ** 2 / 4, Ar = Math.PI * (v.D ** 2 - v.d ** 2) / 4;
        return [
          { label: 'Cap-end (full) area', eq: 'A = π·D² / 4', sub: `π × ${H.n(v.D, 'len')}² / 4`, res: H.r(A, 'area') },
          { label: 'Rod-end (annulus) area', eq: 'A<sub>r</sub> = π·(D² − d²) / 4', sub: `π × (${H.n(v.D, 'len')}² − ${H.n(v.d, 'len')}²) / 4`, res: H.r(Ar, 'area') },
          { label: 'Extend force', eq: 'F = p·A', sub: `${H.n(v.p, 'p')} × ${H.n(A, 'area')}`, res: H.r(v.p * A, 'F') },
          { label: 'Retract force', eq: 'F<sub>r</sub> = p·A<sub>r</sub>', sub: `${H.n(v.p, 'p')} × ${H.n(Ar, 'area')}`, res: H.r(v.p * Ar, 'F') },
          { label: 'Extend speed', eq: 'v = Q / A', sub: `${H.n(v.Q, 'Q')} / ${H.n(A, 'area')}`, res: H.r(v.Q / A, 'v') },
          { label: 'Retract speed', eq: 'v<sub>r</sub> = Q / A<sub>r</sub>', sub: `${H.n(v.Q, 'Q')} / ${H.n(Ar, 'area')}`, res: H.r(v.Q / Ar, 'v') },
          { label: 'Area ratio', eq: 'φ = A / A<sub>r</sub>', sub: `${H.n(A, 'area')} / ${H.n(Ar, 'area')}`, res: `${H.f(A / Ar, 2)}: retracting is ${H.f(A / Ar, 2)}× faster, with ${H.f(A / Ar, 2)}× less force` }];
      }
    }
  };

  /* ---------- 2. Single-acting, spring return ---------- */
  const springReturn = {
    id: 'spring-return', name: 'Single-acting, spring return', symbol: SYM.sa,
    summary: 'Oil pushes the piston out; a spring pushes it back when the oil is released to tank.',
    steps: ['Oil enters the cap-end port and pushes the piston, squeezing the spring.',
      'Air in the spring side escapes through the rod-end vent (breather) as the piston extends.',
      'When the valve releases the oil to tank, the spring pushes the piston back. Oil returns through the same port, and air is drawn back in through the vent.'],
    uses: 'Clamps, brakes, small lifts and tools where the return stroke needs little force.',
    watch: 'Force falls as the spring compresses, because part of the oil force is used to squeeze the spring. Keep the vent filtered, or dirt is pulled in with the air.',
    build() {
      const parts = [...blindCap(0, 9), barrel(9, 79), ...headR(79, 89), tie(0, 89), rod(14, 95, 'g1'), ...piston(10.5, 'g1')];
      const labels = [
        { text: 'End cap (cap end)', g: 'fixed', r: C.FL, a: 4.5, side: 'bot' },
        { text: 'Piston', g: 'g1', r: C.R, a: 14, side: 'bot' },
        { text: 'Spring', g: 'fixed', r: 6.6, a: 66, side: 'top', spring: true },
        { text: 'Cylinder barrel', g: 'fixed', r: C.R + C.W, a: 45, side: 'bot' },
        { text: 'End cap (rod end)', g: 'fixed', r: C.FL, a: 86, side: 'bot' },
        { text: 'Rod', g: 'g1', r: C.ROD, a: 93, side: 'top' }];
      const ports = [{ id: 'A', a: 4.5, label: 'Cap-end port' }, { id: 'V', a: 84, label: 'Rod-end vent (air)' }];
      return { parts, labels, ports, groups: { g1: {} } };
    },
    state(u, dir) {
      const da = 40 * u, p = 10.5 + da, ext = dir > 0;
      return {
        groups: { g1: { da } },
        chambers: [{ rIn: 0, rOut: C.R, a0: 10.5, a1: p, f: ext ? 'hp' : 'lp' }, { rIn: C.ROD, rOut: C.R, a0: p + C.PL, a1: 77.5, f: 'air' }],
        springs: [{ a0: p + C.PL, a1: 77.5, rc: 6.6, wire: 0.65, turns: 7 }],
        ports: { A: flowIf(1, ext ? 'hp' : 'lp', ext ? 1 : -1), V: flowIf(1, 'air', ext ? -1 : 1) },
        status: ext ? 'Extending: oil enters the cap-end port and pushes the piston, squeezing the spring. Air leaves through the rod-end vent.'
          : 'Retracting: the valve has released the oil to tank, so the spring pushes the piston back. Air is drawn in through the vent.'
      };
    },
    calc: {
      inputs: [['D', 'Bore diameter D', 'len', 0.05], ['p', 'Pressure p', 'p', 5e6], ['Q', 'Flow Q', 'Q', 10 / 60000], ['k', 'Spring rate k', 'k', 5000], ['F0', 'Spring preload F₀', 'F', 200], ['s', 'Stroke s', 'len', 0.1]],
      compute(v, H) {
        const A = Math.PI * v.D ** 2 / 4, Fs = v.F0 + v.k * v.s;
        return [
          { label: 'Piston area', eq: 'A = π·D² / 4', sub: `π × ${H.n(v.D, 'len')}² / 4`, res: H.r(A, 'area') },
          { label: 'Oil force', eq: 'F<sub>oil</sub> = p·A', sub: `${H.n(v.p, 'p')} × ${H.n(A, 'area')}`, res: H.r(v.p * A, 'F') },
          { label: 'Spring force at full stroke', eq: 'F<sub>s</sub> = F₀ + k·s', sub: `${H.n(v.F0, 'F')} + ${H.n(v.k, 'k')} × ${H.n(v.s, 'len')}`, res: H.r(Fs, 'F') },
          { label: 'Useful force at start', eq: 'F = p·A − F₀', sub: `${H.n(v.p * A, 'F')} − ${H.n(v.F0, 'F')}`, res: H.r(v.p * A - v.F0, 'F') },
          { label: 'Useful force at full stroke', eq: 'F = p·A − F<sub>s</sub>', sub: `${H.n(v.p * A, 'F')} − ${H.n(Fs, 'F')}`, res: H.r(v.p * A - Fs, 'F') },
          { label: 'Extend speed', eq: 'v = Q / A', sub: `${H.n(v.Q, 'Q')} / ${H.n(A, 'area')}`, res: H.r(v.Q / A, 'v') },
          { label: 'Spring return force', eq: 'from F<sub>s</sub> down to F₀', sub: `${H.n(Fs, 'F')} → ${H.n(v.F0, 'F')}`, res: `${H.e(Fs, 'F')} falling to ${H.e(v.F0, 'F')}` }];
      }
    }
  };

  /* ---------- 3. Double-rod ---------- */
  const doubleRod = {
    id: 'double-rod', name: 'Double-rod', symbol: SYM.dr,
    summary: 'The rod passes right through the piston and out of both end caps, so both sides of the piston have the same area.',
    steps: ['Oil into the left port pushes the piston right; oil on the right returns to tank.',
      'Oil into the right port pushes it back to the left.',
      'Both sides are annuli of the same size, so the force and speed are the same in both directions for the same pressure and flow.'],
    uses: 'Work at both ends (for example two conveyors, one on each side), power steering, and machine slides that need equal speed both ways.',
    watch: 'Two rod seals and two wipers to look after. The rods must be long enough to stay in both end caps over the full stroke.',
    build() {
      const parts = [...headL(0, 10), barrel(10, 80), ...headR(80, 90), tie(0, 90), rod(-46, 96, 'g1'), ...piston(21.5, 'g1')];
      const labels = [
        { text: 'End cap', g: 'fixed', r: C.FL, a: 3, side: 'bot' },
        { text: 'Rod', g: 'g1', r: C.ROD, a: -38, side: 'top' },
        { text: 'Piston', g: 'g1', r: C.R, a: 25, side: 'bot' },
        { text: 'Cylinder barrel', g: 'fixed', r: C.R + C.W, a: 55, side: 'bot' },
        { text: 'End cap', g: 'fixed', r: C.FL, a: 87, side: 'bot' },
        { text: 'Rod', g: 'g1', r: C.ROD, a: 94, side: 'top' }];
      const ports = [{ id: 'A', a: 5, label: 'Port' }, { id: 'B', a: 85, label: 'Port' }];
      return { parts, labels, ports, groups: { g1: {} } };
    },
    state(u, dir) {
      const da = 40 * u, p = 21.5 + da, ext = dir > 0;
      return {
        groups: { g1: { da } },
        chambers: [{ rIn: C.ROD, rOut: C.R, a0: 11.5, a1: p, f: ext ? 'hp' : 'lp' }, { rIn: C.ROD, rOut: C.R, a0: p + C.PL, a1: 78.5, f: ext ? 'lp' : 'hp' }],
        ports: { A: flowIf(1, ext ? 'hp' : 'lp', ext ? 1 : -1), B: flowIf(1, ext ? 'lp' : 'hp', ext ? -1 : 1) },
        status: ext ? 'Moving right: oil enters the left port. Both sides of the piston have the same ring-shaped area, so speed and force match the other direction.'
          : 'Moving left: oil enters the right port. Same area, so the same speed and force as moving right.'
      };
    },
    calc: {
      inputs: [['D', 'Bore diameter D', 'len', 0.063], ['d', 'Rod diameter d', 'len', 0.036], ['p', 'Pressure p', 'p', 1e7], ['Q', 'Flow Q', 'Q', 20 / 60000]],
      compute(v, H) {
        if (v.d >= v.D) return [{ label: 'Check inputs', eq: '', sub: 'The rod must be smaller than the bore.', res: '' }];
        const Ar = Math.PI * (v.D ** 2 - v.d ** 2) / 4;
        return [
          { label: 'Effective area (both sides)', eq: 'A<sub>r</sub> = π·(D² − d²) / 4', sub: `π × (${H.n(v.D, 'len')}² − ${H.n(v.d, 'len')}²) / 4`, res: H.r(Ar, 'area') },
          { label: 'Force (both directions)', eq: 'F = p·A<sub>r</sub>', sub: `${H.n(v.p, 'p')} × ${H.n(Ar, 'area')}`, res: H.r(v.p * Ar, 'F') },
          { label: 'Speed (both directions)', eq: 'v = Q / A<sub>r</sub>', sub: `${H.n(v.Q, 'Q')} / ${H.n(Ar, 'area')}`, res: H.r(v.Q / Ar, 'v') }];
      }
    }
  };

  /* ---------- 4. Tandem ---------- */
  const tandem = {
    id: 'tandem', name: 'Tandem', symbol: SYM.tandem,
    summary: 'Two cylinders in line share one rod. Both pistons are pushed at once, giving nearly twice the force without a bigger bore.',
    steps: ['Extend: pressure oil enters the cap-end port of each cylinder, so both pistons push the common rod.',
      'Oil on the rod side of each piston returns to tank through the other two ports.',
      'Retract: the ports are swapped and oil pushes on the rod side of both pistons.'],
    uses: 'High force where there is no room for a larger diameter, for example in narrow machine frames.',
    watch: 'The cylinder is long, and it needs about twice the oil flow for the same speed. The rod passes through the centre head, which needs its own rod seal.',
    build() {
      const parts = [...blindCap(0, 9), barrel(9, 49), ...headC(49, 58), barrel(58, 98), ...headR(98, 107), tie(0, 107), rod(14, 113, 'g1'), ...piston(10.5, 'g1'), ...piston(59.5, 'g1')];
      const labels = [
        { text: 'End cap (cap end)', g: 'fixed', r: C.FL, a: 4.5, side: 'bot' },
        { text: 'Piston', g: 'g1', r: C.R, a: 14, side: 'bot' },
        { text: 'Cylinder barrel', g: 'fixed', r: C.R + C.W, a: 30, side: 'bot' },
        { text: 'Centre head', g: 'fixed', r: C.FL, a: 53.5, side: 'bot' },
        { text: 'Piston', g: 'g1', r: C.R, a: 63, side: 'bot' },
        { text: 'Cylinder barrel', g: 'fixed', r: C.R + C.W, a: 80, side: 'bot' },
        { text: 'End cap (rod end)', g: 'fixed', r: C.FL, a: 103, side: 'bot' },
        { text: 'Common rod', g: 'g1', r: C.ROD, a: 111, side: 'top' }];
      const ports = [{ id: 'A', a: 4.5, label: 'Port 1' }, { id: 'B', a: 51.5, label: 'Port 2' }, { id: 'C', a: 55.8, label: 'Port 3' }, { id: 'D', a: 102.5, label: 'Port 4' }];
      return { parts, labels, ports, groups: { g1: {} } };
    },
    state(u, dir) {
      const da = 30 * u, p = 10.5 + da, ext = dir > 0, H = ext ? 'hp' : 'lp', L = ext ? 'lp' : 'hp', s = ext ? 1 : -1;
      return {
        groups: { g1: { da } },
        chambers: [{ rIn: 0, rOut: C.R, a0: 10.5, a1: p, f: H }, { rIn: C.ROD, rOut: C.R, a0: p + C.PL, a1: 47.5, f: L },
          { rIn: C.ROD, rOut: C.R, a0: 59.5, a1: p + 49, f: H }, { rIn: C.ROD, rOut: C.R, a0: p + 56, a1: 96.5, f: L }],
        ports: { A: flowIf(1, H, s), B: flowIf(1, L, -s), C: flowIf(1, H, s), D: flowIf(1, L, -s) },
        status: ext ? 'Extending: pressure oil enters ports 1 and 3, behind both pistons. Both push the same rod, so their forces add.'
          : 'Retracting: pressure oil enters ports 2 and 4, in front of both pistons, and pulls the rod back.'
      };
    },
    calc: {
      inputs: [['D', 'Bore diameter D', 'len', 0.063], ['d', 'Rod diameter d', 'len', 0.036], ['p', 'Pressure p', 'p', 1e7], ['Q', 'Flow Q', 'Q', 20 / 60000]],
      compute(v, H) {
        if (v.d >= v.D) return [{ label: 'Check inputs', eq: '', sub: 'The rod must be smaller than the bore.', res: '' }];
        const A = Math.PI * v.D ** 2 / 4, a = Math.PI * v.d ** 2 / 4, Ae = A + (A - a), Ar = 2 * (A - a);
        return [
          { label: 'Full piston area', eq: 'A = π·D² / 4', sub: `π × ${H.n(v.D, 'len')}² / 4`, res: H.r(A, 'area') },
          { label: 'Rod area', eq: 'a = π·d² / 4', sub: `π × ${H.n(v.d, 'len')}² / 4`, res: H.r(a, 'area') },
          { label: 'Extend area (rear full + front annulus)', eq: 'A<sub>ext</sub> = A + (A − a)', sub: `${H.n(A, 'area')} + (${H.n(A, 'area')} − ${H.n(a, 'area')})`, res: H.r(Ae, 'area') },
          { label: 'Extend force', eq: 'F = p·A<sub>ext</sub>', sub: `${H.n(v.p, 'p')} × ${H.n(Ae, 'area')}`, res: H.r(v.p * Ae, 'F') },
          { label: 'Single cylinder, same bore', eq: 'F<sub>1</sub> = p·A', sub: `${H.n(v.p, 'p')} × ${H.n(A, 'area')}`, res: H.r(v.p * A, 'F') },
          { label: 'Extend speed', eq: 'v = Q / A<sub>ext</sub>', sub: `${H.n(v.Q, 'Q')} / ${H.n(Ae, 'area')}`, res: H.r(v.Q / Ae, 'v') },
          { label: 'Retract area (two annuli)', eq: 'A<sub>ret</sub> = 2·(A − a)', sub: `2 × (${H.n(A, 'area')} − ${H.n(a, 'area')})`, res: H.r(Ar, 'area') },
          { label: 'Retract force', eq: 'F<sub>r</sub> = p·A<sub>ret</sub>', sub: `${H.n(v.p, 'p')} × ${H.n(Ar, 'area')}`, res: H.r(v.p * Ar, 'F') }];
      }
    }
  };

  /* ---------- 5. Duplex ---------- */
  const duplex = {
    id: 'duplex', name: 'Duplex', symbol: SYM.duplex,
    summary: 'Two cylinders in line with separate rods. The rear rod pushes the front piston, giving three positions: retracted, mid and full.',
    steps: ['Mid position: oil into port 1 extends the rear piston. Its rod pushes the front piston out by the rear cylinder’s (shorter) stroke.',
      'Full position: oil into port 3 extends the front piston on its own, out to its full stroke.',
      'Retract: oil into ports 2 and 4 brings each piston back.'],
    uses: 'Machines that need an extra fixed stopping point, such as positioning a part at two set distances.',
    watch: 'The two rods are not connected: the rear rod can only push. Choose the two strokes to give the positions you need.',
    positions: [{ label: 'Retracted', u: 0 }, { label: 'Mid', u: 0.5 }, { label: 'Full', u: 1 }],
    holds: [0.5],
    build() {
      const parts = [...blindCap(0, 9), barrel(9, 34), ...headC(34, 43), barrel(43, 83), ...headR(83, 92), tie(0, 92),
        rod(14, 44.5, 'g1'), ...piston(10.5, 'g1'), rod(48, 98, 'g2'), ...piston(44.5, 'g2')];
      const labels = [
        { text: 'End cap (cap end)', g: 'fixed', r: C.FL, a: 4.5, side: 'bot' },
        { text: 'Rear piston', g: 'g1', r: C.R, a: 14, side: 'bot' },
        { text: 'Centre head', g: 'fixed', r: C.FL, a: 38.5, side: 'bot' },
        { text: 'Rear rod (pushes only)', g: 'g1', r: C.ROD, a: 30, side: 'top', inside: true },
        { text: 'Front piston', g: 'g2', r: C.R, a: 48, side: 'bot' },
        { text: 'End cap (rod end)', g: 'fixed', r: C.FL, a: 88, side: 'bot' },
        { text: 'Rod', g: 'g2', r: C.ROD, a: 96, side: 'top' }];
      const ports = [{ id: 'A', a: 4.5, label: 'Port 1' }, { id: 'B', a: 36.5, label: 'Port 2' }, { id: 'C', a: 40.8, label: 'Port 3' }, { id: 'D', a: 87.5, label: 'Port 4' }];
      return { parts, labels, ports, groups: { g1: {}, g2: {} } };
    },
    state(u, dir) {
      const s1 = 15, s2 = 30, rear = u <= 0.5;
      const x1 = rear ? s1 * u / 0.5 : s1, x2 = rear ? x1 : s1 + (s2 - s1) * (u - 0.5) / 0.5;
      const ext = dir > 0, s = ext ? 1 : -1;
      const ports = rear ? { A: flowIf(1, ext ? 'hp' : 'lp', s), B: flowIf(1, ext ? 'lp' : 'hp', -s), C: flowIf(1, 'lp', s), D: flowIf(1, ext ? 'lp' : 'hp', -s) }
        : { A: flowIf(0, 'hp', 0), B: flowIf(0, 'lp', 0), C: flowIf(1, ext ? 'hp' : 'lp', s), D: flowIf(1, ext ? 'lp' : 'hp', -s) };
      return {
        groups: { g1: { da: x1 }, g2: { da: x2 } },
        chambers: [{ rIn: 0, rOut: C.R, a0: 10.5, a1: 10.5 + x1, f: ports.A.f }, { rIn: C.ROD, rOut: C.R, a0: 17.5 + x1, a1: 32.5, f: ports.B.f },
          { rIn: 0, rOut: C.R, a0: 44.5, a1: 44.5 + x2, f: ports.C.f }, { rIn: C.ROD, rOut: C.R, a0: 51.5 + x2, a1: 81.5, f: ports.D.f }],
        ports,
        dims: [{ a0: 98, a1: 98 + x2, text: 'Extension', row: 0, g: null }],
        status: rear ? (ext ? 'Going to mid: oil enters port 1 and extends the rear piston. Its rod pushes the front piston out by the rear stroke.' : 'Going to retracted: oil enters ports 2 and 4 and brings both pistons home.')
          : (ext ? 'Going to full: oil enters port 3 and extends the front piston by itself. The rear piston stays at mid.' : 'Going back to mid: oil enters port 4 and returns the front piston until it meets the rear rod.')
      };
    },
    calc: {
      inputs: [['D1', 'Rear bore D₁', 'len', 0.063], ['D2', 'Front bore D₂', 'len', 0.063], ['s1', 'Rear stroke s₁', 'len', 0.1], ['s2', 'Front stroke s₂', 'len', 0.2], ['p', 'Pressure p', 'p', 1e7]],
      compute(v, H) {
        const A1 = Math.PI * v.D1 ** 2 / 4, A2 = Math.PI * v.D2 ** 2 / 4;
        return [
          { label: 'Rear piston area', eq: 'A₁ = π·D₁² / 4', sub: `π × ${H.n(v.D1, 'len')}² / 4`, res: H.r(A1, 'area') },
          { label: 'Push force at mid', eq: 'F<sub>mid</sub> = p·A₁', sub: `${H.n(v.p, 'p')} × ${H.n(A1, 'area')}`, res: H.r(v.p * A1, 'F') },
          { label: 'Front piston area', eq: 'A₂ = π·D₂² / 4', sub: `π × ${H.n(v.D2, 'len')}² / 4`, res: H.r(A2, 'area') },
          { label: 'Push force at full', eq: 'F<sub>full</sub> = p·A₂', sub: `${H.n(v.p, 'p')} × ${H.n(A2, 'area')}`, res: H.r(v.p * A2, 'F') },
          { label: 'Positions available', eq: '0, s₁, s₂', sub: `0, ${H.n(v.s1, 'len')}, ${H.n(v.s2, 'len')}`, res: `0, ${H.e(v.s1, 'len')}, ${H.e(v.s2, 'len')}` + (v.s1 >= v.s2 ? ' (s₁ must be shorter than s₂)' : '') }];
      }
    }
  };

  /* ---------- 6. Telescoping ---------- */
  const T = [ // stage tubes: rOut, rIn
    { rOut: 12.8, rIn: 11.6 }, { rOut: 11.4, rIn: 10.2 }, { rOut: 10.0, rIn: 8.8 }, { rOut: 8.6, rIn: 7.4 }, { rOut: 7.2, rIn: 6.0 }];
  const STG = 30;
  const telescoping = {
    id: 'telescoping', name: 'Telescoping ram', symbol: SYM.tele,
    summary: 'Nested tubes (stages) slide out one after another, giving a long stroke from a short cylinder.',
    steps: ['Oil enters the base port and fills the inside of all the stages.',
      'The largest stage moves first, because it has the largest area and needs the least pressure. Each smaller stage follows when the one before it reaches its stop.',
      'As smaller stages move, the pressure needed rises and the speed increases (same flow, less area).',
      'Most telescoping rams are single-acting: the weight of the load (for example a dump body) pushes them back when the oil is released.'],
    uses: 'Dump trucks and trailers, tipping bodies, lifts with little room for a long cylinder.',
    watch: 'Each stage has its own seals and stop collar. Pressure jumps each time a smaller stage starts, so the relief valve must allow for the last (smallest) stage.',
    holds: [0.25, 0.5, 0.75],
    build() {
      const parts = [part('cut', 'fixed', [[0, 0], [T[0].rOut, 0], [T[0].rOut, 42], [T[0].rIn, 42], [T[0].rIn, 2], [0, 2]]),
        part('dyn', 'fixed', ring(T[1].rOut, T[0].rIn, 39.8, 41.2)),
        { kind: 'eye', g: 'fixed', a: -3.2, r: 2.6 }];
      const ab = [2.5, 3, 3.5, 4];
      for (let i = 1; i <= 4; i++) {
        const t = T[i], prev = T[i - 1], g = 'g' + i, a0 = ab[i - 1], a1 = a0 + 40;
        if (i < 4) parts.push(part('cut', g, [[t.rIn, a0], [prev.rIn - 0.05, a0], [prev.rIn - 0.05, a0 + 2], [t.rOut, a0 + 2], [t.rOut, a1], [t.rIn, a1]]),
          part('dyn', g, ring(T[i + 1].rOut, t.rIn, a1 - 2.2, a1 - 0.8)));
        else parts.push(part('cut', g, [[t.rIn, a0], [prev.rIn - 0.05, a0], [prev.rIn - 0.05, a0 + 2], [t.rOut, a0 + 2], [t.rOut, a1], [0, a1], [0, a1 - 1.6], [t.rIn, a1 - 1.6]]),
          { kind: 'eye', g, a: a1 + 3.2, r: 2.6 });
      }
      const labels = [
        { text: 'Hinge mount', g: 'fixed', r: 2.6, a: -3.2, side: 'bot' },
        { text: 'Stage 1', g: 'g1', r: T[1].rOut, a: 39.5, side: 'bot' },
        { text: 'Stage 2', g: 'g2', r: T[2].rOut, a: 40, side: 'bot' },
        { text: 'Stage 3', g: 'g3', r: T[3].rOut, a: 40.5, side: 'bot' },
        { text: 'Stage 4', g: 'g4', r: T[4].rOut, a: 41, side: 'bot' },
        { text: 'Seals', g: 'g1', r: T[1].rIn, a: 41.7, side: 'top' },
        { text: 'Rod eyelet', g: 'g4', r: 2.6, a: 47.2, side: 'top' },
        { text: 'Barrel (base)', g: 'fixed', r: T[0].rOut, a: 20, side: 'bot' }];
      const ports = [{ id: 'A', a: 1, label: 'Port (fluid in)', r: T[0].rOut }];
      return { parts, labels, ports, groups: { g1: {}, g2: {}, g3: {}, g4: {} }, rMaxOverride: T[0].rOut };
    },
    state(u, dir) {
      const x = [1, 2, 3, 4].map(i => STG * Math.min(1, Math.max(0, 4 * u - (i - 1))));
      const off = [0, x[0], x[0] + x[1], x[0] + x[1] + x[2], x[0] + x[1] + x[2] + x[3]];
      const ext = dir > 0, f = ext ? 'hp' : 'lp';
      const k = Math.min(4, Math.floor(4 * u) + 1);
      const ab = [2.5, 3, 3.5, 4];
      // fluid regions that do not overlap: each tube's bore up to where the next stage starts
      const bottom = i => ab[i - 1] + off[i];
      const chambers = [{ rIn: 0, rOut: T[0].rIn, a0: 2, a1: bottom(1), f }];
      for (let i = 1; i <= 3; i++) chambers.push({ rIn: 0, rOut: T[i].rIn, a0: bottom(i), a1: bottom(i + 1), f });
      chambers.push({ rIn: 0, rOut: T[4].rIn, a0: bottom(4), a1: bottom(4) + 38.4, f });
      return {
        groups: { g1: { da: off[1] }, g2: { da: off[2] }, g3: { da: off[3] }, g4: { da: off[4] } },
        chambers, ports: { A: flowIf(1, f, ext ? 1 : -1) },
        status: ext ? `Extending: stage ${k} is moving. It is the largest stage not yet at its stop, so it needs the least pressure. Smaller stages that follow need more pressure but move faster.`
          : `Retracting: the oil is released to tank and the weight of the load pushes the stages back in, smallest first (stage ${k}).`
      };
    },
    calc: {
      inputs: [['W', 'Load on the ram W', 'F', 150000], ['D1', 'Stage 1 outside diameter', 'len', 0.16], ['D2', 'Stage 2 outside diameter', 'len', 0.13], ['D3', 'Stage 3 outside diameter', 'len', 0.10], ['D4', 'Stage 4 outside diameter', 'len', 0.075], ['s', 'Stroke of each stage', 'len', 1.0], ['Q', 'Flow Q', 'Q', 100 / 60000]],
      compute(v, H) {
        const rows = []; let tt = 0;
        [v.D1, v.D2, v.D3, v.D4].forEach((D, i) => {
          const A = Math.PI * D ** 2 / 4, p = v.W / A, sp = v.Q / A, t = v.s / sp; tt += t;
          rows.push({ label: `Stage ${i + 1}: area`, eq: `A<sub>${i + 1}</sub> = π·D<sub>${i + 1}</sub>² / 4`, sub: `π × ${H.n(D, 'len')}² / 4`, res: H.r(A, 'area') });
          rows.push({ label: `Stage ${i + 1}: pressure needed`, eq: `p<sub>${i + 1}</sub> = W / A<sub>${i + 1}</sub>`, sub: `${H.n(v.W, 'F')} / ${H.n(A, 'area')}`, res: H.r(p, 'p') });
          rows.push({ label: `Stage ${i + 1}: speed and time`, eq: `v = Q / A<sub>${i + 1}</sub>, t = s / v`, sub: `${H.n(v.Q, 'Q')} / ${H.n(A, 'area')} = ${H.n(sp, 'v')}`, res: `${H.r(sp, 'v')}; ${H.f(t, 1)} s` });
        });
        rows.push({ label: 'Total extension time', eq: 't = t₁ + t₂ + t₃ + t₄', sub: '', res: `${H.f(tt, 1)} s` });
        return rows;
      }
    }
  };

  /* ---------- 7. Stop tube ---------- */
  const stopTube = {
    id: 'stop-tube', name: 'Stop tube', symbol: SYM.da,
    summary: 'A spacer on the rod in front of the piston. It keeps the piston further from the rod bearing at full extension, so a long rod doesn’t sag.',
    steps: ['Without a stop tube, a long cylinder at full extension has the piston right up against the rod-end cap. The rod is only supported over a short length.',
      'A side load or the rod’s own weight then tips the piston and bends the rod (exaggerated in the animation), wearing the bearing and seals.',
      'A stop tube makes the piston stop earlier, so the distance between the piston and the rod bearing is larger. The price is a shorter stroke for the same barrel.'],
    uses: 'Long-stroke cylinders, especially horizontal ones or those carrying side loads.',
    watch: 'With a stop tube, you need a longer cylinder to get the same stroke (in the textbook example, 40 in of barrel gives 36 in of stroke with a 4 in stop tube).',
    options: [{ id: 'stopTube', label: 'Fit a stop tube', def: false }],
    build(o) {
      const parts = [...blindCap(0, 9), barrel(9, 79), ...headR(79, 89), tie(0, 89), rod(14, 95, 'g1'), ...piston(10.5, 'g1')];
      if (o.stopTube) parts.push(part('cut', 'g1', ring(C.ROD + 0.05, 6.2, 17.5, 27.5)));
      const labels = [
        { text: 'Cylinder barrel', g: 'fixed', r: C.R + C.W, a: 40, side: 'bot' },
        { text: o.stopTube ? 'Piston (stops early)' : 'Piston (can tip)', g: 'g1', r: C.R, a: 14, side: 'bot' },
        { text: o.stopTube ? 'Rod (straight)' : 'Rod (sags)', g: 'g1', r: C.ROD, a: 93, side: 'top' },
        { text: 'Rod bearing and seal', g: 'fixed', r: C.ROD + 1, a: 81, side: 'top' }];
      if (o.stopTube) labels.push({ text: 'Stop tube', g: 'g1', r: 6.2, a: 22.5, side: 'top', inside: true });
      const ports = [{ id: 'A', a: 4.5, label: 'Cap-end port' }, { id: 'B', a: 84, label: 'Rod-end port' }];
      return { parts, labels, ports, groups: { g1: { pivot: 81 } } };
    },
    state(u, dir, o) {
      const stroke = o.stopTube ? 50 : 60, da = stroke * u, p = 10.5 + da, ext = dir > 0;
      const tilt = o.stopTube ? 0.08 * u ** 3 : 1.3 * u ** 4;
      return {
        groups: { g1: { da, tilt } },
        chambers: [{ rIn: 0, rOut: C.R, a0: 10.5, a1: p, f: ext ? 'hp' : 'lp' }, { rIn: C.ROD, rOut: C.R, a0: p + C.PL, a1: 77.5, f: ext ? 'lp' : 'hp' }],
        ports: { A: flowIf(1, ext ? 'hp' : 'lp', ext ? 1 : -1), B: flowIf(1, ext ? 'lp' : 'hp', ext ? -1 : 1) },
        dims: [{ a0: 10.5, a1: 10.5 + da, text: 'Stroke', row: 0 }, { a0: p + 3.5, a1: 81, text: 'Bearing distance', row: 1 }],
        status: o.stopTube ? 'With a stop tube: the piston stops short of the end cap, so the rod is supported over a longer distance and stays straight. The stroke is shorter.'
          : (u > 0.8 ? 'Without a stop tube, near full extension: the piston is close to the rod bearing, so the rod is poorly supported and sags (exaggerated here).' : 'Without a stop tube: watch what happens to the rod near full extension.')
      };
    },
    calc: {
      inputs: [['S', 'Stroke without stop tube', 'len', 1.0], ['L', 'Stop tube length', 'len', 0.1]],
      compute(v, H) {
        return [
          { label: 'Stroke with stop tube', eq: 's = S − L<sub>st</sub>', sub: `${H.n(v.S, 'len')} − ${H.n(v.L, 'len')}`, res: H.r(v.S - v.L, 'len') },
          { label: 'Extra bearing distance', eq: 'Δ = L<sub>st</sub>', sub: H.n(v.L, 'len'), res: H.r(v.L, 'len') },
          { label: 'Barrel needed for the original stroke', eq: 'S + L<sub>st</sub>', sub: `${H.n(v.S, 'len')} + ${H.n(v.L, 'len')}`, res: H.r(v.S + v.L, 'len') }];
      }
    }
  };

  return { C, list: [doubleActing, springReturn, doubleRod, tandem, duplex, telescoping, stopTube] };
})();

import * as THREE from 'three';
import { FRAMES, PLINTH_Y, smoothstep } from './config.js';
import { OWNERSHIP, SKILLS } from './content.js';

const TAU = Math.PI * 2;
const GOLDEN = Math.PI * (3 - Math.sqrt(5));
const frac = (x) => x - Math.floor(x);
const gauss = (a, b, c) => (a + b + c - 1.5) / 1.5;

export const BASE_Y = PLINTH_Y + 0.07;
export const CORE = { slabH: 0.6, cols: 4, rows: 2, floors: 3, sx: 1.5, sz: 1.7, sy: 1.08 };
export const CORE_TOP = BASE_Y + CORE.slabH;
export const envelopeTop = (p) => CORE_TOP + 3.6 + 7.4 * smoothstep(0.62, 0.92, p);
export const KEYBOARD = { y: BASE_Y + 0.55, tilt: 0.34, keyD: 0.62, keyH: 0.3, gapX: 0.08, gapZ: 0.12 };

/* Lay the skills out like a keyboard: one ink category key, then its skills, wrapping at maxW. */
export function skillKeyboard(maxW, charW = 0.098) {
  const { keyD, gapX, gapZ } = KEYBOARD;
  const keys = [];
  let row = 0;
  SKILLS.forEach((cat, ci) => {
    const catW = 0.5 + cat.name.length * charW * 0.9;
    keys.push({ text: cat.name, cat: ci, isCat: true, x: 0, w: catW, row });
    const indent = catW + gapX;
    let x = indent;
    cat.items.forEach((name) => {
      const w = 0.36 + name.length * charW;
      if (x + w > maxW) { row++; x = indent; }
      keys.push({ text: name, cat: ci, isCat: false, x, w, row });
      x += w + gapX;
    });
    row++;
  });
  const width = Math.max(...keys.map((k) => k.x + k.w));
  const depth = row * (keyD + gapZ) - gapZ;
  keys.forEach((k) => { k.cx = k.x + k.w / 2 - width / 2; k.cz = k.row * (keyD + gapZ) + keyD / 2 - depth / 2; });
  return { keys, width, depth, rows: row };
}
export const FLOOR_Y = [2.0, 0.8, -0.4, -1.6];
export const SHAFTS = [[-1.9, -0.8], [0, -0.8], [1.9, -0.8], [-1.9, 0.8], [0, 0.8], [1.9, 0.8]];
export const OWN_Y = 1.0;
export const OWN_Z = -2.4;
export const OWN_R = 3.2;
export const SKYLINE_BASE = PLINTH_Y + 0.12;
export const SKYLINE_FROM = 500 / 7000;

export const AGENT_POINTS = Array.from({ length: 5 }, (_, k) => {
  const a = Math.PI / 2 + (k * TAU) / 5;
  const v = new THREE.Vector3(Math.cos(a) * 2.75, Math.sin(a) * 2.6, 0);
  v.applyAxisAngle(new THREE.Vector3(1, 0, 0), 0.5);
  v.y += 0.2;
  return v;
});

export function skylineColumns() {
  const cols = [];
  for (let a = 0; a < 4; a++) {
    for (let b = 0; b < 4; b++) {
      cols.push({ x: (a - 1.5) * 1.2, z: (b - 1.5) * 1.2, h: 0.5 + 4.3 * Math.pow((a + b) / 6, 1.45) });
    }
  }
  return cols;
}

export const growthAt = (p) => SKYLINE_FROM + (1 - SKYLINE_FROM) * smoothstep(0.08, 0.72, p);

function fib(i, n, r, out) {
  const y = 1 - ((i + 0.5) / n) * 2;
  const rad = Math.sqrt(Math.max(0, 1 - y * y));
  const th = i * GOLDEN;
  out[0] = Math.cos(th) * rad * r; out[1] = y * r; out[2] = Math.sin(th) * rad * r;
  return out;
}

/* Each shape is authored in its station's space (x right, y up, +z toward the lens). */
export function createShapes({ N, R, ringCurve }) {
  const v = [0, 0, 0];

  /* 01 · title: a blueprint dot grid behind the name */
  const gCols = 132, gRows = 54;
  const blueprint = (i, out) => {
    const k = i % (gCols * gRows);
    const c = k % gCols, r = Math.floor(k / gCols);
    out[0] = -10 + (c / (gCols - 1)) * 20 + (R[i * 4] - 0.5) * 0.02;
    out[1] = -3.6 + (r / (gRows - 1)) * 8.2;
    out[2] = -3.4 + (R[i * 4 + 1] - 0.5) * 0.02;
    return out;
  };

  /* 02 · core: the blueprint envelope the structure is designed to grow into */
  const coreEnvelope = (i, out, t, p) => {
    const r0 = R[i * 4], r1 = R[i * 4 + 1], r2 = R[i * 4 + 2], r3 = R[i * 4 + 3];
    const W = 3.5, D = 2.1;
    const top = envelopeTop(p);
    if (r3 < 0.34) {
      const k = i % 4;
      out[0] = (k & 1 ? W : -W) + (r1 - 0.5) * 0.03;
      out[1] = CORE_TOP + r0 * (top - CORE_TOP);
      out[2] = (k & 2 ? D : -D) + (r2 - 0.5) * 0.03;
      return out;
    }
    const floors = Math.max(1, Math.floor((top - CORE_TOP) / 1.08));
    const y = CORE_TOP + Math.min(floors, Math.floor(r1 * (floors + 1))) * 1.08;
    const per = 2 * (2 * W + 2 * D);
    let u = r0 * per;
    let x, z;
    if (u < 2 * W) { x = -W + u; z = -D; } else if ((u -= 2 * W) < 2 * D) { x = W; z = -D + u; }
    else if ((u -= 2 * D) < 2 * W) { x = W - u; z = D; } else { u -= 2 * W; x = -W; z = D - u; }
    out[0] = x + (r2 - 0.5) * 0.03; out[1] = Math.min(y, top); out[2] = z;
    return out;
  };

  /* 03 · journey: a twisted ribbon climbing with the staircase */
  const journey = (i, out, t) => {
    const r0 = R[i * 4], r1 = R[i * 4 + 1], r2 = R[i * 4 + 2];
    const a = r0 * TAU * 3.2 + (i % 2) * Math.PI + t * 0.6;
    const rad = 0.32 + (r1 - 0.5) * 0.08;
    out[0] = -4.8 + r0 * 9.6;
    out[1] = PLINTH_Y + 0.6 + Math.pow(r0, 1.15) * 4.6 + Math.sin(a) * rad;
    out[2] = -1.6 + Math.cos(a) * rad + (r2 - 0.5) * 0.05;
    return out;
  };

  /* 04 · skills: a dotted desk under the keyboard */
  const skills = (i, out) => {
    const k = i % (46 * 34);
    const c = k % 46, r = Math.floor(k / 46);
    out[0] = -5.6 + c * 0.25 + (R[i * 4] - 0.5) * 0.02;
    out[1] = BASE_Y + 0.03;
    out[2] = -4.1 + r * 0.25 + (R[i * 4 + 1] - 0.5) * 0.02;
    return out;
  };

  /* 05 · system: light shafts carrying requests down and replies up through the floors */
  const system = (i, out, t) => {
    const r0 = R[i * 4], r1 = R[i * 4 + 1], r2 = R[i * 4 + 2];
    const k = i % SHAFTS.length;
    const top = FLOOR_Y[0] + 0.9, bottom = FLOOR_Y[3] - 0.45;
    const q = frac(r0 + t * (0.16 + (k % 3) * 0.03));
    const down = k < 3;
    out[0] = SHAFTS[k][0] + (r1 - 0.5) * 0.07;
    out[1] = down ? top - q * (top - bottom) : bottom + q * (top - bottom);
    out[2] = SHAFTS[k][1] + (r2 - 0.5) * 0.07;
    return out;
  };

  /* 06 · scale: TeleCRM skyline growing ×14 */
  const sky = skylineColumns();
  const skyEdges = [];
  let skyTotal = 0;
  sky.forEach((col, ci) => {
    for (let k = 0; k < 4; k++) {
      for (const type of [0, 1, 2]) {
        skyEdges.push({ ci, k, type, at: skyTotal });
        skyTotal += type === 0 ? col.h : 0.72;
      }
    }
  });
  const skyAssign = new Uint16Array(N);
  for (let i = 0; i < N; i++) {
    const pick = R[i * 4] * skyTotal;
    let lo = 0, hi = skyEdges.length - 1;
    while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (skyEdges[mid].at <= pick) lo = mid; else hi = mid - 1; }
    skyAssign[i] = lo;
  }
  const corners = [[-0.36, -0.36], [0.36, -0.36], [0.36, 0.36], [-0.36, 0.36]];
  const cY = Math.cos(Math.PI / 4), sY = Math.sin(Math.PI / 4);
  const skyline = (i, out, t, p) => {
    const e = skyEdges[skyAssign[i]];
    const col = sky[e.ci];
    const h = col.h * growthAt(p);
    const u = R[i * 4 + 1];
    const [dx, dz] = corners[e.k];
    const [nx, nz] = corners[(e.k + 1) % 4];
    let x, y, z;
    if (e.type === 0) { x = col.x + dx; z = col.z + dz; y = SKYLINE_BASE + u * h; }
    else {
      x = col.x + dx + (nx - dx) * u; z = col.z + dz + (nz - dz) * u;
      y = e.type === 1 ? SKYLINE_BASE + h : SKYLINE_BASE;
    }
    x += (R[i * 4 + 2] - 0.5) * 0.04; z += (R[i * 4 + 3] - 0.5) * 0.04;
    out[0] = x * cY + z * sY + 0.6;
    out[1] = y;
    out[2] = -x * sY + z * cY - 0.4;
    return out;
  };

  /* 07 · agents: neural shell, orbit and spokes */
  const ringAxis = new THREE.Vector3(1, 0, 0);
  const tmpV = new THREE.Vector3();
  const brain = (i, out) => {
    const r0 = R[i * 4], r1 = R[i * 4 + 1], r2 = R[i * 4 + 2], r3 = R[i * 4 + 3];
    if (r3 < 0.46) {
      fib(i, N, 3.75 + (r0 - 0.5) * 0.08, out);
      out[1] += 0.2;
    } else if (r3 < 0.68) {
      const a = r0 * TAU;
      tmpV.set(Math.cos(a) * 2.75, Math.sin(a) * 2.6, 0).applyAxisAngle(ringAxis, 0.5);
      out[0] = tmpV.x + (r1 - 0.5) * 0.06; out[1] = tmpV.y + 0.2 + (r2 - 0.5) * 0.06; out[2] = tmpV.z;
    } else {
      const a = AGENT_POINTS[i % 5];
      out[0] = a.x * r0 + (r1 - 0.5) * 0.07;
      out[1] = 0.2 + (a.y - 0.2) * r0 + (r2 - 0.5) * 0.07;
      out[2] = a.z * r0;
    }
    return out;
  };

  /* 08 · retrieval: a dot-matrix index wall */
  const cols = Math.round(Math.sqrt(N * 1.7));
  const rows = Math.ceil(N / cols);
  const retrieval = (i, out) => {
    const c = i % cols, r = Math.floor(i / cols);
    const x = -4.8 + (c / (cols - 1)) * 9.6;
    const y = -2.3 + (r / Math.max(1, rows - 1)) * 5.6;
    out[0] = x; out[1] = y; out[2] = -2.4 + 0.16 * Math.sin(x * 0.9 + y * 1.3);
    return out;
  };

  /* 09 · footprint: 67% of the circle dense, the rest a dotted remainder */
  const ownership = (i, out) => {
    const r0 = R[i * 4], r1 = R[i * 4 + 1], r2 = R[i * 4 + 2], r3 = R[i * 4 + 3];
    const mine = r3 < 0.9;
    const u = mine ? r0 * OWNERSHIP : OWNERSHIP + r0 * (1 - OWNERSHIP);
    const a = Math.PI / 2 - u * TAU;
    const rad = OWN_R + (mine ? gauss(r1, r2, r3) * 0.14 : (r1 - 0.5) * 0.04);
    out[0] = Math.cos(a) * rad; out[1] = OWN_Y + Math.sin(a) * rad; out[2] = OWN_Z + (r2 - 0.5) * (mine ? 0.3 : 0.04);
    return out;
  };

  /* Final: the signal laid along the ring that joins every station */
  const ring = new Float32Array(N * 3);
  const pt = new THREE.Vector3();
  for (let i = 0; i < N; i++) {
    const r0 = R[i * 4], r1 = R[i * 4 + 1], r2 = R[i * 4 + 2], r3 = R[i * 4 + 3];
    ringCurve.getPointAt(r0, pt);
    const radial = new THREE.Vector3(pt.x, 0, pt.z).normalize();
    let off, up;
    if (r3 < 0.62) {
      const a = r0 * TAU * 60 + (i % 2) * Math.PI;
      off = Math.cos(a) * 0.8; up = Math.sin(a) * 0.8;
    } else {
      off = gauss(r1, r2, r3) * 1.4; up = gauss(r2, r3, r1) * 0.5;
    }
    ring[i * 3] = pt.x + radial.x * off;
    ring[i * 3 + 1] = pt.y + up + 0.5;
    ring[i * 3 + 2] = pt.z + radial.z * off;
  }

  const defs = [
    { fn: blueprint, dynamic: false },
    { fn: coreEnvelope, dynamic: true },
    { fn: journey, dynamic: true },
    { fn: skills, dynamic: false },
    { fn: system, dynamic: true },
    { fn: skyline, dynamic: true },
    { fn: brain, dynamic: false },
    { fn: retrieval, dynamic: false },
    { fn: ownership, dynamic: false },
  ];

  const shapes = defs.map((d, s) => {
    const f = FRAMES[s];
    const c = Math.cos(f.theta), sn = Math.sin(f.theta);
    const cx = f.center.x, cy = f.center.y, cz = f.center.z;
    const write = (target, t, p) => {
      for (let i = 0, j = 0; i < N; i++, j += 3) {
        d.fn(i, v, t, p);
        target[j] = cx + v[0] * c + v[2] * sn;
        target[j + 1] = cy + v[1];
        target[j + 2] = cz - v[0] * sn + v[2] * c;
      }
    };
    if (d.dynamic) return { dynamic: true, station: s, write };
    const data = new Float32Array(N * 3);
    write(data, 0, 0);
    return { dynamic: false, station: s, data };
  });
  shapes.push({ dynamic: false, station: -1, data: ring });
  return shapes;
}

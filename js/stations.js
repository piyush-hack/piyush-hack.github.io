import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { FRAMES, PLINTH_Y, SCENES, STARTS, smoothstep, clamp } from './config.js';
import {
  BASE_Y, CORE, CORE_TOP, envelopeTop, KEYBOARD, skillKeyboard, FLOOR_Y, SHAFTS, AGENT_POINTS, OWN_Y, OWN_Z, OWN_R, SKYLINE_BASE,
  skylineColumns, growthAt,
} from './shapes.js';
import {
  LINKS, PATTERNS, SKILLS, FLOORS, JOURNEY, AGENT_NAMES, AGENT_STATUS, QUERIES, OWNERSHIP,
} from './content.js';
import { COMMITS, COMMITS_START } from './commits.js';

const TAU = Math.PI * 2;
const frac = (x) => x - Math.floor(x);
const easeOutBack = (x) => { const c = 1.45; return 1 + (c + 1) * (x - 1) ** 3 + c * (x - 1) ** 2; };
const easeOutCubic = (x) => 1 - (1 - x) ** 3;

export function createMaterials() {
  return {
    clay: new THREE.MeshStandardMaterial({ color: 0xf2f0ea, roughness: 0.55, metalness: 0 }),
    plinth: new THREE.MeshStandardMaterial({ color: 0xece9e2, roughness: 0.8, metalness: 0 }),
    plinthHot: new THREE.MeshStandardMaterial({ color: 0xdedad0, roughness: 0.7, metalness: 0 }),
    ink: new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.32, metalness: 0.12 }),
    flat: new THREE.MeshBasicMaterial({ color: 0x111111 }),
    wire: new THREE.MeshBasicMaterial({ color: 0x111111, wireframe: true, transparent: true, opacity: 0.35 }),
    ghost: new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false }),
    line: new THREE.LineBasicMaterial({ color: 0x111111, transparent: true, opacity: 0.6 }),
    faint: new THREE.LineBasicMaterial({ color: 0x111111, transparent: true, opacity: 0.18 }),
  };
}

function line(points, material) {
  return new THREE.Line(new THREE.BufferGeometry().setFromPoints(points.map((p) => (p.isVector3 ? p : new THREE.Vector3(...p)))), material);
}

function circlePoints(r, n = 128) {
  return Array.from({ length: n + 1 }, (_, i) => { const a = (i / n) * TAU; return [Math.cos(a) * r, 0, Math.sin(a) * r]; });
}

class ArcCurve extends THREE.Curve {
  constructor(radius, y, from, to) { super(); this.radius = radius; this.y = y; this.from = from; this.to = to; }
  getPoint(t, target = new THREE.Vector3()) {
    const a = this.from + (this.to - this.from) * t;
    return target.set(Math.sin(a) * this.radius, this.y, -Math.cos(a) * this.radius);
  }
}

class RingCurve extends THREE.Curve {
  constructor(radius) { super(); this.radius = radius; }
  getPoint(t, target = new THREE.Vector3()) {
    const a = Math.PI / 2 - t * TAU;
    return target.set(Math.cos(a) * this.radius, Math.sin(a) * this.radius, 0);
  }
}

function stationGroup(i) {
  const g = new THREE.Group();
  g.position.copy(FRAMES[i].center);
  g.quaternion.copy(FRAMES[i].quat);
  return g;
}

const open = (href) => window.open(href, href.startsWith('mailto:') ? '_self' : '_blank', 'noopener');

/* ═════════ 01 · title: the name, assembled from modules ═════════ */

function voxelCells(lines, rowsPerCap) {
  const fontPx = 220;
  const font = `900 ${fontPx}px "Inter Tight", "Helvetica Neue", Arial, sans-serif`;
  const probe = document.createElement('canvas').getContext('2d');
  probe.font = font;
  const cap = probe.measureText('H').actualBoundingBoxAscent || fontPx * 0.72;
  const step = cap / rowsPerCap;
  const lineH = cap * 1.32;
  const W = Math.ceil(Math.max(...lines.map((l) => probe.measureText(l).width)) + fontPx * 0.3);
  const H = Math.ceil(lineH * lines.length + fontPx * 0.4);
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.font = font;
  ctx.fillStyle = '#000';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  lines.forEach((l, k) => ctx.fillText(l, W / 2, H / 2 + cap / 2 + (k - (lines.length - 1) / 2) * lineH));
  const data = ctx.getImageData(0, 0, W, H).data;
  const cells = [];
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (let gy = 0; gy * step < H; gy++) {
    for (let gx = 0; gx * step < W; gx++) {
      const px = Math.floor((gx + 0.5) * step), py = Math.floor((gy + 0.5) * step);
      if (px < W && py < H && data[(py * W + px) * 4 + 3] > 110) {
        cells.push([gx, gy]);
        minX = Math.min(minX, gx); maxX = Math.max(maxX, gx); minY = Math.min(minY, gy); maxY = Math.max(maxY, gy);
      }
    }
  }
  return { cells, minX, maxX, minY, maxY };
}

function titleStation(ctx) {
  const g = stationGroup(ctx.index);
  const lines = ctx.narrow ? ['PIYUSH', 'PUNIYA'] : ['PIYUSH PUNIYA'];
  const { cells, minX, maxX, minY, maxY } = voxelCells(lines, ctx.narrow ? 15 : 20);
  const cols = maxX - minX + 1, rows = maxY - minY + 1;
  const cell = (ctx.narrow ? 7.4 : 12.4) / cols;
  const geo = new RoundedBoxGeometry(cell * 0.9, cell * 0.9, cell * 1.8, 2, cell * 0.22);
  const mat = new THREE.MeshStandardMaterial({ roughness: 0.4, metalness: 0.1 });
  const n = cells.length;
  const mesh = new THREE.InstancedMesh(geo, mat, n);
  mesh.frustumCulled = false;
  g.add(mesh);
  const rnd = (() => { let a = 41; return () => { a = (a * 16807) % 2147483647; return a / 2147483647; }; })();
  const vox = cells.map(([cx, cy]) => {
    const u = rnd() * TAU, w = Math.acos(2 * rnd() - 1);
    const axis = new THREE.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).normalize();
    return {
      x: (cx - minX - cols / 2 + 0.5) * cell,
      y: -(cy - minY - rows / 2 + 0.5) * cell + 0.45,
      dx: Math.sin(w) * Math.cos(u), dy: Math.cos(w) * 0.8, dz: Math.sin(w) * Math.sin(u),
      dist: 6 + rnd() * 11,
      delay: 0.05 + ((cx - minX) / cols) * 1.15 + rnd() * 0.3,
      axis, spin: (rnd() - 0.5) * 7,
      accent: rnd() < 0.045,
      ox: 0, oy: 0, oz: 0, heat: 0,
    };
  });
  const INK_C = new THREE.Color(0x161616), CLAY_C = new THREE.Color(0xf1eee6);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), pos = new THREE.Vector3(), scl = new THREE.Vector3();
  const plane = new THREE.Plane();
  const hitPoint = new THREE.Vector3();
  const normal = new THREE.Vector3();
  const halfW = (cols * cell) / 2 + 0.6, halfH = (rows * cell) / 2 + 0.6;
  let pointer = null;
  let burstAt = -10;
  const exitStart = STARTS[1] - 1.1, exitEnd = STARTS[1] + 0.25;

  return {
    group: g,
    hitTest(ray) {
      normal.set(0, 0, 1).applyQuaternion(g.quaternion);
      plane.setFromNormalAndCoplanarPoint(normal, g.position);
      if (!ray.intersectPlane(plane, hitPoint)) { pointer = null; return null; }
      const local = g.worldToLocal(hitPoint.clone());
      pointer = local;
      if (Math.abs(local.x) < halfW && Math.abs(local.y - 0.45) < halfH) return { tip: 'Click to scatter the modules', cursor: 'pointer' };
      return null;
    },
    clearPointer() { pointer = null; },
    click(hit, t) { burstAt = t; },
    update(p, t, T) {
      const intro = ctx.introTime();
      const exit = smoothstep(exitStart, exitEnd, T);
      const age = t - burstAt;
      const burst = age < 0 || age > 1.7 ? 0 : age < 0.22 ? easeOutCubic(age / 0.22) : 1 - smoothstep(0.22, 1.7, age);
      const k = 0.16;
      for (let i = 0; i < n; i++) {
        const d = vox[i];
        const a = intro < 0 ? 0 : clamp((intro - d.delay) / 0.95, 0, 1);
        const e = easeOutBack(a), er = easeOutCubic(a);
        let tx = 0, ty = 0, tz = 0, heat = 0;
        if (pointer && exit < 0.5) {
          const dx = d.x - pointer.x, dy = d.y - pointer.y;
          const dist = Math.hypot(dx, dy);
          if (dist < 1.35) {
            const f = (1 - dist / 1.35) ** 2;
            tx = (dx / (dist || 1)) * f * 0.35; ty = (dy / (dist || 1)) * f * 0.35; tz = f * 2.2; heat = f;
          }
        }
        d.ox += (tx - d.ox) * k; d.oy += (ty - d.oy) * k; d.oz += (tz - d.oz) * k;
        d.heat += (heat - d.heat) * 0.12;
        const fly = (1 - e) + exit * 1.25 + burst * 0.55;
        pos.set(
          d.x + d.dx * d.dist * fly + d.ox,
          d.y + d.dy * d.dist * fly + d.oy,
          d.dz * d.dist * fly + 7 * (1 - er) + d.oz,
        );
        q.setFromAxisAngle(d.axis, d.spin * ((1 - er) + exit * 0.8 + burst * 0.7) + d.heat * 0.6);
        const s = (a > 0 ? Math.min(1, a * 4) : 0) * (1 - exit * 0.85);
        scl.set(s, s, s);
        mesh.setMatrixAt(i, m4.compose(pos, q, scl));
        mesh.setColorAt(i, d.accent || d.heat > 0.28 ? CLAY_C : INK_C);
      }
      mesh.instanceMatrix.needsUpdate = true;
      mesh.instanceColor.needsUpdate = true;
      mesh.visible = exit < 0.999;
    },
  };
}

/* ═════════ 02 · built to change: a foundation, swappable rooms, room to grow ═════════ */

function coreStation(ctx) {
  const { mats, labels } = ctx;
  const station = ctx.index;
  const g = stationGroup(station);
  const slab = new THREE.Mesh(new RoundedBoxGeometry(7.2, CORE.slabH, 4.2, 4, 0.1), mats.ink);
  g.add(slab);
  const shock = new THREE.Mesh(new THREE.TorusGeometry(3.9, 0.03, 8, 180), new THREE.MeshBasicMaterial({ color: 0x111111, transparent: true, opacity: 0 }));
  shock.rotation.x = Math.PI / 2;
  shock.position.y = BASE_Y + 0.02;
  g.add(shock);
  const blockGeo = new RoundedBoxGeometry(1.38, 0.98, 1.56, 3, 0.07);
  const ACCENT = new Set([5, 14, 19]);
  const SWAP = [9, 13];
  const blocks = [];
  for (let f = 0; f < CORE.floors; f++) {
    for (let r = 0; r < CORE.rows; r++) {
      for (let c = 0; c < CORE.cols; c++) {
        const i = blocks.length;
        const mesh = new THREE.Mesh(blockGeo, ACCENT.has(i) ? mats.ink : mats.clay);
        mesh.userData = { i };
        g.add(mesh);
        blocks.push({ mesh, home: new THREE.Vector3((c - 1.5) * CORE.sx, CORE_TOP + 0.5 + f * CORE.sy, (r - 0.5) * CORE.sz), start: 0.1 + i * 0.0135 });
      }
    }
  }
  const replacements = SWAP.map((bi) => {
    const m = new THREE.Mesh(blockGeo, mats.ink);
    m.userData = { i: bi };
    m.visible = false;
    g.add(m);
    return m;
  });
  const foundationTag = labels.add({ text: 'foundation · never moves', kind: 'chip', anchor: slab, at: [0, 0, 2.2], station });
  const swapTag = labels.add({ text: 'swap a part · nothing else moves', kind: 'chip-ink', anchor: replacements[0], at: [0, 0.75, 0], station });
  const growTag = labels.add({ text: 'designed for what comes next ↑', kind: 'note', anchor: g, at: [0, 0, 2.1], station });
  let lastP = 0, hovered = -1;
  const dropY = (a) => (1 - a * a) * 5.5;
  const squash = (x) => 1 - 0.14 * Math.sin(Math.PI * clamp(x, 0, 1));
  return {
    group: g,
    pickables: [...blocks.map((b) => b.mesh), ...replacements],
    hover(hit) {
      hovered = hit ? hit.object.userData.i : -1;
      if (!hit) return null;
      const pat = PATTERNS[hovered % PATTERNS.length];
      return { tip: `${pat.name}: ${pat.plain}. Used in ${pat.use}.`, cursor: pat.href ? 'pointer' : 'help' };
    },
    click(hit) { const pat = PATTERNS[hit.object.userData.i % PATTERNS.length]; if (pat.href) open(pat.href); },
    update(p) {
      const land = clamp(p / 0.08, 0, 1);
      slab.position.set(0, BASE_Y + CORE.slabH / 2 + (1 - land * land) * 9, 0);
      slab.scale.set(1, squash((p - 0.08) / 0.05), 1);
      if (lastP < 0.08 && p >= 0.08) ctx.shake(0.55);
      if (lastP < 0.65 && p >= 0.65) ctx.shake(0.2);
      lastP = p;
      const sw = clamp((p - 0.08) / 0.12, 0, 1);
      shock.scale.setScalar(1 + sw * 1.5);
      shock.material.opacity = sw > 0 && sw < 1 ? 0.55 * (1 - sw) : 0;
      const out = smoothstep(0.5, 0.6, p);
      blocks.forEach((b, i) => {
        const a = clamp((p - b.start) / 0.06, 0, 1);
        const swapIdx = SWAP.indexOf(i);
        const m = b.mesh;
        m.visible = p > b.start && !(swapIdx >= 0 && out >= 0.999);
        const lift = hovered === i ? 0.14 : 0;
        m.position.copy(b.home);
        m.position.y += dropY(a) + lift;
        m.scale.set(1, squash((p - b.start - 0.06) / 0.03), 1);
        if (swapIdx >= 0 && out > 0) {
          m.position.y += out * out * 7;
          m.position.x += out * (swapIdx ? 2.2 : -2.2);
          m.rotation.z = out * (swapIdx ? -0.6 : 0.6);
        } else m.rotation.z = 0;
      });
      replacements.forEach((m, k) => {
        const home = blocks[SWAP[k]].home;
        const a = clamp((p - 0.58 - k * 0.02) / 0.07, 0, 1);
        m.visible = p > 0.58 + k * 0.02;
        m.position.copy(home);
        m.position.y += dropY(a) + (hovered === SWAP[k] && a >= 1 ? 0.14 : 0);
        m.scale.set(1, squash((p - 0.65 - k * 0.02) / 0.03), 1);
      });
      foundationTag.alpha = smoothstep(0.1, 0.16, p) * (1 - smoothstep(0.86, 0.95, p) * 0.4);
      swapTag.alpha = smoothstep(0.64, 0.7, p);
      growTag.local.y = envelopeTop(p) + 0.35;
      growTag.alpha = smoothstep(0.7, 0.78, p);
    },
  };
}

/* ═════════ 03 · journey: five roles, one staircase ═════════ */

function journeyStation(ctx) {
  const { mats, labels } = ctx;
  const g = stationGroup(ctx.index);
  const base = PLINTH_Y + 0.07;
  const steps = JOURNEY.map((j, k) => {
    const h = 0.45 + k * 0.62;
    const x = -3.8 + k * 1.9;
    const mesh = new THREE.Mesh(new RoundedBoxGeometry(1.72, 1, 1.5, 3, 0.08), k === JOURNEY.length - 1 ? mats.ink : mats.clay);
    mesh.userData = { k };
    g.add(mesh);
    const company = labels.add({
      text: `${j.company} ↗`, kind: k === JOURNEY.length - 1 ? 'chip-ink' : 'chip', anchor: g, at: [x, base + h + 0.42, 0.3], station: ctx.index,
      href: j.href, onHover: (on) => ctx.tip(on ? j.wins : null),
    });
    const role = labels.add({ text: ctx.narrow ? j.year : `${j.year} · ${j.role}`, kind: 'note', anchor: g, at: [x, base + h + 0.02, 0.9], station: ctx.index });
    return { mesh, h, x, company, role, j };
  });
  const marker = new THREE.Mesh(new THREE.SphereGeometry(0.2, 32, 20), mats.flat);
  g.add(marker);
  let hovered = -1;
  return {
    group: g,
    pickables: steps.map((s) => s.mesh),
    hover(hit) {
      hovered = hit ? hit.object.userData.k : -1;
      return hit ? { tip: `${steps[hovered].j.company} — ${steps[hovered].j.wins}`, cursor: 'pointer' } : null;
    },
    click(hit) { open(steps[hit.object.userData.k].j.href); },
    update(p, t) {
      steps.forEach((s, k) => {
        const grow = smoothstep(0.04 + k * 0.09, 0.16 + k * 0.09, p);
        const lift = hovered === k ? 0.18 : 0;
        s.mesh.scale.set(1, Math.max(0.001, s.h * grow), 1);
        s.mesh.position.set(s.x, base + (s.h * grow) / 2 + lift, 0);
        s.company.alpha = smoothstep(0.8, 1, grow);
        s.role.alpha = s.company.alpha;
      });
      const hp = smoothstep(0.12, 0.74, p) * (steps.length - 1);
      const j = Math.min(Math.floor(hp), steps.length - 2);
      const f = hp - j;
      const a = steps[j], b = steps[j + 1];
      marker.position.set(
        a.x + (b.x - a.x) * f,
        base + a.h + (b.h - a.h) * f + Math.sin(Math.PI * f) * 0.9 + 0.2 + Math.abs(Math.sin(t * 4)) * 0.04,
        0.2,
      );
      marker.visible = p > 0.08;
    },
  };
}

/* ═════════ 04 · skills: a keyboard where every key is a skill ═════════ */

function skillsStation(ctx) {
  const { mats, labels } = ctx;
  const station = ctx.index;
  const g = stationGroup(station);
  const board = new THREE.Group();
  const layout = ctx.narrow ? skillKeyboard(9.0, 0.12) : skillKeyboard(13.2);
  const boardY = KEYBOARD.y + (layout.depth / 2) * Math.sin(KEYBOARD.tilt) + 0.1;
  board.position.y = boardY;
  board.rotation.x = KEYBOARD.tilt;
  g.add(board);
  const plate = new THREE.Mesh(new RoundedBoxGeometry(layout.width + 0.55, 0.26, layout.depth + 0.5, 3, 0.1), mats.ink);
  plate.position.y = -0.13;
  board.add(plate);
  const keys = layout.keys.map((k, i) => {
    const mesh = new THREE.Mesh(new RoundedBoxGeometry(k.w, KEYBOARD.keyH, KEYBOARD.keyD, 2, 0.07), k.isCat ? mats.flat : mats.clay);
    mesh.userData = { i };
    board.add(mesh);
    const cat = SKILLS[k.cat];
    const tip = k.isCat ? `${cat.name} · ${cat.items.length} skills — ${cat.proof}` : `${k.text} — ${cat.proof}`;
    const label = labels.add({
      text: k.text, kind: k.isCat ? 'key-ink' : 'key', anchor: mesh, at: [0, KEYBOARD.keyH / 2 + 0.01, 0], station,
      onHover: (on) => { hovered = on ? i : hovered === i ? -1 : hovered; ctx.tip(on ? tip : null); },
      onClick: () => { pressedAt[i] = clock; ctx.tip(tip, 2600); },
    });
    return { ...k, mesh, label, tip, start: 0.1 + k.row * 0.04 + ((k.cx + layout.width / 2) / layout.width) * 0.06 };
  });
  const pressedAt = keys.map(() => -10);
  let hovered = -1, clock = 0, lastP = 0;
  return {
    group: g,
    pickables: keys.map((k) => k.mesh),
    hover(hit) {
      hovered = hit ? hit.object.userData.i : -1;
      return hit ? { tip: keys[hovered].tip, cursor: 'pointer' } : null;
    },
    click(hit, t) { pressedAt[hit.object.userData.i] = t; ctx.tip(keys[hit.object.userData.i].tip, 2600); },
    update(p, t) {
      clock = t;
      const land = clamp(p / 0.07, 0, 1);
      board.position.y = boardY + (1 - land * land) * 7;
      if (lastP < 0.07 && p >= 0.07) ctx.shake(0.35);
      lastP = p;
      keys.forEach((k, i) => {
        const a = clamp((p - k.start) / 0.05, 0, 1);
        const wave = Math.max(0, Math.sin(t * 2.6 - (k.cx * 1.1 + k.row * 0.9))) ** 14 * 0.06 * smoothstep(0.55, 0.7, p);
        const press = (hovered === i ? 0.11 : 0) + Math.max(0, 1 - (t - pressedAt[i]) / 0.25) * 0.12 + wave;
        k.mesh.visible = a > 0;
        k.mesh.position.set(k.cx, KEYBOARD.keyH / 2 + (1 - a * a) * 1.6 - press, k.cz);
        k.label.alpha = ctx.narrow && !k.isCat ? 0 : smoothstep(0.7, 1, a);
        k.label.el.classList.toggle('is-on', hovered === i);
      });
    },
  };
}

/* ═════════ 05 · system design: my floor plan for any system ═════════ */

function systemStation(ctx) {
  const { mats, labels } = ctx;
  const station = ctx.index;
  const g = stationGroup(station);
  const slabGeo = new RoundedBoxGeometry(6.0, 0.32, 3.4, 3, 0.06);
  let hovered = -1;
  const floors = FLOORS.map((f, k) => {
    const mesh = new THREE.Mesh(slabGeo, k === 1 ? mats.ink : mats.clay);
    mesh.userData = { k };
    g.add(mesh);
    const name = labels.add({
      text: f.name, kind: k === 1 ? 'chip' : 'chip-ink', anchor: mesh, at: [-2.15, 0, 1.72], station,
      onHover: (on) => { hovered = on ? k : hovered === k ? -1 : hovered; ctx.tip(on ? f.tip : null); },
      onClick: () => ctx.tip(`${f.name} — ${f.tip}`, 3200),
    });
    const note = labels.add({ text: f.note, kind: 'note', anchor: mesh, at: [0.95, -0.16, 1.72], offset: [0, 30], station });
    return { mesh, name, note, y: FLOOR_Y[k], k };
  });
  /* the services floor scales out while every other floor stays exactly as it is */
  const LOADS = [[0, 1], [0.32, 2], [0.46, 4], [0.6, 8], [0.74, 14]];
  const instGeo = new RoundedBoxGeometry(0.56, 0.34, 0.78, 3, 0.06);
  const instances = Array.from({ length: 14 }, (_, j) => {
    const m = new THREE.Mesh(instGeo, j === 0 ? mats.ink : mats.clay);
    const c = j % 7, r = Math.floor(j / 7);
    m.position.set((c - 3) * 0.76, FLOOR_Y[2] + 0.16 + 0.17, (r - 0.5) * 1.15 - 0.2);
    m.userData.at = LOADS.find(([, n]) => n > j)[0];
    g.add(m);
    return m;
  });
  const load = labels.add({ text: 'load ×1', kind: 'chip-ink', anchor: g, at: [2.55, FLOOR_Y[2] + 0.62, 1.5], station });
  const shafts = [];
  SHAFTS.forEach(([x, z]) => shafts.push(new THREE.Vector3(x, FLOOR_Y[0] + 0.9, z), new THREE.Vector3(x, FLOOR_Y[3] - 0.45, z)));
  const shaftLines = new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(shafts), new THREE.LineBasicMaterial({ color: 0x111111, transparent: true, opacity: 0 }));
  g.add(shaftLines);
  const msg = new THREE.Mesh(new THREE.SphereGeometry(0.15, 24, 16), mats.flat);
  g.add(msg);
  const STEPS = [[0, 'request in'], [0.2, 'hits a stable interface'], [0.4, 'any instance takes it'], [0.58, 'one source of truth'], [0.72, 'response out']];
  const msgTag = labels.add({ text: STEPS[0][1], kind: 'chip-ink', anchor: msg, at: [0, 0, 0], offset: [74, 0], station });
  const top = FLOOR_Y[0] + 1.2, bottom = FLOOR_Y[3];
  return {
    group: g,
    pickables: floors.map((f) => f.mesh),
    hover(hit) {
      hovered = hit ? hit.object.userData.k : -1;
      return hit ? { tip: `${FLOORS[hovered].name} — ${FLOORS[hovered].tip}`, cursor: 'help' } : null;
    },
    update(p, t) {
      floors.forEach((f) => {
        const order = 3 - f.k;
        const s = smoothstep(0.04 + order * 0.07, 0.15 + order * 0.07, p);
        f.mesh.position.set((1 - s) * (f.k % 2 ? 9 : -9), f.y + (hovered === f.k ? 0.16 : 0), 0);
        f.name.alpha = smoothstep(0.85, 1, s);
        f.note.alpha = ctx.narrow ? 0 : f.name.alpha;
        f.name.el.classList.toggle('is-on', hovered === f.k);
      });
      const servicesIn = smoothstep(0.15, 0.25, p);
      let n = 0;
      instances.forEach((m, j) => {
        const s = j === 0 ? servicesIn : smoothstep(m.userData.at, m.userData.at + 0.035, p);
        m.scale.setScalar(Math.max(0.001, s));
        m.visible = s > 0.002;
        m.position.y = FLOOR_Y[2] + 0.33 + (hovered === 2 ? 0.16 : 0) + (1 - s) * 0.6;
        if (s > 0.5) n = j + 1;
      });
      labels.setText(load, n >= 14 ? 'load ×14 · same design' : `load ×${Math.max(1, n)}`);
      load.alpha = servicesIn;
      shaftLines.material.opacity = 0.22 * smoothstep(0.36, 0.5, p);
      const live = smoothstep(0.4, 0.5, p);
      const q = frac(t / 5.2);
      const down = q < 0.7;
      msg.position.set(down ? 0 : 1.9, down ? top - (q / 0.7) * (top - bottom) : bottom + ((q - 0.7) / 0.3) * (top - bottom), down ? 0.8 : -0.8);
      msg.visible = live > 0.5;
      let label = STEPS[0][1];
      STEPS.forEach(([at, text]) => { if (q >= at) label = text; });
      labels.setText(msgTag, label);
      msgTag.alpha = live;
    },
  };
}

/* ═════════ 05 · scale: TeleCRM ═════════ */

function scaleStation(ctx) {
  const { mats, labels } = ctx;
  const g = stationGroup(ctx.index);
  const cols = skylineColumns();
  const tallest = cols.reduce((a, b) => (b.h > a.h ? b : a));
  const rot = (x, z) => [x * Math.cos(Math.PI / 4) + z * Math.sin(Math.PI / 4) + 0.6, -x * Math.sin(Math.PI / 4) + z * Math.cos(Math.PI / 4) - 0.4];
  const [tx, tz] = rot(tallest.x, tallest.z);
  const req = labels.add({ text: '500 req', kind: 'num', anchor: g, at: [tx, 0, tz], station: ctx.index });
  const costPts = [];
  for (let i = 0; i <= 40; i++) {
    const u = i / 40;
    const v = 40 - 23 * smoothstep(0.1, 0.9, u) + Math.sin(u * 31) * 0.9 * (1 - u);
    costPts.push(new THREE.Vector3(-5.2 + u * 3.6, -1.9 + (v - 17) * 0.1, -1.6));
  }
  const cost = new THREE.Line(new THREE.BufferGeometry().setFromPoints(costPts), new THREE.LineBasicMaterial({ color: 0x111111 }));
  g.add(cost, line([[-5.2, -1.95, -1.6], [-1.6, -1.95, -1.6]], mats.faint));
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 12), mats.flat);
  g.add(head);
  const costLabel = labels.add({ text: '$40 / day', kind: 'chip', anchor: head, at: [0, 0.4, 0], station: ctx.index });
  labels.add({ text: 'DB cost', kind: 'note', anchor: g, at: [-4.6, -2.25, -1.6], station: ctx.index });
  if (!ctx.narrow) labels.add({ text: 'TeleCRM ↗', kind: 'chip-ink', anchor: g, at: [3.4, PLINTH_Y + 0.3, 1.6], station: ctx.index, href: LINKS.telecrm });
  labels.add({ text: 'CI/CD from scratch', kind: 'note', anchor: g, at: [-3.0, PLINTH_Y + 0.25, 2.6], station: ctx.index });
  labels.add({ text: 'led the team', kind: 'note', anchor: g, at: [0.4, PLINTH_Y + 0.25, 3.4], station: ctx.index });
  const pick = new THREE.Mesh(new THREE.BoxGeometry(5.2, 5.2, 5.2), mats.ghost);
  pick.position.set(0.6, 0, -0.4);
  g.add(pick);
  return {
    group: g,
    pickables: [pick],
    hover(hit) { return hit ? { tip: 'TeleCRM backend: 500 → 7,000 concurrent requests (×14)', cursor: 'pointer' } : null; },
    click() { open(LINKS.telecrm); },
    update(p) {
      const grow = growthAt(p);
      req.local.y = SKYLINE_BASE + tallest.h * grow + 0.55;
      labels.setText(req, `${Math.round(7000 * grow).toLocaleString('en-US')} req`);
      const c = smoothstep(0.12, 0.8, p);
      const idx = Math.max(1, Math.floor(c * 40));
      cost.geometry.setDrawRange(0, idx + 1);
      head.position.copy(costPts[idx]);
      labels.setText(costLabel, `$${Math.round(40 - 23 * smoothstep(0.1, 0.9, idx / 40))} / day`);
    },
  };
}

/* ═════════ 06 · AI agents ═════════ */

function agentsStation(ctx) {
  const { mats, labels } = ctx;
  const g = stationGroup(ctx.index);
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.8, 48, 32), mats.ink);
  core.position.y = 0.2;
  const halo = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.01, 8, 160), mats.flat);
  halo.position.y = 0.2;
  g.add(core, halo);
  let manual = -1, manualUntil = -1;
  const agentGeo = new THREE.SphereGeometry(0.4, 40, 28);
  const agents = AGENT_POINTS.map((pos, k) => {
    const m = new THREE.Mesh(agentGeo, mats.clay);
    m.position.copy(pos);
    m.userData = { k };
    g.add(m);
    return m;
  });
  const spokes = [];
  AGENT_POINTS.forEach((a) => spokes.push(new THREE.Vector3(0, 0.2, 0), a));
  g.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(spokes), mats.line));
  const pulseGeo = new THREE.SphereGeometry(0.085, 16, 12);
  const pulses = AGENT_POINTS.map(() => { const m = new THREE.Mesh(pulseGeo, mats.flat); g.add(m); return m; });
  const gaugeCurve = new RingCurve(4.15);
  const gauge = new THREE.Mesh(new THREE.TubeGeometry(gaugeCurve, 240, 0.055, 8, false), mats.flat);
  gauge.position.y = 0.2;
  const track = line(circlePoints(4.15, 160).map(([x, , z]) => [x, z, 0]), mats.faint);
  track.position.y = 0.2;
  g.add(gauge, track);
  const gaugeIndex = gauge.geometry.index.count, perSeg = 48;
  let clock = 0;
  const pick = (k) => { manual = k; manualUntil = clock + 3.5; };
  const tags = agents.map((m, k) => labels.add({
    text: AGENT_NAMES[k], kind: 'tag', anchor: m, at: [0, 0.72, 0], station: ctx.index,
    onClick: () => pick(k), onHover: (on) => ctx.tip(on ? `Hand the conversation to the ${AGENT_NAMES[k]} agent` : null),
  }));
  labels.add({ text: 'Orchestrator', kind: 'chip-ink', anchor: core, at: [0, -1.12, 0], station: ctx.index });
  const status = labels.add({ text: 'INPROGRESS', kind: 'note', anchor: core, at: [0, -1.62, 0], station: ctx.index });
  const pct = labels.add({ text: '0%', kind: 'num', anchor: g, at: [0, 4.6, 0], station: ctx.index });
  if (!ctx.narrow) labels.add({ text: 'How I built it ↗', kind: 'chip', anchor: g, at: [-2.6, PLINTH_Y + 0.35, 2.4], station: ctx.index, href: LINKS.agents });
  if (!ctx.narrow) labels.add({ text: 'Teaching AI to say “I don’t know” ↗', kind: 'chip', anchor: g, at: [2.2, PLINTH_Y + 0.35, 2.8], station: ctx.index, href: LINKS.idk });
  const tip = new THREE.Vector3();
  return {
    group: g,
    pickables: agents,
    hover(hit) { return hit ? { tip: `Click to hand off to ${AGENT_NAMES[hit.object.userData.k]}`, cursor: 'pointer' } : null; },
    click(hit) { pick(hit.object.userData.k); },
    update(p, t) {
      clock = t;
      const auto = clamp(Math.floor(smoothstep(0.08, 0.92, p) * 5), 0, 4);
      const active = manualUntil > t ? manual : auto;
      agents.forEach((m, k) => {
        const on = k === active;
        m.material = on ? mats.ink : mats.clay;
        m.scale.setScalar((on ? 1.32 : 1) + Math.sin(t * 2 + k) * 0.03);
        tags[k].el.classList.toggle('is-on', on);
      });
      pulses.forEach((m, k) => {
        const qq = frac(t * 0.65 + k * 0.21);
        const a = AGENT_POINTS[k];
        const back = k === active ? 1 - qq : qq;
        m.position.set(a.x * back, 0.2 + (a.y - 0.2) * back, a.z * back);
      });
      halo.rotation.set(t * 0.4, t * 0.3, 0);
      const fill = 0.99 * smoothstep(0.1, 0.75, p);
      gauge.geometry.setDrawRange(0, Math.floor((gaugeIndex / perSeg) * fill) * perSeg);
      gaugeCurve.getPoint(Math.max(fill, 0.001), tip);
      pct.local.set(tip.x * 1.16, tip.y * 1.16 + 0.2, 0);
      labels.setText(pct, `${Math.round(fill * 100)}%`);
      const si = manualUntil > t ? 1 : clamp(Math.floor(p * AGENT_STATUS.length), 0, AGENT_STATUS.length - 1);
      labels.setText(status, `guardrail → ${AGENT_STATUS[si]}`);
    },
  };
}

/* ═════════ 07 · retrieval ═════════ */

function retrievalStation(ctx) {
  const { mats, labels } = ctx;
  const g = stationGroup(ctx.index);
  const slabGeo = new RoundedBoxGeometry(1.75, 2.3, 0.14, 3, 0.05);
  const textLine = new THREE.BoxGeometry(1, 0.05, 0.02);
  const xs = [-2.7, 0, 2.7];
  const docs = ['Returns policy', 'X300 returns', 'X200 returns'];
  const slabs = xs.map((x, k) => {
    const s = new THREE.Group();
    s.position.set(x, 0.95, 0);
    const slab = new THREE.Mesh(slabGeo, mats.clay);
    slab.userData = { k };
    s.add(slab);
    [0.9, 0.62, 0.62, 0.8, 0.5, 0.7].forEach((w, j) => {
      const l = new THREE.Mesh(textLine, mats.flat);
      l.scale.x = w * 1.2;
      l.position.set(-0.7 + (w * 1.2) / 2, 0.78 - j * 0.28, 0.08);
      s.add(l);
    });
    g.add(s);
    const tag = labels.add({ text: docs[k], kind: 'chip', anchor: s, at: [0, 1.5, 0], station: ctx.index });
    return { group: s, slab, tag };
  });
  const UNIT = 0.13;
  const segGeo = new THREE.BoxGeometry(0.62, 1, 0.62);
  const judgeMats = [mats.clay, mats.ink, mats.wire];
  const WINDOWS = [[0.1, 0.28], [0.3, 0.48], [0.5, 0.64]];
  const stacks = xs.map((x) => [0, 1, 2].map((j) => {
    const m = new THREE.Mesh(segGeo, judgeMats[j]);
    m.position.set(x, 0, 1.35);
    g.add(m);
    return m;
  }));
  const totals = xs.map((x) => labels.add({ text: '0', kind: 'num', anchor: g, at: [x, 0, 1.35], station: ctx.index }));
  const legend = ['meaning ·0.35', 'exact ·0.45', 'loose ·0.20'].map((name) => labels.add({ text: name, kind: 'note', anchor: g, at: [0, 0, 0], station: ctx.index }));
  let qi = 0, replayAt = -10, clock = 0;
  const query = labels.add({
    text: `${QUERIES[0].text}  ⇄`, kind: 'quote', anchor: g, at: [0, 3.25, -0.6], station: ctx.index,
    onClick: () => { qi = (qi + 1) % QUERIES.length; replayAt = clock; labels.setText(query, `${QUERIES[qi].text}  ⇄`); },
    onHover: (on) => ctx.tip(on ? 'Switch the question — watch the vote change' : null),
  });
  const answer = labels.add({ text: '✓ Answer', kind: 'chip-ink', anchor: g, at: [0, -0.7, 0.4], station: ctx.index });
  if (!ctx.narrow) labels.add({ text: 'Read the recipe ↗', kind: 'chip', anchor: g, at: [-3.9, PLINTH_Y + 0.3, 2.6], station: ctx.index, href: LINKS.hybrid });
  return {
    group: g,
    pickables: slabs.map((s) => s.slab),
    hover(hit) { return hit ? { tip: `${docs[hit.object.userData.k]} — click the question to switch queries`, cursor: 'help' } : null; },
    click() { query.el.click(); },
    update(p, t) {
      clock = t;
      const Q = QUERIES[qi];
      const replay = t - replayAt < 2.4 ? clamp((t - replayAt) / 2.0, 0, 1) * 0.8 : null;
      const pp = replay === null ? p : replay;
      xs.forEach((x, k) => {
        let base = PLINTH_Y + 0.08, total = 0;
        stacks[k].forEach((m, j) => {
          const pts = Q.points[k][j];
          const grow = smoothstep(WINDOWS[j][0], WINDOWS[j][1], pp);
          const h = Math.max(0.0001, pts * UNIT * grow);
          m.visible = pts > 0;
          m.scale.y = h;
          m.position.y = base + h / 2;
          base += pts > 0 ? h : 0;
          total += pts * grow;
          if (k === 2) {
            legend[j].local.set(x + 0.6, base - h / 2, 1.35);
            legend[j].alpha = pts > 0 ? smoothstep(WINDOWS[j][0], WINDOWS[j][0] + 0.06, pp) : 0;
          }
        });
        totals[k].local.set(x, base + 0.38, 1.35);
        totals[k].alpha = smoothstep(0.1, 0.16, pp);
        labels.setText(totals[k], total.toFixed(1));
      });
      const win = smoothstep(0.66, 0.78, pp);
      slabs.forEach((s, k) => {
        const won = k === Q.winner;
        s.slab.material = won && win > 0.5 ? mats.ink : mats.clay;
        s.group.position.y = 0.95 + (won ? win * 0.35 : 0);
        s.group.position.z = won ? 0 : -win * 0.5;
        s.group.rotation.y = won ? Math.sin(win * Math.PI) * 0.35 : 0;
        s.tag.el.classList.toggle('is-on', won && win > 0.5);
      });
      answer.local.set(xs[Q.winner], -0.7, 0.4);
      answer.alpha = win;
    },
  };
}

/* ═════════ 11 · footprint: real commit history ═════════ */

function footprintStation(ctx) {
  const { mats, labels } = ctx;
  const g = stationGroup(ctx.index);
  const days = COMMITS.length;
  const weeks = Math.ceil(days / 7);
  const sx = 0.082, sz = 0.19;
  const x0 = -((weeks - 1) * sx) / 2, z0 = 0.35;
  const bars = new THREE.InstancedMesh(new THREE.BoxGeometry(0.068, 1, 0.16), new THREE.MeshStandardMaterial({ roughness: 0.4, metalness: 0.05 }), days);
  const ink = new THREE.Color(0x141414), quiet = new THREE.Color(0xd6d3cb), hot = new THREE.Color(0x8a877f);
  const heights = COMMITS.map((c) => (c ? 0.08 + Math.sqrt(c) * 0.27 : 0.025));
  COMMITS.forEach((c, i) => bars.setColorAt(i, c ? ink : quiet));
  g.add(bars);
  const cumulative = [];
  COMMITS.reduce((sum, c, i) => { cumulative[i] = sum + c; return cumulative[i]; }, 0);
  const startDate = new Date(`${COMMITS_START}T00:00:00Z`);
  const fmt = (i, opts) => new Date(startDate.getTime() + i * 864e5).toLocaleDateString('en-US', { ...opts, timeZone: 'UTC' });
  const ringPts = [];
  for (let k = 0; k <= 160; k++) {
    const a = Math.PI / 2 - (k / 160) * TAU;
    ringPts.push([Math.cos(a) * OWN_R, OWN_Y + Math.sin(a) * OWN_R, OWN_Z]);
  }
  g.add(line(ringPts, mats.faint));
  const endA = Math.PI / 2 - OWNERSHIP * TAU;
  labels.add({ text: '67% · 199K lines', kind: 'chip-ink', anchor: g, at: [Math.cos(endA) * (OWN_R + 0.75), OWN_Y + Math.sin(endA) * (OWN_R + 0.75), OWN_Z], station: ctx.index });
  if (!ctx.narrow) labels.add({ text: 'GitHub ↗', kind: 'chip', anchor: g, at: [-3.6, PLINTH_Y + 0.3, 2.6], station: ctx.index, href: LINKS.github });
  const counter = labels.add({ text: '0 commits', kind: 'num', anchor: g, at: [0, 0, z0], station: ctx.index });
  const date = labels.add({ text: fmt(0, { month: 'short', year: 'numeric' }), kind: 'note', anchor: g, at: [0, 0, z0], station: ctx.index });
  const m4 = new THREE.Matrix4(), pos = new THREE.Vector3(), quat = new THREE.Quaternion(), scl = new THREE.Vector3();
  let lastSweep = -1, hovered = -1, lastHovered = -1;
  return {
    group: g,
    pickables: [bars],
    hover(hit) {
      hovered = hit && hit.instanceId != null ? hit.instanceId : -1;
      if (hovered < 0) return null;
      const c = COMMITS[hovered];
      return { tip: `${fmt(hovered, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} · ${c} commit${c === 1 ? '' : 's'}`, cursor: 'crosshair' };
    },
    update(p) {
      const sweep = smoothstep(0.04, 0.74, p) * (weeks + 3);
      if (hovered !== lastHovered) {
        if (lastHovered >= 0) bars.setColorAt(lastHovered, COMMITS[lastHovered] ? ink : quiet);
        if (hovered >= 0) bars.setColorAt(hovered, hot);
        bars.instanceColor.needsUpdate = true;
        lastHovered = hovered;
      }
      if (Math.abs(sweep - lastSweep) < 1e-3) return;
      lastSweep = sweep;
      for (let i = 0; i < days; i++) {
        const w = Math.floor(i / 7), d = i % 7;
        const h = Math.max(0.001, heights[i] * smoothstep(w, w + 3, sweep));
        pos.set(x0 + w * sx, PLINTH_Y + 0.07 + h / 2, z0 + (d - 3) * sz);
        scl.set(1, h, 1);
        bars.setMatrixAt(i, m4.compose(pos, quat, scl));
      }
      bars.instanceMatrix.needsUpdate = true;
      bars.computeBoundingSphere();
      const head = clamp(Math.floor(Math.min(sweep, weeks) * 7) - 1, 0, days - 1);
      const hx = x0 + Math.min(sweep, weeks - 1) * sx;
      counter.local.set(hx, PLINTH_Y + 3.75, z0);
      date.local.set(hx, PLINTH_Y + 3.3, z0);
      counter.alpha = smoothstep(0.03, 0.08, p);
      date.alpha = counter.alpha;
      labels.setText(counter, `${cumulative[sweep >= weeks ? days - 1 : head].toLocaleString('en-US')} commits`);
      labels.setText(date, fmt(head, { month: 'short', year: 'numeric' }));
    },
  };
}

const BUILDERS = [
  titleStation, coreStation, journeyStation, skillsStation, systemStation, scaleStation, agentsStation, retrievalStation, footprintStation,
];

export function createStations(ctx) {
  const plinthGeo = new THREE.CylinderGeometry(5.1, 5.1, 0.14, 120);
  const rimPts = circlePoints(5.1, 160);
  return BUILDERS.map((build, i) => {
    const station = build({ ...ctx, index: i });
    const plinth = new THREE.Mesh(plinthGeo, ctx.mats.plinth);
    plinth.position.y = PLINTH_Y - 0.07;
    plinth.userData = { station: i };
    const rim = line(rimPts, ctx.mats.faint);
    rim.position.y = PLINTH_Y + 0.005;
    station.group.add(plinth, rim);
    station.plinth = plinth;
    station.mapLabel = ctx.labels.add({
      text: `${String(i + 1).padStart(2, '0')} · ${SCENES[i].name}`, kind: 'map', anchor: station.group, at: [0, PLINTH_Y, 5.7], map: true,
      onClick: () => ctx.navigate(i), onHover: (on) => { station.mapHot = on; },
    });
    ctx.scene.add(station.group);
    return station;
  });
}

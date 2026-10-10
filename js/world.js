import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  FRAMES, CAMERA_POSITIONS, CAMERA_TARGETS, FRAMING, LOOK, PAPER, PLINTH_Y, STATION_COUNT, SCENES, STARTS, BOUNDARIES,
  OVERVIEW_SCENE, WORLD_CENTER, sceneEnd, smoothstep, smootherstep, clamp,
} from './config.js';
import { createShapes } from './shapes.js';
import { createStations, createMaterials } from './stations.js';
import { LabelLayer } from './labels.js';

const VERT = /* glsl */ `
uniform float uTime;
uniform float uSize;
uniform float uPR;
uniform float uFogNear;
uniform float uFogFar;
attribute float aScale;
attribute float aRand;
varying float vAlpha;
void main() {
  vec3 p = position;
  float t = uTime;
  p += 0.035 * vec3(
    sin(t * 0.9 + aRand * 6.2831 + p.y * 1.3),
    cos(t * 0.8 + aRand * 4.0 + p.x * 1.1),
    sin(t * 0.7 + aRand * 5.0 + p.z * 1.2));
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  float depth = -mv.z;
  gl_PointSize = min(uSize * aScale * uPR * (12.0 / max(depth, 0.1)), 18.0 * uPR);
  vAlpha = (1.0 - smoothstep(uFogNear, uFogFar, depth)) * smoothstep(0.6, 3.0, depth);
}`;

const FRAG = /* glsl */ `
uniform vec3 uColor;
uniform float uOpacity;
varying float vAlpha;
void main() {
  float d = length(gl_PointCoord - 0.5);
  float a = (1.0 - smoothstep(0.22, 0.5, d)) * vAlpha * uOpacity;
  if (a < 0.01) discard;
  gl_FragColor = vec4(uColor, a);
}`;

function mulberry32(seed) {
  let a = seed;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pointsMaterial(size, opacity) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 }, uSize: { value: size }, uPR: { value: 1 }, uFogNear: { value: 20 }, uFogFar: { value: 56 },
      uColor: { value: new THREE.Color(0x161616) }, uOpacity: { value: opacity },
    },
    vertexShader: VERT,
    fragmentShader: FRAG,
    transparent: true,
    depthWrite: false,
  });
}

const transitionSum = (T, lead, span) => BOUNDARIES.reduce((s, b) => s + smootherstep((T - (b - lead)) / span), 0);

/* Gentle orbit while a shot holds; zero velocity at every hand-off so cuts never kick. */
function driftAt(T) {
  for (const b of BOUNDARIES) {
    const s = b - 1.0;
    if (T >= s && T <= s + 1.8) return 0.5 - smootherstep((T - s) / 1.8);
  }
  let i = 0;
  while (i < BOUNDARIES.length && T > BOUNDARIES[i] + 0.8) i++;
  const start = i === 0 ? 0 : BOUNDARIES[i - 1] + 0.8;
  const end = i === BOUNDARIES.length ? sceneEnd(OVERVIEW_SCENE) : BOUNDARIES[i] - 1.0;
  return smootherstep((T - start) / Math.max(0.1, end - start)) - 0.5;
}

const easeOutCubic = (x) => 1 - (1 - x) ** 3;

export function createWorld({ canvas, labelRoot, tipEl, narrow, onNavigate }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setClearColor(PAPER, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(PAPER, 20, 56);
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 700);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();
  scene.add(new THREE.HemisphereLight(0xffffff, 0xd8d3c6, 0.55));
  const key = new THREE.DirectionalLight(0xffffff, 1.3);
  key.position.set(30, 60, 40);
  scene.add(key);

  /* ── tooltip + interaction state ── */
  let tipText = null, tipHoldUntil = 0, tipFromLabel = null;
  const setTip = (text, holdMs) => {
    tipFromLabel = text;
    if (holdMs) { tipText = text; tipHoldUntil = performance.now() + holdMs; }
  };
  const state = { assemble: 0, introStart: -1 };
  let clock = 0;
  let shakeAmp = 0;
  const drag = { active: false, mode: null, station: null, lastX: 0 };
  const labels = new LabelLayer(labelRoot);
  const mats = createMaterials();
  const stations = createStations({
    mats, labels, scene, narrow,
    navigate: (i) => onNavigate(i),
    tip: setTip,
    introTime: () => (state.introStart < 0 ? -1 : clock - state.introStart),
    dragging: () => drag.active,
    shake: (a) => { shakeAmp = Math.max(shakeAmp, a); },
  });

  const ringCurve = new THREE.CatmullRomCurve3(FRAMES.map((f) => f.center.clone().add(new THREE.Vector3(0, PLINTH_Y, 0))), true, 'centripetal');
  scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(ringCurve.getSpacedPoints(480)), mats.faint));

  /* dot floor */
  const floorPts = [];
  const step = narrow ? 2.2 : 1.7;
  const frand = mulberry32(3);
  for (let x = -96; x <= 96; x += step) {
    for (let z = -96; z <= 96; z += step) {
      if (x * x + z * z < 96 * 96) floorPts.push(x + (frand() - 0.5) * 0.3, -6.2, z + (frand() - 0.5) * 0.3);
    }
  }
  const floorGeo = new THREE.BufferGeometry();
  floorGeo.setAttribute('position', new THREE.Float32BufferAttribute(floorPts, 3));
  const fc = floorPts.length / 3;
  floorGeo.setAttribute('aScale', new THREE.BufferAttribute(new Float32Array(fc).fill(1), 1));
  floorGeo.setAttribute('aRand', new THREE.BufferAttribute(Float32Array.from({ length: fc }, () => frand()), 1));
  const floorMat = pointsMaterial(2.2, 0.32);
  const floor = new THREE.Points(floorGeo, floorMat);
  floor.frustumCulled = false;
  scene.add(floor);

  /* the signal: one particle swarm that becomes every scene */
  const N = narrow ? 9000 : 18000;
  const rand = mulberry32(20261010);
  const R = Float32Array.from({ length: N * 4 }, () => rand());
  const shapes = createShapes({ N, R, ringCurve });
  const scatter = new Float32Array(N * 3), swirl = new Float32Array(N * 3);
  const delay = new Float32Array(N), scales = new Float32Array(N), rands = new Float32Array(N);
  const c0 = FRAMES[0].center;
  for (let i = 0, j = 0; i < N; i++, j += 3) {
    const a = rand() * Math.PI * 2, b = Math.acos(2 * rand() - 1), r = 10 + rand() * 20;
    scatter[j] = c0.x + Math.sin(b) * Math.cos(a) * r;
    scatter[j + 1] = c0.y + Math.cos(b) * r * 0.6;
    scatter[j + 2] = c0.z + Math.sin(b) * Math.sin(a) * r - 6;
    const a2 = rand() * Math.PI * 2, b2 = Math.acos(2 * rand() - 1), k = 0.8 + rand() * 1.8;
    swirl[j] = Math.sin(b2) * Math.cos(a2) * k;
    swirl[j + 1] = Math.cos(b2) * k;
    swirl[j + 2] = Math.sin(b2) * Math.sin(a2) * k;
    delay[i] = rand();
    scales[i] = 0.6 + Math.pow(rand(), 2.4) * 1.3;
    rands[i] = rand();
  }
  const positions = new Float32Array(shapes[0].data);
  const bufA = new Float32Array(N * 3), bufB = new Float32Array(N * 3);
  const geo = new THREE.BufferGeometry();
  const posAttr = new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage);
  geo.setAttribute('position', posAttr);
  geo.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));
  geo.setAttribute('aRand', new THREE.BufferAttribute(rands, 1));
  const pmat = pointsMaterial(2.3, 0.62);
  const points = new THREE.Points(geo, pmat);
  points.frustumCulled = false;
  scene.add(points);

  const posCurve = new THREE.CatmullRomCurve3(CAMERA_POSITIONS, false, 'centripetal');
  const tgtCurve = new THREE.CatmullRomCurve3(CAMERA_TARGETS, false, 'centripetal');

  const camPos = new THREE.Vector3(), camTgt = new THREE.Vector3();
  const goalPos = new THREE.Vector3(), goalTgt = new THREE.Vector3();
  const tmp = new THREE.Vector3(), right = new THREE.Vector3(), up = new THREE.Vector3();
  const introFrom = FRAMES[0].toWorld(-1.6, -0.6, 7.2);
  const pointer = { x: 0, y: 0, sx: 0, sy: 0, cx: -1, cy: -1, over: false, downX: 0, downY: 0, down: false };
  const ndc = new THREE.Vector2();
  const raycaster = new THREE.Raycaster();
  let width = 1, height = 1, Ts = 0, roll = 0, first = true, lastKey = '';
  let orbit = 0, orbitVel = 0;
  let reveal = 0;
  let hover = null;
  const stationVis = new Array(STATION_COUNT).fill(0);
  const plinths = stations.map((s) => s.plinth);

  window.addEventListener('pointermove', (e) => {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
    pointer.cx = e.clientX; pointer.cy = e.clientY;
    pointer.over = e.target === canvas;
    if (drag.active) {
      if (drag.mode === 'orbit') { orbitVel += (e.clientX - drag.lastX) * 0.0045; drag.lastX = e.clientX; }
      else if (drag.mode === 'station' && drag.station.dragMove) { castFromPointer(); drag.station.dragMove(raycaster.ray, e.clientX - drag.lastX); drag.lastX = e.clientX; }
    }
  }, { passive: true });
  canvas.addEventListener('pointerleave', () => { pointer.over = false; });
  canvas.addEventListener('pointerdown', (e) => {
    pointer.down = true; pointer.downX = e.clientX; pointer.downY = e.clientY;
    pointer.cx = e.clientX; pointer.cy = e.clientY; pointer.over = true;
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
    resolveHover();
    if (hover && hover.station && hover.station.dragStart) {
      drag.active = true; drag.mode = 'station'; drag.station = hover.station; drag.lastX = e.clientX;
      castFromPointer();
      hover.station.dragStart(hover.hit, raycaster.ray);
    } else if (reveal > 0.6) {
      drag.active = true; drag.mode = 'orbit'; drag.lastX = e.clientX;
    }
  });
  const endPointer = (e, cancelled) => {
    if (!pointer.down) return;
    pointer.down = false;
    const moved = Math.hypot(e.clientX - pointer.downX, e.clientY - pointer.downY);
    const wasStationDrag = drag.active && drag.mode === 'station';
    if (drag.active && drag.station && drag.station.dragEnd) drag.station.dragEnd();
    drag.active = false; drag.mode = null; drag.station = null;
    if (cancelled || moved > 6 || wasStationDrag) return;
    resolveHover();
    if (!hover) return;
    if (hover.overview != null) onNavigate(hover.overview);
    else if (hover.station && hover.station.click) hover.station.click(hover.hit, clock);
  };
  window.addEventListener('pointerup', (e) => endPointer(e, false));
  window.addEventListener('pointercancel', (e) => endPointer(e, true));

  function castFromPointer() {
    ndc.set((pointer.cx / width) * 2 - 1, -(pointer.cy / height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
  }

  function activeStation() {
    let best = -1, bestVis = 0.6;
    stationVis.forEach((v, i) => { if (v > bestVis) { best = i; bestVis = v; } });
    return best;
  }

  function resolveHover() {
    hover = null;
    stations.forEach((s) => { if (s.plinth.material !== mats.plinth) s.plinth.material = mats.plinth; });
    if (!pointer.over || pointer.cx < 0) { stations[0].clearPointer(); return; }
    castFromPointer();
    if (reveal > 0.6) {
      const hit = raycaster.intersectObjects(plinths, false)[0];
      if (hit) {
        const i = hit.object.userData.station;
        stations[i].plinth.material = mats.plinthHot;
        hover = { overview: i, tip: `${String(i + 1).padStart(2, '0')} · ${SCENES[i].name} — click to fly there`, cursor: 'pointer' };
      } else {
        hover = { orbit: true, tip: null, cursor: 'grab' };
      }
      return;
    }
    const si = activeStation();
    if (si !== 0) stations[0].clearPointer();
    if (si < 0) return;
    const s = stations[si];
    if (s.hitTest) {
      const r = s.hitTest(raycaster.ray);
      if (r) hover = { station: s, hit: r, tip: r.tip, cursor: r.cursor };
      return;
    }
    if (!s.pickables) return;
    const hit = raycaster.intersectObjects(s.pickables, false)[0];
    const res = s.hover ? s.hover(hit || null) : null;
    if (hit && res) hover = { station: s, hit, tip: res.tip, cursor: res.cursor };
  }

  function resize() {
    width = canvas.clientWidth || window.innerWidth;
    height = canvas.clientHeight || window.innerHeight;
    const pr = Math.min(window.devicePixelRatio || 1, 1.5);
    renderer.setPixelRatio(pr);
    renderer.setSize(width, height, false);
    pmat.uniforms.uPR.value = pr;
    floorMat.uniforms.uPR.value = pr;
    camera.aspect = width / height;
    camera.fov = clamp((2 * Math.atan(4.4 / (14 * Math.min(1, camera.aspect))) * 180) / Math.PI, 33, 68);
    camera.updateProjectionMatrix();
  }

  const stationProgress = (s) => clamp((Ts - STARTS[s]) / SCENES[s].len, 0, 1);

  function updateParticles(time) {
    const m = transitionSum(Ts, 0.7, 1.4);
    const i = Math.min(Math.floor(m), shapes.length - 2);
    const f = m - i;
    const A = shapes[i], B = shapes[i + 1];
    const asm = state.assemble;
    const blending = f > 1e-4;
    const key = `${i}|${f.toFixed(4)}|${asm.toFixed(4)}`;
    if (!A.dynamic && (!blending || !B.dynamic) && key === lastKey) return m;
    lastKey = key;
    let a = A.data;
    if (A.dynamic) { A.write(bufA, time, stationProgress(A.station)); a = bufA; }
    let b = null;
    if (blending) {
      b = B.data;
      if (B.dynamic) { B.write(bufB, time, stationProgress(B.station)); b = bufB; }
    }
    for (let p = 0, j = 0; p < N; p++, j += 3) {
      let x = a[j], y = a[j + 1], z = a[j + 2];
      if (b) {
        let t = f * 1.7 - delay[p] * 0.7;
        t = t < 0 ? 0 : t > 1 ? 1 : t;
        t = t * t * (3 - 2 * t);
        const s = Math.sin(t * Math.PI);
        x += (b[j] - x) * t + swirl[j] * s;
        y += (b[j + 1] - y) * t + swirl[j + 1] * s;
        z += (b[j + 2] - z) * t + swirl[j + 2] * s;
      }
      if (asm < 1) {
        let k = asm * 1.6 - delay[p] * 0.6;
        k = k < 0 ? 0 : k > 1 ? 1 : k;
        k = 1 - Math.pow(1 - k, 3);
        x = scatter[j] + (x - scatter[j]) * k;
        y = scatter[j + 1] + (y - scatter[j + 1]) * k;
        z = scatter[j + 2] + (z - scatter[j + 2]) * k;
      }
      positions[j] = x; positions[j + 1] = y; positions[j + 2] = z;
    }
    posAttr.needsUpdate = true;
    return m;
  }

  function update(T, time, dt, velocity = 0) {
    clock = time;
    const k = 1 - Math.exp(-dt * 5.5);
    Ts = first ? T : Ts + (T - Ts) * k;

    for (let s = 0; s < STATION_COUNT; s++) {
      const t0 = STARTS[s], t1 = sceneEnd(s);
      stationVis[s] = (s === 0 ? 1 : smoothstep(t0 - 0.45, t0 + 0.25, Ts)) * (1 - smoothstep(t1 - 0.55, t1 + 0.05, Ts));
    }
    resolveHover();
    for (let s = 0; s < STATION_COUNT; s++) stations[s].update(stationProgress(s), time, Ts);

    const m = updateParticles(time);
    const mi = Math.min(Math.floor(m), LOOK.length - 2);
    const mf = m - mi;
    const look = (key2) => LOOK[mi][key2] + (LOOK[mi + 1][key2] - LOOK[mi][key2]) * mf;
    pmat.uniforms.uTime.value = time;
    pmat.uniforms.uSize.value = 2.3 * look('size');
    pmat.uniforms.uOpacity.value = 0.62 * look('opacity');
    floorMat.uniforms.uTime.value = time;

    const last = STARTS[OVERVIEW_SCENE];
    reveal = smoothstep(last - 1.4, last + 1.0, Ts);
    const near = 14 + reveal * 86, far = 35 + reveal * 421;
    scene.fog.near = near; scene.fog.far = far;
    pmat.uniforms.uFogNear.value = near; pmat.uniforms.uFogFar.value = far;
    floorMat.uniforms.uFogNear.value = near * 0.6; floorMat.uniforms.uFogFar.value = far * 0.8;

    /* camera rig */
    const c = transitionSum(Ts, 1.0, 1.8) / STATION_COUNT;
    posCurve.getPoint(c, goalPos);
    tgtCurve.getPoint(c, goalTgt);
    if (width <= 860) goalPos.sub(goalTgt).multiplyScalar(1.12).add(goalTgt);
    const introT = state.introStart < 0 ? 0 : clamp((time - state.introStart) / 3.0, 0, 1);
    if (introT < 1) goalPos.lerpVectors(introFrom, goalPos, easeOutCubic(introT));
    const pivot = reveal > 0.5 ? WORLD_CENTER : goalTgt;
    const angle = driftAt(Ts) * (0.12 + reveal * 0.3);
    orbit += orbitVel; orbitVel *= 0.9;
    if (reveal < 0.5 && !drag.active) orbit *= 0.94;
    tmp.copy(goalPos).sub(pivot).applyAxisAngle(THREE.Object3D.DEFAULT_UP, angle + orbit * reveal);
    goalPos.copy(pivot).add(tmp);
    if (first) { camPos.copy(goalPos); camTgt.copy(goalTgt); first = false; }
    camPos.lerp(goalPos, introT < 1 ? 1 - Math.exp(-dt * 9) : k);
    camTgt.lerp(goalTgt, k);
    pointer.sx += (pointer.x - pointer.sx) * k * 0.5;
    pointer.sy += (pointer.y - pointer.sy) * k * 0.5;
    camera.position.copy(camPos);
    camera.lookAt(camTgt);
    right.setFromMatrixColumn(camera.matrixWorld, 0);
    up.setFromMatrixColumn(camera.matrixWorld, 1);
    const sway = (1 + reveal * 5) * (drag.active ? 0 : 1);
    camera.position.addScaledVector(right, pointer.sx * 0.4 * sway).addScaledVector(up, -pointer.sy * 0.25 * sway);
    camera.lookAt(camTgt);
    shakeAmp *= Math.exp(-dt * 6);
    if (shakeAmp > 0.002) {
      camera.position.addScaledVector(right, (Math.random() - 0.5) * shakeAmp * 0.5).addScaledVector(up, (Math.random() - 0.5) * shakeAmp * 0.5);
    }
    roll += (clamp(-velocity * 0.0009, -0.06, 0.06) - roll) * k;
    camera.rotateZ(roll);

    const fi = Math.min(Math.floor(m), FRAMING.length - 2);
    const ff = m - fi;
    const narrowNow = width <= 860;
    const fx = narrowNow ? 0 : FRAMING[fi].x + (FRAMING[fi + 1].x - FRAMING[fi].x) * ff;
    const dyA = FRAMING[fi].dy || 0, dyB = FRAMING[fi + 1].dy || 0;
    const fy = narrowNow ? FRAMING[fi].y + (FRAMING[fi + 1].y - FRAMING[fi].y) * ff : dyA + (dyB - dyA) * ff;
    camera.setViewOffset(width, height, -fx * width, fy * height, width, height);
    camera.updateMatrixWorld();

    /* cursor + tooltip */
    const now = performance.now();
    const text = (hover && hover.tip) || tipFromLabel || (now < tipHoldUntil ? tipText : null);
    if (tipEl) {
      if (text && pointer.cx >= 0) {
        if (tipEl.textContent !== text) tipEl.textContent = text;
        tipEl.style.transform = `translate3d(${Math.min(pointer.cx + 16, width - 300)}px, ${pointer.cy + 18}px, 0)`;
        tipEl.classList.add('is-on');
      } else tipEl.classList.remove('is-on');
    }
    const cursor = drag.active ? 'grabbing' : hover && hover.cursor ? hover.cursor : '';
    if (document.documentElement.dataset.cursor !== cursor) document.documentElement.dataset.cursor = cursor;
    stations.forEach((s, i) => s.mapLabel.el.classList.toggle('is-on', Boolean(s.mapHot) || (hover && hover.overview === i)));

    scene.updateMatrixWorld();
    labels.update(camera, width, height, stationVis, smoothstep(last + 0.2, last + 1.2, Ts));
    renderer.render(scene, camera);
  }

  resize();
  return { update, resize, state };
}

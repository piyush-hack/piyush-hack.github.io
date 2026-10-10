import * as THREE from 'three';

/* The film: twelve scenes, each with its own length (seconds of film time). */
export const SCENES = [
  { key: 'title', name: 'Title', len: 3.5 },
  { key: 'core', name: 'Built to change', len: 5 },
  { key: 'journey', name: 'Journey', len: 4 },
  { key: 'skills', name: 'Skills', len: 5 },
  { key: 'system', name: 'System design', len: 4.5 },
  { key: 'scale', name: 'Scale', len: 3.5 },
  { key: 'agents', name: 'AI agents', len: 3.5 },
  { key: 'retrieval', name: 'Retrieval', len: 3.5 },
  { key: 'footprint', name: 'Footprint', len: 3.5 },
  { key: 'world', name: 'The world', len: 4.5 },
];
export const STARTS = SCENES.reduce((acc, s, i) => { acc.push(i ? acc[i - 1] + SCENES[i - 1].len : 0); return acc; }, []);
export const DURATION = STARTS[STARTS.length - 1] + SCENES[SCENES.length - 1].len;
export const STATION_COUNT = SCENES.length - 1;
export const OVERVIEW_SCENE = SCENES.length - 1;
export const BOUNDARIES = STARTS.slice(1);
export const sceneEnd = (i) => STARTS[i] + SCENES[i].len;
export const sceneAt = (T) => {
  let i = 0;
  while (i < SCENES.length - 1 && T >= STARTS[i + 1] - 1e-6) i++;
  return i;
};

export const RING = 46;
export const PLINTH_Y = -2.6;
export const PAPER = 0xf3f2ee;
export const INK = 0x111111;

const HEIGHTS = [0, 0.6, -0.4, 0.9, 0, 1.1, -0.3, 0.8, -0.2];
const UP = new THREE.Vector3(0, 1, 0);

/* Stations sit on a ring, facing outward; the camera orbits the world from outside. */
export const FRAMES = Array.from({ length: STATION_COUNT }, (_, i) => {
  const theta = (i / STATION_COUNT) * Math.PI * 2;
  const center = new THREE.Vector3(Math.sin(theta) * RING, HEIGHTS[i], Math.cos(theta) * RING);
  const quat = new THREE.Quaternion().setFromAxisAngle(UP, theta);
  return {
    theta,
    center,
    quat,
    toWorld: (x, y, z, out = new THREE.Vector3()) => out.set(x, y, z).applyQuaternion(quat).add(center),
  };
});

/* Camera shot per station, authored in station space (x right, y up, +z toward the lens). */
const SHOTS = [
  { pos: [0, 0.5, 15.5], target: [0, 0.45, 0] },
  { pos: [3.4, -1.2, 16.2], target: [0, 1.5, 0] },
  { pos: [-3.0, 3.0, 15.6], target: [0.3, 0.3, 0] },
  { pos: [0, 8.0, 15.8], target: [0, -0.3, 0.2] },
  { pos: [5.4, 5.2, 15.6], target: [0, 0.3, 0] },
  { pos: [3.2, 2.2, 15.4], target: [0, 0.6, 0] },
  { pos: [2.2, 1.0, 15.2], target: [0, 0.2, 0] },
  { pos: [0, 7.0, 14.0], target: [0, 0.4, 0] },
  { pos: [3.0, 2.2, 15.4], target: [0, 0.6, 0] },
];
const OVERVIEW = { pos: [0, 90, 188], target: [0, -6, -4] };
export const WORLD_CENTER = new THREE.Vector3(0, -4, 0);

export const CAMERA_POSITIONS = [...SHOTS.map((s, i) => FRAMES[i].toWorld(...s.pos)), new THREE.Vector3(...OVERVIEW.pos)];
export const CAMERA_TARGETS = [...SHOTS.map((s, i) => FRAMES[i].toWorld(...s.target)), new THREE.Vector3(...OVERVIEW.target)];

/* Where the hero sits on screen: desktop shifts it right of the copy, phones lift it above. */
export const FRAMING = [
  { x: 0, y: 0.05 },
  { x: 0.2, y: 0.2 },
  { x: 0.2, y: 0.2 },
  { x: 0, y: 0.32, dy: -0.11 },
  { x: 0.25, y: 0.2 },
  { x: 0.2, y: 0.2 },
  { x: 0.2, y: 0.2 },
  { x: 0.21, y: 0.21 },
  { x: 0.2, y: 0.2 },
  { x: 0.18, y: 0.27 },
];

/* Particle look per scene. */
export const LOOK = [
  { size: 0.9, opacity: 0.55 },
  { size: 1.05, opacity: 0.85 },
  { size: 1.05, opacity: 0.85 },
  { size: 0.9, opacity: 0.45 },
  { size: 0.95, opacity: 0.55 },
  { size: 1.1, opacity: 0.9 },
  { size: 1.05, opacity: 0.75 },
  { size: 1, opacity: 0.55 },
  { size: 1.1, opacity: 0.9 },
  { size: 9, opacity: 0.9 },
];

export const smoothstep = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
export const smootherstep = (t) => {
  const x = Math.min(1, Math.max(0, t));
  return x * x * x * (x * (x * 6 - 15) + 10);
};
export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

import { createWorld } from './world.js';
import { SCENES, STARTS, DURATION, sceneAt, clamp } from './config.js';

const { gsap, ScrollTrigger, Lenis } = window;
gsap.registerPlugin(ScrollTrigger);
ScrollTrigger.config({ ignoreMobileResize: true });

const html = document.documentElement;
const CINE = html.classList.contains('cine');
const SCENE_EL = Array.from(document.querySelectorAll('.scene'));
const FPS = 24;

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const pad = (n) => String(n).padStart(2, '0');
const isNarrow = () => window.innerWidth <= 860;
const filmLength = `${Math.floor(DURATION / 60)}:${pad(Math.round(DURATION % 60))}`;

/* ═══════════ kinetic type helpers ═══════════ */

function make(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text != null) node.textContent = text;
  return node;
}

function split(target, mode) {
  const label = target.textContent.replace(/\s+/g, ' ').trim();
  const walker = document.createTreeWalker(target, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach((node) => {
    const frag = document.createDocumentFragment();
    node.textContent.split(/(\s+)/).forEach((part) => {
      if (!part) return;
      if (!part.trim()) { frag.append(document.createTextNode(' ')); return; }
      const word = make('span', 'w');
      if (mode === 'chars') {
        word.setAttribute('aria-hidden', 'true');
        Array.from(part).forEach((c) => {
          const ch = make('span', 'ch');
          ch.append(make('span', 'ch-i', c));
          word.append(ch);
        });
      } else {
        word.append(make('span', 'w-i', part));
      }
      frag.append(word);
    });
    node.replaceWith(frag);
  });
  if (mode === 'chars') target.append(make('span', 'sr-only', label));
}

const GLYPHS = '#%&*+=/<>_—01';
function scrambleText(text, v) {
  const n = Math.floor(text.length * v);
  let out = text.slice(0, n);
  for (let i = n; i < text.length; i++) out += text[i] === ' ' || v === 0 ? ' ' : GLYPHS[(Math.random() * GLYPHS.length) | 0];
  return out;
}

function scramble(node, duration) {
  const text = node.dataset.text || (node.dataset.text = node.textContent.trim());
  const o = { v: 0 };
  return gsap.fromTo(o, { v: 0 }, {
    v: 1, duration, ease: 'none', immediateRender: false,
    onUpdate: () => { node.textContent = scrambleText(text, o.v); },
  });
}

function formatCount(v, node) {
  const dec = parseInt(node.dataset.dec || '0', 10);
  const n = dec ? Number(v.toFixed(dec)) : Math.round(v);
  const s = node.dataset.format === 'comma' ? n.toLocaleString('en-US') : n.toFixed(dec);
  return s + (node.dataset.suffix || '');
}

function addCounter(tl, node, at, duration, ease = 'power2.out') {
  const from = parseFloat(node.dataset.from || '0');
  const to = parseFloat(node.dataset.to);
  const o = { v: from };
  node.textContent = formatCount(from, node);
  tl.fromTo(o, { v: from }, {
    v: to, duration, ease, immediateRender: false,
    onUpdate: () => { node.textContent = formatCount(o.v, node); },
  }, at);
}

/* ═══════════ the master timeline ═══════════ */

const ENTER = '.k-scramble, .k-chars, .k-words, .k-fade, .k-pop, .k-count, .k-roll, .k-list, .scene-links, .hint';

function enterScene(tl, scene, at, len) {
  $$(ENTER, scene).forEach((node, j) => {
    const s = at + Math.min(j * 0.08, 0.55);
    const c = node.classList;
    if (c.contains('k-chars')) {
      tl.from($$('.ch-i', node), { yPercent: 120, duration: 0.8, stagger: 0.022, ease: 'power4.out' }, s);
    } else if (c.contains('k-words')) {
      tl.from($$('.w-i', node), { yPercent: 110, duration: 0.7, stagger: 0.022 }, s);
    } else if (c.contains('k-fade') || c.contains('scene-links') || c.contains('hint')) {
      tl.from(node, { y: 18, opacity: 0, duration: 0.6 }, s);
    } else if (c.contains('k-scramble')) {
      tl.add(scramble(node, 0.6), s);
    } else if (c.contains('k-pop')) {
      tl.from(node, { yPercent: 35, opacity: 0, scale: 0.9, transformOrigin: '0% 100%', duration: 0.8, ease: 'expo.out' }, s);
    } else if (c.contains('k-count')) {
      addCounter(tl, node, s + 0.05, 1.2, 'expo.out');
    } else if (c.contains('k-roll')) {
      const track = $('.roll-track', node);
      const steps = track.children.length - 1;
      for (let k = 1; k <= steps; k++) tl.to(track, { yPercent: (-100 / (steps + 1)) * k, duration: 0.32, ease: 'power3.inOut' }, s + 0.25 + k * ((len - 1.4) / steps));
    } else if (c.contains('k-list')) {
      tl.from(node.children, { y: 18, opacity: 0, duration: 0.6, stagger: 0.07 }, s);
    }
  });
}

function exitScene(tl, scene, at) {
  tl.fromTo($('.s-inner', scene), { y: 0 }, { y: -56, duration: 0.6, ease: 'power2.in', immediateRender: false }, at);
  const chars = $$('.k-chars .ch', scene);
  if (chars.length) {
    tl.fromTo(chars, { yPercent: 0, rotation: 0, opacity: 1 }, {
      yPercent: (k) => -(70 + ((k * 47) % 90)), rotation: (k) => ((k * 29) % 36) - 18, opacity: 0,
      duration: 0.5, stagger: 0.01, ease: 'power2.in', immediateRender: false,
    }, at);
  }
  tl.fromTo(scene, { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.5, ease: 'power1.in', immediateRender: false }, at + 0.1);
}

function buildFilm() {
  const tl = gsap.timeline({ paused: true, defaults: { ease: 'power3.out' } });
  tl.set({}, {}, DURATION);
  const cut = $('.cut');
  SCENE_EL.forEach((scene, i) => {
    const t0 = STARTS[i], len = SCENES[i].len;
    if (i > 0) {
      tl.fromTo(scene, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3, ease: 'none', immediateRender: false }, t0 - 0.3);
      enterScene(tl, scene, t0 - 0.2, len);
    }
    if (i < SCENE_EL.length - 1) {
      exitScene(tl, scene, t0 + len - 0.7);
      const b = t0 + len;
      const origin = i % 2 ? '100% 50%' : '0% 50%';
      tl.fromTo(cut, { scaleX: 0, opacity: 0.45, transformOrigin: origin }, { scaleX: 1, duration: 0.4, ease: 'power3.inOut', immediateRender: false }, b - 0.5);
      tl.fromTo(cut, { opacity: 0.45 }, { opacity: 0, duration: 0.35, ease: 'power1.out', immediateRender: false }, b - 0.1);
    }
  });
  return tl;
}

/* ═══════════ HUD ═══════════ */

function createHud(onSelect) {
  const tc = $('#tc'), fill = $('#scrub-fill');
  const num = $('#sc-num'), name = $('#sc-name'), list = $('.scrub-ticks');
  $('#tc-total').textContent = `/ 00:${pad(Math.floor(DURATION))}:${pad(Math.round((DURATION % 1) * FPS))}`;
  const buttons = SCENES.map((scene, i) => {
    const li = make('li');
    li.style.left = `${(STARTS[i] / DURATION) * 100}%`;
    const btn = make('button');
    btn.type = 'button';
    btn.setAttribute('aria-label', `Scene ${i + 1}: ${scene.name}`);
    btn.append(make('span', null, `${pad(i + 1)} ${scene.name}`));
    btn.addEventListener('click', () => onSelect(i));
    li.append(btn);
    list.append(li);
    return btn;
  });
  let current = -1, lastTc = '';
  return (T) => {
    const sec = Math.floor(T + 1e-6);
    const frame = clamp(Math.floor((T - sec) * FPS + 1e-6), 0, FPS - 1);
    const text = `00:${pad(sec)}:${pad(frame)}`;
    if (text !== lastTc) { tc.textContent = text; lastTc = text; }
    fill.style.transform = `scaleX(${clamp(T / DURATION, 0, 1)})`;
    const idx = sceneAt(T);
    if (idx !== current) {
      current = idx;
      num.textContent = `SC ${pad(idx + 1)}`;
      name.textContent = SCENES[idx].name;
      buttons.forEach((b, i) => {
        b.classList.toggle('is-current', i === idx);
        b.classList.toggle('is-past', i < idx);
        if (i === idx) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
      });
    }
    return idx;
  };
}

/* ═══════════ boot sequence ═══════════ */

function createBoot() {
  const log = $('#boot-log'), fill = $('#boot-fill'), pct = $('#boot-pct');
  const lines = [
    '> boot piyush.puniya',
    '  ✓ patterns   strategy · adapter · factory · registry',
    '  ✓ history    6,114 commits replayed',
    `  ✓ systems    ${SCENES.length - 1} stations mounted`,
    '  ✓ ready',
  ];
  const shown = { n: 0, v: 0 };
  const render = () => {
    const want = Math.min(lines.length, Math.floor(shown.v / 20) + 1);
    if (want !== shown.n) { shown.n = want; log.textContent = lines.slice(0, want).join('\n'); }
    fill.style.transform = `scaleX(${shown.v / 100})`;
    pct.textContent = String(Math.round(shown.v)).padStart(3, '0');
  };
  render();
  return {
    to(v, duration = 0.5) { return gsap.to(shown, { v, duration, ease: 'power2.out', onUpdate: render }); },
    exit() {
      const tl = gsap.timeline();
      tl.to('.boot-in', { opacity: 0, y: -14, duration: 0.45, ease: 'power2.in' })
        .to('.boot-seam', { scaleX: 1, duration: 0.5, ease: 'expo.inOut' }, 0.2)
        .to('.boot-top', { yPercent: -101, duration: 1.1, ease: 'expo.inOut' }, 0.62)
        .to('.boot-bottom', { yPercent: 101, duration: 1.1, ease: 'expo.inOut' }, 0.62)
        .to('.boot-seam', { opacity: 0, duration: 0.3 }, 0.7)
        .add(() => html.classList.add('is-booted'));
      return tl;
    },
  };
}

/* ═══════════ boot ═══════════ */

function fontsReady() {
  const timeout = new Promise((r) => setTimeout(r, 3500));
  const load = document.fonts
    ? Promise.all([
      document.fonts.load('900 120px "Inter Tight"'),
      document.fonts.load('800 60px "Inter Tight"'),
      document.fonts.load('italic 40px "Instrument Serif"'),
      document.fonts.load('400 12px "JetBrains Mono"'),
    ]).then(() => document.fonts.ready)
    : Promise.resolve();
  return Promise.race([load, timeout]);
}

const nextFrame = () => new Promise((r) => requestAnimationFrame(() => r()));

async function bootFilm() {
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  const startScene = SCENE_EL.findIndex((s) => `#${s.id}` === location.hash);
  window.scrollTo(0, 0);
  $('.track').style.height = `${Math.round(DURATION * 46)}svh`;
  const boot = createBoot();
  const began = performance.now();
  boot.to(28, 0.6);

  await fontsReady();
  boot.to(46, 0.4);
  await nextFrame();
  $$('.k-chars').forEach((n) => split(n, 'chars'));
  $$('.k-words').forEach((n) => split(n, 'words'));

  let goScene = () => {};
  let world = null;
  try {
    world = createWorld({
      canvas: $('#gl'), labelRoot: $('#labels'), tipEl: $('#tip'), narrow: isNarrow(),
      onNavigate: (i) => goScene(i),
    });
  } catch (err) {
    console.warn('WebGL unavailable — continuing without the 3D world.', err);
    $('#gl').style.display = 'none';
  }
  boot.to(88, 0.5);

  const tl = buildFilm();
  const lenis = new Lenis({ autoRaf: false, lerp: 0.08, wheelMultiplier: 0.9, touchMultiplier: 1.3 });
  lenis.on('scroll', ScrollTrigger.update);
  const st = ScrollTrigger.create({ trigger: '.track', start: 'top top', end: 'bottom bottom', animation: tl, scrub: true });
  window.__cineReady = true;

  const timeToScroll = (T) => st.start + (clamp(T, 0, DURATION) / DURATION) * (st.end - st.start);
  const sceneTime = (i) => (i <= 0 ? 0 : i >= SCENES.length - 1 ? DURATION : STARTS[i] + SCENES[i].len * 0.6);

  const playBtn = $('#play');
  const playLbl = $('.play-lbl', playBtn);
  playLbl.textContent = `Play ${filmLength}`;
  let playing = false, playFrom = 0, playClock = 0;
  const setPlaying = (on) => {
    playing = on;
    html.classList.toggle('is-playing', on);
    playBtn.setAttribute('aria-pressed', String(on));
    playLbl.textContent = on ? 'Pause' : `Play ${filmLength}`;
  };
  const play = () => {
    let T = tl.time();
    if (T >= DURATION - 0.05) { T = 0; lenis.scrollTo(timeToScroll(0), { immediate: true, force: true }); }
    playFrom = T;
    playClock = performance.now();
    setPlaying(true);
  };
  const stop = () => { if (playing) setPlaying(false); };
  const toggle = () => (playing ? stop() : play());

  goScene = (i, opts = {}) => {
    stop();
    const target = timeToScroll(sceneTime(clamp(i, 0, SCENES.length - 1)));
    const distance = Math.abs(target - window.scrollY) / window.innerHeight;
    lenis.scrollTo(target, {
      duration: clamp(0.9 + distance * 0.1, 1, 2.8),
      easing: (t) => (t < 0.5 ? 8 * t ** 4 : 1 - (-2 * t + 2) ** 4 / 2),
      ...opts,
    });
  };

  const updateHud = createHud(goScene);
  let currentScene = 0;

  playBtn.addEventListener('click', toggle);
  $('#replay').addEventListener('click', () => {
    stop();
    lenis.scrollTo(0, { duration: 2.6, easing: (t) => 1 - (1 - t) ** 3, onComplete: () => play() });
  });
  $$('[data-scene]').forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); goScene(+a.dataset.scene); }));
  window.addEventListener('wheel', stop, { passive: true });
  window.addEventListener('touchstart', stop, { passive: true });
  window.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const onControl = e.target.closest && e.target.closest('button, a, input, textarea, select');
    if (e.code === 'Space' && !onControl) { e.preventDefault(); toggle(); return; }
    const next = ['ArrowDown', 'ArrowRight', 'PageDown'].includes(e.key);
    const prev = ['ArrowUp', 'ArrowLeft', 'PageUp'].includes(e.key);
    if (next || prev) { e.preventDefault(); goScene(currentScene + (next ? 1 : -1)); }
    else if (e.key === 'Home') { e.preventDefault(); goScene(0); }
    else if (e.key === 'End') { e.preventDefault(); goScene(SCENES.length - 1); }
  });

  gsap.ticker.lagSmoothing(0);
  gsap.ticker.add((time, deltaMs) => {
    if (playing) {
      const T = Math.min(DURATION, playFrom + (performance.now() - playClock) / 1000);
      lenis.scrollTo(timeToScroll(T), { immediate: true, force: true });
      if (T >= DURATION) stop();
    }
    lenis.raf(time * 1000);
    const T = tl.time();
    currentScene = updateHud(T);
    if (world) world.update(T, time, Math.min(deltaMs / 1000, 0.1), lenis.velocity || 0);
  });
  window.addEventListener('resize', () => { if (world) world.resize(); });
  ScrollTrigger.refresh();

  await nextFrame();
  await nextFrame();
  await boot.to(100, 0.45);
  const wait = Math.max(0, 1500 - (performance.now() - began));
  if (wait) await new Promise((r) => setTimeout(r, wait));

  html.classList.add('is-ready');
  boot.exit();
  if (world) world.state.introStart = gsap.ticker.time + 0.5;
  const intro = gsap.timeline({ delay: 0.55, defaults: { ease: 'power4.out' } });
  if (world) intro.to(world.state, { assemble: 1, duration: 3.2, ease: 'expo.out' }, 0);
  intro
    .add(scramble($('#sc-01 .eyebrow'), 1.0), 0.9)
    .from('#sc-01 .k-words .w-i', { yPercent: 110, duration: 0.8, stagger: 0.03 }, 1.6)
    .from('#sc-01 .title-links a', { y: 12, opacity: 0, duration: 0.6, stagger: 0.06 }, 1.9)
    .from('#sc-01 .cue', { opacity: 0, y: 10, duration: 0.7 }, 2.2)
    .from('.hud', { opacity: 0, duration: 0.9, stagger: 0.12, ease: 'power2.out' }, 1.4)
    .from('.viewfinder i', { opacity: 0, scale: 0.4, duration: 0.8, stagger: 0.06 }, 1.2);
  if (!world) intro.progress(1);

  if (startScene > 0) goScene(startScene, { immediate: true });
}

if (CINE) bootFilm();
else { window.__cineReady = true; $('#gl').style.display = 'none'; }

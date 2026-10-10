import * as THREE from 'three';

const projected = new THREE.Vector3();

/* DOM annotations pinned to 3D points. Links are real anchors; actions are real buttons. */
export class LabelLayer {
  constructor(root) {
    this.root = root;
    this.items = [];
  }

  add({ text, kind = 'tag', anchor, at = [0, 0, 0], offset = [0, 0], station = -1, map = false, href, onClick, onHover, title }) {
    const interactive = Boolean(href || onClick);
    const el = document.createElement(href ? 'a' : onClick ? 'button' : 'div');
    el.className = `lbl lbl-${kind}${interactive ? ' lbl-link' : ''}`;
    if (href) {
      el.href = href;
      if (!href.startsWith('mailto:')) { el.target = '_blank'; el.rel = 'noopener'; }
    }
    if (onClick) {
      if (!href) el.type = 'button';
      el.addEventListener('click', (e) => { if (!href) e.preventDefault(); onClick(e); });
    }
    if (onHover) {
      el.addEventListener('pointerenter', () => onHover(true));
      el.addEventListener('pointerleave', () => onHover(false));
      el.addEventListener('focus', () => onHover(true));
      el.addEventListener('blur', () => onHover(false));
    }
    if (title) el.dataset.tip = title;
    if (!interactive) el.setAttribute('aria-hidden', 'true');
    el.tabIndex = interactive ? 0 : -1;
    const inner = document.createElement('span');
    inner.className = 'lbl-in';
    inner.textContent = text;
    el.append(inner);
    this.root.append(el);
    const item = { el, inner, anchor, station, map, offset, local: new THREE.Vector3(...at), alpha: 1, shown: false, text };
    this.items.push(item);
    return item;
  }

  setText(item, text) {
    if (item.text === text) return;
    item.text = text;
    item.inner.textContent = text;
  }

  update(camera, width, height, stationVis, mapVis) {
    for (const it of this.items) {
      const vis = (it.map ? mapVis : stationVis[it.station] || 0) * it.alpha;
      if (vis < 0.02) {
        if (it.shown) { it.el.style.visibility = 'hidden'; it.shown = false; }
        continue;
      }
      projected.copy(it.local);
      it.anchor.localToWorld(projected);
      projected.project(camera);
      if (projected.z > 1 || projected.z < -1) {
        if (it.shown) { it.el.style.visibility = 'hidden'; it.shown = false; }
        continue;
      }
      const x = (projected.x + 1) * 0.5 * width + it.offset[0];
      const y = (1 - projected.y) * 0.5 * height + it.offset[1];
      it.el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      it.el.style.opacity = vis.toFixed(3);
      if (!it.shown) { it.el.style.visibility = 'visible'; it.shown = true; }
    }
  }
}

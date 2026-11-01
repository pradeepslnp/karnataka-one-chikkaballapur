/* Hero: floating document sheets.
   - Always builds a lightweight CSS 3D version (works everywhere, instant).
   - On capable desktops, lazy-loads the WebGL scene and cross-fades to it.
   - Sheets react to the pointer, drift gently, and settle into a neat stack on scroll. */
import { drawSheet } from "./sheet-art.js";

/* Positions are fractions of the stage size; z and widths are relative to stage width. */
export const LAYOUT = [
  { kind: "ledger",  fan: { x:  0.20, y: -0.20, z: -0.22, rx:  6, ry: -10, rz:   9 } },
  { kind: "project", fan: { x:  0.34, y:  0.06, z: -0.36, rx:  4, ry: -18, rz:  17 } },
  { kind: "list",    fan: { x: -0.24, y:  0.21, z: -0.10, rx: 10, ry:  12, rz: -15 } },
  { kind: "cert",    fan: { x:  0.20, y:  0.18, z:  0.04, rx:  8, ry:  -8, rz:  11 } },
  { kind: "form",    fan: { x: -0.17, y: -0.13, z:  0.12, rx:  6, ry:  14, rz:  -9 } },
  { kind: "print",   fan: { x:  0.03, y:  0.00, z:  0.24, rx:  4, ry:   2, rz:   3 } }
];
LAYOUT.forEach((s, i) => {
  s.stack = { x: 0.02 + (i % 2 ? 0.006 : -0.004), y: 0.06 - i * 0.012, z: -0.05 + i * 0.012, rx: 52, ry: 0, rz: -4 + (i * 7 % 5) - 2 };
  s.w = 0.38;
  s.seed = i + 3;
});

const lerp = (a, b, t) => a + (b - a) * t;
const ease = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

/** Shared state read by both renderers. */
export const heroState = { tx: 0, ty: 0, px: 0, py: 0, progress: 0, scan: -1, time: 0 };

/** Pose of sheet i at time t, blending fan → stack by settle amount. */
export function pose(s, i, settle, t, motion) {
  const a = s.fan, b = s.stack, e = ease(settle);
  const bob = motion ? Math.sin(t * 0.55 + i * 1.7) * 0.012 * (1 - e) : 0;
  const sway = motion ? Math.sin(t * 0.4 + i) * 1.2 * (1 - e) : 0;
  return {
    x: lerp(a.x, b.x, e), y: lerp(a.y, b.y, e) + bob, z: lerp(a.z, b.z, e),
    rx: lerp(a.rx, b.rx, e), ry: lerp(a.ry, b.ry, e), rz: lerp(a.rz, b.rz, e) + sway
  };
}

export function initHero({ motion, webgl }) {
  const hero = document.querySelector(".hero");
  const stage = document.querySelector(".hero-stage");
  const wrap = document.getElementById("sheets");
  const glass = document.querySelector(".hero-glass");
  if (!hero || !stage || !wrap) return;

  /* ---------- CSS 3D sheets ---------- */
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const els = LAYOUT.map(s => {
    const el = document.createElement("div");
    el.className = "sheet";
    const img = new Image();
    img.alt = "";
    img.decoding = "async";
    img.src = drawSheet(document.createElement("canvas"), s.kind, Math.round(230 * dpr), s.seed).toDataURL("image/png");
    el.appendChild(img);
    wrap.appendChild(el);
    return el;
  });

  let W = stage.clientWidth, H = stage.clientHeight;
  const sizeSheets = () => {
    W = stage.clientWidth; H = stage.clientHeight;
    const w = Math.min(W * LAYOUT[0].w, H * 0.48);
    wrap.style.setProperty("--w", w + "px");
    els.forEach(el => el.style.setProperty("--w", w + "px"));
  };
  sizeSheets();
  const ro = new ResizeObserver(sizeSheets);
  ro.observe(stage);

  const renderCSS = () => {
    const st = heroState;
    const rotX = 6 - st.py * 9, rotY = -10 + st.px * 16;
    wrap.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`;
    els.forEach((el, i) => {
      const p = pose(LAYOUT[i], i, st.progress, st.time, motion);
      el.style.transform =
        `translate3d(${p.x * W}px,${p.y * H}px,${p.z * W}px) rotateX(${p.rx}deg) rotateY(${p.ry}deg) rotateZ(${p.rz}deg)`;
      el.style.setProperty("--sa", `${120 + rotY * 2 + p.ry * 2}deg`);
    });
  };
  renderCSS();

  /* ---------- Pointer & scroll inputs ---------- */
  const finePointer = matchMedia("(pointer: fine)").matches;
  if (motion && finePointer) {
    window.addEventListener("pointermove", e => {
      heroState.tx = (e.clientX / innerWidth) * 2 - 1;
      heroState.ty = (e.clientY / innerHeight) * 2 - 1;
      const r = hero.getBoundingClientRect();
      if (e.clientY < r.bottom) {
        glass.style.setProperty("--lx", ((e.clientX - r.left) / r.width) * 100 + "%");
        glass.style.setProperty("--ly", ((e.clientY - r.top) / r.height) * 100 + "%");
      }
    }, { passive: true });
  }
  const readScroll = () => {
    const r = hero.getBoundingClientRect();
    heroState.progress = motion ? clamp(-r.top / (r.height * 0.75)) : 0;
  };

  /* ---------- Loop (only while hero is on screen) ---------- */
  let visible = true, raf = 0, last = performance.now(), webglActive = false, scene = null;
  const tick = now => {
    raf = 0;
    if (!visible || document.hidden) return;
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    const st = heroState;
    st.time += dt;
    if (!finePointer) { st.tx = Math.sin(st.time * 0.25) * 0.4; st.ty = Math.cos(st.time * 0.2) * 0.25; }
    const k = 1 - Math.pow(0.002, dt);
    st.px = lerp(st.px, st.tx, k); st.py = lerp(st.py, st.ty, k);
    readScroll();
    if (webglActive) scene.render(dt); else renderCSS();
    raf = requestAnimationFrame(tick);
  };
  const start = () => { if (motion && !raf) { last = performance.now(); raf = requestAnimationFrame(tick); } };
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) start(); }).observe(hero);
  document.addEventListener("visibilitychange", start);
  start();

  /* ---------- Scanner light sweep (the one orchestrated load moment) ---------- */
  const scanEl = document.querySelector(".scan");
  heroState.sweep = (delay = 0.25) => {
    if (!motion || !scanEl) return;
    const dur = 1.6, t0 = performance.now() + delay * 1000;
    const step = now => {
      const t = (now - t0) / 1000 / dur;
      if (t < 0) return requestAnimationFrame(step);
      const e = clamp(t);
      const x = lerp(-0.1, 1.05, 1 - Math.pow(1 - e, 2.2));
      heroState.scan = e >= 1 ? -1 : x;
      scanEl.style.opacity = e >= 1 ? 0 : String(Math.sin(Math.PI * e) * 1.2);
      scanEl.style.transform = `translateX(${x * hero.clientWidth - 90}px)`;
      if (e < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  /* ---------- Upgrade to WebGL on capable devices ---------- */
  if (webgl) {
    const load = () => import("./scene3d.js")
      .then(m => m.initScene({ stage, layout: LAYOUT, state: heroState, pose, motion }))
      .then(sc => {
        if (!sc) return;
        scene = sc;
        sc.onLost = () => { webglActive = false; stage.classList.remove("is-webgl"); };
        webglActive = true;
        sc.render(0);
        requestAnimationFrame(() => stage.classList.add("is-webgl"));
      })
      .catch(() => { /* stay on CSS version */ });
    ("requestIdleCallback" in window) ? requestIdleCallback(load, { timeout: 1200 }) : setTimeout(load, 400);
  }
}

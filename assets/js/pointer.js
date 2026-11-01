/* Pointer interactions for fine pointers (mouse / trackpad) only:
   custom cursor with context states, magnetic buttons, 3D card tilt with sheen. */

const lerp = (a, b, t) => a + (b - a) * t;

export function initPointer() {
  const root = document.documentElement;
  const cursor = document.querySelector(".cursor");
  if (!cursor) return;
  const dot = cursor.querySelector(".cursor-dot");
  const ring = cursor.querySelector(".cursor-ring");
  root.classList.add("has-cursor");

  /* ---------- Cursor ---------- */
  const pos = { x: innerWidth / 2, y: innerHeight / 2 }, ringPos = { ...pos };
  let scale = 1, targetScale = 1, raf = 0, shown = false;
  const SCALE = { link: 1.55, card: 2.1, default: 1 };

  const loop = () => {
    raf = 0;
    ringPos.x = lerp(ringPos.x, pos.x, 0.2);
    ringPos.y = lerp(ringPos.y, pos.y, 0.2);
    scale = lerp(scale, targetScale, 0.18);
    dot.style.transform = `translate3d(${pos.x}px,${pos.y}px,0)`;
    ring.style.transform = `translate3d(${ringPos.x}px,${ringPos.y}px,0) scale(${scale})`;
    if (Math.abs(ringPos.x - pos.x) + Math.abs(ringPos.y - pos.y) > 0.1 || Math.abs(scale - targetScale) > 0.005) {
      raf = requestAnimationFrame(loop);
    }
  };
  const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };

  const stateFor = el => {
    if (!el || !el.closest) return "default";
    if (el.closest("input:not([type=radio]):not([type=checkbox]),textarea,select,iframe")) return "text";
    if (el.closest("a,button,summary,label,[role=button]")) return "link";
    if (el.closest("[data-tilt]")) return "card";
    return "default";
  };

  window.addEventListener("pointermove", e => {
    if (e.pointerType !== "mouse") return;
    pos.x = e.clientX; pos.y = e.clientY;
    if (!shown) { shown = true; ringPos.x = pos.x; ringPos.y = pos.y; cursor.dataset.state = "default"; }
    const st = stateFor(e.target);
    if (cursor.dataset.state !== st) cursor.dataset.state = st;
    targetScale = SCALE[st] || 1;
    kick();
  }, { passive: true });
  document.addEventListener("pointerleave", () => { cursor.dataset.state = "hidden"; });
  window.addEventListener("blur", () => { cursor.dataset.state = "hidden"; });
  window.addEventListener("pointerdown", () => { targetScale *= 0.82; kick(); });
  window.addEventListener("pointerup", () => { targetScale = SCALE[cursor.dataset.state] || 1; kick(); });
  cursor.dataset.state = "hidden";

  /* ---------- Magnetic buttons ---------- */
  document.querySelectorAll("[data-magnetic]").forEach(el => {
    const strength = 0.28, radius = 1.4;
    let rect = null;
    el.addEventListener("pointerenter", () => { rect = el.getBoundingClientRect(); });
    el.addEventListener("pointermove", e => {
      if (!rect) rect = el.getBoundingClientRect();
      const dx = e.clientX - (rect.left + rect.width / 2);
      const dy = e.clientY - (rect.top + rect.height / 2);
      el.style.translate = `${dx * strength}px ${dy * strength * radius / 2}px`;
    });
    el.addEventListener("pointerleave", () => { el.style.translate = "0 0"; rect = null; });
  });

  /* ---------- Tilt + sheen ---------- */
  bindTilt(document);
}

/** Attach tilt to [data-tilt] elements inside root (callable again for new content). */
export function bindTilt(root) {
  if (!document.documentElement.classList.contains("has-cursor")) return;
  root.querySelectorAll("[data-tilt]:not([data-tilt-bound])").forEach(el => {
    el.dataset.tiltBound = "";
    const max = parseFloat(el.dataset.tilt) || 6;
    let rect = null, raf = 0, tx = 0, ty = 0, cx = 0, cy = 0, active = false;
    const frame = () => {
      raf = 0;
      cx = lerp(cx, tx, 0.16); cy = lerp(cy, ty, 0.16);
      el.style.transform = `perspective(1000px) rotateX(${(-cy * max).toFixed(2)}deg) rotateY(${(cx * max).toFixed(2)}deg) translateZ(0)`;
      if (active || Math.abs(cx - tx) + Math.abs(cy - ty) > 0.002) raf = requestAnimationFrame(frame);
      else if (!tx && !ty) el.style.transform = "";
    };
    el.addEventListener("pointerenter", e => {
      if (e.pointerType !== "mouse") return;
      rect = el.getBoundingClientRect(); active = true;
    });
    el.addEventListener("pointermove", e => {
      if (e.pointerType !== "mouse") return;
      if (!rect) rect = el.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width, y = (e.clientY - rect.top) / rect.height;
      // Ease tilt off while the user is reading an opened checklist
      const damp = el.querySelector("details[open]") ? 0.25 : 1;
      tx = (x - 0.5) * 2 * damp; ty = (y - 0.5) * 2 * damp;
      el.style.setProperty("--mx", x * 100 + "%");
      el.style.setProperty("--my", y * 100 + "%");
      if (!raf) raf = requestAnimationFrame(frame);
    });
    el.addEventListener("pointerleave", () => {
      active = false; tx = 0; ty = 0; rect = null;
      if (!raf) raf = requestAnimationFrame(frame);
    });
  });
}

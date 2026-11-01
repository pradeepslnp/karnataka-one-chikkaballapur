/* Draws abstract document sheets onto a canvas.
   Shared by the WebGL scene (as textures) and the CSS 3D fallback,
   so both versions of the hero look the same. No real ID layouts are imitated. */

export const SHEET_KINDS = ["form", "ledger", "cert", "list", "print", "project"];

const C = {
  paper: "#FFFFFF", line: "#D9DBE5", lineDark: "#B9BCCB", text: "#3B3757",
  violet: "#5B47C8", red: "#C8102E", turmeric: "#FFC72C", indigo: "#1A1538"
};

function rng(seed) {
  let s = seed * 9301 + 49297;
  return () => ((s = (s * 9301 + 49297) % 233280) / 233280);
}

function bars(ctx, x, y, w, rows, gap, r, color, minF = 0.45) {
  ctx.fillStyle = color;
  for (let i = 0; i < rows; i++) {
    const f = i === rows - 1 ? minF + r() * 0.2 : 0.75 + r() * 0.25;
    roundRect(ctx, x, y + i * gap, w * f, gap * 0.32, gap * 0.16);
    ctx.fill();
  }
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function stamp(ctx, cx, cy, s, color, rot = -0.18) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rot);
  ctx.globalAlpha = 0.82;
  ctx.strokeStyle = color;
  ctx.lineWidth = s * 0.05;
  ctx.beginPath(); ctx.arc(0, 0, s * 0.5, 0, Math.PI * 2); ctx.stroke();
  ctx.lineWidth = s * 0.025;
  ctx.beginPath(); ctx.arc(0, 0, s * 0.38, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i * 4 * Math.PI) / 5;
    ctx.lineTo(Math.cos(a) * s * 0.2, Math.sin(a) * s * 0.2);
  }
  ctx.closePath(); ctx.fill();
  ctx.restore();
}

/** Draw a sheet. `w` is the canvas width in px; height follows A4 ratio. */
export function drawSheet(canvas, kind, w, seed = 1) {
  const h = Math.round(w * 1.414);
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d");
  const u = w / 100; // 1 unit = 1% of width
  const r = rng(seed);

  ctx.fillStyle = C.paper;
  ctx.fillRect(0, 0, w, h);
  // faint paper grain
  ctx.fillStyle = "rgba(26,21,56,0.025)";
  for (let i = 0; i < 260; i++) ctx.fillRect(r() * w, r() * h, u * 0.35, u * 0.35);

  const m = 9 * u; // margin
  const cw = w - m * 2;

  // header band common to all sheets
  ctx.fillStyle = C.text;
  roundRect(ctx, m, m, cw * 0.46, 3.2 * u, 1.6 * u); ctx.fill();
  ctx.fillStyle = C.lineDark;
  roundRect(ctx, m, m + 5.6 * u, cw * 0.3, 2 * u, 1 * u); ctx.fill();

  switch (kind) {
    case "form": {
      ctx.strokeStyle = C.lineDark; ctx.lineWidth = u * 0.5;
      ctx.strokeRect(w - m - 22 * u, m, 22 * u, 27 * u); // photo box
      ctx.fillStyle = "#EEF0F3"; ctx.fillRect(w - m - 21.5 * u, m + 0.5 * u, 21 * u, 26 * u);
      ctx.fillStyle = C.lineDark;
      ctx.beginPath(); ctx.arc(w - m - 11 * u, m + 10 * u, 4.5 * u, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.ellipse(w - m - 11 * u, m + 23 * u, 8 * u, 6 * u, 0, Math.PI, 0); ctx.fill();
      let y = m + 36 * u;
      for (let i = 0; i < 7; i++) {
        ctx.fillStyle = C.lineDark; roundRect(ctx, m, y, 16 * u, 1.8 * u, 0.9 * u); ctx.fill();
        ctx.strokeStyle = C.line; ctx.lineWidth = u * 0.45;
        ctx.beginPath(); ctx.moveTo(m + 20 * u, y + 2.4 * u); ctx.lineTo(w - m, y + 2.4 * u); ctx.stroke();
        ctx.fillStyle = C.text; roundRect(ctx, m + 21 * u, y - 0.2 * u, (20 + r() * 40) * u, 1.8 * u, 0.9 * u); ctx.fill();
        y += 9.5 * u;
      }
      ctx.fillStyle = C.red; roundRect(ctx, m, h - m - 4 * u, cw * 0.34, 4 * u, 1 * u); ctx.fill();
      stamp(ctx, w - m - 14 * u, h - m - 14 * u, 22 * u, C.violet);
      break;
    }
    case "ledger": {
      const top = m + 14 * u, rows = 13, rh = (h - top - m - 6 * u) / rows;
      const cols = [0, 0.14, 0.42, 0.62, 0.8, 1];
      ctx.fillStyle = "#F1EFFB"; ctx.fillRect(m, top, cw, rh);
      ctx.strokeStyle = C.lineDark; ctx.lineWidth = u * 0.4;
      for (let i = 0; i <= rows; i++) { ctx.beginPath(); ctx.moveTo(m, top + i * rh); ctx.lineTo(w - m, top + i * rh); ctx.stroke(); }
      cols.forEach(c => { ctx.beginPath(); ctx.moveTo(m + c * cw, top); ctx.lineTo(m + c * cw, top + rows * rh); ctx.stroke(); });
      for (let i = 0; i < rows; i++) for (let c = 0; c < cols.length - 1; c++) {
        ctx.fillStyle = i === 0 ? C.violet : C.text;
        ctx.globalAlpha = i === 0 ? 0.9 : 0.55;
        const cx = m + cols[c] * cw + 1.6 * u, cwid = (cols[c + 1] - cols[c]) * cw - 3.2 * u;
        roundRect(ctx, cx, top + i * rh + rh * 0.38, cwid * (0.4 + r() * 0.55), rh * 0.24, rh * 0.12); ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = "rgba(255,199,44,.35)";
      ctx.fillRect(m, top + rh * 6, cw, rh);
      break;
    }
    case "cert": {
      ctx.strokeStyle = C.violet; ctx.lineWidth = u * 0.6;
      ctx.strokeRect(4 * u, 4 * u, w - 8 * u, h - 8 * u);
      ctx.lineWidth = u * 0.3;
      ctx.strokeRect(5.6 * u, 5.6 * u, w - 11.2 * u, h - 11.2 * u);
      ctx.fillStyle = C.indigo;
      roundRect(ctx, w * 0.22, m + 16 * u, w * 0.56, 4.5 * u, 2 * u); ctx.fill();
      bars(ctx, m + 4 * u, m + 30 * u, cw - 8 * u, 10, 5.4 * u, r, C.lineDark);
      stamp(ctx, w * 0.3, h - m - 16 * u, 24 * u, C.red, 0.12);
      ctx.strokeStyle = C.text; ctx.lineWidth = u * 0.5;
      ctx.beginPath(); ctx.moveTo(w * 0.56, h - m - 12 * u);
      ctx.bezierCurveTo(w * 0.62, h - m - 20 * u, w * 0.66, h - m - 6 * u, w * 0.74, h - m - 14 * u);
      ctx.bezierCurveTo(w * 0.78, h - m - 18 * u, w * 0.8, h - m - 10 * u, w * 0.84, h - m - 12 * u);
      ctx.stroke();
      ctx.strokeStyle = C.lineDark;
      ctx.beginPath(); ctx.moveTo(w * 0.54, h - m - 8 * u); ctx.lineTo(w - m, h - m - 8 * u); ctx.stroke();
      break;
    }
    case "list": {
      let y = m + 16 * u;
      for (let i = 0; i < 8; i++) {
        ctx.strokeStyle = C.lineDark; ctx.lineWidth = u * 0.5;
        roundRect(ctx, m, y, 5 * u, 5 * u, 1 * u); ctx.stroke();
        if (i < 5) {
          ctx.strokeStyle = C.violet; ctx.lineWidth = u * 0.9;
          ctx.beginPath(); ctx.moveTo(m + 1 * u, y + 2.6 * u); ctx.lineTo(m + 2.2 * u, y + 3.8 * u); ctx.lineTo(m + 4.2 * u, y + 1.2 * u); ctx.stroke();
        }
        ctx.fillStyle = i < 5 ? C.lineDark : C.text;
        roundRect(ctx, m + 9 * u, y + 1.5 * u, (30 + r() * 42) * u, 2 * u, 1 * u); ctx.fill();
        y += 10.4 * u;
      }
      ctx.fillStyle = C.turmeric; roundRect(ctx, m, h - m - 5 * u, cw * 0.3, 5 * u, 2.5 * u); ctx.fill();
      break;
    }
    case "print": {
      bars(ctx, m, m + 16 * u, cw, 6, 4.6 * u, r, C.lineDark);
      ctx.fillStyle = "#E8E4FA"; ctx.fillRect(m, m + 46 * u, cw, 34 * u);
      ctx.fillStyle = "rgba(91,71,200,.55)";
      ctx.beginPath(); ctx.moveTo(m, m + 80 * u); ctx.lineTo(m + cw * 0.35, m + 58 * u); ctx.lineTo(m + cw * 0.6, m + 70 * u); ctx.lineTo(m + cw, m + 52 * u); ctx.lineTo(m + cw, m + 80 * u); ctx.fill();
      ctx.fillStyle = C.turmeric; ctx.beginPath(); ctx.arc(m + cw * 0.78, m + 56 * u, 4 * u, 0, 7); ctx.fill();
      bars(ctx, m, m + 88 * u, cw, 8, 4.6 * u, r, C.lineDark);
      break;
    }
    case "project": {
      ctx.fillStyle = C.indigo; ctx.fillRect(0, 0, w, h * 0.56);
      ctx.fillStyle = "rgba(255,255,255,.9)";
      for (let i = 0; i < 16; i++) { ctx.beginPath(); ctx.arc(4.2 * u, 6 * u + i * (h - 12 * u) / 15, 1.3 * u, 0, 7); ctx.fill(); }
      ctx.fillStyle = C.turmeric; roundRect(ctx, m + 3 * u, h * 0.2, cw * 0.62, 5 * u, 1 * u); ctx.fill();
      ctx.fillStyle = "rgba(241,240,250,.6)"; roundRect(ctx, m + 3 * u, h * 0.2 + 9 * u, cw * 0.42, 2.4 * u, 1.2 * u); ctx.fill();
      ctx.fillStyle = C.red; ctx.fillRect(0, h * 0.56, w, 1.6 * u);
      bars(ctx, m + 3 * u, h * 0.66, cw * 0.7, 5, 5 * u, r, C.lineDark);
      break;
    }
  }
  return canvas;
}

import { SHOP, SERVICES } from "./config.js";
import { initHero, heroState } from "./hero.js";

/* ---------- Capabilities ---------- */
const mq = q => window.matchMedia(q).matches;
const reducedMotion = mq("(prefers-reduced-motion: reduce)");
const finePointer = mq("(pointer: fine) and (hover: hover)");
const saveData = !!(navigator.connection && navigator.connection.saveData);
const motion = !reducedMotion;
const canWebGL = (() => {
  if (!motion || !finePointer || saveData || innerWidth < 1024) return false;
  if ((navigator.deviceMemory || 8) < 4 || (navigator.hardwareConcurrency || 8) < 4) return false;
  try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); }
  catch { return false; }
})();

/* ---------- Helpers ---------- */
const $ = id => document.getElementById(id);
const set = (id, v) => { const el = $(id); if (el) el.textContent = v; };
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const store = {
  get(k) { try { return JSON.parse(localStorage.getItem(k) || "null"); } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage unavailable */ } }
};

/* ---------- Shop details (from config.js) ---------- */
set("shopName", SHOP.name); set("shopName2", SHOP.name);
set("tagline", SHOP.tagline);
set("areaShort", SHOP.area); set("addrFull", SHOP.address); set("addrFoot", SHOP.address);
set("landmark", SHOP.landmark); set("hoursShort", SHOP.hoursShort); set("hoursFull", SHOP.hoursFull);
set("menuHours", SHOP.hoursShort);
set("yr", new Date().getFullYear());
document.title = SHOP.name + " – Online & Citizen Services";

const tel = "tel:" + SHOP.phone;
["phoneLink", "phoneLink2", "menuPhone"].forEach(id => { $(id).href = tel; $(id).textContent = SHOP.phoneShow; });
["headCall", "barCall", "phoneLink3"].forEach(id => { $(id).href = tel; });

const dir = `https://www.google.com/maps/dir/?api=1&destination=${SHOP.lat},${SHOP.lng}`;
["dirBtn", "dirBtn2", "barDir"].forEach(id => { $(id).href = dir; });
$("mapFrame").src = `https://maps.google.com/maps?q=${SHOP.lat},${SHOP.lng}&z=16&output=embed`;
$("barWa").href = `https://wa.me/${SHOP.whatsapp}`;

/* ---------- Open now / closed (shop's local time, India) ---------- */
function openStatus() {
  const h = SHOP.hours;
  if (!h) return;
  const parts = Object.fromEntries(new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata", weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23"
  }).formatToParts(new Date()).map(p => [p.type, p.value]));
  const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(parts.weekday);
  const now = +parts.hour * 60 + +parts.minute;
  const toMin = t => { const [a, b] = t.split(":").map(Number); return a * 60 + b; };
  const fmt = t => { let [a, b] = t.split(":").map(Number); const ap = a >= 12 ? "PM" : "AM"; a = a % 12 || 12; return `${a}:${String(b).padStart(2, "0")} ${ap}`; };
  const open = h.days.includes(day) && now >= toMin(h.open) && now < toMin(h.close);
  let text;
  if (open) text = `Open now, closes at ${fmt(h.close)}`;
  else {
    let d = day, label = "";
    const opensLaterToday = h.days.includes(day) && now < toMin(h.open);
    if (opensLaterToday) label = "today";
    else {
      for (let i = 1; i <= 7; i++) { d = (day + i) % 7; if (h.days.includes(d)) break; }
      label = d === (day + 1) % 7 ? "tomorrow" : ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][d];
    }
    text = `Closed now, opens ${label} at ${fmt(h.open)}`;
  }
  const el = $("openStatus");
  el.classList.toggle("is-closed", !open);
  el.querySelector(".status-text").textContent = text;
  el.classList.remove("is-pending");
}
openStatus();
setInterval(openStatus, 60000);

/* ---------- Services ---------- */
function layoutSpans(list) {
  // Wide screens use a 6-column grid: featured cards take 3, others 2.
  // The last row is stretched so it is always full.
  const spans = list.map(s => (s.featured ? 3 : 2));
  let row = [], used = 0;
  const rows = [];
  spans.forEach((sp, i) => { if (used + sp > 6) { rows.push(row); row = []; used = 0; } row.push(i); used += sp; });
  if (row.length) rows.push(row);
  const last = rows[rows.length - 1];
  const lastUsed = last.reduce((a, i) => a + spans[i], 0);
  if (lastUsed < 6) last.forEach(i => { spans[i] = 6 / last.length; });
  return spans;
}

const spans = layoutSpans(SERVICES);
$("svcGrid").innerHTML = SERVICES.map((s, i) => {
  const id = slug(s.name);
  return `
  <article class="svc${s.featured ? " featured" : ""}" data-tilt="${s.featured ? 3 : 4}" style="--span:${spans[i]}" data-svc="${esc(s.name)}">
    <div class="svc-top">
      <div>
        <h3>${esc(s.name)}</h3>
      </div>
      <span class="stamp-ic" aria-hidden="true"><svg class="ic"><use href="#i-${esc(s.icon || "deed")}"/></svg></span>
    </div>
    <p class="svc-desc">${esc(s.desc)}</p>
    <details>
      <summary>Documents to bring <span class="count" data-count>${s.docs.length}</span><span class="plus" aria-hidden="true"></span></summary>
      <ul class="checklist">
        ${s.docs.map((d, j) => `
        <li><label class="check"><input type="checkbox" data-doc="${id}:${j}"><span class="box"><svg class="ic"><use href="#i-check"/></svg></span><span class="txt">${esc(d)}</span></label></li>`).join("")}
      </ul>
      <div class="svc-actions">
        <a class="link-btn" href="#enquiry" data-ask="${esc(s.name)}"><svg class="ic"><use href="#i-chat"/></svg>Ask about this</a>
      </div>
    </details>
  </article>`;
}).join("");

/* Checklist: remembers ticks on this device */
const CHECK_KEY = "k1-checklist";
const checked = new Set(store.get(CHECK_KEY) || []);
const updateCount = card => {
  const boxes = card.querySelectorAll("[data-doc]");
  const done = [...boxes].filter(b => b.checked).length;
  const c = card.querySelector("[data-count]");
  c.textContent = done ? `${done} of ${boxes.length} ready` : String(boxes.length);
  c.classList.toggle("is-done", done === boxes.length);
};
document.querySelectorAll(".svc").forEach(card => {
  card.querySelectorAll("[data-doc]").forEach(b => { b.checked = checked.has(b.dataset.doc); });
  updateCount(card);
});
$("svcGrid").addEventListener("change", e => {
  const b = e.target.closest("[data-doc]");
  if (!b) return;
  b.checked ? checked.add(b.dataset.doc) : checked.delete(b.dataset.doc);
  store.set(CHECK_KEY, [...checked]);
  updateCount(b.closest(".svc"));
});

/* ---------- Enquiry form ---------- */
$("chipRow").innerHTML = SERVICES.map(s =>
  `<label class="chip"><input type="radio" name="service" value="${esc(s.name)}" required><span>${esc(s.name)}</span></label>`
).join("");

const form = $("enqForm");
const okMsg = $("okMsg");
const fieldOf = el => el.closest(".field, .chips");

const validators = {
  fName: () => $("fName").value.trim().length >= 2,
  fPhone: () => /^(\+?91)?[6-9]\d{9}$/.test($("fPhone").value.replace(/[\s-]/g, "")),
  fSvc: () => !!form.querySelector("input[name=service]:checked")
};
const check = (id, show) => {
  const ok = validators[id]();
  const holder = id === "fSvc" ? $("fSvc") : fieldOf($(id));
  if (show || ok) holder.classList.toggle("invalid", !ok);
  const input = id === "fSvc" ? null : $(id);
  if (input) { input.setAttribute("aria-invalid", String(!ok)); input.setAttribute("aria-describedby", id + "Err"); }
  return ok;
};
["fName", "fPhone"].forEach(id => {
  $(id).addEventListener("blur", () => { if ($(id).value) check(id, true); });
  $(id).addEventListener("input", () => { if (fieldOf($(id)).classList.contains("invalid")) check(id, true); });
});
form.addEventListener("change", e => { if (e.target.name === "service") check("fSvc", true); });

form.addEventListener("submit", e => {
  e.preventDefault();
  const results = ["fName", "fPhone", "fSvc"].map(id => [id, check(id, true)]);
  const firstBad = results.find(([, ok]) => !ok);
  if (firstBad) {
    const [id] = firstBad;
    (id === "fSvc" ? form.querySelector("input[name=service]") : $(id)).focus();
    return;
  }
  const service = form.querySelector("input[name=service]:checked").value;
  const text = `New enquiry from website%0A` +
    `Name: ${encodeURIComponent($("fName").value.trim())}%0A` +
    `Mobile: ${encodeURIComponent($("fPhone").value.trim())}%0A` +
    `Service: ${encodeURIComponent(service)}%0A` +
    `Details: ${encodeURIComponent($("fMsg").value.trim() || "-")}`;
  const url = `https://wa.me/${SHOP.whatsapp}?text=${text}`;
  window.open(url, "_blank");
  $("waFallback").href = url;
  form.reset();
  form.hidden = true;
  okMsg.hidden = false;
  okMsg.classList.remove("is-stamping"); void okMsg.offsetWidth; okMsg.classList.add("is-stamping");
  okMsg.focus();
});
$("okAgain").addEventListener("click", () => {
  okMsg.hidden = true; form.hidden = false;
  form.querySelectorAll(".invalid").forEach(el => el.classList.remove("invalid"));
  $("fName").focus();
});

/* "Ask about this" on a service card pre-selects it in the form */
$("svcGrid").addEventListener("click", e => {
  const a = e.target.closest("[data-ask]");
  if (!a) return;
  e.preventDefault();
  if (form.hidden) $("okAgain").click();
  const radio = [...form.querySelectorAll("input[name=service]")].find(r => r.value === a.dataset.ask);
  if (radio) { radio.checked = true; check("fSvc", false); }
  scrollToHash("#enquiry", () => $("fName").focus({ preventScroll: true }));
});

/* ---------- Navigation ---------- */
const head = document.querySelector(".site-head");
const navLinks = [...document.querySelectorAll(".nav a")];
const ink = document.querySelector(".nav-ink");
const moveInk = a => {
  if (!a) { ink.style.opacity = "0"; return; }
  ink.style.opacity = "1";
  ink.style.width = a.offsetWidth - 24 + "px";
  ink.style.transform = `translateX(${a.offsetLeft + 12}px)`;
};
let current = null;
const setCurrent = id => {
  if (id === current) return;
  current = id;
  navLinks.forEach(a => a.getAttribute("href") === "#" + id ? a.setAttribute("aria-current", "true") : a.removeAttribute("aria-current"));
  moveInk(navLinks.find(a => a.getAttribute("href") === "#" + id));
};

/* Which section is under the header line, and is it dark? */
const sections = ["top", "services", "how", "location", "enquiry"].map(id => $(id));
const darkZones = [document.querySelector(".hero"), $("enquiry"), document.querySelector(".site-foot")];
let ticking = false;
const onScroll = () => {
  ticking = false;
  const y = 40;
  head.classList.toggle("is-dark", darkZones.some(z => { const r = z.getBoundingClientRect(); return r.top <= y && r.bottom > y; }));
  const probe = innerHeight * 0.35;
  let active = null;
  sections.forEach(s => { const r = s.getBoundingClientRect(); if (r.top <= probe && r.bottom > probe) active = s.id; });
  setCurrent(active === "top" ? null : active);
  if (!motionApi) {
    const max = document.documentElement.scrollHeight - innerHeight;
    document.querySelector(".progress").style.setProperty("--p", max > 0 ? (scrollY / max).toFixed(4) : 0);
  }
};
window.addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
window.addEventListener("resize", () => moveInk(navLinks.find(a => a.hasAttribute("aria-current"))));

/* Anchor links: smooth via Lenis when active, native otherwise */
let motionApi = null;
function scrollToHash(hash, done) {
  const target = hash === "#top" ? document.body : document.querySelector(hash);
  if (!target) return;
  // Both paths land the section just below the floating header (html scroll-padding-top).
  const offset = -(parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 96);
  if (motionApi && motionApi.lenis) {
    // Lenis applies scroll-padding-top itself, so no extra offset here
    motionApi.lenis.scrollTo(hash === "#top" ? 0 : target, { duration: 1.2, onComplete: done });
  } else {
    const top = hash === "#top" ? 0 : target.getBoundingClientRect().top + scrollY + offset;
    window.scrollTo({ top, behavior: reducedMotion ? "auto" : "smooth" });
    if (done) setTimeout(done, reducedMotion ? 0 : 700);
  }
  history.replaceState(null, "", hash);
}
document.addEventListener("click", e => {
  const a = e.target.closest('a[href^="#"]');
  if (!a || a.hasAttribute("data-ask") || a.classList.contains("skip")) return;
  const hash = a.getAttribute("href");
  if (hash.length < 2) return;
  e.preventDefault();
  closeMenu(false);
  scrollToHash(hash, () => {
    const t = hash === "#top" ? document.querySelector(".brand") : document.querySelector(hash + " h2") || document.querySelector(hash);
    if (t && t !== document.activeElement) { if (!t.hasAttribute("tabindex") && !/^(A|BUTTON|INPUT)$/.test(t.tagName)) t.setAttribute("tabindex", "-1"); t.focus({ preventScroll: true }); }
  });
});

/* ---------- Mobile menu ---------- */
const menu = $("mobileMenu");
const menuBtn = document.querySelector(".menu-btn");
function openMenu() {
  menu.hidden = false;
  menu.classList.add("is-open");
  menuBtn.setAttribute("aria-expanded", "true");
  document.body.style.overflow = "hidden";
  motionApi?.lenis?.stop();
  menu.querySelector(".menu-close").focus();
}
function closeMenu(returnFocus = true) {
  if (menu.hidden) return;
  menu.hidden = true;
  menu.classList.remove("is-open");
  menuBtn.setAttribute("aria-expanded", "false");
  document.body.style.overflow = "";
  motionApi?.lenis?.start();
  if (returnFocus) menuBtn.focus();
}
menuBtn.addEventListener("click", openMenu);
menu.querySelector(".menu-close").addEventListener("click", () => closeMenu());
menu.addEventListener("keydown", e => {
  if (e.key === "Escape") closeMenu();
  if (e.key === "Tab") { // keep focus inside the menu
    const f = [...menu.querySelectorAll("a,button")];
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }
});

/* ---------- Experience layers ---------- */
initHero({ motion, webgl: canWebGL });
const sweep = delay => heroState.sweep?.(delay);

if (finePointer && motion) {
  import("./pointer.js").then(m => m.initPointer());
}
if (motion) {
  import("./motion.js")
    .then(m => m.initMotion({ smooth: finePointer, heroSweep: sweep }))
    .then(api => { motionApi = api; onScroll(); });
}
onScroll();

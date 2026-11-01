/* Scroll & entrance motion. Loaded only when the visitor allows motion.
   GSAP + ScrollTrigger drive reveals; Lenis smooths wheel scrolling on desktop. */

const loadScript = src => new Promise((res, rej) => {
  const s = document.createElement("script");
  s.src = src; s.async = true; s.onload = res; s.onerror = rej;
  document.head.appendChild(s);
});

export async function initMotion({ smooth, heroSweep }) {
  try {
    await loadScript("assets/vendor/gsap.min.js");
    await loadScript("assets/vendor/ScrollTrigger.min.js");
    if (smooth) await loadScript("assets/vendor/lenis.min.js");
  } catch {
    heroSweep?.();
    return null;
  }
  const { gsap, ScrollTrigger } = window;
  gsap.registerPlugin(ScrollTrigger);
  document.documentElement.classList.add("motion");

  /* ---------- Smooth scroll (desktop wheel only) ---------- */
  let lenis = null;
  if (smooth && window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.11, wheelMultiplier: 1, smoothWheel: true, syncTouch: false });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  /* ---------- Hero entrance: headline, then the scanner sweep ---------- */
  const lines = gsap.utils.toArray(".hero h1 .line > span");
  const tl = gsap.timeline({ defaults: { ease: "expo.out" } });
  tl.from(lines, { yPercent: 105, duration: 1.15, stagger: 0.09 }, 0.05)
    .from(".hero .status, .hero-lede, .hero .btns", { opacity: 0, y: 18, duration: 0.9, stagger: 0.08 }, 0.45)
    .from(".hero-stage", { opacity: 0, scale: 0.94, duration: 1.4, ease: "power3.out" }, 0.1)
    .from(".strip .slip", { opacity: 0, y: 30, duration: 1, stagger: 0.07, clearProps: "all" }, 0.6);
  heroSweep?.(0.35);

  /* Hero copy drifts up and fades as you leave the hero */
  gsap.to(".hero-copy", {
    yPercent: -12, opacity: 0.25, ease: "none",
    scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true }
  });

  /* ---------- Service sheets are dealt onto the table, once ---------- */
  gsap.set(".svc", { opacity: 0 });
  ScrollTrigger.batch(".svc", {
    start: "top 88%", once: true,
    onEnter: batch => gsap.fromTo(batch,
      { "--ry": "56px", "--rr": (i) => (i % 2 ? "2.5deg" : "-2.5deg"), opacity: 0 },
      { "--ry": "0px", "--rr": "0deg", opacity: 1, duration: 1, ease: "expo.out", stagger: 0.08 })
  });

  /* ---------- How it works: the perforation draws across ---------- */
  gsap.from(".steps", {
    "--draw": 0, duration: 1.4, ease: "power2.inOut",
    scrollTrigger: { trigger: ".steps", start: "top 80%", once: true }
  });
  gsap.from(".steps li", {
    opacity: 0, y: 24, duration: 0.9, stagger: 0.15, ease: "expo.out",
    scrollTrigger: { trigger: ".steps", start: "top 80%", once: true }
  });

  /* ---------- Map unmasks, form sheet slides onto the glass ---------- */
  gsap.from(".map", {
    clipPath: "inset(12% 12% 12% 12% round 4px)", duration: 1.3, ease: "expo.out",
    scrollTrigger: { trigger: ".loc", start: "top 80%", once: true }
  });
  gsap.from(".form-sheet", {
    y: 80, rotation: -2.5, opacity: 0, duration: 1.3, ease: "expo.out",
    scrollTrigger: { trigger: ".enq-sec", start: "top 75%", once: true }
  });

  /* ---------- Scroll progress ---------- */
  const bar = document.querySelector(".progress");
  ScrollTrigger.create({
    start: 0, end: "max",
    onUpdate: self => bar.style.setProperty("--p", self.progress.toFixed(4))
  });

  window.addEventListener("load", () => ScrollTrigger.refresh());
  return { lenis, gsap, ScrollTrigger };
}

/* =====================================================================
   ANIMATIONS — GSAP + ScrollTrigger
   Premium, restrained motion. Fully disabled for prefers-reduced-motion.
   ===================================================================== */

(function () {
  "use strict";

  const root = document.documentElement;
  const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const canHover = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  /* ---------- Graph-editor visual (works with or without GSAP) ---------- */
  const graph = (() => {
    const curve = $("#graphCurve");
    if (!curve || !curve.getTotalLength) return null;
    const dot = $("#graphDot"), head = $("#graphPlayhead"), track = $("#graphTrackDot"), tc = $("#graphTimecode");
    const len = curve.getTotalLength();
    const samples = [];
    for (let i = 0; i <= 200; i++) samples.push(curve.getPointAtLength((len * i) / 200));
    const X0 = 40, X1 = 440, Y0 = 235, Y1 = 40, DURATION = 2.4, FPS = 24;

    const yAt = (x) => {
      for (let i = 1; i < samples.length; i++) {
        if (samples[i].x >= x) {
          const a = samples[i - 1], b = samples[i];
          const k = (x - a.x) / (b.x - a.x || 1);
          return a.y + (b.y - a.y) * k;
        }
      }
      return Y1;
    };

    return {
      length: len,
      place(t) {
        const x = X0 + (X1 - X0) * t;
        const y = yAt(x);
        dot.setAttribute("cx", x.toFixed(2));
        dot.setAttribute("cy", y.toFixed(2));
        head.setAttribute("x1", x.toFixed(2));
        head.setAttribute("x2", x.toFixed(2));
        const value = (Y0 - y) / (Y0 - Y1);
        track.style.left = (value * 100).toFixed(2) + "%";
        const frames = Math.round(t * DURATION * FPS);
        tc.textContent = "00:00:" + String(Math.floor(frames / FPS)).padStart(2, "0") + ":" + String(frames % FPS).padStart(2, "0");
      },
      duration: DURATION
    };
  })();

  if (!window.gsap || reduceMotion) {
    if (graph) graph.place(0.5);
    root.classList.add("anim-fallback");
    return;
  }

  const ST = window.ScrollTrigger;
  if (ST) gsap.registerPlugin(ST);
  gsap.defaults({ ease: "power3.out" });

  /* ---------- 1. Hero entrance ---------- */
  const heroWords = $$(".hero__title .word");
  const heroItems = $$("[data-hero]");
  const curve = $("#graphCurve");

  gsap.set(heroWords, { yPercent: 115, opacity: 1 });
  gsap.set(heroItems, { autoAlpha: 0, y: 28 });
  if (curve && graph) gsap.set(curve, { strokeDasharray: graph.length, strokeDashoffset: graph.length });
  gsap.set(".graph__key, .graph__handle-dot", { scale: 0, transformOrigin: "50% 50%", transformBox: "fill-box" });

  // CSS pre-hide is no longer needed — GSAP owns the states now
  root.classList.add("anim-ready");

  const intro = gsap.timeline({ delay: 0.15 });
  intro
    .to(".hero__meta", { autoAlpha: 1, y: 0, duration: 0.9 })
    .to(heroWords, { yPercent: 0, duration: 1.3, stagger: 0.12, ease: "expo.out" }, 0.1)
    .to(heroItems.filter((el) => !el.classList.contains("hero__meta")), { autoAlpha: 1, y: 0, duration: 1, stagger: 0.1 }, 0.55)
    .to(curve, { strokeDashoffset: 0, duration: 1.4, ease: "power2.inOut" }, 0.9)
    .to(".graph__key, .graph__handle-dot", { scale: 1, duration: 0.6, stagger: 0.08, ease: "back.out(2)" }, 1.4);

  // Looping playhead across the speed graph
  if (graph) {
    graph.place(0);
    const state = { t: 0 };
    gsap.to(state, {
      t: 1, duration: graph.duration, ease: "none", repeat: -1, yoyo: true, repeatDelay: 0.5, delay: 1.8,
      onUpdate: () => graph.place(state.t)
    });
  }

  /* ---------- 2. Scroll reveals ---------- */
  if (ST) {
    // Gentle hero parallax
    gsap.to(".hero__title", { yPercent: -12, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
    gsap.to(".hero__visual", { y: -50, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });

    const reveal = (els, vars) => {
      if (!els.length) return;
      gsap.set(els, { autoAlpha: 0, y: vars && vars.y != null ? vars.y : 40 });
      ST.batch(els, {
        start: "top 88%",
        once: true,
        onEnter: (batch) => gsap.to(batch, { autoAlpha: 1, y: 0, duration: 1.1, stagger: 0.12, ease: "power3.out", overwrite: true })
      });
    };

    reveal($$("[data-reveal]").filter((el) => !el.closest(".hero")));
    reveal($$("[data-reveal-item]"), { y: 30 });

    // Showreel: opens up slightly as it enters
    gsap.fromTo("#reel", { scale: 0.92, borderRadius: 32 }, {
      scale: 1, borderRadius: 20, ease: "none",
      scrollTrigger: { trigger: "#showreel", start: "top 85%", end: "top 15%", scrub: 0.6 }
    });

    // Contact headline
    const contactLines = $$(".contact__title .line > span");
    gsap.set(contactLines, { yPercent: 110, opacity: 1 });
    gsap.to(contactLines, {
      yPercent: 0, duration: 1.3, stagger: 0.12, ease: "expo.out",
      scrollTrigger: { trigger: ".contact__title", start: "top 85%", once: true }
    });

    // Process: progress line + active steps
    gsap.to("#processProgress", {
      scaleX: 1, ease: "none",
      scrollTrigger: { trigger: "#process", start: "top 70%", end: "bottom 60%", scrub: 0.5 }
    });
    $$(".step").forEach((step) => {
      ST.create({
        trigger: step, start: "top 70%",
        once: true,
        onEnter: () => step.classList.add("is-active")
      });
    });

    // Recalculate positions when the layout changes (showreel shown/hidden, fonts, images)
    const refresh = () => ST.refresh();
    document.addEventListener("portfolio:layout", () => requestAnimationFrame(refresh));
    window.addEventListener("load", refresh);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
  }

  /* ---------- 3. Project cards ---------- */
  function animateCards(cards) {
    if (!cards || !cards.length) return;

    if (ST) {
      gsap.set(cards, { autoAlpha: 0, y: 70 });
      gsap.set(cards.map((c) => c.querySelector(".card__media")), { clipPath: "inset(12% 6% 0% 6% round 14px)" });
      ST.batch(cards, {
        start: "top 90%",
        once: true,
        onEnter: (batch) => {
          gsap.to(batch, { autoAlpha: 1, y: 0, duration: 1.2, stagger: 0.14, ease: "expo.out", overwrite: true });
          gsap.to(batch.map((c) => c.querySelector(".card__media")), {
            clipPath: "inset(0% 0% 0% 0% round 14px)", duration: 1.4, stagger: 0.14, ease: "expo.out",
            onComplete() { this.targets().forEach((t) => (t.style.clipPath = "")); }
          });
        }
      });
      ST.refresh();
    }

    if (!canHover) return;

    // "View" cursor bubble that follows the pointer inside each preview
    cards.forEach((card) => {
      const media = card.querySelector(".card__media");
      const bubble = card.querySelector(".card__cursor");
      if (!media || !bubble) return;
      const xTo = gsap.quickTo(bubble, "x", { duration: 0.45, ease: "power3.out" });
      const yTo = gsap.quickTo(bubble, "y", { duration: 0.45, ease: "power3.out" });
      const move = (e) => {
        const r = media.getBoundingClientRect();
        xTo(e.clientX - r.left);
        yTo(e.clientY - r.top);
      };
      media.addEventListener("mouseenter", (e) => {
        const r = media.getBoundingClientRect();
        gsap.set(bubble, { x: e.clientX - r.left, y: e.clientY - r.top });
        gsap.to(bubble, { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(1.7)" });
      });
      media.addEventListener("mousemove", move);
      media.addEventListener("mouseleave", () => gsap.to(bubble, { scale: 0, opacity: 0, duration: 0.35, ease: "power2.in" }));
    });
  }

  if (window.__projectsRendered) animateCards(window.__projectsRendered.cards);
  document.addEventListener("projects:rendered", (e) => animateCards(e.detail.cards));

  /* ---------- 4. Magnetic buttons (pointer devices only) ---------- */
  if (canHover) {
    $$(".btn, .reel__btn, .nav__brand").forEach((el) => {
      const strength = el.classList.contains("reel__btn") ? 0.3 : 0.18;
      const xTo = gsap.quickTo(el, "x", { duration: 0.6, ease: "elastic.out(1, 0.5)" });
      const yTo = gsap.quickTo(el, "y", { duration: 0.6, ease: "elastic.out(1, 0.5)" });
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * strength);
        yTo((e.clientY - (r.top + r.height / 2)) * strength);
      });
      el.addEventListener("mouseleave", () => { xTo(0); yTo(0); });
    });
  }

  /* ---------- 5. Smooth in-page scrolling with nav offset ---------- */
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute("href");
    if (id.length < 2 || id.indexOf("#work/") === 0) return;
    const target = document.querySelector(id);
    if (!target) return;
    e.preventDefault();
    const top = target.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    history.replaceState(null, "", id);
  });
})();

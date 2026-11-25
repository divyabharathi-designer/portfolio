/* =====================================================================
   MAIN — fills the page from config.js and wires up interactions
   (navigation, showreel player, contact, resume detection)
   ===================================================================== */

(function () {
  "use strict";

  const cfg = window.portfolioConfig || {};
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const ICON = {
    arrow: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9"/></svg>',
    right: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
  };

  /* ---------------- 1. Text from config ---------------- */
  function bindConfig() {
    $$("[data-config]").forEach((el) => {
      const key = el.dataset.config;
      const val = cfg[key];
      if (val === undefined || val === null || val === "") {
        if (el.matches("[data-config='availability'], [data-config='tagline']")) el.hidden = true;
        return;
      }
      el.textContent = val;
    });
    $$("[data-optional]").forEach((el) => { if (!cfg[el.dataset.optional]) el.hidden = true; });

    // About intro: highlight the name
    const intro = $("#aboutTitle");
    if (intro && cfg.about) {
      let html = esc(cfg.about);
      if (cfg.name) html = html.replace(esc(cfg.name), "<em>" + esc(cfg.name) + "</em>");
      intro.innerHTML = html;
    }

    // Hero name: one masked line per word, accent full stop at the end
    const h1 = $("#heroTitle");
    if (h1 && cfg.name) {
      const words = cfg.name.trim().split(/\s+/);
      h1.setAttribute("aria-label", cfg.name);
      h1.innerHTML = words
        .map((w, i) => {
          const last = i === words.length - 1;
          return '<span class="line" aria-hidden="true"><span class="word">' +
            esc(w) + (last ? '<span class="stop">.</span>' : "") + "</span></span>";
        })
        .join(" ");
      fitHeroTitle();
      window.addEventListener("resize", fitHeroTitle);
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitHeroTitle);
    }

    if (cfg.name) {
      document.title = cfg.name + " — " + (cfg.title || "Portfolio");
      const img = $("#profileImg");
      if (img) img.alt = "Portrait of " + cfg.name;
    }
    if (cfg.seoDescription) {
      const meta = $('meta[name="description"]');
      if (meta) meta.setAttribute("content", cfg.seoDescription);
    }
    const year = $("#year");
    if (year) year.textContent = new Date().getFullYear();
  }

  /* Scales the name so it fills exactly one line on tablets & desktops.
     On phones the CSS size applies and the name wraps naturally. */
  function fitHeroTitle() {
    const h1 = $("#heroTitle");
    if (!h1) return;
    h1.style.fontSize = "";
    h1.classList.remove("is-fit");
    const avail = h1.clientWidth;
    if (!avail) return;
    const cssSize = parseFloat(getComputedStyle(h1).fontSize);
    const measure = (el) => { const r = document.createRange(); r.selectNodeContents(el); return r.getBoundingClientRect().width; };

    if (window.innerWidth > 768) {
      // Desktop / tablet: the whole name on one line, edge to edge
      h1.classList.add("is-fit");
      h1.style.fontSize = "100px";
      const needed = measure(h1) || avail;
      h1.style.fontSize = Math.max(48, Math.min(220, (100 * avail) / needed * 0.99)).toFixed(1) + "px";
    } else {
      // Phones: words wrap, but the longest word must never break
      h1.style.fontSize = "100px";
      const widest = Math.max.apply(null, $$(".line", h1).map(measure).concat([1]));
      h1.style.fontSize = Math.min(cssSize, (100 * avail) / widest * 0.98).toFixed(1) + "px";
    }
  }

  /* ---------------- 2. Lists: tools, services, process, socials ---------------- */
  function buildLists() {
    const tools = $("#toolsList");
    if (tools && Array.isArray(cfg.skills)) {
      tools.innerHTML = cfg.skills
        .map((s, i) => {
          const o = typeof s === "string" ? { name: s } : s;
          const short = o.short || o.name.replace(/[^A-Za-z]/g, "").slice(0, 2);
          return (
            '<li class="tool" data-reveal-item>' +
              '<span class="tool__index">' + String(i + 1).padStart(2, "0") + "</span>" +
              '<span class="tool__mono" aria-hidden="true">' + esc(short) + "</span>" +
              '<span class="tool__name">' + (o.vendor ? '<span class="tool__vendor">' + esc(o.vendor) + "</span>" : "") + esc(o.name) + "</span>" +
              '<span class="tool__use">' + esc(o.use || "") + "</span>" +
              '<span class="tool__arrow" aria-hidden="true">' + ICON.right + "</span>" +
            "</li>"
          );
        })
        .join("");
    }

    const services = Array.isArray(cfg.services) ? cfg.services : [];
    const sList = $("#servicesList");
    if (sList) {
      sList.innerHTML = services.map((s) => "<li>" + esc(s) + "</li>").join("");
      if (!services.length) sList.parentElement.hidden = true;
    }

    const track = $("#ribbonTrack");
    if (track) {
      const items = services.length ? services : [cfg.tagline || "Motion Design"];
      const group = '<div class="ribbon__group">' + items.concat(items).map((s) => '<span class="ribbon__item">' + esc(s) + "</span>").join("") + "</div>";
      track.innerHTML = group + group; // two identical halves → seamless loop
    }

    const steps = $("#processSteps");
    if (steps && Array.isArray(cfg.process)) {
      steps.innerHTML = cfg.process
        .map((p) =>
          '<li class="step" data-reveal-item>' +
            '<span class="step__dot" aria-hidden="true"></span>' +
            '<span class="step__num">' + esc(p.step) + "</span>" +
            '<h3 class="step__title">' + esc(p.title) + "</h3>" +
            '<p class="step__text">' + esc(p.text) + "</p>" +
          "</li>"
        )
        .join("");
    }

    const socials = $("#socialsList");
    if (socials) {
      const links = [
        ["Instagram", cfg.instagram],
        ["LinkedIn", cfg.linkedin],
        ["Behance", cfg.behance]
      ].filter((l) => l[1] && /^https?:\/\//.test(l[1]));
      socials.innerHTML = links
        .map((l) => '<li><a href="' + esc(l[1]) + '" target="_blank" rel="noopener noreferrer">' + l[0] + ICON.arrow + "</a></li>")
        .join("");
      if (!links.length) socials.hidden = true;
    }

    $$("[data-link='email']").forEach((a) => {
      if (!cfg.email) { a.hidden = true; return; }
      a.href = "mailto:" + cfg.email;
      a.textContent = cfg.email;
    });
    if (!cfg.email) { const row = $(".contact__email"); if (row) row.hidden = true; }
  }

  /* ---------------- 3. Profile image with graceful fallback ---------------- */
  function profileImage() {
    const wrap = $("#aboutPhoto");
    const img = $("#profileImg");
    const initials = $("#profileInitials");
    if (!wrap || !img) return;
    initials.textContent = (cfg.name || "")
      .split(/\s+/).filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
    const fail = () => wrap.classList.add("is-fallback");
    if (!cfg.profileImage) return fail();
    img.addEventListener("error", fail, { once: true });
    img.src = cfg.profileImage;
  }

  /* ---------------- 4. Resume: only shown when the file exists ---------------- */
  async function resumeButton() {
    const btn = $("#resumeBtn");
    if (!btn || !cfg.resume) return;
    try {
      const res = await fetch(cfg.resume, { method: "HEAD", cache: "no-cache" });
      const type = res.headers.get("content-type") || "";
      if (res.ok && !/text\/html/i.test(type)) {
        btn.href = cfg.resume;
        btn.setAttribute("download", (cfg.name || "resume").replace(/\s+/g, "-") + "-Resume" + (cfg.resume.match(/\.[a-z0-9]+$/i) || [".pdf"])[0]);
        btn.hidden = false;
      }
    } catch (e) { /* not available — keep hidden */ }
  }

  /* ---------------- 5. Navigation ---------------- */
  function navigation() {
    const nav = $("#nav");
    const toggle = $("#menuToggle");
    const menu = $("#mobileMenu");
    let lastY = window.scrollY;
    let ticking = false;

    const onScroll = () => {
      const y = window.scrollY;
      nav.classList.toggle("nav--scrolled", y > 20);
      const goingDown = y > lastY && y > 320;
      if (!document.documentElement.classList.contains("menu-open")) nav.classList.toggle("nav--hidden", goingDown);
      lastY = y;
      ticking = false;
    };
    window.addEventListener("scroll", () => { if (!ticking) { requestAnimationFrame(onScroll); ticking = true; } }, { passive: true });
    onScroll();

    const setMenu = (open) => {
      document.documentElement.classList.toggle("menu-open", open);
      document.body.classList.toggle("is-locked", open);
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      menu.setAttribute("aria-hidden", String(!open));
      if (open && window.gsap && !reduceMotion) {
        gsap.fromTo($$(".mobile-menu__links a", menu), { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, stagger: 0.06, duration: 0.8, ease: "expo.out", delay: 0.25 });
      }
    };
    toggle.addEventListener("click", () => setMenu(!document.documentElement.classList.contains("menu-open")));
    $$("a", menu).forEach((a) => a.addEventListener("click", () => setMenu(false)));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && document.documentElement.classList.contains("menu-open")) setMenu(false); });
    window.addEventListener("resize", () => { if (window.innerWidth > 768 && document.documentElement.classList.contains("menu-open")) setMenu(false); });

    // Active link follows the section in view
    const links = $$(".nav__link");
    const map = { home: "home", showreel: "home", work: "work", about: "about", skills: "about", process: "about", contact: "contact" };
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          const key = map[en.target.id];
          links.forEach((l) => l.classList.toggle("is-active", l.dataset.section === key));
        });
      }, { rootMargin: "-45% 0px -50% 0px" });
      Object.keys(map).forEach((id) => { const s = document.getElementById(id); if (s) io.observe(s); });
    }
  }

  /* ---------------- 6. Copy e-mail ---------------- */
  function copyEmail() {
    const btn = $("#copyEmail");
    if (!btn || !cfg.email) return;
    const label = $(".copy-btn__label", btn);
    btn.addEventListener("click", async () => {
      let ok = false;
      try { await navigator.clipboard.writeText(cfg.email); ok = true; }
      catch (e) {
        const t = document.createElement("textarea");
        t.value = cfg.email; t.setAttribute("readonly", ""); t.style.position = "fixed"; t.style.opacity = "0";
        document.body.appendChild(t); t.select();
        try { ok = document.execCommand("copy"); } catch (err) { ok = false; }
        t.remove();
      }
      label.textContent = ok ? "Copied" : "Press ⌘/Ctrl + C";
      btn.classList.toggle("is-copied", ok);
      setTimeout(() => { label.textContent = "Copy"; btn.classList.remove("is-copied"); }, 2000);
    });
  }

  /* ---------------- 7. Showreel player ---------------- */
  async function showreel() {
    const section = $("#showreel");
    const reel = $("#reel");
    const video = $("#reelVideo");
    if (!section || !video) return;

    let data;
    try { data = await window.portfolioManifest; } catch (e) { data = null; }
    if (!data || !data.showreel) return; // stays hidden

    section.hidden = false;
    document.dispatchEvent(new CustomEvent("portfolio:layout"));

    const poster = $("#reelPoster");
    if (data.showreelPoster) {
      const probe = new Image();
      probe.onload = () => { poster.style.backgroundImage = "url('" + data.showreelPoster + "')"; poster.classList.add("has-image"); video.poster = data.showreelPoster; };
      probe.src = data.showreelPoster;
    }

    const playBtn = $("#reelPlay");
    const soundBtn = $("#reelSound");
    const fullBtn = $("#reelFull");
    const bar = $("#reelProgress");
    let userPaused = reduceMotion; // respect reduced motion: don't autoplay
    let inView = false;
    let loaded = false;

    const sync = () => {
      const paused = video.paused;
      reel.classList.toggle("is-paused", paused);
      playBtn.setAttribute("aria-label", paused ? "Play showreel" : "Pause showreel");
      reel.classList.toggle("is-unmuted", !video.muted);
      soundBtn.setAttribute("aria-label", video.muted ? "Turn sound on" : "Turn sound off");
      soundBtn.setAttribute("aria-pressed", String(!video.muted));
    };

    const hide = () => {
      section.hidden = true;
      document.dispatchEvent(new CustomEvent("portfolio:layout"));
    };

    const load = () => {
      if (loaded) return;
      loaded = true;
      video.preload = "auto";
      video.src = data.showreel;
    };

    const tryPlay = () => {
      if (userPaused || !inView) return;
      const p = video.play();
      if (p && p.catch) p.catch(() => sync());
    };

    video.addEventListener("error", hide);
    video.addEventListener("loadeddata", () => { reel.classList.add("is-ready"); tryPlay(); });
    video.addEventListener("play", sync);
    video.addEventListener("pause", sync);
    video.addEventListener("volumechange", sync);
    video.addEventListener("timeupdate", () => {
      if (video.duration) bar.style.transform = "scaleX(" + video.currentTime / video.duration + ")";
    });

    const toggle = () => {
      load();
      if (video.paused) { userPaused = false; video.play().catch(() => {}); }
      else { userPaused = true; video.pause(); }
    };
    playBtn.addEventListener("click", toggle);
    video.addEventListener("click", toggle);

    soundBtn.addEventListener("click", () => {
      load();
      video.muted = !video.muted;
      if (!video.muted && video.paused) { userPaused = false; video.play().catch(() => {}); }
    });

    fullBtn.addEventListener("click", () => {
      load();
      const target = video;
      if (target.requestFullscreen) target.requestFullscreen().catch(() => {});
      else if (target.webkitEnterFullscreen) target.webkitEnterFullscreen();
      if (video.paused) { userPaused = false; video.play().catch(() => {}); }
    });

    if ("IntersectionObserver" in window) {
      new IntersectionObserver((entries) => {
        entries.forEach((en) => { if (en.isIntersecting) load(); });
      }, { rootMargin: "600px 0px" }).observe(reel);

      new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          inView = en.isIntersecting;
          if (inView) tryPlay();
          else if (!video.paused && !document.fullscreenElement) video.pause();
        });
      }, { threshold: 0.25 }).observe(reel);
    } else {
      load(); inView = true;
    }

    // Pause while a project is open
    document.addEventListener("portfolio:modal", (e) => {
      if (e.detail.open) { if (!video.paused) { video.pause(); reel.dataset.resume = "1"; } }
      else if (reel.dataset.resume) { delete reel.dataset.resume; tryPlay(); }
    });

    sync();
  }

  /* ---------------- boot ---------------- */
  bindConfig();
  buildLists();
  profileImage();
  navigation();
  copyEmail();
  resumeButton();
  showreel();
})();

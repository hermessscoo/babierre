/* Hermes V10 — site.js (GSAP 3.13 + ScrollTrigger + SplitText + Lenis). Nessun codice generato dall'LLM. */
(function () {
  "use strict";
  var d = document, root = d.documentElement, w = window;
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };
  var reduce = w.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = w.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var lenis = null;

  function ready() { w.__hermesReady = true; root.classList.add("is-ready"); }
  function hidePreloader() { root.classList.add("is-loaded"); }
  function fmt(n, dec) { return n.toLocaleString("it-IT", { minimumFractionDigits: dec, maximumFractionDigits: dec }); }

  /* ---------- menu (indipendente da GSAP) ---------- */
  var nav = $("[data-nav]");
  if (nav) {
    var toggle = $(".nav__toggle", nav);
    var setOpen = function (open) {
      nav.classList.toggle("is-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Chiudi menu" : "Apri menu");
      if (lenis) { open ? lenis.stop() : lenis.start(); }
    };
    toggle.addEventListener("click", function () { setOpen(!nav.classList.contains("is-open")); });
    $$(".nav__links a", nav).forEach(function (a) { a.addEventListener("click", function () { setOpen(false); }); });
    d.addEventListener("keydown", function (e) { if (e.key === "Escape") setOpen(false); });
  }

  /* ---------- fallback: niente GSAP o reduced motion ---------- */
  if (!w.gsap || !w.ScrollTrigger || reduce) {
    root.classList.add("no-anim");
    hidePreloader();
    if (nav) w.addEventListener("scroll", function () { nav.classList.toggle("is-scrolled", w.scrollY > 40); }, { passive: true });
    ready();
    return;
  }

  var gsap = w.gsap, ScrollTrigger = w.ScrollTrigger, Split = w.SplitText || null;
  gsap.registerPlugin(ScrollTrigger);
  if (Split) gsap.registerPlugin(Split);
  gsap.defaults({ ease: "expo.out", duration: 1.2 });

  /* ---------- Lenis smooth scroll ---------- */
  if (w.Lenis) {
    lenis = new w.Lenis({ lerp: 0.09, smoothWheel: true, anchors: false });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var id = a.getAttribute("href");
      var t = id.length > 1 ? d.getElementById(id.slice(1)) : null;
      if (!t) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(id === "#top" ? 0 : t, { duration: 1.6 });
      else t.scrollIntoView({ behavior: "smooth" });
    });
  });

  /* ---------- nav hide/show + progress ---------- */
  if (nav) {
    ScrollTrigger.create({
      start: 0, end: "max",
      onUpdate: function (self) {
        var y = self.scroll();
        nav.classList.toggle("is-scrolled", y > 40);
        if (!nav.classList.contains("is-open")) nav.classList.toggle("is-hidden", self.direction === 1 && y > w.innerHeight * 0.6);
      }
    });
  }
  var bar = $(".progress");
  if (bar) gsap.to(bar, { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: 0.3 } });

  /* ---------- cursore + magnetic ---------- */
  if (finePointer) {
    root.classList.add("has-cursor");
    var cur = $(".cursor");
    var cx = gsap.quickTo(cur, "x", { duration: 0.35, ease: "power3" }), cy = gsap.quickTo(cur, "y", { duration: 0.35, ease: "power3" });
    w.addEventListener("pointermove", function (e) { cx(e.clientX); cy(e.clientY); cur.classList.add("is-moving"); }, { passive: true });
    d.addEventListener("pointerleave", function () { cur.classList.remove("is-moving"); });
    d.addEventListener("pointerover", function (e) { cur.classList.toggle("is-hover", !!e.target.closest("a,button")); });
    $$("[data-magnetic]").forEach(function (el) {
      var mx = gsap.quickTo(el, "x", { duration: 0.6, ease: "elastic.out(1,0.4)" }), my = gsap.quickTo(el, "y", { duration: 0.6, ease: "elastic.out(1,0.4)" });
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        mx((e.clientX - r.left - r.width / 2) * 0.3); my((e.clientY - r.top - r.height / 2) * 0.4);
      });
      el.addEventListener("pointerleave", function () { mx(0); my(0); });
    });
  }

  /* ---------- helpers split ---------- */
  function splitLines(el, onSplit) {
    if (!Split) { gsap.set(el, { autoAlpha: 1 }); return null; }
    return Split.create(el, {
      type: "lines,words", mask: "lines", linesClass: "line", autoSplit: true,
      onSplit: function (self) { gsap.set(el, { autoAlpha: 1 }); return onSplit(self); }
    });
  }

  /* ---------- intro (preloader + hero) ---------- */
  function intro() {
    var tl = gsap.timeline({ defaults: { ease: "expo.out" } });
    var pre = $(".preloader"), num = $("[data-count-pre]");
    var letters = $("[data-letters]");
    if (pre && letters) {
      var all = $$("span", letters), keep = $$("span[data-keep]", letters), rest = all.filter(function (x) { return !x.hasAttribute("data-keep"); });
      tl.fromTo(all, { opacity: 0 }, { opacity: 1, duration: 0.05, stagger: { each: 0.006, from: "random" }, ease: "none" })
        .to(rest, { opacity: 0.12, duration: 0.6, stagger: { each: 0.004, from: "random" } }, "+=0.15")
        .to(keep, { opacity: 1, color: "var(--accent)", duration: 0.4 }, "<0.2")
        .to(pre, { clipPath: "inset(0 0 100% 0)", duration: 0.9, ease: "expo.inOut" }, "+=0.35")
        .add(hidePreloader);
    } else if (pre && num) {
      var o = { v: 0 };
      tl.to(o, { v: 100, duration: 1.1, ease: "power2.inOut", onUpdate: function () { num.textContent = Math.round(o.v); } })
        .to(pre, { clipPath: "inset(0 0 100% 0)", duration: 0.9, ease: "expo.inOut" }, "+=0.05")
        .add(hidePreloader);
    } else hidePreloader();

    var hero = $(".hero");
    if (!hero) return tl;
    var title = $("[data-split='hero']", hero);
    var at = pre ? "-=0.45" : 0;
    if (title) {
      if (Split) {
        var sp = Split.create(title, { type: "lines,words", mask: "lines", linesClass: "line" });
        gsap.set(title, { autoAlpha: 1 });
        tl.from(sp.lines, { yPercent: 115, duration: 1.4, stagger: 0.09 }, at);
      } else tl.to(title, { autoAlpha: 1, duration: 1 }, at);
    }
    tl.fromTo($$("[data-intro]", hero), { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 1.2, stagger: 0.08 }, "<0.35");
    var media = $("[data-hero-media] img", hero);
    if (media) tl.fromTo(media, { scale: 1.25 }, { scale: 1.05, duration: 2.2 }, pre ? "<-0.8" : 0);
    return tl;
  }

  /* ---------- sezioni ---------- */
  function sections() {
    var mm = gsap.matchMedia();

    // reveal generici
    ScrollTrigger.batch("[data-reveal]", {
      start: "top 88%", once: true,
      onEnter: function (els) { gsap.fromTo(els, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, stagger: 0.08, overwrite: true }); }
    });
    // titoli
    $$("[data-split]").forEach(function (el) {
      var mode = el.getAttribute("data-split");
      if (mode === "hero") return;
      if (mode === "scrub") {
        if (!Split) { gsap.set(el, { autoAlpha: 1 }); return; }
        Split.create(el, {
          type: "words", autoSplit: true,
          onSplit: function (self) {
            gsap.set(el, { autoAlpha: 1 });
            return gsap.fromTo(self.words, { opacity: 0.14 }, { opacity: 1, ease: "none", stagger: 0.1,
              scrollTrigger: { trigger: el, start: "top 80%", end: "bottom 45%", scrub: 0.6 } });
          }
        });
        return;
      }
      splitLines(el, function (self) {
        return gsap.from(self.lines, { yPercent: 115, duration: 1.3, stagger: 0.08,
          scrollTrigger: { trigger: el, start: "top 88%", once: true } });
      });
    });

    // hero image: parallax in uscita
    $$(".hero--image, .hero--video").forEach(function (h) {
      var img = $("[data-hero-media]", h), c = $("[data-hero-content]", h);
      gsap.to(img, { yPercent: 18, ease: "none", scrollTrigger: { trigger: h, start: "top top", end: "bottom top", scrub: true } });
      gsap.to(c, { yPercent: -20, autoAlpha: 0.2, ease: "none", scrollTrigger: { trigger: h, start: "top top", end: "bottom top", scrub: true } });
    });
    $$(".hero--shader .hero__inner").forEach(function (c) {
      gsap.to(c, { yPercent: -15, autoAlpha: 0.3, ease: "none", scrollTrigger: { trigger: c.parentNode, start: "top top", end: "bottom top", scrub: true } });
    });

    // galleria orizzontale pinnata (solo desktop)
    $$(".hgallery").forEach(function (sec) {
      mm.add("(min-width: 900px)", function () {
        var pin = $(".hgallery__pin", sec), track = $(".hgallery__track", sec), vp = $(".hgallery__viewport", sec);
        sec.classList.add("is-pinned");
        var dist = function () { return Math.max(0, track.scrollWidth - vp.clientWidth + parseFloat(getComputedStyle(vp).paddingLeft) * 2); };
        var tween = gsap.to(track, { x: function () { return -dist(); }, ease: "none",
          scrollTrigger: { trigger: pin, start: "top top", end: function () { return "+=" + dist(); }, pin: true, scrub: 1, invalidateOnRefresh: true, anticipatePin: 1 } });
        $$(".hcard", sec).forEach(function (card) {
          var img = $("img", card);
          if (img) gsap.fromTo(img, { xPercent: -6 }, { xPercent: 6, ease: "none",
            scrollTrigger: { trigger: card, containerAnimation: tween, start: "left right", end: "right left", scrub: true } });
        });
        return function () { sec.classList.remove("is-pinned"); };
      });
      gsap.fromTo($$(".hcard", sec), { autoAlpha: 0, y: 60 }, { autoAlpha: 1, y: 0, stagger: 0.08, scrollTrigger: { trigger: sec, start: "top 75%", once: true } });
    });

    // card impilate
    $$(".stack").forEach(function (sec) {
      var cards = $$(".stack__card", sec);
      cards.forEach(function (card, i) {
        var next = cards[i + 1];
        if (!next) return;
        var tl = gsap.timeline({ scrollTrigger: { trigger: next, start: "top bottom", end: "top 20%", scrub: true } });
        tl.to(card, { scale: 0.92 + i * 0.01, ease: "none" }, 0).to($(".stack__shade", card), { opacity: 0.45, ease: "none" }, 0);
      });
      cards.forEach(function (card) {
        var img = $(".stack__media img", card);
        if (img) gsap.fromTo(img, { scale: 1.2 }, { scale: 1, ease: "none", scrollTrigger: { trigger: card, start: "top bottom", end: "top 30%", scrub: true } });
      });
    });

    // zoom con clip-path
    $$(".zoom").forEach(function (sec) {
      var pin = $(".zoom__pin", sec), media = $(".zoom__media", sec), img = $("img", sec), scrim = $(".zoom__scrim", sec), text = $(".zoom__text", sec);
      mm.add({ desk: "(min-width: 900px)", mob: "(max-width: 899px)" }, function (ctx) {
        var start = ctx.conditions.desk ? "inset(22% 28% 22% 28% round 28px)" : "inset(26% 8% 26% 8% round 20px)";
        var tl = gsap.timeline({ scrollTrigger: { trigger: pin, start: "top top", end: "+=130%", pin: true, scrub: 1, anticipatePin: 1 } });
        tl.fromTo(media, { clipPath: start }, { clipPath: "inset(0% 0% 0% 0% round 0px)", ease: "power2.inOut", duration: 1 }, 0)
          .fromTo(img, { scale: 1.35 }, { scale: 1, ease: "power2.inOut", duration: 1 }, 0)
          .fromTo(scrim, { opacity: 0 }, { opacity: 1, ease: "none", duration: 0.5 }, 0.45)
          .fromTo(text.children, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, stagger: 0.08, duration: 0.45, ease: "power3.out" }, 0.6);
      });
    });

    // marquee con velocità legata allo scroll
    $$(".marquee").forEach(function (sec) {
      var track = $(".marquee__track", sec);
      var loop = gsap.to(track, { xPercent: -50, ease: "none", duration: 38, repeat: -1 });
      var dir = 1;
      ScrollTrigger.create({ trigger: sec, start: "top bottom", end: "bottom top",
        onToggle: function (self) { self.isActive ? loop.play() : loop.pause(); },
        onUpdate: function (self) {
          dir = self.direction;
          var v = gsap.utils.clamp(-6, 6, self.getVelocity() / 300);
          gsap.to(loop, { timeScale: dir * (1 + Math.abs(v)), duration: 0.2, overwrite: true,
            onComplete: function () { gsap.to(loop, { timeScale: dir, duration: 1.2, ease: "power2.out" }); } });
        } });
    });

    // stats count-up
    $$("[data-count]").forEach(function (el) {
      var end = parseFloat(el.getAttribute("data-count")) || 0, dec = parseInt(el.getAttribute("data-decimals") || "0", 10), o = { v: 0 };
      el.textContent = fmt(0, dec);
      gsap.to(o, { v: end, duration: 2.2, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 88%", once: true },
        onUpdate: function () { el.textContent = fmt(o.v, dec); } });
    });

    // split: clip reveal + parallax
    $$(".split__media").forEach(function (m) {
      var img = $("img", m);
      gsap.fromTo(m, { clipPath: "inset(100% 0% 0% 0% round var(--radius))" }, { clipPath: "inset(0% 0% 0% 0% round var(--radius))", duration: 1.6, ease: "expo.inOut", scrollTrigger: { trigger: m, start: "top 80%", once: true } });
      if (img) gsap.fromTo(img, { yPercent: -6 }, { yPercent: 6, ease: "none", scrollTrigger: { trigger: m, start: "top bottom", end: "bottom top", scrub: true } });
    });

    // servizi: immagine che segue il cursore
    $$(".svc").forEach(function (sec) {
      var fl = $(".svc__float", sec);
      if (!fl || !finePointer) return;
      gsap.set(fl, { xPercent: -50, yPercent: -50 });
      var fx = gsap.quickTo(fl, "x", { duration: 0.6, ease: "power3" }), fy = gsap.quickTo(fl, "y", { duration: 0.6, ease: "power3" });
      var imgs = $$(".svc__img", fl);
      $$(".svc__row", sec).forEach(function (row) {
        row.addEventListener("pointerenter", function () {
          var i = row.getAttribute("data-idx"), hit = false;
          imgs.forEach(function (im) { var on = im.getAttribute("data-idx") === i && !!$("img", im); im.classList.toggle("is-active", on); hit = hit || on; });
          fl.classList.toggle("is-on", hit);
        });
        row.addEventListener("pointerleave", function () { fl.classList.remove("is-on"); });
      });
      sec.addEventListener("pointermove", function (e) { fx(e.clientX); fy(e.clientY); });
    });

    // scramble: lettere casuali che si compongono nella parola finale
    var GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ#%&*+/<>";
    $$("[data-scramble]").forEach(function (el, n) {
      var final = el.textContent, o = { p: 0 };
      el.style.minHeight = el.offsetHeight + "px";
      gsap.to(o, { p: 1, duration: 1.4, delay: n * 0.12, ease: "power2.out",
        scrollTrigger: { trigger: el, start: "top 85%", once: true },
        onStart: function () { el.style.opacity = 1; },
        onUpdate: function () {
          var out = "";
          for (var i = 0; i < final.length; i++) {
            var ch = final[i];
            out += (ch === " " || i / final.length < o.p) ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0];
          }
          el.textContent = out;
        }, onComplete: function () { el.textContent = final; } });
      gsap.from(el, { x: -30, duration: 1.4, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 85%", once: true } });
    });
    $$(".statement__ghost").forEach(function (g) {
      gsap.fromTo(g, { yPercent: -35 }, { yPercent: -65, ease: "none", scrollTrigger: { trigger: g.parentNode, start: "top bottom", end: "bottom top", scrub: true } });
    });
    // testo riempito dal video: il titolo si ingrandisce uscendo
    $$(".vfill__title").forEach(function (t) {
      gsap.to(t, { scale: 1.35, ease: "none", scrollTrigger: { trigger: t.closest(".hero"), start: "top top", end: "bottom top", scrub: true } });
    });
    // indice laterale + capitoli
    var pidx = $(".pindex");
    if (pidx) ScrollTrigger.create({ start: function () { return innerHeight * 0.8; }, end: "max",
      onToggle: function (self) { pidx.classList.toggle("is-on", self.isActive); } });
    $$("[data-pindex]").forEach(function (a) {
      var sec = d.getElementById(a.getAttribute("data-pindex"));
      if (sec) ScrollTrigger.create({ trigger: sec, start: "top 50%", end: "bottom 50%",
        onToggle: function (self) { a.classList.toggle("is-active", self.isActive); } });
    });
    var chs = $$("[data-chapter]"), bar = $(".chapters__bar");
    if (chs.length) ScrollTrigger.create({ start: 0, end: "max", onUpdate: function (self) {
      var k = Math.min(chs.length - 1, Math.floor(self.progress * chs.length));
      chs.forEach(function (c, i) { c.classList.toggle("is-active", i === k); });
      if (bar) bar.style.transform = "scaleX(" + self.progress + ")";
    } });

    // footer wordmark
    $$("[data-mark]").forEach(function (m) {
      gsap.from(m, { yPercent: 100, duration: 1.6, scrollTrigger: { trigger: m.parentNode, start: "top 95%", once: true } });
    });
  }

  /* ---------- avvio dopo i font (max 2.5s) ---------- */
  var fonts = d.fonts && d.fonts.ready ? Promise.race([d.fonts.ready, new Promise(function (r) { setTimeout(r, 2500); })]) : Promise.resolve();
  fonts.then(function () {
    try {
      sections();
      intro();
    } catch (err) {
      console.warn("[hermes] animazioni disattivate:", err);
      root.classList.add("no-anim");
      hidePreloader();
    }
    w.addEventListener("load", function () { ScrollTrigger.refresh(); });
    ScrollTrigger.refresh();
    ready();
  });
})();

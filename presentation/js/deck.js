/* =========================================================================
   Deck engine — vanilla JS, no dependencies, offline.
   - 1920x1080 stage scaled to fit viewport (PPT-style proportional scaling)
   - per-slide step reveal (click / → / Space) ; ← reverses
   - keyboard: → ← Space Click F ESC Home End digits
   - count-up, SVG line-drawing, FLIP-style morph across twin slides
   ========================================================================= */
(function () {
  "use strict";

  var BASE_W = 1920, BASE_H = 1080;
  var stage = document.getElementById("stage");
  var viewport = document.getElementById("viewport");
  var slides = Array.prototype.slice.call(document.querySelectorAll(".slide"));
  var progress = document.getElementById("progress");
  var dotsWrap = document.getElementById("dots");
  var counter = document.getElementById("counter");

  var current = 0;
  var stepIndex = 0;          // steps revealed on current slide
  var stepGroups = [];        // array of arrays: elements per step for current slide
  var exportMode = /(?:^|[?&])export=1(?:&|$)/.test(location.search);

  /* --------------------------- scaling --------------------------------- */
  function resize() {
    var sw = window.innerWidth, sh = window.innerHeight;
    var scale = Math.min(sw / BASE_W, sh / BASE_H);
    var tx = (sw - BASE_W * scale) / 2;
    var ty = (sh - BASE_H * scale) / 2;
    stage.style.transform = "translate(" + tx + "px," + ty + "px) scale(" + scale + ")";
  }
  window.addEventListener("resize", resize);

  /* ----------------------- step bookkeeping ---------------------------- */
  function buildSteps(slide) {
    var groups = {};
    var order = [];
    slide.querySelectorAll("[data-step]").forEach(function (el) {
      var n = parseInt(el.getAttribute("data-step"), 10);
      if (isNaN(n)) return;
      if (!groups[n]) { groups[n] = []; order.push(n); }
      groups[n].push(el);
    });
    order.sort(function (a, b) { return a - b; });
    var ordered = order.map(function (n) { return groups[n]; });

    // Cap clicks per slide: merge the fine-grained data-step groups into at most
    // `data-max-steps` buckets (default 2) while preserving reveal order.
    // Slides that need discrete stepping (e.g. 3D drill-down) set data-max-steps.
    var max = parseInt(slide.getAttribute("data-max-steps") || "2", 10);
    if (isNaN(max) || max < 1) max = 2;
    if (ordered.length <= max) return ordered;

    var buckets = [];
    var perBucket = Math.ceil(ordered.length / max);
    for (var i = 0; i < ordered.length; i += perBucket) {
      var merged = [];
      for (var j = i; j < Math.min(i + perBucket, ordered.length); j++) {
        merged = merged.concat(ordered[j]);
      }
      buckets.push(merged);
    }
    return buckets;
  }

  function showStepsUpTo(idx) {
    stepGroups.forEach(function (grp, i) {
      var on = i < idx;
      grp.forEach(function (el) {
        el.classList.toggle("step-in", on);
        if (on) triggerElementFx(el);
      });
    });
  }

  /* special effects when a step element becomes visible */
  function triggerElementFx(el) {
    if (el.__fxDone) return;
    // count-up
    if (el.hasAttribute("data-count")) { countUp(el); el.__fxDone = true; }
    // svg line draw
    if (el.classList.contains("draw")) { drawLine(el); el.__fxDone = true; }
    // copilot mapping connectors (slide 02)
    if (el.classList.contains("copilot-diagram")) { buildCopilotLinks(el); el.__fxDone = true; }
    // twin drill-down level
    if (el.hasAttribute("data-twin-level")) { setTwinLevel(el.getAttribute("data-twin-level"), el); }
  }
  function resetElementFx(slide) {
    slide.querySelectorAll("[data-count]").forEach(function (el) { el.__fxDone = false; });
    slide.querySelectorAll(".draw").forEach(function (el) { el.__fxDone = false; });
    slide.querySelectorAll(".copilot-diagram").forEach(function (el) { el.__fxDone = false; });
  }

  function countUp(el) {
    var target = parseFloat(el.getAttribute("data-count"));
    var dur = parseInt(el.getAttribute("data-dur") || "900", 10);
    var dec = parseInt(el.getAttribute("data-dec") || "0", 10);
    var prefix = el.getAttribute("data-prefix") || "";
    var suffix = el.getAttribute("data-suffix") || "";
    var start = null;
    function tick(t) {
      if (start === null) start = t;
      var p = Math.min((t - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      var val = target * eased;
      el.textContent = prefix + val.toFixed(dec) + suffix;
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = prefix + target.toFixed(dec) + suffix;
    }
    requestAnimationFrame(tick);
  }

  function drawLine(el) {
    var paths = el.tagName === "path" || el.tagName === "line" ? [el]
              : Array.prototype.slice.call(el.querySelectorAll("path.dl, line.dl, .dl"));
    paths.forEach(function (p) {
      try {
        var len = p.getTotalLength ? p.getTotalLength() : 400;
        p.style.transition = "none";
        p.style.strokeDasharray = len;
        p.style.strokeDashoffset = len;
        // force reflow
        void p.getBoundingClientRect();
        p.style.transition = "stroke-dashoffset 1s ease";
        p.style.strokeDashoffset = "0";
      } catch (e) {}
    });
  }

  /* --------- copilot mapping connectors (정비사→질의/수행, 데이터→AI행) ------ */
  // Draws SVG connector paths from the two side illustrations to the mapped
  // pipeline rows, using layout-space offsets (independent of stage scale),
  // then animates each with a staggered stroke-dashoffset "draw" effect.
  function buildCopilotLinks(diagram) {
    var svg   = diagram.querySelector(".cd-links");
    var panel = diagram.querySelector(".cd-panel");
    var actor = diagram.querySelector(".cd-actor");
    var equip = diagram.querySelector(".cd-equip");
    if (!svg || !panel || !actor || !equip) return;

    var W = diagram.clientWidth, H = diagram.clientHeight;
    svg.setAttribute("viewBox", "0 0 " + W + " " + H);

    var pL = panel.offsetLeft;
    var pR = panel.offsetLeft + panel.offsetWidth;
    var pTop = panel.offsetTop;
    var aX = actor.offsetLeft + actor.offsetWidth - 6;   // right edge of maintainer
    var aY = actor.offsetTop + actor.offsetHeight / 2;
    var eX = equip.offsetLeft + 6;                       // left edge of equipment
    var eY = equip.offsetTop + equip.offsetHeight / 2;

    var defs = '<defs>' +
      '<marker id="cdU" markerWidth="10" markerHeight="10" refX="7" refY="5" orient="auto">' +
        '<path d="M0 0 L10 5 L0 10 Z" fill="#e4922e"/></marker>' +
      '<marker id="cdD" markerWidth="10" markerHeight="10" refX="7" refY="5" orient="auto">' +
        '<path d="M0 0 L10 5 L0 10 Z" fill="#4a9fe8"/></marker>' +
      '</defs>';

    var body = "";
    var rows = Array.prototype.slice.call(panel.querySelectorAll(".cd-row"));
    rows.forEach(function (row) {
      var cy = pTop + row.offsetTop + row.offsetHeight / 2;
      var src = row.getAttribute("data-src");
      if (src === "user") {
        var ex = pL - 9;
        body += '<path class="lk user" d="M' + aX + ' ' + aY +
                ' C' + (aX + 46) + ' ' + aY + ' ' + (ex - 46) + ' ' + cy +
                ' ' + ex + ' ' + cy + '" marker-end="url(#cdU)"/>';
      } else if (src === "data") {
        var sx = pR + 9;
        body += '<path class="lk data" d="M' + eX + ' ' + eY +
                ' C' + (eX - 46) + ' ' + eY + ' ' + (sx + 46) + ' ' + cy +
                ' ' + sx + ' ' + cy + '" marker-end="url(#cdD)"/>';
      }
    });
    svg.innerHTML = defs + body;

    // staggered line-draw + fade-in
    var paths = Array.prototype.slice.call(svg.querySelectorAll(".lk"));
    paths.forEach(function (p, i) {
      var len = p.getTotalLength ? p.getTotalLength() : 300;
      var delay = (i * 0.1).toFixed(2);
      p.style.transition = "none";
      p.style.strokeDasharray = len;
      p.style.strokeDashoffset = len;
      p.style.opacity = "0";
      void p.getBoundingClientRect();
      p.style.transition = "stroke-dashoffset .55s ease " + delay + "s, opacity .2s ease " + delay + "s";
      p.style.strokeDashoffset = "0";
      p.style.opacity = "1";
    });
  }

  /* ------------------------- twin drill-down --------------------------- */
  // camera transforms per level (applied to .twin-cam)
  var TWIN_CAM = {
    EXTERIOR:  "scale(1) translate(0,0)",
    XRAY:      "scale(1.08) translate(0,-1%)",
    SYSTEM:    "scale(1.55) translate(-6%,-4%)",
    ENGINE:    "scale(2.35) translate(-14%,-6%)",
    COMPONENT: "scale(3.3) translate(-19%,-7%)"
  };
  function setTwinLevel(level, srcEl) {
    var scene = document.querySelector(".twin-stage.is-live") ||
                (srcEl && srcEl.closest(".slide").querySelector(".twin-stage"));
    if (!scene) return;
    scene.classList.add("is-live");
    var cam = scene.querySelector(".twin-cam");
    if (cam && TWIN_CAM[level]) cam.style.transform = TWIN_CAM[level];
    // toggle layers marked with data-show="LEVEL"
    scene.querySelectorAll("[data-show-from]").forEach(function (g) {
      var order = ["EXTERIOR","XRAY","SYSTEM","ENGINE","COMPONENT"];
      var from = g.getAttribute("data-show-from");
      var show = order.indexOf(level) >= order.indexOf(from);
      g.style.opacity = show ? "1" : "0";
    });
    // hide exterior shell once we go inside
    var shell = scene.querySelector('[data-xray-shell]');
    if (shell) {
      var solid = (level === "EXTERIOR");
      shell.style.opacity = solid ? "1" : (level === "XRAY" ? "0.22" : "0.10");
    }
    // level indicator
    scene.querySelectorAll(".twin-levels .lv").forEach(function (b) {
      b.classList.toggle("on", b.getAttribute("data-lv") === level);
    });
    var hud = scene.querySelector(".twin-hud .lvl");
    if (hud) hud.textContent = level;
    // callouts
    scene.querySelectorAll(".twin-callout").forEach(function (c) {
      c.classList.toggle("show", c.getAttribute("data-at") === level);
    });
  }

  /* ------------------------- slide navigation -------------------------- */
  function activate(idx, dir) {
    idx = Math.max(0, Math.min(slides.length - 1, idx));
    if (idx === current) { /* still refresh */ }
    slides.forEach(function (s) { s.classList.remove("is-active", "is-leaving"); });
    var slide = slides[idx];
    slide.classList.add("is-active");
    current = idx;

    // static steps always visible; dynamic steps hidden
    slide.querySelectorAll(".step-static").forEach(function (el) { el.classList.add("step-in"); });
    resetElementFx(slide);
    stepGroups = buildSteps(slide);
    stepIndex = 0;
    // If slide is a twin slide, initialize base level
    var twin = slide.querySelector(".twin-stage");
    if (twin) { twin.classList.add("is-live"); setTwinLevel("EXTERIOR"); }
    if (exportMode) {
      stepIndex = stepGroups.length;
      showStepsUpTo(stepIndex);
      snapCounts(slide);
    } else {
      showStepsUpTo(0);
    }

    updateHud();
  }

  function snapCounts(slide) {
    slide.querySelectorAll("[data-count]").forEach(function (el) {
      var target = parseFloat(el.getAttribute("data-count"));
      var dec = parseInt(el.getAttribute("data-dec") || "0", 10);
      var prefix = el.getAttribute("data-prefix") || "";
      var suffix = el.getAttribute("data-suffix") || "";
      if (isNaN(target)) return;
      el.textContent = prefix + target.toFixed(dec) + suffix;
      el.__fxDone = true;
    });
  }

  function next() {
    if (stepIndex < stepGroups.length) {
      stepIndex++;
      showStepsUpTo(stepIndex);
      updateHud();
    } else if (current < slides.length - 1) {
      activate(current + 1, 1);
    }
  }
  function prev() {
    if (stepIndex > 0) {
      stepIndex--;
      showStepsUpTo(stepIndex);
      updateHud();
    } else if (current > 0) {
      // go to previous slide with all steps revealed
      activate(current - 1, -1);
      stepIndex = stepGroups.length;
      showStepsUpTo(stepIndex);
      updateHud();
    }
  }

  /* ----------------------------- HUD ----------------------------------- */
  function buildDots() {
    slides.forEach(function (_, i) {
      var b = document.createElement("button");
      b.className = "dot"; b.type = "button";
      b.setAttribute("aria-label", "슬라이드 " + (i + 1));
      b.addEventListener("click", function (e) { e.stopPropagation(); activate(i, 1); });
      dotsWrap.appendChild(b);
    });
  }
  function updateHud() {
    var pct = slides.length > 1 ? (current / (slides.length - 1)) * 100 : 100;
    progress.style.width = pct + "%";
    Array.prototype.forEach.call(dotsWrap.children, function (d, i) {
      d.classList.toggle("active", i === current);
    });
    if (counter) counter.innerHTML = "<b>" + String(current + 1).padStart(2, "0") + "</b> / " + String(slides.length).padStart(2, "0");
  }

  /* --------------------------- input ----------------------------------- */
  document.addEventListener("keydown", function (e) {
    switch (e.key) {
      case "ArrowRight": case "PageDown": case " ": case "Spacebar":
        e.preventDefault(); next(); break;
      case "ArrowLeft": case "PageUp":
        e.preventDefault(); prev(); break;
      case "Home": e.preventDefault(); activate(0, -1); break;
      case "End": e.preventDefault(); activate(slides.length - 1, 1); break;
      case "f": case "F":
        if (!document.fullscreenElement) (document.documentElement.requestFullscreen || function(){}).call(document.documentElement);
        else document.exitFullscreen && document.exitFullscreen();
        break;
      case "b": case "B": case ".":
        document.body.classList.toggle("blackout"); break;
      default:
        if (e.key >= "0" && e.key <= "9") { /* reserved */ }
    }
  });

  // click to advance (ignore clicks on interactive HUD)
  viewport.addEventListener("click", function (e) {
    if (e.target.closest("#hud, a, button, .js-ext")) return;
    next();
  });
  // right-click to go back
  viewport.addEventListener("contextmenu", function (e) { e.preventDefault(); prev(); });

  // auto-hide HUD when idle
  var hud = document.getElementById("hud");
  var idleTimer;
  function poke() {
    hud.classList.remove("hidden");
    clearTimeout(idleTimer);
    idleTimer = setTimeout(function () { hud.classList.add("hidden"); }, 3500);
  }
  window.addEventListener("mousemove", poke);
  window.addEventListener("keydown", poke);

  /* --------------------------- boot ------------------------------------ */
  if (exportMode) {
    document.documentElement.classList.add("export-mode");
    if (hud) hud.classList.add("hidden");
    if (progress) progress.classList.add("hidden");
  }

  document.querySelectorAll("a.live-go").forEach(function (a) {
    if (location.protocol === "file:") {
      a.setAttribute("href", "https://inchojeong.github.io/tbl-maintenance-ai/");
    }
  });

  buildDots();
  resize();
  activate(0, 1);
  if (!exportMode) poke();

  // expose for debugging / PDF export
  window.__deck = { next: next, prev: prev, go: activate, count: slides.length };
})();

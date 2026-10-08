/*
 * Enzyme virtual lab – interface, v1.0.0.
 * Talks to the platform only through the SLL bridge (protocol v1, capability level 3).
 */
(function () {
  "use strict";

  var SIM_ID = "enzyme-lab";
  var VERSION = "1.0.0";
  var M = window.EnzymeModel;

  var STRINGS = {
    he: {
      title: "מעבדת אנזים וירטואלית",
      tubeLabel: "מבחנת התגובה: חלקיקי תוצר נוצרים בקצב התגובה הנוכחי",
      controls: "תנאי הניסוי",
      temperature: "טמפרטורה",
      pH: "pH",
      substrate: "ריכוז מצע",
      temperatureShort: "טמפ' (\u2066°C\u2069)",
      substrateShort: "מצע (\u2066mM\u2069)",
      rateShort: "קצב (\u2066%\u2069)",
      locked: "קבוע בפעילות הזאת",
      measure: "מדוד קצב תגובה",
      clear: "נקה טבלה",
      results: "תוצאות",
      plotBy: "ציר X:",
      tableCaption: "טבלת מדידות",
      empty: "עוד אין מדידות. קבעו תנאים ולחצו על \"מדוד קצב תגובה\".",
      modelTitle: "מה מאחורי הסימולציה",
      modelText:
        "מודל לימודי מפושט, לא אנזים מסוים. קצב התגובה עולה עם ריכוז המצע עד רוויה (מיכאליס-מנטן, Km = 2 mM). מתחת ל-37°C הקצב מוכפל בכל עלייה של 10°C; מעל 37°C האנזים מאבד את המבנה שלו והקצב יורד בחדות. ה-pH האופטימלי הוא 7. לכל מדידה נוספת שונות קטנה (עד 3%), כמו במעבדה אמיתית.",
      tube: "מבחנה: {n} חלקיקי תוצר נוצרים בכל שנייה, בערך.",
      measured: "מדידה {i}: קצב {r} אחוז, בטמפרטורה {t}°C, pH {p}, מצע {s} mM.",
      cleared: "הטבלה נוקתה.",
      graphTitle: "קצב התגובה כפונקציה של {x}. {n} מדידות.",
      axisRate: "קצב יחסי (\u2066%\u2069)",
      axisX: { temperature: "טמפרטורה (\u2066°C\u2069)", pH: "pH", substrate: "ריכוז מצע (\u2066mM\u2069)" },
    },
    en: {
      title: "Enzyme virtual lab",
      tubeLabel: "Reaction test tube: product particles form at the current reaction rate",
      controls: "Experiment conditions",
      temperature: "Temperature",
      pH: "pH",
      substrate: "Substrate concentration",
      temperatureShort: "Temp (°C)",
      substrateShort: "Substrate (mM)",
      rateShort: "Rate (%)",
      locked: "Fixed in this activity",
      measure: "Measure reaction rate",
      clear: "Clear table",
      results: "Results",
      plotBy: "X axis:",
      tableCaption: "Measurements",
      empty: "No measurements yet. Set the conditions and press \"Measure reaction rate\".",
      modelTitle: "What is behind the simulation",
      modelText:
        "A simplified educational model, not a specific enzyme. The rate rises with substrate concentration until saturation (Michaelis–Menten, Km = 2 mM). Below 37°C the rate doubles for every 10°C; above 37°C the enzyme loses its structure and the rate falls sharply. The optimal pH is 7. Each measurement has a little variation (up to 3%), as in a real lab.",
      tube: "Test tube: about {n} product particles form per second.",
      measured: "Measurement {i}: rate {r} percent, at {t}°C, pH {p}, substrate {s} mM.",
      cleared: "The table was cleared.",
      graphTitle: "Reaction rate as a function of {x}. {n} measurements.",
      axisRate: "Relative rate (%)",
      axisX: { temperature: "Temperature (°C)", pH: "pH", substrate: "Substrate (mM)" },
    },
  };

  var state = {
    locale: "he",
    sessionId: "standalone",
    params: { temperature: 20, pH: 7, substrate: 10 },
    locked: [],
    measurements: [],
    xAxis: "temperature",
  };

  var el = function (id) { return document.getElementById(id); };
  var PARAMS = ["temperature", "pH", "substrate"];

  function t(key) {
    return STRINGS[state.locale][key];
  }
  function fmt(template, values) {
    return template.replace(/\{(\w+)\}/g, function (_, k) { return String(values[k]); });
  }
  function num(x, digits) {
    return new Intl.NumberFormat(state.locale === "he" ? "he-IL" : "en-US", {
      maximumFractionDigits: digits === undefined ? 1 : digits,
    }).format(x);
  }

  // ---- Localization -------------------------------------------------------
  function applyLocale() {
    document.documentElement.lang = state.locale;
    document.documentElement.dir = state.locale === "he" ? "rtl" : "ltr";
    document.title = t("title");
    el("tube").setAttribute("aria-label", t("tubeLabel"));
    var nodes = document.querySelectorAll("[data-i18n]");
    for (var i = 0; i < nodes.length; i++) {
      var v = t(nodes[i].getAttribute("data-i18n"));
      if (typeof v === "string") nodes[i].textContent = v;
    }
    render();
  }

  // ---- Parameters ---------------------------------------------------------
  function clampParam(id, value) {
    var r = M.RANGES[id];
    var v = Number(value);
    if (!isFinite(v)) return state.params[id];
    return Math.min(r.max, Math.max(r.min, v));
  }

  function setParams(params) {
    PARAMS.forEach(function (id) {
      if (Object.prototype.hasOwnProperty.call(params, id)) state.params[id] = clampParam(id, params[id]);
    });
    PARAMS.forEach(function (id) {
      el(id).value = String(state.params[id]);
    });
    render();
    report();
  }

  function applyLocks() {
    PARAMS.forEach(function (id) {
      var locked = state.locked.indexOf(id) !== -1;
      var input = el(id);
      input.disabled = locked;
      var wrap = input.closest(".control");
      wrap.classList.toggle("is-locked", locked);
      wrap.querySelector(".locked-note").hidden = !locked;
    });
  }

  PARAMS.forEach(function (id) {
    el(id).addEventListener("input", function (e) {
      if (state.locked.indexOf(id) !== -1) return;
      state.params[id] = clampParam(id, e.target.value);
      render();
      report();
    });
  });

  // ---- Measurements -------------------------------------------------------
  el("measure").addEventListener("click", function () {
    var c = { temperature: state.params.temperature, pH: state.params.pH, substrate: state.params.substrate };
    var r = M.measure(c, state.sessionId, state.measurements.length);
    state.measurements.push({ temperature: c.temperature, pH: c.pH, substrate: c.substrate, rate: r });
    el("live").textContent = fmt(t("measured"), {
      i: state.measurements.length, r: num(r), t: num(c.temperature), p: num(c.pH), s: num(c.substrate),
    });
    render();
    report();
    bridge.emit("measurementTaken", { index: state.measurements.length, rate: r });
  });

  el("clear").addEventListener("click", function () {
    state.measurements = [];
    el("live").textContent = t("cleared");
    render();
    report();
  });

  el("xaxis").addEventListener("change", function (e) {
    state.xAxis = e.target.value;
    renderGraph();
  });

  // ---- Observables reported to the platform --------------------------------
  function distinct(values) {
    var seen = {};
    values.forEach(function (v) { seen[String(v)] = true; });
    return Object.keys(seen).length;
  }

  function best(key) {
    if (!state.measurements.length) return -1;
    var top = state.measurements[0];
    state.measurements.forEach(function (m) { if (m.rate > top.rate) top = m; });
    return top[key];
  }

  function computeObservables() {
    var ms = state.measurements;
    var temps = ms.map(function (m) { return m.temperature; });
    var phs = ms.map(function (m) { return m.pH; });
    var subs = ms.map(function (m) { return m.substrate; });
    return {
      temperature: state.params.temperature,
      pH: state.params.pH,
      substrate: state.params.substrate,
      measurementsCount: ms.length,
      distinctTemperatures: distinct(temps),
      distinctPH: distinct(phs),
      bestTemperature: best("temperature"),
      bestPH: best("pH"),
      lastRate: ms.length ? ms[ms.length - 1].rate : -1,
      // 1 when every measurement used the same temperature (a controlled variable), else 0.
      temperatureHeldConstant: ms.length > 1 && distinct(temps) === 1 ? 1 : 0,
      substrateHeldConstant: ms.length > 1 && distinct(subs) === 1 ? 1 : 0,
    };
  }

  function report() {
    bridge.reportObservables(computeObservables());
  }

  // ---- Rendering -----------------------------------------------------------
  function render() {
    PARAMS.forEach(function (id) {
      var unit = id === "temperature" ? "°C" : id === "substrate" ? " mM" : "";
      el(id + "-out").textContent = num(state.params[id]) + unit;
    });
    var perSecond = Math.round(M.rate(state.params) / 10);
    el("tube-desc").textContent = fmt(t("tube"), { n: perSecond });
    renderTable();
    renderGraph();
  }

  function renderTable() {
    var body = el("rows");
    body.textContent = "";
    state.measurements.forEach(function (m, i) {
      var tr = document.createElement("tr");
      if (i === state.measurements.length - 1) tr.className = "latest";
      [i + 1, num(m.temperature), num(m.pH), num(m.substrate), num(m.rate)].forEach(function (v) {
        var td = document.createElement("td");
        td.textContent = String(v);
        tr.appendChild(td);
      });
      body.appendChild(tr);
    });
    el("empty").hidden = state.measurements.length > 0;
  }

  var SVG_NS = "http://www.w3.org/2000/svg";
  function svg(tag, attrs, text) {
    var n = document.createElementNS(SVG_NS, tag);
    Object.keys(attrs).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    if (text !== undefined) n.textContent = text;
    return n;
  }

  function renderGraph() {
    var g = el("graph");
    var title = el("graph-title");
    while (g.lastChild && g.lastChild !== title) g.removeChild(g.lastChild);
    title.textContent = fmt(t("graphTitle"), { x: t("axisX")[state.xAxis], n: state.measurements.length });

    var W = 360, H = 240, L = 44, R = 12, T = 12, B = 40;
    var range = M.RANGES[state.xAxis];
    var sx = function (x) { return L + ((x - range.min) / (range.max - range.min)) * (W - L - R); };
    var sy = function (y) { return H - B - (y / 100) * (H - T - B); };

    // The graph keeps a mathematical orientation (x grows to the right) in both languages.
    for (var y = 0; y <= 100; y += 25) {
      g.appendChild(svg("line", { class: "grid", x1: L, x2: W - R, y1: sy(y), y2: sy(y) }));
      g.appendChild(svg("text", { class: "tick", x: L - 6, y: sy(y) + 4, "text-anchor": "end" }, num(y, 0)));
    }
    var steps = 4;
    for (var i = 0; i <= steps; i++) {
      var xv = range.min + ((range.max - range.min) * i) / steps;
      g.appendChild(svg("text", { class: "tick", x: sx(xv), y: H - B + 16, "text-anchor": "middle" }, num(xv, 1)));
    }
    g.appendChild(svg("line", { class: "axis", x1: L, x2: W - R, y1: sy(0), y2: sy(0) }));
    g.appendChild(svg("line", { class: "axis", x1: L, x2: L, y1: T, y2: sy(0) }));
    g.appendChild(svg("text", { class: "label", x: (L + W - R) / 2, y: H - 6, "text-anchor": "middle" }, t("axisX")[state.xAxis]));
    g.appendChild(svg("text", { class: "label", x: 12, y: (T + H - B) / 2, "text-anchor": "middle", transform: "rotate(-90 12 " + (T + H - B) / 2 + ")" }, t("axisRate")));

    state.measurements.forEach(function (m, idx) {
      var latest = idx === state.measurements.length - 1;
      g.appendChild(svg("circle", { class: latest ? "point latest" : "point", cx: sx(m[state.xAxis]), cy: sy(Math.min(100, m.rate)), r: latest ? 5.5 : 4.5 }));
    });
  }

  // ---- Test tube animation ---------------------------------------------------
  var canvas = el("tube");
  var ctx = canvas.getContext("2d");
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var particles = [];
  var lastTime = 0;
  var spawnBudget = 0;

  function drawTube(now) {
    var w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    // Liquid
    ctx.fillStyle = "#e3f1ec";
    ctx.fillRect(20, 40, w - 40, h - 60);
    ctx.strokeStyle = "#4e6168";
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 20, w - 40, h - 40);

    var dt = lastTime ? Math.min(0.1, (now - lastTime) / 1000) : 0;
    lastTime = now;
    var r = M.rate(state.params);
    spawnBudget += dt * (r / 10);
    while (spawnBudget >= 1 && particles.length < 120) {
      spawnBudget -= 1;
      particles.push({ x: 30 + Math.random() * (w - 60), y: h - 26, v: 25 + Math.random() * 25 });
    }
    ctx.fillStyle = "#0e7c66";
    particles = particles.filter(function (p) {
      p.y -= p.v * dt;
      if (p.y < 44) return false;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fill();
      return true;
    });
    if (!reduceMotion) window.requestAnimationFrame(drawTube);
  }

  function drawStaticTube() {
    // Reduced motion: a still picture whose density reflects the current rate.
    var w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#e3f1ec";
    ctx.fillRect(20, 40, w - 40, h - 60);
    ctx.strokeStyle = "#4e6168";
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 20, w - 40, h - 40);
    var n = Math.round(M.rate(state.params) * 0.8);
    ctx.fillStyle = "#0e7c66";
    for (var i = 0; i < n; i++) {
      var x = 30 + ((i * 97) % (w - 60));
      var y = 46 + ((i * 53) % (h - 74));
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ---- Start -----------------------------------------------------------------
  var bridge = window.SLL.connect({
    simId: SIM_ID,
    version: VERSION,
    capabilityLevel: 3,
    onInit: function (init) {
      state.locale = init.locale;
      state.sessionId = init.sessionId || state.sessionId;
      state.locked = init.lockedParams.filter(function (id) { return PARAMS.indexOf(id) !== -1; });
      state.measurements = [];
      applyLocks();
      applyLocale();
      setParams(init.params);
    },
    onSetParams: function (params) {
      setParams(params);
    },
  });

  if (bridge.standalone) {
    var q = new URLSearchParams(window.location.search);
    if (q.get("lang") === "en") state.locale = "en";
  }

  applyLocks();
  applyLocale();
  report();

  if (reduceMotion) {
    drawStaticTube();
    PARAMS.forEach(function (id) { el(id).addEventListener("input", drawStaticTube); });
  } else {
    window.requestAnimationFrame(drawTube);
  }
})();

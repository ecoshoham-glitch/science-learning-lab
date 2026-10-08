/*
 * Leeuwenhoek's microscope – interface, v1.0.0.
 * Talks to the platform only through the SLL bridge (protocol v1, capability level 3).
 *
 * Drawing: objects live in "specimen space" (micrometres). On screen, an object is drawn at its
 * apparent size (actual size × magnification) times PX_PER_MM, so zooming in shows fewer, larger
 * objects – as through a real lens. Objects below the visibility limit are drawn as faint specks.
 */
(function () {
  "use strict";

  var SIM_ID = "microscope-lens";
  var VERSION = "1.0.0";
  var L = window.LensModel;

  var PX_PER_MM = 14;
  var SIZE = 360;
  var C = SIZE / 2;
  var R = SIZE / 2 - 6;

  var STRINGS = {
    he: {
      title: "המיקרוסקופ של ליווינהוק",
      controls: "המיקרוסקופ",
      instrument: "מכשיר",
      ball: "עדשת כדור יחידה (ליווינהוק)",
      compound: "מיקרוסקופ מורכב של שנות ה-1660 (הוק)",
      lensDiameter: "קוטר כדור הזכוכית",
      lensFixed: "במיקרוסקופ המורכב ההגדלה קבועה (×50), וגודל הכדור לא משפיע.",
      locked: "קבוע בפעילות הזאת",
      sample: "דגימה",
      cork: "פרוסה דקה של שעם",
      pond: "טיפת מים מאגם",
      blood: "טיפת דם",
      focal: "מוקד",
      magnification: "הגדלה",
      view: "מה רואים בעינית",
      fieldLabel: "שדה הראייה של המיקרוסקופ",
      found: "תצפיות שעשיתם:",
      none: "עוד אין",
      modelTitle: "מה מאחורי הסימולציה",
      modelText:
        "מודל לימודי מפושט. כדור זכוכית (מקדם שבירה 1.52) הוא עדשה שאורך המוקד שלה תלוי בקוטר: f = nD/4(n−1). ההגדלה של זכוכית מגדלת היא 250 מ\"מ חלקי אורך המוקד – לכן כדור קטן יותר מגדיל יותר. כדור של כ-1.3 מ\"מ נותן הגדלה של כ-260, קרוב לעדשות הטובות של ליווינהוק. למיקרוסקופ המורכב של התקופה נתנו הגדלה קבועה של 50. עצם נחשב \"נראה בבירור\" כשהגודל הנראה שלו מגיע ל-0.2 מ\"מ. המודל מתעלם מעקיפת אור, מפגמי עדשה ומתאורה. הגדלים טיפוסיים, והתמונות סכמטיות.",
      mag: "×{m}",
      focalValue: "{f} mm",
      descMag: "הגדלה ×{m}. {sample}.",
      descSeen: "רואים בבירור: {list}.",
      descNotSeen: "{name}: נראים רק כנקודות זעירות ולא ברורות – צריך הגדלה של לפחות ×{min}.",
      corkCellSeen: "תאי שעם – \"חלת דבש\" של חללים ריקים המוקפים בדפנות",
      protistSeen: "יצורים חד-תאיים גדולים בצורת אליפסה עם גרעין",
      bacteriumSeen: "חיידקים – מקלונים זעירים",
      redBloodCellSeen: "תאי דם אדומים – דסקיות עגולות",
      discoveries: {
        "cork-cells": "דפנות תאי שעם",
        protists: "חד-תאיים במים",
        "bacteria-visible": "חיידקים",
        "bacteria-hidden-compound": "המיקרוסקופ המורכב לא מראה חיידקים",
        "blood-cells": "תאי דם אדומים",
      },
    },
    en: {
      title: "Leeuwenhoek's microscope",
      controls: "The microscope",
      instrument: "Instrument",
      ball: "Single ball lens (Leeuwenhoek)",
      compound: "1660s compound microscope (Hooke)",
      lensDiameter: "Glass ball diameter",
      lensFixed: "The compound microscope has a fixed magnification (×50); the ball size does not matter.",
      locked: "Fixed in this activity",
      sample: "Sample",
      cork: "Thin slice of cork",
      pond: "Drop of pond water",
      blood: "Drop of blood",
      focal: "Focal length",
      magnification: "Magnification",
      view: "What you see in the eyepiece",
      fieldLabel: "The microscope's field of view",
      found: "Your observations:",
      none: "None yet",
      modelTitle: "What is behind the simulation",
      modelText:
        "A simplified educational model. A glass ball (refractive index 1.52) is a lens whose focal length depends on its diameter: f = nD/4(n−1). A magnifier's magnification is 250 mm divided by its focal length – so a smaller ball magnifies more. A ball of about 1.3 mm gives about 260×, close to Leeuwenhoek's best lenses. The compound microscope of the time is given a fixed magnification of 50. An object counts as \"clearly visible\" when its apparent size reaches 0.2 mm. The model ignores diffraction, lens defects and lighting. Sizes are typical and the pictures are schematic.",
      mag: "×{m}",
      focalValue: "{f} mm",
      descMag: "Magnification ×{m}. {sample}.",
      descSeen: "Clearly visible: {list}.",
      descNotSeen: "{name}: only tiny, unclear specks – you need at least ×{min}.",
      corkCellSeen: "cork cells – a \"honeycomb\" of empty spaces surrounded by walls",
      protistSeen: "large oval single-celled organisms with a nucleus",
      bacteriumSeen: "bacteria – tiny rods",
      redBloodCellSeen: "red blood cells – round discs",
      discoveries: {
        "cork-cells": "Cork cell walls",
        protists: "Single-celled organisms in water",
        "bacteria-visible": "Bacteria",
        "bacteria-hidden-compound": "The compound microscope shows no bacteria",
        "blood-cells": "Red blood cells",
      },
    },
  };

  var NOT_SEEN_NAME = {
    he: { corkCell: "תאי שעם", protist: "חד-תאיים", bacterium: "חיידקים", redBloodCell: "תאי דם אדומים" },
    en: { corkCell: "Cork cells", protist: "Single-celled organisms", bacterium: "Bacteria", redBloodCell: "Red blood cells" },
  };

  var DISCOVERY_ORDER = ["cork-cells", "protists", "bacteria-visible", "bacteria-hidden-compound", "blood-cells"];

  var state = {
    locale: "he",
    instrument: "ball",
    sample: "cork",
    params: { lensDiameter: 6 },
    locked: [],
    samplesViewed: [],
    instrumentsUsed: [],
    discoveries: [],
  };

  var el = function (id) { return document.getElementById(id); };

  function t(key) { return STRINGS[state.locale][key]; }
  function fmt(template, values) {
    return template.replace(/\{(\w+)\}/g, function (_, k) { return String(values[k]); });
  }
  function num(x, digits) {
    return new Intl.NumberFormat(state.locale === "he" ? "he-IL" : "en-US", {
      maximumFractionDigits: digits === undefined ? 1 : digits,
    }).format(x);
  }
  function addOnce(list, value) {
    if (list.indexOf(value) === -1) { list.push(value); return true; }
    return false;
  }

  // ---- Deterministic specimen layouts (micrometres, origin at the field centre) -----------
  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      var x = Math.imul(a ^ (a >>> 15), 1 | a);
      x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
      return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
    };
  }

  var layouts = (function () {
    var r = rng(1665);
    var protists = [
      { x: -75, y: 20, a: 0.4 }, { x: 170, y: 120, a: 2.1 }, { x: 210, y: -240, a: 1.2 },
      { x: -260, y: 220, a: 2.8 }, { x: -380, y: -320, a: 0.2 }, { x: 360, y: 330, a: 1.7 },
    ];
    var bacteria = [];
    for (var i = 0; i < 420; i++) {
      // Dense around the centre, where a strong lens looks.
      var rad = 140 * Math.sqrt(r());
      var th = r() * Math.PI * 2;
      bacteria.push({ x: rad * Math.cos(th), y: rad * Math.sin(th), a: r() * Math.PI });
    }
    var blood = [];
    for (var gy = -300; gy <= 300; gy += 9.5) {
      for (var gx = -300; gx <= 300; gx += 9.5) {
        if (r() < 0.22) continue;
        blood.push({ x: gx + (r() - 0.5) * 8, y: gy + (r() - 0.5) * 8 });
      }
    }
    return { protists: protists, bacteria: bacteria, blood: blood };
  })();

  // ---- Model helpers -------------------------------------------------------
  function currentMagnification() {
    return L.magnification(state.instrument, state.params.lensDiameter);
  }

  function visibility(m) {
    var out = {};
    L.SAMPLES[state.sample].forEach(function (id) {
      out[id] = L.isClearlyVisible(L.SPECIMENS[id].sizeUm, m);
    });
    return out;
  }

  // ---- Drawing -------------------------------------------------------------
  var canvas = el("field");
  var ctx = canvas.getContext("2d");

  function speck(x, y, radius) {
    ctx.beginPath();
    ctx.arc(x, y, Math.max(0.7, radius), 0, Math.PI * 2);
    ctx.fill();
  }

  function drawCork(s) {
    var w = 30; // cell width in µm
    var h = (w * Math.sqrt(3)) / 2;
    var half = R / s + w;
    var rHex = w / Math.sqrt(3);
    ctx.fillStyle = "#f1e2c4";
    ctx.fillRect(0, 0, SIZE, SIZE);
    ctx.strokeStyle = "#7a5228";
    ctx.lineWidth = Math.max(0.6, 2.2 * s);
    for (var row = Math.floor(-half / h); row <= Math.ceil(half / h); row++) {
      var y = row * h;
      var shift = row % 2 === 0 ? 0 : w / 2;
      for (var col = Math.floor(-half / w) - 1; col <= Math.ceil(half / w); col++) {
        var x = col * w + shift;
        ctx.beginPath();
        for (var k = 0; k < 6; k++) {
          var ang = Math.PI / 6 + (k * Math.PI) / 3;
          var px = C + (x + rHex * Math.cos(ang)) * s;
          var py = C + (y + rHex * Math.sin(ang)) * s;
          if (k === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
      }
    }
  }

  function drawPond(s, seen) {
    ctx.fillStyle = "#eef3ea";
    ctx.fillRect(0, 0, SIZE, SIZE);

    // Protists: 100 µm long ovals with a nucleus and a fringe of cilia.
    layouts.protists.forEach(function (p) {
      var x = C + p.x * s, y = C + p.y * s;
      var rx = 50 * s, ry = 28 * s;
      if (x + rx < 0 || x - rx > SIZE || y + rx < 0 || y - rx > SIZE) return;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(p.a);
      ctx.fillStyle = "rgba(108, 160, 92, 0.45)";
      ctx.strokeStyle = "#3e6b35";
      ctx.lineWidth = Math.max(1, 1.2 * s);
      ctx.beginPath();
      ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "rgba(62, 107, 53, 0.7)";
      ctx.beginPath();
      ctx.ellipse(rx * 0.15, 0, rx * 0.22, ry * 0.32, 0, 0, Math.PI * 2);
      ctx.fill();
      if (s > 0.6) {
        ctx.beginPath();
        for (var c = 0; c < 36; c++) {
          var a = (c / 36) * Math.PI * 2;
          var ex = rx * Math.cos(a), ey = ry * Math.sin(a);
          ctx.moveTo(ex, ey);
          ctx.lineTo(ex * 1.08, ey * 1.12);
        }
        ctx.stroke();
      }
      ctx.restore();
    });

    // Bacteria: 2 µm rods.
    if (seen.bacterium) {
      ctx.strokeStyle = "#5b3a7a";
      ctx.lineCap = "round";
      ctx.lineWidth = Math.max(1.5, 0.8 * s);
      layouts.bacteria.forEach(function (b) {
        var x = C + b.x * s, y = C + b.y * s;
        if (x < -10 || x > SIZE + 10 || y < -10 || y > SIZE + 10) return;
        var dx = Math.cos(b.a) * 1 * s, dy = Math.sin(b.a) * 1 * s;
        ctx.beginPath();
        ctx.moveTo(x - dx, y - dy);
        ctx.lineTo(x + dx, y + dy);
        ctx.stroke();
      });
    } else {
      ctx.fillStyle = "rgba(60, 60, 60, 0.22)";
      layouts.bacteria.forEach(function (b, i) {
        if (i % 3) return; // unresolved: a sparse haze of specks, not shapes
        speck(C + b.x * s, C + b.y * s, 0.8);
      });
    }
  }

  function drawBlood(s) {
    ctx.fillStyle = "#f7ece8";
    ctx.fillRect(0, 0, SIZE, SIZE);
    var rad = 3.75 * s;
    layouts.blood.forEach(function (b) {
      var x = C + b.x * s, y = C + b.y * s;
      if (x < -rad || x > SIZE + rad || y < -rad || y > SIZE + rad) return;
      ctx.fillStyle = "#c2453d";
      ctx.beginPath();
      ctx.arc(x, y, rad, 0, Math.PI * 2);
      ctx.fill();
      if (rad > 4) {
        // The central pale area of a biconcave disc.
        ctx.fillStyle = "#e08a80";
        ctx.beginPath();
        ctx.arc(x, y, rad * 0.45, 0, Math.PI * 2);
        ctx.fill();
      }
    });
  }

  function draw(m, seen) {
    var s = (m * PX_PER_MM) / 1000; // pixels per micrometre
    ctx.clearRect(0, 0, SIZE, SIZE);
    ctx.save();
    ctx.beginPath();
    ctx.arc(C, C, R, 0, Math.PI * 2);
    ctx.clip();
    if (state.sample === "cork") drawCork(s);
    else if (state.sample === "pond") drawPond(s, seen);
    else drawBlood(s);
    // Vignette at the edge of the lens.
    var g = ctx.createRadialGradient(C, C, R * 0.7, C, C, R);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(1, "rgba(0,0,0,0.35)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, SIZE, SIZE);
    ctx.restore();
  }

  // ---- Observations ----------------------------------------------------------
  function updateDiscoveries(m, seen) {
    var found = [];
    if (state.sample === "cork" && seen.corkCell) found.push("cork-cells");
    if (state.sample === "pond" && seen.protist) found.push("protists");
    if (state.sample === "pond" && seen.bacterium) found.push("bacteria-visible");
    if (state.sample === "pond" && state.instrument === "compound" && !seen.bacterium) found.push("bacteria-hidden-compound");
    if (state.sample === "blood" && seen.redBloodCell) found.push("blood-cells");
    found.forEach(function (id) {
      if (addOnce(state.discoveries, id)) bridge.emit("observationMade", { observation: id, magnification: Math.round(m) });
    });
  }

  function computeObservables(m, seen) {
    return {
      magnification: Math.round(m * 10) / 10,
      lensDiameter: state.params.lensDiameter,
      instrument: state.instrument,
      sample: state.sample,
      bacteriaVisible: state.sample === "pond" && seen.bacterium ? 1 : 0,
      samplesViewed: state.samplesViewed.slice(),
      instrumentsUsed: state.instrumentsUsed.slice(),
      observations: state.discoveries.slice(),
      observationsCount: state.discoveries.length,
    };
  }

  // ---- Rendering of text -------------------------------------------------------
  function renderText(m, seen) {
    el("lensDiameter-out").textContent = num(state.params.lensDiameter) + " mm";
    el("mag").textContent = fmt(t("mag"), { m: num(m, 0) });
    el("focal").textContent = state.instrument === "compound" ? "—" : fmt(t("focalValue"), { f: num(L.focalLength(state.params.lensDiameter), 2) });

    var lens = el("lensDiameter");
    var lensLocked = state.locked.indexOf("lensDiameter") !== -1;
    lens.disabled = lensLocked || state.instrument === "compound";
    lens.closest(".control").classList.toggle("is-locked", lens.disabled);
    var note = el("lens-note");
    note.hidden = !lens.disabled;
    note.textContent = lensLocked ? t("locked") : t("lensFixed");

    var seenList = [];
    var notSeen = [];
    L.SAMPLES[state.sample].forEach(function (id) {
      if (seen[id]) seenList.push(t(id + "Seen"));
      else notSeen.push(fmt(t("descNotSeen"), { name: NOT_SEEN_NAME[state.locale][id], min: num(Math.ceil(L.minMagnificationToSee(L.SPECIMENS[id].sizeUm)), 0) }));
    });
    var parts = [fmt(t("descMag"), { m: num(m, 0), sample: t(state.sample) })];
    if (seenList.length) parts.push(fmt(t("descSeen"), { list: seenList.join("; ") }));
    parts = parts.concat(notSeen);
    var desc = parts.join(" ");
    if (el("field-desc").textContent !== desc) el("field-desc").textContent = desc;

    var list = el("found-list");
    list.textContent = "";
    var labels = t("discoveries");
    var any = false;
    DISCOVERY_ORDER.forEach(function (id) {
      if (state.discoveries.indexOf(id) === -1) return;
      any = true;
      var li = document.createElement("li");
      li.textContent = labels[id];
      list.appendChild(li);
    });
    if (!any) {
      var none = document.createElement("li");
      none.className = "none";
      none.textContent = t("none");
      list.appendChild(none);
    }
  }

  // Changes are coalesced into one update per frame, so dragging the slider cannot flood the host.
  var pending = false;
  function update() {
    if (pending) return;
    pending = true;
    window.requestAnimationFrame(function () {
      pending = false;
      addOnce(state.samplesViewed, state.sample);
      addOnce(state.instrumentsUsed, state.instrument);
      var m = currentMagnification();
      var seen = visibility(m);
      updateDiscoveries(m, seen);
      draw(m, seen);
      renderText(m, seen);
      bridge.reportObservables(computeObservables(m, seen));
    });
  }

  // ---- Localization -----------------------------------------------------------
  function applyLocale() {
    document.documentElement.lang = state.locale;
    document.documentElement.dir = state.locale === "he" ? "rtl" : "ltr";
    document.title = t("title");
    canvas.setAttribute("aria-label", t("fieldLabel"));
    var nodes = document.querySelectorAll("[data-i18n]");
    for (var i = 0; i < nodes.length; i++) {
      var v = t(nodes[i].getAttribute("data-i18n"));
      if (typeof v === "string") nodes[i].textContent = v;
    }
    update();
  }

  // ---- Controls ------------------------------------------------------------------
  function setParams(params) {
    if (Object.prototype.hasOwnProperty.call(params, "lensDiameter")) {
      var v = Number(params.lensDiameter);
      if (isFinite(v)) {
        var r = L.RANGES.lensDiameter;
        state.params.lensDiameter = Math.round(Math.min(r.max, Math.max(r.min, v)) * 10) / 10;
      }
    }
    el("lensDiameter").value = String(state.params.lensDiameter);
    update();
  }

  el("lensDiameter").addEventListener("input", function (e) {
    if (state.locked.indexOf("lensDiameter") !== -1) return;
    setParams({ lensDiameter: e.target.value });
  });

  function radios(name) { return document.querySelectorAll('input[name="' + name + '"]'); }
  function syncRadios() {
    Array.prototype.forEach.call(radios("instrument"), function (r) { r.checked = r.value === state.instrument; });
    Array.prototype.forEach.call(radios("sample"), function (r) { r.checked = r.value === state.sample; });
  }
  Array.prototype.forEach.call(radios("instrument"), function (r) {
    r.addEventListener("change", function () { if (r.checked) { state.instrument = r.value; update(); } });
  });
  Array.prototype.forEach.call(radios("sample"), function (r) {
    r.addEventListener("change", function () { if (r.checked) { state.sample = r.value; update(); } });
  });

  // ---- Start ----------------------------------------------------------------------
  var bridge = window.SLL.connect({
    simId: SIM_ID,
    version: VERSION,
    capabilityLevel: 3,
    onInit: function (init) {
      state.locale = init.locale;
      state.locked = init.lockedParams.filter(function (id) { return id === "lensDiameter"; });
      state.instrument = "ball";
      state.sample = "cork";
      state.samplesViewed = [];
      state.instrumentsUsed = [];
      state.discoveries = [];
      syncRadios();
      applyLocale();
      setParams(init.params);
    },
    onSetParams: function (params) { setParams(params); },
  });

  if (bridge.standalone) {
    var q = new URLSearchParams(window.location.search);
    if (q.get("lang") === "en") state.locale = "en";
  }

  syncRadios();
  applyLocale();
})();

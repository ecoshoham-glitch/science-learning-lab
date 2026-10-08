/*
 * Genetic code simulator – interface, v1.0.0.
 * Talks to the platform only through the SLL bridge (protocol v1, capability level 3).
 */
(function () {
  "use strict";

  var SIM_ID = "genetic-code";
  var VERSION = "1.0.0";
  var G = window.GeneticModel;

  var STRINGS = {
    he: {
      title: "מהגן אל החלבון",
      sequences: "הגן, ה-mRNA והחלבון",
      reset: "חזרה לגן המקורי",
      instructions: "בחרו בסיס בגדיל המקודד, ושנו אותו בעזרת הכלים. צפו מה קורה ל-mRNA ולחלבון.",
      coding: "DNA מקודד",
      template: "DNA תבנית",
      mrna: "mRNA",
      protein: "חלבון",
      tools: "כלי מוטציה",
      replace: "החלפת הבסיס הנבחר ב:",
      insert: "הוספת בסיס אחרי הנבחר:",
      delete: "מחיקת הבסיס הנבחר",
      noSelection: "לא נבחר בסיס.",
      selected: "נבחר: בסיס {i} ({b}), בקודון {c}.",
      result: "תוצאה",
      found: "סוגי מוטציות שמצאתם:",
      baseLabel: "בסיס {i}: {b}",
      leftover: "בסיסים עודפים",
      types: {
        none: "אין מוטציה",
        silent: "מוטציה שקטה",
        missense: "מוטציה מחליפת משמעות",
        nonsense: "מוטציית עצירה",
        nonstop: "אובדן קודון העצירה",
        frameshift: "מוטציית הזזת מסגרת",
        multiple: "כמה שינויים",
      },
      explain: {
        none: "הגן זהה למקור.",
        silent: "רצף ה-DNA השתנה, אבל החלבון לא. כמה קודונים שונים מקודדים לאותה חומצת אמינו.",
        missense: "חומצת אמינו אחת בחלבון התחלפה באחרת.",
        nonsense: "נוצר קודון עצירה מוקדם, והחלבון התקצר.",
        nonstop: "קודון העצירה השתנה, והתרגום ממשיך מעבר לסוף המקורי.",
        frameshift: "הוספה או מחיקה שינתה את מסגרת הקריאה, ולכן כל הקודונים שאחריה נקראים אחרת.",
        multiple: "יש יותר משינוי אחד. כדי לבדוק כל סוג לחוד, חזרו לגן המקורי.",
      },
      modelTitle: "מה מאחורי הסימולציה",
      modelText:
        "הסימולציה משתמשת בקוד הגנטי התקני. ה-mRNA זהה לגדיל המקודד, עם U במקום T, ומשלים לגדיל התבנית. פישוטים: אין פרומוטור, אינטרונים או שחבור, והתרגום מתחיל בבסיס הראשון (קודון ההתחלה AUG) ונעצר בקודון העצירה הראשון.",
    },
    en: {
      title: "From gene to protein",
      sequences: "Gene, mRNA and protein",
      reset: "Back to the original gene",
      instructions: "Select a base on the coding strand and change it with the tools. Watch what happens to the mRNA and the protein.",
      coding: "Coding DNA",
      template: "Template DNA",
      mrna: "mRNA",
      protein: "Protein",
      tools: "Mutation tools",
      replace: "Replace the selected base with:",
      insert: "Insert a base after the selected one:",
      delete: "Delete the selected base",
      noSelection: "No base selected.",
      selected: "Selected: base {i} ({b}), in codon {c}.",
      result: "Result",
      found: "Mutation types you found:",
      baseLabel: "Base {i}: {b}",
      leftover: "extra bases",
      types: {
        none: "No mutation",
        silent: "Silent mutation",
        missense: "Missense mutation",
        nonsense: "Nonsense mutation",
        nonstop: "Stop codon lost",
        frameshift: "Frameshift mutation",
        multiple: "Several changes",
      },
      explain: {
        none: "The gene is identical to the original.",
        silent: "The DNA changed, but the protein did not. Several codons code for the same amino acid.",
        missense: "One amino acid in the protein was replaced by another.",
        nonsense: "An early stop codon appeared, so the protein is shorter.",
        nonstop: "The stop codon changed, so translation continues past the original end.",
        frameshift: "An insertion or deletion shifted the reading frame, so every codon after it is read differently.",
        multiple: "There is more than one change. To test each type on its own, go back to the original gene.",
      },
      modelTitle: "What is behind the simulation",
      modelText:
        "The simulation uses the standard genetic code. The mRNA matches the coding strand, with U instead of T, and is complementary to the template strand. Simplifications: no promoter, introns or splicing; translation starts at the first base (start codon AUG) and stops at the first stop codon.",
    },
  };

  var state = { locale: "he", gene: G.ORIGINAL_GENE, selected: -1, found: [] };
  var el = function (id) { return document.getElementById(id); };

  function t(key) { return STRINGS[state.locale][key]; }
  function fmt(template, values) {
    return template.replace(/\{(\w+)\}/g, function (_, k) { return String(values[k]); });
  }
  function aaName(code) { return G.AMINO_NAMES[code][state.locale]; }

  function applyLocale() {
    document.documentElement.lang = state.locale;
    document.documentElement.dir = state.locale === "he" ? "rtl" : "ltr";
    document.title = t("title");
    var nodes = document.querySelectorAll("[data-i18n]");
    for (var i = 0; i < nodes.length; i++) {
      var v = t(nodes[i].getAttribute("data-i18n"));
      if (typeof v === "string") nodes[i].textContent = v;
    }
    el("coding").setAttribute("aria-label", t("coding"));
    render();
  }

  // ---- Editing -------------------------------------------------------------
  function edit(newGene, newSelection) {
    // Keep the gene within sensible bounds for the display.
    if (newGene.length < 3 || newGene.length > 40) return;
    state.gene = newGene;
    state.selected = Math.min(newSelection, newGene.length - 1);
    var type = G.classifyMutation(G.ORIGINAL_GENE, state.gene);
    if (type !== "none" && type !== "multiple" && state.found.indexOf(type) === -1) state.found.push(type);
    render();
    report(type);
    bridge.emit("mutationMade", { type: type });
  }

  function buildToolButtons() {
    var groups = document.querySelectorAll(".base-buttons");
    for (var g = 0; g < groups.length; g++) {
      var action = groups[g].getAttribute("data-action");
      G.BASES.forEach(function (b) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.textContent = b;
        btn.className = "b-" + b;
        btn.setAttribute("data-base", b);
        btn.addEventListener("click", (function (act, base) {
          return function () {
            var i = state.selected;
            if (i < 0) return;
            var s = state.gene;
            if (act === "replace") edit(s.slice(0, i) + base + s.slice(i + 1), i);
            else edit(s.slice(0, i + 1) + base + s.slice(i + 1), i + 1);
          };
        })(action, b));
        groups[g].appendChild(btn);
      });
    }
  }

  el("delete").addEventListener("click", function () {
    var i = state.selected;
    if (i < 0) return;
    edit(state.gene.slice(0, i) + state.gene.slice(i + 1), Math.max(0, i - 1));
  });

  el("reset").addEventListener("click", function () {
    state.gene = G.ORIGINAL_GENE;
    state.selected = -1;
    render();
    report("none");
  });

  // ---- Rendering -------------------------------------------------------------
  function renderBases(container, seq, interactive, compareTo) {
    // Same sequence as last time: update selection state in place, so the focused button survives.
    if (container.getAttribute("data-seq") === seq && container.getAttribute("data-locale") === state.locale) {
      if (interactive) {
        var existing = container.querySelectorAll("button.base");
        for (var k = 0; k < existing.length; k++) existing[k].setAttribute("aria-pressed", k === state.selected ? "true" : "false");
      }
      return;
    }
    container.setAttribute("data-seq", seq);
    container.setAttribute("data-locale", state.locale);
    container.textContent = "";
    for (var i = 0; i < seq.length; i++) {
      if (i > 0 && i % 3 === 0) {
        var gap = document.createElement("span");
        gap.className = "codon-gap";
        container.appendChild(gap);
      }
      var b = seq[i];
      var node = document.createElement(interactive ? "button" : "span");
      node.className = "base b-" + b + (compareTo && compareTo[i] !== b ? " changed" : "");
      node.textContent = b;
      if (interactive) {
        node.type = "button";
        node.setAttribute("aria-pressed", i === state.selected ? "true" : "false");
        node.setAttribute("aria-label", fmt(t("baseLabel"), { i: i + 1, b: b }));
        node.addEventListener("click", (function (idx) {
          return function () {
            state.selected = idx;
            render();
          };
        })(i));
      }
      container.appendChild(node);
    }
  }

  function render() {
    var gene = state.gene;
    var mrna = G.transcribe(gene);
    renderBases(el("coding"), gene, true, G.ORIGINAL_GENE);
    renderBases(el("template"), G.templateStrand(gene), false);
    renderBases(el("mrna"), mrna, false);

    var original = G.proteinOf(G.ORIGINAL_GENE).protein;
    var split = G.codons(mrna);
    var proteinEl = el("protein");
    proteinEl.textContent = "";
    var stopped = false;
    split.codons.forEach(function (codon, idx) {
      var aa = G.CODON_TABLE[codon];
      var span = document.createElement("span");
      if (stopped) {
        span.className = "amino leftover";
        span.textContent = "–";
      } else if (aa === "Stop") {
        span.className = "amino stop";
        span.textContent = aaName("Stop");
        stopped = true;
      } else {
        span.className = "amino" + (original[idx] !== aa ? " changed" : "");
        span.textContent = aa;
        span.title = aaName(aa);
      }
      proteinEl.appendChild(span);
    });
    if (split.leftover) {
      var extra = document.createElement("span");
      extra.className = "amino leftover";
      extra.textContent = split.leftover + " (" + t("leftover") + ")";
      proteinEl.appendChild(extra);
    }

    var hasSel = state.selected >= 0;
    el("selection").textContent = hasSel
      ? fmt(t("selected"), { i: state.selected + 1, b: gene[state.selected], c: Math.floor(state.selected / 3) + 1 })
      : t("noSelection");
    var toolButtons = document.querySelectorAll(".base-buttons button, #delete");
    for (var k = 0; k < toolButtons.length; k++) toolButtons[k].disabled = !hasSel;

    var type = G.classifyMutation(G.ORIGINAL_GENE, gene);
    el("mutation").textContent = t("types")[type];
    el("mutation-explain").textContent = t("explain")[type];

    var list = el("found-list");
    list.textContent = "";
    state.found.forEach(function (f) {
      var li = document.createElement("li");
      li.textContent = t("types")[f];
      list.appendChild(li);
    });
  }

  function report(type) {
    var p = G.proteinOf(state.gene);
    bridge.reportObservables({
      currentMutationType: type || G.classifyMutation(G.ORIGINAL_GENE, state.gene),
      mutationTypesFound: state.found.slice(),
      mutationTypesFoundCount: state.found.length,
      proteinLength: p.protein.length,
      geneLength: state.gene.length,
    });
  }

  // ---- Start -------------------------------------------------------------------
  var bridge = window.SLL.connect({
    simId: SIM_ID,
    version: VERSION,
    capabilityLevel: 3,
    onInit: function (init) {
      state.locale = init.locale;
      state.gene = G.ORIGINAL_GENE;
      state.selected = -1;
      state.found = [];
      applyLocale();
      report("none");
    },
    // This simulation has no numeric parameters; setParams is accepted and ignored.
    onSetParams: function () {},
  });

  if (bridge.standalone && new URLSearchParams(window.location.search).get("lang") === "en") state.locale = "en";

  buildToolButtons();
  applyLocale();
  report("none");
})();

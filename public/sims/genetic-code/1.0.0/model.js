/*
 * Genetic code simulator – scientific model, v1.0.0.
 *
 * Uses the standard genetic code. The gene is shown as the DNA coding strand (5'→3');
 * the template strand is its complement (3'→5'), and the mRNA has the same sequence as the
 * coding strand with U instead of T.
 *
 * SIMPLIFICATIONS: no promoter, introns, splicing or UTRs; translation starts at the first
 * base of the shown sequence (which begins with the start codon) and stops at the first stop codon.
 *
 * Pure functions, no DOM.
 */
(function (root) {
  "use strict";

  var BASES = ["A", "C", "G", "T"];

  // Standard genetic code, RNA codons -> three-letter amino acid code ("Stop" for stop codons).
  var CODON_TABLE = Object.freeze({
    UUU: "Phe", UUC: "Phe", UUA: "Leu", UUG: "Leu",
    CUU: "Leu", CUC: "Leu", CUA: "Leu", CUG: "Leu",
    AUU: "Ile", AUC: "Ile", AUA: "Ile", AUG: "Met",
    GUU: "Val", GUC: "Val", GUA: "Val", GUG: "Val",
    UCU: "Ser", UCC: "Ser", UCA: "Ser", UCG: "Ser",
    CCU: "Pro", CCC: "Pro", CCA: "Pro", CCG: "Pro",
    ACU: "Thr", ACC: "Thr", ACA: "Thr", ACG: "Thr",
    GCU: "Ala", GCC: "Ala", GCA: "Ala", GCG: "Ala",
    UAU: "Tyr", UAC: "Tyr", UAA: "Stop", UAG: "Stop",
    CAU: "His", CAC: "His", CAA: "Gln", CAG: "Gln",
    AAU: "Asn", AAC: "Asn", AAA: "Lys", AAG: "Lys",
    GAU: "Asp", GAC: "Asp", GAA: "Glu", GAG: "Glu",
    UGU: "Cys", UGC: "Cys", UGA: "Stop", UGG: "Trp",
    CGU: "Arg", CGC: "Arg", CGA: "Arg", CGG: "Arg",
    AGU: "Ser", AGC: "Ser", AGA: "Arg", AGG: "Arg",
    GGU: "Gly", GGC: "Gly", GGA: "Gly", GGG: "Gly",
  });

  var AMINO_NAMES = Object.freeze({
    Ala: { he: "אלנין", en: "Alanine" }, Arg: { he: "ארגינין", en: "Arginine" },
    Asn: { he: "אספרגין", en: "Asparagine" }, Asp: { he: "חומצה אספרטית", en: "Aspartic acid" },
    Cys: { he: "ציסטאין", en: "Cysteine" }, Gln: { he: "גלוטמין", en: "Glutamine" },
    Glu: { he: "חומצה גלוטמית", en: "Glutamic acid" }, Gly: { he: "גליצין", en: "Glycine" },
    His: { he: "היסטידין", en: "Histidine" }, Ile: { he: "איזולאוצין", en: "Isoleucine" },
    Leu: { he: "לאוצין", en: "Leucine" }, Lys: { he: "ליזין", en: "Lysine" },
    Met: { he: "מתיונין", en: "Methionine" }, Phe: { he: "פנילאלנין", en: "Phenylalanine" },
    Pro: { he: "פרולין", en: "Proline" }, Ser: { he: "סרין", en: "Serine" },
    Thr: { he: "תראונין", en: "Threonine" }, Trp: { he: "טריפטופן", en: "Tryptophan" },
    Tyr: { he: "טירוזין", en: "Tyrosine" }, Val: { he: "ולין", en: "Valine" },
    Stop: { he: "עצירה", en: "Stop" },
  });

  /** Starting gene: Met-Ala-Trp-Lys-Glu-Phe-Arg-Stop. Chosen so every mutation type is one edit away. */
  var ORIGINAL_GENE = "ATGGCCTGGAAAGAGTTTCGCTAA";

  function validateDna(seq) {
    if (typeof seq !== "string" || !/^[ACGT]*$/.test(seq)) throw new TypeError("DNA must contain only A, C, G, T");
    return seq;
  }

  var COMPLEMENT = { A: "T", T: "A", C: "G", G: "C" };

  /** Template strand, written 3'→5' under the coding strand (base-by-base complement). */
  function templateStrand(coding) {
    validateDna(coding);
    return coding.split("").map(function (b) { return COMPLEMENT[b]; }).join("");
  }

  /** mRNA (5'→3'): same as the coding strand, with U instead of T. */
  function transcribe(coding) {
    validateDna(coding);
    return coding.replace(/T/g, "U");
  }

  /** Split mRNA into codons from the first base. A trailing incomplete codon is returned separately. */
  function codons(mrna) {
    var list = [];
    for (var i = 0; i + 3 <= mrna.length; i += 3) list.push(mrna.slice(i, i + 3));
    return { codons: list, leftover: mrna.slice(list.length * 3) };
  }

  /**
   * Translate mRNA from the first base until the first stop codon.
   * Returns amino acids (without the stop) and whether a stop codon was reached.
   */
  function translate(mrna) {
    var split = codons(mrna);
    var protein = [];
    for (var i = 0; i < split.codons.length; i++) {
      var aa = CODON_TABLE[split.codons[i]];
      if (aa === "Stop") return { protein: protein, stopped: true, codonsRead: i + 1 };
      protein.push(aa);
    }
    return { protein: protein, stopped: false, codonsRead: split.codons.length };
  }

  function proteinOf(coding) {
    return translate(transcribe(coding));
  }

  /**
   * Classify a mutated gene against the original.
   * Returns one of: "none", "silent", "missense", "nonsense", "nonstop", "frameshift", "multiple".
   * Insertions/deletions whose length difference is not a multiple of 3 are frameshifts.
   */
  function classifyMutation(original, mutated) {
    validateDna(original);
    validateDna(mutated);
    if (original === mutated) return "none";
    if ((mutated.length - original.length) % 3 !== 0) return "frameshift";
    if (mutated.length !== original.length) return "multiple";

    var a = proteinOf(original).protein;
    var b = proteinOf(mutated).protein;
    if (b.length < a.length) return "nonsense";
    // The stop codon was lost, so translation reads on past the original end.
    if (b.length > a.length) return "nonstop";
    var diffs = 0;
    for (var i = 0; i < Math.max(a.length, b.length); i++) if (a[i] !== b[i]) diffs++;
    if (diffs === 0) return "silent";
    if (diffs === 1 && a.length === b.length) return "missense";
    return "multiple";
  }

  var api = {
    BASES: BASES,
    CODON_TABLE: CODON_TABLE,
    AMINO_NAMES: AMINO_NAMES,
    ORIGINAL_GENE: ORIGINAL_GENE,
    templateStrand: templateStrand,
    transcribe: transcribe,
    codons: codons,
    translate: translate,
    proteinOf: proteinOf,
    classifyMutation: classifyMutation,
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.GeneticModel = api;
})(typeof window !== "undefined" ? window : this);

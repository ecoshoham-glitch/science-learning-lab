import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const G = require("../../public/sims/genetic-code/1.0.0/model.js");

const ORIGINAL = G.ORIGINAL_GENE as string;
const replaceAt = (s: string, i: number, b: string) => s.slice(0, i) + b + s.slice(i + 1);

describe("genetic code – standard table", () => {
  it("has all 64 codons", () => {
    expect(Object.keys(G.CODON_TABLE)).toHaveLength(64);
  });

  it("has exactly three stop codons: UAA, UAG, UGA", () => {
    const stops = Object.entries(G.CODON_TABLE).filter(([, aa]) => aa === "Stop").map(([c]) => c).sort();
    expect(stops).toEqual(["UAA", "UAG", "UGA"]);
  });

  it("matches known codon assignments", () => {
    expect(G.CODON_TABLE.AUG).toBe("Met");
    expect(G.CODON_TABLE.UGG).toBe("Trp");
    expect(G.CODON_TABLE.UUU).toBe("Phe");
    expect(G.CODON_TABLE.GGG).toBe("Gly");
    expect(G.CODON_TABLE.AGA).toBe("Arg");
    expect(G.CODON_TABLE.CAU).toBe("His");
  });

  it("codes for the 20 standard amino acids, with the known codon counts", () => {
    const counts: Record<string, number> = {};
    for (const aa of Object.values(G.CODON_TABLE) as string[]) counts[aa] = (counts[aa] ?? 0) + 1;
    expect(Object.keys(counts).filter((k) => k !== "Stop")).toHaveLength(20);
    expect(counts.Leu).toBe(6);
    expect(counts.Ser).toBe(6);
    expect(counts.Arg).toBe(6);
    expect(counts.Met).toBe(1);
    expect(counts.Trp).toBe(1);
    expect(counts.Ile).toBe(3);
  });

  it("has a Hebrew and English name for every amino acid it uses", () => {
    for (const aa of new Set(Object.values(G.CODON_TABLE) as string[])) {
      expect(G.AMINO_NAMES[aa].he.length).toBeGreaterThan(0);
      expect(G.AMINO_NAMES[aa].en.length).toBeGreaterThan(0);
    }
  });
});

describe("transcription and translation", () => {
  it("template strand is the base-by-base complement", () => {
    expect(G.templateStrand("ATGC")).toBe("TACG");
  });

  it("mRNA equals the coding strand with U for T", () => {
    expect(G.transcribe("ATGTTT")).toBe("AUGUUU");
  });

  it("translates the original gene to Met-Ala-Trp-Lys-Glu-Phe-Arg and stops", () => {
    const r = G.proteinOf(ORIGINAL);
    expect(r.protein).toEqual(["Met", "Ala", "Trp", "Lys", "Glu", "Phe", "Arg"]);
    expect(r.stopped).toBe(true);
  });

  it("rejects invalid bases", () => {
    expect(() => G.transcribe("ATGX")).toThrow(TypeError);
  });
});

describe("mutation classification", () => {
  it("identical gene is no mutation", () => {
    expect(G.classifyMutation(ORIGINAL, ORIGINAL)).toBe("none");
  });

  it("GCC→GCA (Ala→Ala) is silent", () => {
    expect(G.classifyMutation(ORIGINAL, replaceAt(ORIGINAL, 5, "A"))).toBe("silent");
  });

  it("AAA→GAA (Lys→Glu) is missense", () => {
    expect(G.classifyMutation(ORIGINAL, replaceAt(ORIGINAL, 9, "G"))).toBe("missense");
  });

  it("TGG→TGA (Trp→Stop) is nonsense", () => {
    expect(G.classifyMutation(ORIGINAL, replaceAt(ORIGINAL, 8, "A"))).toBe("nonsense");
  });

  it("TAA→TAC (Stop→Tyr) loses the stop codon", () => {
    expect(G.classifyMutation(ORIGINAL, replaceAt(ORIGINAL, 23, "C"))).toBe("nonstop");
  });

  it("a single insertion or deletion is a frameshift", () => {
    expect(G.classifyMutation(ORIGINAL, ORIGINAL.slice(0, 4) + ORIGINAL.slice(5))).toBe("frameshift");
    expect(G.classifyMutation(ORIGINAL, ORIGINAL.slice(0, 4) + "A" + ORIGINAL.slice(4))).toBe("frameshift");
  });

  it("every single substitution in the gene gets a defined class", () => {
    const allowed = new Set(["silent", "missense", "nonsense", "nonstop", "multiple"]);
    for (let i = 0; i < ORIGINAL.length; i++)
      for (const b of ["A", "C", "G", "T"]) {
        if (b === ORIGINAL[i]) continue;
        expect(allowed.has(G.classifyMutation(ORIGINAL, replaceAt(ORIGINAL, i, b)))).toBe(true);
      }
  });
});

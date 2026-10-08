import { z } from "zod";

/**
 * Media library, version 1: images used by lessons, with their source and licence.
 * Images are self-hosted under /public/media, so students' browsers make no requests to third parties.
 * `sourceVerified: false` means the image was checked to show the right person, but the exact copy's
 * source still needs confirming before public publication. See docs/MEDIA.md.
 */
const localizedText = z.object({ he: z.string().min(1), en: z.string().min(1) });

export const mediaSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  kind: z.enum(["portrait", "reconstruction", "illustration"]),
  file: z.string().regex(/^\/media\/[a-z0-9/-]+\.(jpg|png|webp)$/),
  /** The person's name, e.g. "Robert Hooke". */
  name: localizedText,
  /** Life years, e.g. "1635–1703". */
  years: z.string(),
  alt: localizedText,
  /** Shown to students when the image needs explaining (e.g. a modern reconstruction). */
  note: localizedText.optional(),
  credit: localizedText,
  licence: z.enum(["public-domain", "public-domain-mark", "free-art-license"]),
  sourceUrl: z.string().url().optional(),
  sourceVerified: z.boolean(),
});

export type Media = z.infer<typeof mediaSchema>;

# Media (images)

Images used in lessons live in `public/media/` and are described in `src/content/media/*.json`
(schema `src/lib/media/schema.ts`). They are self-hosted: students' browsers make no requests to third parties.

Every image records: kind (`portrait`, `reconstruction`, `illustration`), name and life years, alt text,
an optional note shown to students (required for modern reconstructions), credit, licence, source URL,
and `sourceVerified`. Unverified sources are flagged to the teacher (not to students) and must be
confirmed before public publication.

## Current images (0.7.0)

| Image | What it is | Licence | Source verified |
| --- | --- | --- | --- |
| Hooke | Modern reconstruction by Rita Greer (2004); no portrait from his lifetime survives | Free Art License (credit the artist) | Yes – Wikimedia Commons |
| Leeuwenhoek | Painting by Jan Verkolje, c. 1673, Rijksmuseum SK-A-957 | Public domain | Yes |
| Schleiden | 19th-century engraving, later colouring | Public domain (age); colouring source to confirm | No |
| Schwann | 19th-century photograph | Public domain (age) | No |

| Leeuwenhoek's microscope (photo) | Exact replica, photo by Jeroen Rouwkema | CC BY-SA 3.0 (credit + licence shown; resized copy stays CC BY-SA) | Yes – Wikimedia Commons |
| Leeuwenhoek's microscope | Original schematic SVG drawn for the platform from descriptions of surviving instruments | Original | Yes (lensonleeuwenhoek.net, parts) |

The four portrait files were supplied by the owner (a screenshot) and cropped; they are small (165×225 px).
Higher-resolution copies from the verified sources can replace them without other changes.
The workspace cannot download from Wikimedia, Wellcome or museum sites (network policy).

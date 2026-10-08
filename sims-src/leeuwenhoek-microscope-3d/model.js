/*
 * Leeuwenhoek's single-lens microscope – 3D model data, v1.0.0.
 * A RECONSTRUCTION for teaching. Proportions follow a photograph of an exact replica
 * (Jeroen Rouwkema, Wikimedia Commons, CC BY-SA 3.0); the parts and how they work follow the
 * descriptions of the surviving instruments (lensonleeuwenhoek.net, "Parts"; Folkes 1723).
 * Parts the photograph does not show (the eye side, the lens socket, the back of the mount and the
 * bracket's fixing) are completed from those descriptions.
 *
 * Units: millimetres. Origin: centre of the plates. x to the right and y up as seen from the back
 * (the specimen side); +z points from the plates towards the mount; the eye side is -z.
 * Pure data and functions, no DOM, no three.js – so it can be unit tested.
 */

export const PLATE = { width: 16, height: 48, thickness: 0.8, cornerRadius: 1.6 };

/** Lens: a tiny glass bead between the two plates, over a hole through both. */
export const LENS = { x: 0.8, y: 13.7, radius: 0.55, holeRadius: 0.5 };

export const RIVETS = [
  [-4, 20], [5.8, 20], [-4.3, 4.9], [5.4, 5.4], [-4.5, -21], [4.5, -21],
];

/** The mount (stage) block, behind the plates. */
export const MOUNT = { x0: -6.4, x1: 9.6, y0: -6, y1: -1.7, z0: 0.4, z1: 3.4 };

/** Long positioning screw: vertical, through the bracket foot and the mount. */
export const LONG_SCREW = { x: 4.8, z: 2.3, y0: -41, y1: 1, radius: 0.55 };

/** Specimen pin: from the top of its holder, curving to just behind the lens. */
export const PIN_PATH = [
  [1.9, 9, 1.8],
  [2.1, 11.5, 1.3],
  [1.3, 13.2, 0.6],
  [0.8, 13.7, 0.35],
];

/** Movement ranges for the two adjustments the viewer can try (mm). */
export const RANGES = {
  height: { min: -4, max: 4 }, // long screw: mount up / down
  distance: { min: 0, max: 2 }, // focusing screw: specimen away from the lens
};

/** Real size, for the scale note: the plates are about 5 cm long. */
export const REAL_LENGTH_CM = 5;

/** Where the specimen (the pin tip) is for a given mount height and distance offset. */
export function pinTip(height, distance) {
  if (typeof height !== "number" || !isFinite(height) || typeof distance !== "number" || !isFinite(distance)) {
    throw new TypeError("height and distance must be finite numbers");
  }
  const tip = PIN_PATH[PIN_PATH.length - 1];
  return { x: tip[0], y: tip[1] + clamp(height, RANGES.height), z: tip[2] + clamp(distance, RANGES.distance) };
}

/** The specimen is in front of the lens and close enough to be seen sharply. */
export function specimenAligned(height, distance) {
  const p = pinTip(height, distance);
  const dx = p.x - LENS.x;
  const dy = p.y - LENS.y;
  return Math.hypot(dx, dy) <= LENS.radius && p.z <= 0.8;
}

export function clamp(v, r) {
  return Math.min(r.max, Math.max(r.min, v));
}

/** The parts a student can explore, with the view that shows each one best. */
export const PARTS = [
  {
    id: "plates",
    view: "back",
    he: "לוחות המתכת",
    en: "The metal plates",
    textHe: "שני לוחות דקים של פליז (ולפעמים כסף), באורך של כ-5 ס\"מ, מחוברים זה לזה. העדשה יושבת ביניהם.",
    textEn: "Two thin plates of brass (sometimes silver), about 5 cm long, joined together. The lens sits between them.",
  },
  {
    id: "lens",
    view: "front",
    he: "העדשה",
    en: "The lens",
    textHe: "כדור זכוכית זעיר, בקוטר של כמילימטר, מעל חור קטן שעובר דרך שני הלוחות. מצמידים את העין לצד הקדמי ומסתכלים דרכה אל האור.",
    textEn: "A tiny glass bead, about a millimetre across, over a small hole through both plates. You put your eye to the front and look through it towards the light.",
  },
  {
    id: "rivets",
    view: "front",
    he: "המסמרות",
    en: "The rivets",
    textHe: "מסמרות זעירות מחברות את שני הלוחות. תמיד יש שתיים בפינות הקרובות לעדשה.",
    textEn: "Tiny rivets join the two plates. There are always two in the corners near the lens.",
  },
  {
    id: "pin",
    view: "side",
    he: "סיכת הדגימה",
    en: "The specimen pin",
    textHe: "על קצה הסיכה מניחים את הדגימה – טיפת מים, חתיכת שעם או חרק – מול העדשה, מאחורי הלוח.",
    textEn: "The specimen – a drop of water, a piece of cork or an insect – sits on the pin's tip, in front of the lens, behind the plate.",
  },
  {
    id: "knob",
    view: "back",
    he: "ידית הסיבוב",
    en: "The turning handle",
    textHe: "ידית קטנה על הסיכה: מסובבים אותה כדי לראות את הדגימה מכיוונים שונים.",
    textEn: "A small handle on the pin: turn it to see the specimen from different sides.",
  },
  {
    id: "mount",
    view: "side",
    he: "הבמה",
    en: "The mount",
    textHe: "גוש מתכת שמחזיק את הסיכה. הוא לא מחובר ישירות ללוחות, ולכן אפשר להזיז אותו.",
    textEn: "A metal block that holds the pin. It is not attached directly to the plates, so it can move.",
  },
  {
    id: "focusScrew",
    view: "back",
    he: "בורג המיקוד",
    en: "The focusing screw",
    textHe: "בורג עם ידית בצורת כנף: מקרב ומרחיק את הדגימה מהעדשה עד שהתמונה חדה.",
    textEn: "A screw with a wing-shaped handle: it brings the specimen nearer to or farther from the lens until the image is sharp.",
  },
  {
    id: "longScrew",
    view: "back",
    he: "בורג המיקום",
    en: "The positioning screw",
    textHe: "בורג ארוך שמעלה ומוריד את הבמה, כדי להביא את הדגימה בדיוק מול העדשה.",
    textEn: "A long screw that raises and lowers the mount, to bring the specimen exactly in front of the lens.",
  },
  {
    id: "bracket",
    view: "side",
    he: "התושבת",
    en: "The bracket",
    textHe: "תושבת בצורת L שמחזיקה את הבורג הארוך ואת הבמה. בורג עם אום נועל אותה במקומה.",
    textEn: "An L-shaped bracket that holds the long screw and the mount. A screw with a nut locks it in place.",
  },
];

export const VIEWS = ["back", "front", "side"];

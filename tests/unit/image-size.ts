import { readFileSync } from "node:fs";

/** Reads the pixel size of a JPEG, PNG or SVG (width/height attributes) without dependencies. */
export function imageSize(file: string): { width: number; height: number } {
  const buf = readFileSync(file);
  if (buf.toString("latin1", 1, 4) === "PNG") return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let i = 2;
    while (i < buf.length) {
      const marker = buf[i + 1];
      const len = buf.readUInt16BE(i + 2);
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
      }
      i += 2 + len;
    }
  }
  const svg = buf.toString("utf8");
  const w = /<svg[^>]*\swidth="(\d+)"/.exec(svg);
  const h = /<svg[^>]*\sheight="(\d+)"/.exec(svg);
  if (w && h) return { width: Number(w[1]), height: Number(h[1]) };
  throw new Error(`unknown image size: ${file}`);
}

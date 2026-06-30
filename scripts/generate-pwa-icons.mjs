import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { deflateSync } from "node:zlib";

const outDir = join(process.cwd(), "public", "icons");
mkdirSync(outDir, { recursive: true });

const crcTable = new Uint32Array(256).map((_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  return value >>> 0;
});

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type, "ascii");
  const length = Buffer.alloc(4);
  const crc = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function png(size) {
  const margin = Math.round(size * 0.13);
  const center = size / 2;
  const radius = size * 0.36;
  const inner = size * 0.21;
  const rows = [];

  for (let y = 0; y < size; y += 1) {
    const row = Buffer.alloc(1 + size * 4);
    row[0] = 0;
    for (let x = 0; x < size; x += 1) {
      const offset = 1 + x * 4;
      const dx = x - center;
      const dy = y - center;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const inRing = distance < radius && distance > inner;
      const inCut = x > center - size * 0.05 && x < center + size * 0.27 && y > center - size * 0.32 && y < center - size * 0.02;
      const inDot = Math.sqrt((x - center + size * 0.16) ** 2 + (y - center + size * 0.2) ** 2) < size * 0.06;
      const border = x < margin || y < margin || x >= size - margin || y >= size - margin;
      const shade = Math.round(18 + (x / size) * 20 + (y / size) * 12);

      if (inRing || inCut || inDot) {
        row[offset] = inCut ? 255 : 0;
        row[offset + 1] = inCut ? 189 : 168;
        row[offset + 2] = inCut ? 0 : 138;
        row[offset + 3] = 255;
      } else {
        row[offset] = border ? 7 : shade;
        row[offset + 1] = border ? 17 : shade + 6;
        row[offset + 2] = border ? 31 : shade + 14;
        row[offset + 3] = 255;
      }
    }
    rows.push(row);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(Buffer.concat(rows), { level: 9 })),
    chunk("IEND", Buffer.alloc(0))
  ]);
}

for (const size of [180, 192, 512]) {
  writeFileSync(join(outDir, `icon-${size}.png`), png(size));
}

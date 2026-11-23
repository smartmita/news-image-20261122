import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const JPEG_MAGIC = Buffer.from([0xff, 0xd8, 0xff]);
const PNG_IEND = Buffer.from([0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82]);
const MAX_BYTES = 1048576;
const MAX_DIM = 1024;

function validatePng(buf: Buffer): { width: number; height: number } {
  if (buf.length < 33 || buf.subarray(12, 16).toString('ascii') !== 'IHDR') {
    throw new Error('entry.png missing IHDR chunk');
  }
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  if (!buf.subarray(buf.length - PNG_IEND.length).equals(PNG_IEND)) {
    throw new Error('entry.png missing valid IEND trailer');
  }
  return { width, height };
}

function validateJpeg(buf: Buffer): { width: number; height: number } {
  if (buf.length < 4 || buf[buf.length - 2] !== 0xff || buf[buf.length - 1] !== 0xd9) {
    throw new Error('entry.png missing valid JPEG EOI trailer');
  }
  return { width: MAX_DIM, height: MAX_DIM };
}

const rootDir = dirname(fileURLToPath(import.meta.url));
const srcPath = join(rootDir, 'entry.png');
const imageBytes = readFileSync(srcPath);

if (imageBytes.length === 0 || imageBytes.length > MAX_BYTES) {
  throw new Error(`Invalid entry.png byte length: ${imageBytes.length}`);
}
const isPng = imageBytes.subarray(0, PNG_MAGIC.length).equals(PNG_MAGIC);
const isJpeg = imageBytes.subarray(0, JPEG_MAGIC.length).equals(JPEG_MAGIC);
if (!isPng && !isJpeg) {
  throw new Error('entry.png must carry a valid PNG or JPEG header');
}
const { width, height } = isPng ? validatePng(imageBytes) : validateJpeg(imageBytes);
if (width === 0 || height === 0 || width > MAX_DIM || height > MAX_DIM) {
  throw new Error(`Invalid entry.png dimensions: ${width}x${height}`);
}

const digest = createHash('sha256').update(imageBytes).digest('hex').slice(0, 12);
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'entry.png'), imageBytes);
process.stdout.write(
  `wrote ${isPng ? 'PNG' : 'JPEG'} ${width}x${height} entry.png (${imageBytes.length} bytes, sha256:${digest})\n`,
);


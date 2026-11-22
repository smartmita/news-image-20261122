import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const MAX_BYTES = 1048576;
const MAX_DIM = 1024;

const rootDir = dirname(fileURLToPath(import.meta.url));
const srcPath = join(rootDir, 'entry.png');
const imageBytes = readFileSync(srcPath);

if (imageBytes.length === 0 || imageBytes.length > MAX_BYTES) {
  throw new Error(`Invalid entry.png byte length: ${imageBytes.length}`);
}
if (!imageBytes.subarray(0, PNG_MAGIC.length).equals(PNG_MAGIC)) {
  throw new Error('entry.png does not carry a valid PNG header');
}
if (imageBytes.subarray(12, 16).toString('ascii') !== 'IHDR') {
  throw new Error('entry.png missing IHDR chunk');
}
const width = imageBytes.readUInt32BE(16);
const height = imageBytes.readUInt32BE(20);
if (width === 0 || height === 0 || width > MAX_DIM || height > MAX_DIM) {
  throw new Error(`Invalid entry.png dimensions: ${width}x${height}`);
}

const PNG_IEND = Buffer.from([0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82]);
if (imageBytes.length < 33 || !imageBytes.subarray(imageBytes.length - PNG_IEND.length).equals(PNG_IEND)) {
  throw new Error('entry.png missing valid IEND trailer');
}

const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'entry.png'), imageBytes);
process.stdout.write(`wrote ${width}x${height} entry.png (${imageBytes.length} bytes)\n`);


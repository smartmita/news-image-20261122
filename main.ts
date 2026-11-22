import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const MAX_BYTES = 1048576;

const rootDir = dirname(fileURLToPath(import.meta.url));
const srcPath = join(rootDir, 'entry.png');
const imageBytes = readFileSync(srcPath);

if (imageBytes.length === 0 || imageBytes.length > MAX_BYTES) {
  throw new Error(`Invalid entry.png byte length: ${imageBytes.length}`);
}
if (!imageBytes.subarray(0, PNG_MAGIC.length).equals(PNG_MAGIC)) {
  throw new Error('entry.png does not carry a valid PNG header');
}

const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'entry.png'), imageBytes);


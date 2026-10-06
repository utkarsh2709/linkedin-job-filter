// Renders scripts/icon.svg to public/icons/{16,32,48,128}.png. Needs `sharp` (npm i --no-save sharp).
import sharp from 'sharp';
import { readFile } from 'node:fs/promises';

const svg = await readFile(new URL('./icon.svg', import.meta.url));
for (const size of [16, 32, 48, 128]) {
  await sharp(svg, { density: (72 * size) / 128 * 4 }).resize(size, size).png().toFile(new URL(`../public/icons/${size}.png`, import.meta.url).pathname);
}

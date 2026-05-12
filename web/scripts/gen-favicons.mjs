// Generate favicon PNG set + ICO from public/favicon.svg using sharp + png-to-ico.
import sharp from 'sharp';
import pngToIco from 'png-to-ico';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const pub = resolve(here, '..', 'public');
const svg = await readFile(resolve(pub, 'favicon.svg'));

const sizes = [
  { name: 'favicon-16.png', size: 16 },
  { name: 'favicon-32.png', size: 32 },
  { name: 'favicon-48.png', size: 48 },
  { name: 'apple-touch-icon.png', size: 180 },
];

for (const { name, size } of sizes) {
  await sharp(svg, { density: 384 })
    .resize(size, size)
    .png()
    .toFile(resolve(pub, name));
  console.log('wrote', name);
}

const icoBuf = await pngToIco([
  resolve(pub, 'favicon-16.png'),
  resolve(pub, 'favicon-32.png'),
  resolve(pub, 'favicon-48.png'),
]);
await writeFile(resolve(pub, 'favicon.ico'), icoBuf);
console.log('wrote favicon.ico');

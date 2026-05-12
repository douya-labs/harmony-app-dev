// Generate OG share image (1200x630, dark bg + B3 logo + brand text).
import sharp from 'sharp';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const pub = resolve(here, '..', 'public');

const W = 1200, H = 630;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0066FF"/>
      <stop offset="100%" stop-color="#00CC99"/>
    </linearGradient>
    <radialGradient id="bgG" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#142033"/>
      <stop offset="100%" stop-color="#0a0f1a"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bgG)"/>
  <!-- B3 icon, scaled up & centered-left -->
  <g transform="translate(140, 195) scale(4)">
    <path d="M32 6 L54 19 L54 45 L32 58 L10 45 L10 19 Z" stroke="url(#g)" stroke-width="3.5" fill="none" stroke-linejoin="round"/>
    <path d="M32 22 L42 28 L42 38 L32 44 L22 38 L22 28 Z" fill="url(#g)"/>
  </g>
  <!-- Wordmark -->
  <text x="500" y="320" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, sans-serif" font-weight="800" font-size="120" fill="url(#g)" letter-spacing="-2">ohos<tspan font-weight="400" opacity="0.7">dev</tspan></text>
  <!-- Tagline -->
  <text x="500" y="380" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, sans-serif" font-weight="500" font-size="32" fill="#9ab0c8" letter-spacing="-0.5">Community-driven HarmonyOS developer hub</text>
  <text x="500" y="425" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, sans-serif" font-weight="400" font-size="24" fill="#6b8094">Tutorials · Reference · AgentSkill</text>
</svg>`;

await sharp(Buffer.from(svg))
  .png()
  .toFile(resolve(pub, 'og-image.png'));
console.log('wrote og-image.png');

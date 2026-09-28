// Копирует woff2 (subset cyrillic + latin) из @fontsource-variable в /public/fonts.
// Никаких запросов к Google CDN: файлы лежат локально и отдаются со своего домена.
import { copyFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const out = 'public/fonts';
mkdirSync(out, { recursive: true });

const map = [
  ['unbounded', 'unbounded'],
  ['onest', 'onest'],
  ['jetbrains-mono', 'jetbrains-mono'],
];
for (const [pkg, name] of map) {
  for (const subset of ['cyrillic', 'latin']) {
    const src = join('node_modules/@fontsource-variable', pkg, 'files', `${name}-${subset}-wght-normal.woff2`);
    const dst = join(out, `${name}-${subset}.woff2`);
    copyFileSync(src, dst);
    console.log('→', dst);
  }
}

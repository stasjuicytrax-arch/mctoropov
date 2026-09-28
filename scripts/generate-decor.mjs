// Генерирует: зерно 128×128 (tileable) и 4 варианта рваного края (SVG-маски).
// Сид фиксированный: результат детерминирован, края не «прыгают» между сборками.
import sharp from 'sharp';
import { writeFileSync, mkdirSync } from 'node:fs';

mkdirSync('public/decor', { recursive: true });

function rng(seed) { return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646; }

// --- Зерно: RGBA. Светлые и тёмные «зёрна» с альфой по модулю шума.
// Средний тон нейтрален: чёрный не поднимается в серый, лайм не тускнеет, а зерно видно на обоих.
{
  const S = 128, r = rng(7), px = Buffer.alloc(S * S * 4);
  for (let i = 0; i < S * S; i++) {
    const g = (r() + r() + r() + r() - 2) / 2;          // ~N(0, .29), −1…1
    const v = g > 0 ? 255 : 0;
    const a = Math.min(255, Math.round(Math.abs(g) * 255 * 3.2));
    px[i * 4] = px[i * 4 + 1] = px[i * 4 + 2] = v;
    px[i * 4 + 3] = a;
  }
  await sharp(px, { raw: { width: S, height: S, channels: 4 } }).png().toFile('public/decor/grain.png');
}

// --- Рваные края: ширина 1440, высота 64 (viewBox).
// Кромка = случайное блуждание с возвратом к середине (крупная «рвань» бумаги)
// + мелкая зубчатость волокон + редкие глубокие надрывы. Заливка — ниже кромки.
function tear(seed, { drift = 1, fiber = 1, notches = .04 } = {}) {
  const r = rng(seed), W = 1440, H = 64, mid = H * .52;
  let x = 0, y = mid, v = 0;
  const pts = [];
  while (x <= W) {
    v += (r() - .5) * 3.2 * drift - (y - mid) * .045;   // инерция + возврат к середине
    v *= .82;
    y = Math.max(H * .14, Math.min(H * .9, y + v));
    let yy = y + (r() - .5) * 5 * fiber;                 // волокна
    if (r() < notches) yy = Math.max(2, y - H * (.2 + r() * .25));   // надрыв вверх
    pts.push([x, yy]);
    x += 2 + r() * 7;
  }
  pts.push([W, mid]);
  const d = 'M0 ' + H + ' L' + pts.map(([a, b]) => a.toFixed(1) + ' ' + b.toFixed(1)).join(' L') + ' L' + W + ' ' + H + ' Z';
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none"><path d="' + d + '"/></svg>';
}
[[11, { drift: 1.1 }], [23, { drift: .8, fiber: 1.3 }], [37, { drift: 1.3, notches: .06 }], [51, { drift: .9, fiber: .8 }]]
  .forEach(([s, o], i) => fs_write('public/decor/tear-' + (i + 1) + '.svg', tear(s, o)));
function fs_write(p, s) { writeFileSync(p, s); }
// --- Штрихкод (§8.9): детерминированные полосы, цвет задаётся маской в CSS
{
  const r = rng(99), H = 40;
  let x = 0, rects = '';
  while (x < 176) {
    const w = [1, 1, 2, 3][Math.floor(r() * 4)];
    if (r() > .35) rects += '<rect x="' + x + '" y="0" width="' + w + '" height="' + H + '"/>';
    x += w + 1 + Math.floor(r() * 2);
  }
  writeFileSync('public/decor/barcode.svg', '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + x + ' ' + H + '" preserveAspectRatio="none">' + rects + '</svg>');
}
console.log('grain + 4 tears + barcode');

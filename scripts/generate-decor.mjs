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
// Так рвут бумагу руками: широкие пологие выступы разной длины, вершины скруглены.
// Кромка = случайное блуждание с возвратом к середине, узлы редкие (шаг 16–52 px),
// между узлами — кубические кривые (Catmull-Rom), поэтому иголок и зигзага нет.
// Правка 28.09: амплитуда уменьшена втрое (было ±20 px и мелкая зубчатость волокон
// поверх неё — читалось как кардиограмма), острые надрывы убраны.
function tear(seed, { drift = 1, step = 1, depth = 1 } = {}) {
  const r = rng(seed), W = 1440, H = 64, mid = H * .52;
  const amp = H * .25 * depth;            // половина размаха кромки: ~16 px из 64 (было ~24 + иглы)

  // значение-шум: случайные узлы через λ, между ними — плавная интерполяция.
  // Две октавы: длинные волны задают крупные выступы, короткая — их неровность.
  const octave = (lambda) => {
    const n = Math.ceil(W / lambda) + 3, v = Array.from({ length: n }, () => r() * 2 - 1);
    return (x) => {
      const t = x / lambda, i = Math.floor(t), f = t - i;
      const s = f * f * (3 - 2 * f);                    // smoothstep — вершины скруглены
      return v[i] * (1 - s) + v[i + 1] * s;
    };
  };
  const big = octave(150 * step), small = octave(52 * step);

  const pts = [];
  for (let x = 0; x <= W; x += 12) {
    const y = mid + amp * (.66 * big(x) + .34 * small(x)) * drift;
    pts.push([x, Math.max(H * .18, Math.min(H * .86, y))]);
  }
  pts.push([W, mid]);

  // Catmull-Rom → кубические безье: вершины скруглены, стыки без изломов
  const at = (i) => pts[Math.max(0, Math.min(pts.length - 1, i))];
  let d = `M0 ${H} L${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = at(i - 1), [x1, y1] = at(i), [x2, y2] = at(i + 1), [x3, y3] = at(i + 2);
    const c1x = x1 + (x2 - x0) / 6, c1y = y1 + (y2 - y0) / 6;
    const c2x = x2 - (x3 - x1) / 6, c2y = y2 - (y3 - y1) / 6;
    d += ` C${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${x2.toFixed(1)} ${y2.toFixed(1)}`;
  }
  d += ` L${W} ${H} Z`;
  return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none"><path d="' + d + '"/></svg>';
}
// четыре варианта: разная длина выступов и глубина, чтобы стыки не повторялись
[[11, { drift: 1 }], [23, { step: 1.3, depth: .9 }], [37, { drift: 1.1, step: .75 }], [51, { step: 1.15, depth: 1.1 }]]
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

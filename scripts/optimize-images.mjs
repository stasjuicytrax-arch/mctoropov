// Готовит фото: AVIF + WebP + JPG, ширины 480/960/1440 (оригиналы Tilda — максимум 1680 px).
// Запуск: npm run images
import sharp from 'sharp';
import { mkdirSync, existsSync } from 'node:fs';

const OUT = 'public/img';
mkdirSync(OUT, { recursive: true });

// slug → [исходник, опции]
const photos = {
  // hero: оригинал 1920×1080 (16:9) целиком — без обрезки; мобайл — кадр 4:3 по центру дивана
  'hero-portrait':    ['assets/photo/hero-portrait.jpg', { widths: [480, 960, 1440, 1920] }],
  'hero-portrait-m':  ['assets/photo/hero-portrait.jpg', { crop: { ar: 4 / 3, x: .5 } }],
  'about-portrait':   ['assets/photo/0516.jpg',       { crop: { ar: 4 / 5, x: 0.5 } }],
  'dir-wedding':      ['assets/photo/IMG_9248.JPG',   {}],
  'dir-city':         ['assets/photo/DSC08484.jpg',   {}],
  'dir-corporate':    ['assets/photo/1H4B5362.jpg',   {}],
  'dir-private':      ['assets/photo/IMG_7474_1.jpg', {}],
  'dir-graduation':   ['assets/photo/6aprWn2ONgI.jpg',{}],
  'stats-hall':       ['assets/photo/0L8A1431.jpg',   { crop: { ar: 4 / 5, x: .3 } }],
  'artist-arena':     ['assets/photo/1H4B6105.jpg',   {}],
  'artist-stage':     ['assets/photo/-f2ARszOtLc.jpg',{ crop: { ar: 4 / 5, x: .45 } }],
};
const widths = [480, 960, 1440];
const fit = (list, max) => { const out = list.filter(w => w <= max); if (!out.includes(max) && max < list[list.length - 1]) out.push(max); return out; };

for (const [slug, [src, opt]] of Object.entries(photos)) {
  let base = sharp(src).rotate();
  const meta = await base.metadata();
  if (opt.crop) {
    const h = meta.height;
    const w = Math.round(h * opt.crop.ar);
    const left = Math.round((meta.width - w) * opt.crop.x);
    base = base.extract({ left, top: 0, width: w, height: h });
  }
  const buf = await base.toBuffer();
  const m2 = await sharp(buf).metadata();
  for (const w of fit(opt.widths ?? widths, m2.width)) {
    const r = sharp(buf).resize({ width: w });
    await r.clone().avif({ quality: 52 }).toFile(`${OUT}/${slug}-${w}.avif`);
    await r.clone().webp({ quality: 74 }).toFile(`${OUT}/${slug}-${w}.webp`);
    await r.clone().jpeg({ quality: 78, mozjpeg: true }).toFile(`${OUT}/${slug}-${w}.jpg`);
  }
  console.log(slug, m2.width, 'x', m2.height);
}

// Декор: скотч (ч/б + альфа) и клякса-маска
await sharp('assets/decor/Tear_Tape_Shape_11.png').resize({ width: 480 }).webp({ quality: 80 }).toFile('public/decor/tape.webp');
console.log('decor ok');

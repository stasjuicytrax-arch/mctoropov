// Готовит обложки кейсов для страниц направлений (ТЗ §6, карточка типа C).
// Источник — content/case-photos.json: соответствие «кейс → фото» снято со старых
// страниц Tilda (там фото и текст кейса лежат в одной секции Zero-блока).
// Что делает: докачивает недостающие оригиналы в assets/cases/ и готовит
//   · обложки карточек: public/img/cases/<slug>-<ширина>.<формат>, кадр 4:3;
//   · галерею кейса для лайтбокса: public/img/cases/<slug>-g<NN>.webp, кадр целиком.
// Запуск: npm run case-photos
import sharp from 'sharp';
import { mkdirSync, existsSync, writeFileSync, readFileSync } from 'node:fs';

const SRC = 'assets/cases';
const OUT = 'public/img/cases';
const WIDTHS = [480, 960];
const AR = 4 / 3;
const GALLERY_W = 1100;   // лайтбокс: на 1440×900 кадр показывается примерно 1000 px по ширине

mkdirSync(SRC, { recursive: true });
mkdirSync(OUT, { recursive: true });

const map = JSON.parse(readFileSync('content/case-photos.json', 'utf8'));
const jobs = [];
for (const [dir, list] of Object.entries(map)) {
  if (dir === '_') continue;
  list.forEach((c, i) => jobs.push({ slug: `${dir}-${String(i + 1).padStart(2, '0')}`, url: c.cover, event: c.event }));
}

let downloaded = 0, skipped = 0;
for (const job of jobs) {
  const file = `${SRC}/${job.slug}.jpg`;
  if (!existsSync(file)) {
    const res = await fetch(job.url, { headers: { 'user-agent': 'Mozilla/5.0' } });
    if (!res.ok) { console.error('не скачалось', job.slug, res.status, job.url); continue; }
    writeFileSync(file, Buffer.from(await res.arrayBuffer()));
    downloaded++;
  }

  if (existsSync(`${OUT}/${job.slug}-960.avif`)) { skipped++; continue; }

  const base = sharp(file).rotate();
  const meta = await base.metadata();
  // кадр 4:3 по центру: у Tilda и вертикали, и горизонтали, карточка одна для всех
  const [w, h] = meta.width / meta.height > AR
    ? [Math.round(meta.height * AR), meta.height]
    : [meta.width, Math.round(meta.width / AR)];
  const buf = await base
    .extract({ left: Math.round((meta.width - w) / 2), top: Math.round((meta.height - h) * .35), width: w, height: h })
    .toBuffer();

  for (const width of WIDTHS.filter((x) => x <= w).concat(WIDTHS.some((x) => x <= w) ? [] : [w])) {
    const r = sharp(buf).resize({ width });
    await r.clone().avif({ quality: 50 }).toFile(`${OUT}/${job.slug}-${width}.avif`);
    await r.clone().webp({ quality: 72 }).toFile(`${OUT}/${job.slug}-${width}.webp`);
    await r.clone().jpeg({ quality: 76, mozjpeg: true }).toFile(`${OUT}/${job.slug}-${width}.jpg`);
  }
  console.log(job.slug, `${w}×${h}`, job.event.slice(0, 40));
}

// ---------- Галерея кейса: все фото коллажа со старого сайта ----------
// Только webp: лайтбокс грузит кадры по требованию, и 687 фото в двух форматах
// весили бы вдвое больше репозитория. webp понимают 97 % браузеров, а без JS
// лайтбокс и не открывается.
let shots = 0, shotsReady = 0;
for (const [dir, list] of Object.entries(map)) {
  if (dir === '_') continue;
  for (const [i, c] of list.entries()) {
    const slug = `${dir}-${String(i + 1).padStart(2, '0')}`;
    for (const [j, url] of c.photos.entries()) {
      const n = String(j + 1).padStart(2, '0');
      const out = `${OUT}/${slug}-g${n}.webp`;
      shots++;
      if (existsSync(out)) { shotsReady++; continue; }
      // первый кадр коллажа — та же картинка, что обложка: второй раз не качаем
      const src = j === 0 ? `${SRC}/${slug}.jpg` : `${SRC}/${slug}-g${n}.jpg`;
      if (!existsSync(src)) {
        const res = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0' } });
        if (!res.ok) { console.error('не скачалось', slug, n, res.status); continue; }
        writeFileSync(src, Buffer.from(await res.arrayBuffer()));
        downloaded++;
      }
      await sharp(src).rotate().resize({ width: GALLERY_W, withoutEnlargement: true }).webp({ quality: 68 }).toFile(out);
    }
  }
}
console.log(`кадров в галереях: ${shots}, уже было готово: ${shotsReady}`);
console.log(`обложек: ${jobs.length}, скачано: ${downloaded}, уже было готово: ${skipped}`);

// Готовит обложки кейсов для страниц направлений (ТЗ §6, карточка типа C).
// Источник — content/case-photos.json: соответствие «кейс → фото» снято со старых
// страниц Tilda (там фото и текст кейса лежат в одной секции Zero-блока).
// Что делает: докачивает недостающие оригиналы в assets/cases/ и режет их
// в public/img/cases/<slug>-<ширина>.<формат> кадром 4:3.
// Запуск: npm run case-photos
import sharp from 'sharp';
import { mkdirSync, existsSync, writeFileSync, readFileSync } from 'node:fs';

const SRC = 'assets/cases';
const OUT = 'public/img/cases';
const WIDTHS = [480, 960];
const AR = 4 / 3;

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
console.log(`обложек: ${jobs.length}, скачано: ${downloaded}, уже было готово: ${skipped}`);

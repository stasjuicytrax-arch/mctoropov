// Разбор старой страницы Tilda: какие фото лежат в одной секции с каким текстом.
import { readFileSync } from 'node:fs';
const html = readFileSync(process.argv[2], 'utf8');
const cut = Number(process.argv[3] ?? 260);
const parts = html.split(/<div id="(rec\d+)"/);
console.log('секций:', (parts.length - 1) / 2);
for (let i = 1; i < parts.length; i += 2) {
  const id = parts[i];
  const body = parts[i + 1];
  const imgs = [...body.matchAll(/data-original="([^"]+)"/g)].map((m) => m[1].split('/').pop());
  const text = body
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<style[\s\S]*?<\/style>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  console.log(`\n=== ${id} | фото: ${imgs.length ? imgs.join(', ') : '—'}`);
  if (text) console.log('   ', text.slice(0, cut));
}

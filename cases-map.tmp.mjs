// Достаёт из старой страницы Tilda пары «кейс → его фотографии»:
// внутри секции с кейсами идут подряд текстовый блок («Мероприятие: …») и галерея.
import { readFileSync } from 'node:fs';

const html = readFileSync(process.argv[2], 'utf8');
// document-order: либо картинка, либо текст блока
const tokens = [...html.matchAll(/data-original="([^"]+)"|Мероприятие:\s*([^<]{0,160})/g)];

let cur = null;
const out = [];
for (const m of tokens) {
  if (m[2] !== undefined) {
    const name = m[2].replace(/&[a-z]+;/g, ' ').replace(/\s+/g, ' ').trim();
    cur = { name, imgs: [] };
    out.push(cur);
  } else if (cur) {
    cur.imgs.push(m[1].split('/').pop());
  }
}
console.log(`кейсов с текстом: ${out.length}`);
for (const c of out) console.log(`\n· ${c.name}\n   ${c.imgs.length} фото: ${c.imgs.slice(0, 12).join(', ')}${c.imgs.length > 12 ? ' …' : ''}`);

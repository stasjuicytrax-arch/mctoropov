// Генерирует разметку FAQ и отзывов из content/*.md — тексты не переписываются руками.
// Запуск: node scripts/build-content.mjs  →  src/sections/_faq-items.html, _reviews-items.html, _jsonld.html
import { readFileSync, writeFileSync } from 'node:fs';

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// неразрывный пробел после коротких предлогов и союзов (типографика)
const nbsp = (s) => s.replace(/(^|[\s«(])([а-яёА-ЯЁ]{1,2})\s/g, '$1$2&nbsp;');
// эмодзи в интерфейсе запрещены (ДС §14) — вычищаем из отзывов
const noEmoji = (s) => s.replace(/[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu, '').replace(/\s{2,}/g, ' ').replace(/\s+([!.,)])/g, '$1').trim();

// ---------- FAQ ----------
const faqMd = readFileSync('content/02-faq.md', 'utf8');
const faq = [...faqMd.matchAll(/^### (\d+)\. (.+)\n([\s\S]+?)(?=\n### |\s*$)/gm)].map(([, n, q, a]) => ({ n: +n, q: q.trim(), a: a.trim() }));
if (faq.length !== 17) throw new Error('FAQ: ожидалось 17, найдено ' + faq.length);

writeFileSync('src/sections/_faq-items.html', faq.map(({ n, q, a }) => {
  const id = `faq-${n}`;
  return `<li class="faq__item" data-faq-item>
  <h3 class="faq__h">
    <button class="faq__q" type="button" id="${id}-q" aria-expanded="false" aria-controls="${id}-a">
      <span class="faq__num">${String(n).padStart(2, '0')}</span>
      <span class="faq__text">${nbsp(esc(q))}</span>
      <span class="faq__sign">{{icon:plus}}</span>
    </button>
  </h3>
  <div class="faq__a" id="${id}-a" role="region" aria-labelledby="${id}-q">
    <div class="faq__a-inner"><p>${nbsp(esc(a))}</p></div>
  </div>
</li>`;
}).join('\n') + '\n');

// ---------- Отзывы: отбор из ТЗ блок 14 ----------
const revMd = readFileSync('content/03-reviews.md', 'utf8');
const reviews = Object.fromEntries([...revMd.matchAll(/^### (\d+)\. (.+)\n([\s\S]+?)(?=\n### |\s*$)/gm)].map(([, n, who, text]) => [who.trim(), text.trim()]));
const pick = [
  ['Кротова Наталья', 'Наталья Кротова'],
  ['Инна С.', 'Инна С.'],
  ['Ирина Кичева', 'Ирина Кичева', 'Юбилей мужа'],
  ['Матвей Долгих', 'Матвей Долгих', 'Свадьба'],
  ['Светлана Алексеева', 'Светлана Алексеева'],
  ['Машуля Валиуллина', 'Машуля Валиуллина'],
  ['Konovalovaa', 'Отзыв из Instagram'],
  ['Ирина Колчина', 'Ирина Колчина'],
];
writeFileSync('src/sections/_reviews-items.html', pick.map(([key, name, meta], i) => {
  const text = reviews[key];
  if (!text) throw new Error('нет отзыва: ' + key);
  return `<li class="review" data-review data-reveal-item>
  ${i === 0 || i === 5 ? '<img class="review__tape" src="/decor/tape.webp" alt="" width="480" height="150" loading="lazy" decoding="async">' : ''}
  <figure class="review__card">
    <blockquote class="review__body" data-review-body><p>${nbsp(esc(noEmoji(text)))}</p></blockquote>
    <button class="review__more" type="button" aria-expanded="false" hidden data-review-more>Читать целиком</button>
    <figcaption class="review__who"><span class="review__name">${esc(name)}</span>${meta ? `<span class="review__meta">${esc(meta)}</span>` : ''}</figcaption>
  </figure>
</li>`;
}).join('\n') + '\n');

// ---------- JSON-LD (ТЗ §8): Person, LocalBusiness, FAQPage ----------
const ld = [
  {
    '@context': 'https://schema.org', '@type': 'Person', name: 'Стас Торопов', jobTitle: 'Ведущий мероприятий, артист, ивент-менеджер',
    url: 'https://stastoropov.ru/', telephone: '+79194459601', email: 'stas.toropov2015@yandex.ru',
    address: { '@type': 'PostalAddress', addressLocality: 'Пермь', addressCountry: 'RU' },
    sameAs: ['https://vk.com/stastoropov', 'https://www.instagram.com/stastoropov/', 'https://www.youtube.com/channel/UCPVTZqdmxN2ThTZ7u90rBIg', 'https://t.me/+491Rk3L02ItiODMy'],
  },
  {
    '@context': 'https://schema.org', '@type': 'LocalBusiness', name: 'Стас Торопов — ведущий мероприятий', url: 'https://stastoropov.ru/',
    telephone: '+79194459601', email: 'stas.toropov2015@yandex.ru', image: 'https://stastoropov.ru/img/hero-portrait-1440.jpg',
    address: { '@type': 'PostalAddress', addressLocality: 'Пермь', addressRegion: 'Пермский край', addressCountry: 'RU' },
    areaServed: ['Пермь', 'Екатеринбург', 'Сочи', 'Москва', 'Санкт-Петербург', 'Тюмень', 'Ижевск'],
  },
  {
    '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: faq.map(({ q, a }) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
  },
];
writeFileSync('src/sections/_jsonld.html', ld.map((o) => `<script type="application/ld+json">${JSON.stringify(o)}</script>`).join('\n') + '\n');
console.log('faq', faq.length, '· reviews', pick.length, '· jsonld', ld.length);

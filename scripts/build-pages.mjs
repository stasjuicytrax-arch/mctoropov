// Генерирует 5 страниц направлений (ТЗ §6) из content/04-cases.md и content/02-faq.md.
// Шаблон: hero с фото → кейсы → площадки (бегущая строка) → FAQ по направлению → другие направления → форма.
// Тексты не переписываются: лиды, кейсы и ответы FAQ берутся из content/ как есть.
// Запуск: node scripts/build-pages.mjs  →  weddings.html, cityholiday.html, korporat.html, privatparty.html, graduationday.html
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

// content/ в деплой не уходит (.vercelignore) — на сервере собираются уже сгенерированные страницы
if (!existsSync('content/04-cases.md')) {
  console.log('build-pages: content/ нет, беру готовые *.html');
  process.exit(0);
}

const SITE = 'https://stastoropov.ru';
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// неразрывный пробел после коротких предлогов и союзов (типографика)
const nbsp = (s) => s.replace(/(^|[\s«(])([а-яёА-ЯЁ]{1,2})\s/g, '$1$2&nbsp;');
const txt = (s) => nbsp(esc(s));
const pad = (n) => String(n).padStart(2, '0');
const fmt = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '&nbsp;');
const plural = (n, one, few, many) => {
  const a = n % 100, b = n % 10;
  return a > 10 && a < 20 ? many : b === 1 ? one : b >= 2 && b <= 4 ? few : many;
};

// ---------- Направления: порядок и фото — как в карточках блока 02 на главной ----------
const DIRS = [
  {
    slug: 'weddings', section: 1, name: 'Свадебное событие', crumb: 'Свадьбы',
    title: 'Ведущий на свадьбу в Перми: организация и проведение | STASTOROPOV',
    desc: 'Стас Торопов: ведущий на свадьбу в Перми. Больше тысячи свадебных мероприятий, организация под ключ, сценарий, шоу-программа, звук и свет.',
    seo: 'Ведущий на свадьбу в Перми', unit: ['гость', 'гостя', 'гостей'],
    img: 'dir-wedding', w: 1440, h: 2015, alt: 'Стас Торопов ведёт банкет в шатре, гости за столами',
    faq: [2, 5, 6, 7, 8, 10, 11, 14, 15, 17],
  },
  {
    slug: 'cityholiday', section: 2, name: 'Городской праздник', crumb: 'Городские праздники',
    title: 'Ведущий Дня города и городских праздников | STASTOROPOV',
    desc: 'Стас Торопов: ведущий Дня города Перми, Дня металлурга, «Битвы роботов». Площади до 30 000 зрителей, работа с хедлайнерами.',
    seo: 'Ведущий Дня города и массовых мероприятий', unit: ['зритель', 'зрителя', 'зрителей'],
    img: 'dir-city', w: 1440, h: 960, alt: 'Городская сцена под открытым небом и толпа зрителей',
    faq: [1, 2, 3, 9, 10, 11, 15, 17],
  },
  {
    slug: 'korporat', section: 3, name: 'Корпоративное мероприятие', crumb: 'Корпоративы',
    title: 'Ведущий корпоратива в Перми | STASTOROPOV',
    desc: 'Стас Торопов: ведущий корпоративов и юбилеев компаний. Сибур, Parma Technologies Group, ВНИИ Галургии, финал GenerationS в Сколково.',
    seo: 'Ведущий корпоратива в Перми', unit: ['гость', 'гостя', 'гостей'],
    img: 'dir-corporate', w: 1440, h: 960, alt: 'Стас Торопов на сцене корпоративного мероприятия',
    faq: [2, 4, 5, 6, 9, 11, 13, 14, 15, 17],
  },
  {
    slug: 'privatparty', section: 4, name: 'Частная вечеринка', crumb: 'Частные вечеринки',
    title: 'Ведущий на юбилей и день рождения в Перми | STASTOROPOV',
    desc: 'Стас Торопов: ведущий частных вечеринок, дней рождения и юбилеев. Тематические праздники, квесты, хедлайнеры.',
    seo: 'Ведущий на юбилей и день рождения', unit: ['гость', 'гостя', 'гостей'],
    img: 'dir-private', w: 1440, h: 961, alt: 'Стас Торопов с микрофоном на частной вечеринке',
    faq: [2, 5, 6, 7, 8, 11, 12, 14, 15, 17],
  },
  {
    slug: 'graduationday', section: 5, name: 'Выпускной вечер', crumb: 'Выпускные',
    title: 'Ведущий на выпускной в Перми | STASTOROPOV',
    desc: 'Стас Торопов: ведущий выпускных вечеров в Перми. Тайминг, артисты, техспециалисты, оформление площадки, видеоклипы для родителей и учителей.',
    seo: 'Ведущий на выпускной в Перми', unit: ['гость', 'гостя', 'гостей'],
    img: 'dir-graduation', w: 1440, h: 960, alt: 'Танцевальный номер на сцене выпускного',
    faq: [2, 5, 6, 8, 9, 11, 14, 15, 17],
  },
];

// ---------- Кейсы ----------
const casesMd = readFileSync('content/04-cases.md', 'utf8');
const cell = (s) => s.trim();
const dash = (s) => (s === '—' || s === '' ? null : s);

function parseSection(n) {
  const m = casesMd.match(new RegExp(`^## ${n}\\. .+\\n([\\s\\S]+?)(?=\\n---|\\n## |(?![\\s\\S]))`, 'm'));
  if (!m) throw new Error('нет раздела кейсов ' + n);
  const body = m[1];
  const lead = body.match(/^\*\*Лид:\*\* (.+)$/m)?.[1].trim() ?? null;
  const rows = body.split('\n').filter((l) => l.startsWith('|')).slice(2).map((l) => l.split('|').slice(1, -1).map(cell));

  let base = '';   // последняя строка, описанная полностью: на неё ссылаются все «То же» ниже
  const cases = rows.map(([event, cityYear, place, guests, rawTasks]) => {
    // «То же + …» — раскрываем, чтобы кейс читался сам по себе после сортировки
    let tasks = rawTasks.replace(/^То же \+ /, () => `${base}, `).replace(/^То же$/, base);
    tasks = tasks.replace(/\.?\s*Есть видео\.?/, '').trim();   // видео нет на руках — вопрос к клиенту

    let headliner = null, organizers = null;
    tasks = tasks.replace(/\.?\s*Организаторы: (.+)$/, (_, o) => { organizers = o.trim(); return ''; });
    tasks = tasks.replace(/^Хедлайнеры?: (.+?)(?:\.|$)/, (_, h) => { headliner = h.trim(); return ''; }).trim();
    if (!rawTasks.startsWith('То же') && tasks) base = tasks;

    const [city, year] = cityYear.split(/,\s*/);
    const g = guests.match(/^([\d\s]+)(?:\s*\((.+)\))?$/);
    return {
      event, city, year: year ?? null, place: dash(place),
      guests: g ? +g[1].replace(/\s/g, '') : null, guestsNote: g?.[2] ?? null,
      tasks: tasks || null, headliner, organizers,
    };
  });
  // сначала масштаб: заказчику важны цифры (ТЗ §1, аудитория 1), без числа — в конце, порядок исходника внутри
  cases.sort((a, b) => (b.guests ?? -1) - (a.guests ?? -1));
  return { lead, cases };
}

// ---------- FAQ ----------
const faqMd = readFileSync('content/02-faq.md', 'utf8');
const faq = Object.fromEntries([...faqMd.matchAll(/^### (\d+)\. (.+)\n([\s\S]+?)(?=\n### |\s*$)/gm)].map(([, n, q, a]) => [+n, { n: +n, q: q.trim(), a: a.trim() }]));

const faqItem = ({ n, q, a }, i) => `<li class="faq__item" data-faq-item>
  <h3 class="faq__h">
    <button class="faq__q" type="button" id="faq-${n}-q" aria-expanded="false" aria-controls="faq-${n}-a">
      <span class="faq__num">${pad(i + 1)}</span>
      <span class="faq__text">${txt(q)}</span>
      <span class="faq__sign">{{icon:plus}}</span>
    </button>
  </h3>
  <div class="faq__a" id="faq-${n}-a" role="region" aria-labelledby="faq-${n}-q">
    <div class="faq__a-inner"><p>${txt(a)}</p></div>
  </div>
</li>`;

// ---------- Разметка ----------
const COLLAPSE_AFTER = 8;   // длинные списки (21 и 22 кейса) сворачиваются; без JS видно всё

const srcset = (img, fmt_) => [480, 960, 1440].map((w) => `/img/${img}-${w}.${fmt_} ${w}w`).join(', ');
const HERO_SIZES = '(max-width: 767px) calc(100vw - 40px), (max-width: 1279px) 50vw, 700px';

function caseItem(c, i, unit) {
  const place = [c.city, c.place].filter(Boolean).map(txt).join(' · ');
  const year = c.year && !c.event.includes(c.year) ? `, ${c.year}` : '';
  const guests = c.guests
    ? `<p class="case__guests"><span class="case__n">${fmt(c.guests)}</span><span class="case__unit">${c.guestsNote ? `${plural(c.guests, 'зритель', 'зрителя', 'зрителей')} ${txt(c.guestsNote)}` : plural(c.guests, ...unit)}</span></p>`
    : '';
  const extra = [
    c.headliner && `<p class="case__meta"><span class="case__key">Хедлайнер</span> ${txt(c.headliner)}</p>`,
    c.organizers && `<p class="case__meta"><span class="case__key">Организаторы</span> ${txt(c.organizers)}</p>`,
  ].filter(Boolean).join('\n      ');
  return `<li class="case" data-reveal-item>
    <span class="case__num" aria-hidden="true">${pad(i + 1)}</span>
    <div class="case__main">
      <h3 class="case__title">${txt(c.event)}${year}</h3>
      <p class="case__place">${place}</p>
    </div>
    <div class="case__body">
      ${c.tasks ? `<p class="case__tasks">${txt(c.tasks)}</p>` : ''}
      ${extra}
    </div>
    ${guests}
  </li>`;
}

function page(d) {
  const { lead, cases } = parseSection(d.section);
  const max = cases.find((c) => c.guests && !c.guestsNote)?.guests;
  const cities = [...new Set(cases.map((c) => c.city))];
  // площадки для бегущей строки: без уточнений после запятой и без безымянных («Ресторан»)
  const venues = [...new Set(cases.map((c) => c.place).filter(Boolean).map((p) => p.replace(/,.*$/, '')))].filter((v) => /[«A-Za-z ]/.test(v));
  // бегущая строка: города, если их много (городские праздники — площади безымянные), иначе площадки
  const [stripLabel, strip] = cities.length >= 5 ? ['Города', cities] : ['Площадки', venues.slice(0, 10)];
  const items = d.faq.map((n) => faq[n] ?? (() => { throw new Error('нет вопроса ' + n); })());
  const others = DIRS.filter((o) => o !== d);
  const collapse = cases.length > COLLAPSE_AFTER + 2;
  const url = `${SITE}/${d.slug}`;

  const facts = [
    [cases.length, plural(cases.length, 'кейс', 'кейса', 'кейсов') + ' на&nbsp;сайте'],
    [max, `${plural(max, ...d.unit)} на&nbsp;одном событии`],
    cities.length > 1
      ? [cities.length, plural(cities.length, 'город', 'города', 'городов')]
      : [venues.length, plural(venues.length, 'площадка', 'площадки', 'площадок') + ' Перми'],
  ];

  const ld = [
    {
      '@context': 'https://schema.org', '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Главная', item: `${SITE}/` },
        { '@type': 'ListItem', position: 2, name: 'Услуги', item: `${SITE}/#directions` },
        { '@type': 'ListItem', position: 3, name: d.crumb, item: url },
      ],
    },
    {
      '@context': 'https://schema.org', '@type': 'FAQPage',
      mainEntity: items.map(({ q, a }) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
    },
  ];

  // скорость в px/s как у строки на главной (4 слова, ~48 знаков за 40 s): длиннее группа — дольше цикл
  const speed = Math.max(1, strip.join('').length / 48).toFixed(2);
  const marqueeGroup = strip.map((v) => `<span class="marquee__word">${txt(v)}</span><span class="marquee__star">{{icon:asterisk}}</span>`).join('\n      ');

  return `<!doctype html>
<!-- Сгенерировано scripts/build-pages.mjs из content/ — правки вносить в генератор или в content/ -->
<html lang="ru" class="no-js">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>${esc(d.title)}</title>
  <meta name="description" content="${esc(d.desc)}">
  <meta name="theme-color" content="#0A0A0B">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="canonical" href="${url}">

  <meta property="og:type" content="website">
  <meta property="og:locale" content="ru_RU">
  <meta property="og:site_name" content="Стас Торопов">
  <meta property="og:url" content="${url}">
  <meta property="og:title" content="${esc(d.name)} — Стас Торопов">
  <meta property="og:description" content="${esc(d.desc)}">
  <meta property="og:image" content="${SITE}/img/${d.img}-1440.jpg">
  <meta property="og:image:alt" content="${esc(d.alt)}">
  <meta name="twitter:card" content="summary_large_image">
  <script>document.documentElement.classList.replace('no-js', 'js')</script>

  <link rel="preload" href="/fonts/unbounded-cyrillic.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="/fonts/onest-cyrillic.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" as="image" type="image/avif" imagesrcset="${srcset(d.img, 'avif')}" imagesizes="${HERO_SIZES}" fetchpriority="high">

${ld.map((o) => `  <script type="application/ld+json">${JSON.stringify(o)}</script>`).join('\n')}
  <link rel="stylesheet" href="/src/styles/page.css">
  <script type="module" src="/src/scripts/page.js"></script>
</head>
<body>
  <a class="skip-link" href="#main">Перейти к содержанию</a>

  <!-- @include src/sections/00-header.html root=/ -->

  <main id="main">
    <section class="sec sec--dark sec--rail dhero" id="top" data-theme="dark" aria-labelledby="dhero-title">
      <div class="container dhero__grid">
        <nav class="crumbs" aria-label="Хлебные крошки">
          <ol class="crumbs__list">
            <li><a class="crumbs__link" href="/">Главная</a></li>
            <li><a class="crumbs__link" href="/#directions">Услуги</a></li>
            <li><span aria-current="page">${esc(d.crumb)}</span></li>
          </ol>
        </nav>

        <div class="dhero__text">
          <p class="rail"><span class="rail__num">01</span><span class="rail__sep">/</span><span>Направление ${pad(d.section)}</span></p>
          <h1 class="dhero__title" id="dhero-title" style="--chars: ${Math.max(...d.name.split(' ').map((w) => w.length))}" data-reveal="lines">${txt(d.name)}</h1>
          <p class="dhero__seo">${txt(d.seo)}</p>
        </div>

        <div class="dhero__body">
          ${lead ? `<p class="dhero__lead">${txt(lead)}</p>` : ''}
          <div class="dhero__actions">
            <a class="btn btn--primary btn--l" href="#form" data-magnetic>
              <span class="btn__label">Узнать условия</span>
              <span class="btn__arrow">{{icon:arrow-up-right}}</span>
            </a>
            <a class="btn btn--secondary btn--l" href="https://t.me/+491Rk3L02ItiODMy" target="_blank" rel="noopener" data-magnetic data-goal="telegram">
              <span class="btn__label">Написать в&nbsp;телеграм</span>
              <span class="btn__arrow">{{icon:brand-telegram}}</span>
            </a>
          </div>
        </div>

        <figure class="dhero__media">
          <picture class="dhero__picture">
            <source type="image/avif" srcset="${srcset(d.img, 'avif')}" sizes="${HERO_SIZES}">
            <source type="image/webp" srcset="${srcset(d.img, 'webp')}" sizes="${HERO_SIZES}">
            <img src="/img/${d.img}-960.jpg" alt="${esc(d.alt)}" width="${d.w}" height="${d.h}" fetchpriority="high" decoding="async">
          </picture>
        </figure>

        <ul class="dhero__facts" data-reveal="up">
          ${facts.map(([n, label]) => `<li class="dhero__fact" data-reveal-item><span class="dhero__n">${fmt(n)}</span> <span class="dhero__label">${label}</span></li>`).join('\n          ')}
        </ul>
      </div>
    </section>

    <section class="sec sec--light sec--rail cases" id="cases" data-theme="light" data-tear="2" aria-labelledby="cases-title">
      <div class="container">
        <div class="cases__head">
          <p class="rail"><span class="rail__num">02</span></p>
          <h2 class="h2 cases__title" id="cases-title" data-reveal="lines">Кейсы</h2>
          <p class="cases__note" data-reveal="fade">мероприятие · город · площадка · задачи · ${d.unit[2]}</p>
        </div>
        <ol class="cases__list${collapse ? ' is-collapsible' : ''}" id="cases-list" data-reveal="up" data-cases>
  ${cases.map((c, i) => caseItem(c, i, d.unit)).join('\n  ')}
        </ol>
        ${collapse ? `<button class="btn btn--dark btn--m cases__more" type="button" aria-expanded="false" aria-controls="cases-list" hidden data-cases-more>
          <span class="btn__label" data-cases-more-label>Показать все ${cases.length} ${plural(cases.length, 'кейс', 'кейса', 'кейсов')}</span>
          <span class="btn__arrow">{{icon:arrow-down}}</span>
        </button>` : ''}
      </div>
    </section>

    <section class="sec sec--acid marquee" data-theme="acid" data-tear="1" aria-label="${stripLabel}: ${esc(strip.join(', '))}">
      <div class="marquee__track" data-marquee data-marquee-speed="${speed}" aria-hidden="true">
        <div class="marquee__group">
      ${marqueeGroup}
        </div>
        <div class="marquee__group">
      ${marqueeGroup}
        </div>
      </div>
    </section>

    <section class="sec sec--dark sec--rail faq" id="faq" data-theme="dark" data-tear="3" aria-labelledby="faq-title">
      <div class="container faq__grid">
        <div class="faq__head">
          <p class="rail"><span class="rail__num">03</span></p>
          <h2 class="h2 faq__title" id="faq-title" data-reveal="lines">Частые вопросы</h2>
        </div>
        <ol class="faq__list" data-faq>
${items.map(faqItem).join('\n')}
        </ol>
      </div>
    </section>

    <nav class="sec sec--dark sec--rail others" aria-labelledby="others-title">
      <div class="container">
        <p class="rail"><span class="rail__num">04</span></p>
        <h2 class="others__title" id="others-title">Другие направления</h2>
        <ul class="others__list" data-reveal="up">
          ${others.map((o) => `<li data-reveal-item><a class="others__link" href="/${o.slug}"><span class="others__num">${pad(o.section)}</span><span class="others__name">${txt(o.name)}</span><span class="others__go">{{icon:arrow-up-right}}</span></a></li>`).join('\n          ')}
        </ul>
      </div>
    </nav>

    <!-- @include src/sections/18-form.html num=05 -->
  </main>

  <!-- @include src/sections/19-footer.html root=/ -->

  <!-- @include src/sections/_systems.html -->
</body>
</html>
`;
}

for (const d of DIRS) {
  writeFileSync(`${d.slug}.html`, page(d));
  console.log(d.slug, parseSection(d.section).cases.length);
}

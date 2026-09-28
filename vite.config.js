import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/*
 * Сборка HTML из секций.
 *   <!-- @include src/sections/01-hero.html -->  — вставка partial (рекурсивно)
 *   {{icon:arrow-up-right}}                      — инлайн-иконка Tabler (outline), stroke 1.5
 *   {{icon:asterisk:asterisk}}                   — то же + дополнительный класс
 *   <!-- @include src/sections/18-form.html num=05 root=/ -->  — partial с параметрами:
 *   внутри него {{param:num|17}} → значение параметра, иначе значение после «|».
 *   Параметры наследуются вложенными include.
 * Весь контент остаётся в исходном HTML — поисковик видит тексты без JS (ТЗ §8).
 */
// старые адреса Tilda сохранены — позиции в поиске не теряются
export const DIRECTION_PAGES = ['weddings', 'cityholiday', 'korporat', 'privatparty', 'graduationday'];

const ICON_DIR =resolve('node_modules/@tabler/icons/icons/outline');

function icon(name, extra = '') {
  const svg = readFileSync(resolve(ICON_DIR, `${name}.svg`), 'utf8');
  return svg
    .replace(/<svg[^>]*>/s, `<svg class="icon icon--${name}${extra ? ' ' + extra : ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">`)
    .replace(/<path stroke="none" d="M0 0h24v24H0z" fill="none"\s*\/>/, '')
    .replace(/\n\s*/g, '');
}

function expand(html, depth = 0, params = {}) {
  if (depth > 5) return html;
  return html
    .replace(/<!--\s*@include\s+(\S+)((?:\s+[a-z]+=\S*)*)\s*-->/g, (_, p, args) => {
      const own = Object.fromEntries([...args.matchAll(/([a-z]+)=(\S*)/g)].map(([, k, v]) => [k, v]));
      return expand(readFileSync(resolve(p), 'utf8'), depth + 1, { ...params, ...own });
    })
    .replace(/\{\{param:([a-z]+)\|([^}]*)\}\}/g, (_, k, def) => params[k] ?? def)
    .replace(/\{\{icon:([a-z0-9-]+)(?::([a-z0-9 _-]+))?\}\}/g, (_, n, c) => icon(n, c));
}

const partials = () => ({
  name: 'html-partials',
  transformIndexHtml: { order: 'pre', handler: (html) => expand(html) },
  handleHotUpdate({ file, server }) {
    if (file.includes('/src/sections/') && file.endsWith('.html')) {
      server.ws.send({ type: 'full-reload' });
      return [];
    }
  },
});

// Dev-заглушка приёма заявок: проверяет телефон и отвечает как настоящий обработчик.
// В проде POST /api/lead должен пересылать заявку в Telegram-бот и на почту (ТЗ §4).
// ?fail в Referer (открыть сайт как /?fail) — вернуть 500, чтобы проверить состояние ошибки.
const leadStub = () => ({
  name: 'lead-stub',
  configureServer(server) {
    server.middlewares.use('/api/lead', (req, res) => {
      if (req.method !== 'POST') { res.statusCode = 405; return res.end(); }
      let body = '';
      req.on('data', (c) => { body += c; });
      req.on('end', () => {
        let ok = false;
        try { ok = /^\+7\d{10}$/.test(JSON.parse(body).phone); } catch { /* битый JSON */ }
        const fail = (req.headers.referer || '').includes('?fail');
        setTimeout(() => {
          res.statusCode = fail ? 500 : ok ? 200 : 422;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ ok: ok && !fail }));
          console.log('[lead]', res.statusCode, body);
        }, 700);
      });
    });
  },
});

// ЧПУ без .html в dev и preview — как cleanUrls на Vercel
const cleanUrls = () => {
  const rewrite = (req, _res, next) => {
    const path = req.url.split('?')[0].replace(/\/$/, '');
    if (DIRECTION_PAGES.includes(path.slice(1))) req.url = path + '.html';
    next();
  };
  return {
    name: 'clean-urls',
    configureServer: (server) => { server.middlewares.use(rewrite); },
    configurePreviewServer: (server) => { server.middlewares.use(rewrite); },
  };
};

export default defineConfig({
  plugins: [partials(), leadStub(), cleanUrls()],
  server: { port: 5173, host: true },
  // главная, 404 (ТЗ §7) и страницы направлений (ТЗ §6; генерирует scripts/build-pages.mjs)
  build: {
    target: 'es2020',
    assetsInlineLimit: 0,
    rollupOptions: {
      input: {
        main: resolve('index.html'),
        notFound: resolve('404.html'),
        ...Object.fromEntries(DIRECTION_PAGES.map((slug) => [slug, resolve(`${slug}.html`)])),
      },
    },
  },
});

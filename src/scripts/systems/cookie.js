// Cookie-уведомление (ТЗ §8). Показывается один раз: ответ лежит в localStorage.
// Появляется не сразу — сначала человек должен увидеть страницу, а не плашку.
const KEY = 'toropov:cookie';
const DELAY = 1200;

export function initCookie() {
  const el = document.querySelector('[data-cookie]');
  if (!el) return;

  let seen = false;
  try { seen = localStorage.getItem(KEY) === 'ok'; } catch { /* приватный режим — покажем снова */ }
  if (seen) return;

  setTimeout(() => { el.hidden = false; }, DELAY);

  el.querySelector('[data-cookie-accept]')?.addEventListener('click', () => {
    el.hidden = true;
    try { localStorage.setItem(KEY, 'ok'); } catch { /* не сохранилось — не страшно */ }
  });
}

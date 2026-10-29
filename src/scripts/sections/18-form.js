// 18 · Форма «Праздник за 7 дней»: маска +7 (___) ___-__-__, проверка на клиенте,
// честные состояния loading / success / error, защита — honeypot + rate-limit.
// Отправка: POST (JSON) в функцию toropov-leads в Яндекс.Облаке → релей → канал @helpppevent
// (код функции — server/leads/). В dev заявку принимает заглушка /api/lead из vite.config.js.
import { reachGoal } from '../systems/goals.js';
import { initReveal } from '../systems/reveal.js';

const ENDPOINT = import.meta.env.DEV
  ? '/api/lead'
  : 'https://functions.yandexcloud.net/d4e2rs20lmca21plq1uc';
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
const TG_URL = 'https://t.me/+491Rk3L02ItiODMy';
const RATE_KEY = 'lead:last';
const RATE_MS = 60_000;          // не чаще одной заявки в минуту с одного браузера

const digitsOf = (v) => {
  let d = v.replace(/\D/g, '');
  if (d.startsWith('8')) d = '7' + d.slice(1);
  if (!d.startsWith('7')) d = '7' + d;
  return d.slice(0, 11);
};
const format = (d) => {
  const p = d.slice(1);
  let out = '+7';
  if (p.length) out += ' (' + p.slice(0, 3);
  if (p.length >= 3) out += ')';
  if (p.length > 3) out += ' ' + p.slice(3, 6);
  if (p.length > 6) out += '-' + p.slice(6, 8);
  if (p.length > 8) out += '-' + p.slice(8, 10);
  return out;
};

// ---------- Откуда пришла заявка: форма, страница, кнопка, UTM ----------
const PAGES = {
  '/': 'Главная', '/weddings': 'Свадьба', '/cityholiday': 'Городской праздник',
  '/korporat': 'Корпоратив', '/privatparty': 'Частная вечеринка', '/graduationday': 'Выпускной',
};
const pageName = () => PAGES[location.pathname.replace(/\.html$/, '').replace(/\/$/, '') || '/'] || document.title;
const squash = (t) => (t || '').replace(/\s+/g, ' ').trim();

// Последняя кнопка, которая привела к форме (прокрутка к #form или открытие окна)
let lastTrigger = '';
function describeTrigger(el) {
  const label = squash(el.querySelector('.btn__label')?.textContent || el.textContent);
  let where = '';
  if (el.closest('[data-menu]')) where = 'мобильное меню';
  else if (el.closest('.hdr')) where = 'шапка';
  else if (el.closest('.pack')) where = `тариф «${squash(el.closest('.pack').querySelector('.pack__name')?.textContent)}»`;
  else if (el.closest('.hero, .dhero')) where = 'первый экран';
  else {
    const h = el.closest('section')?.querySelector('h2');
    if (h) where = `раздел «${squash(h.textContent)}»`;
  }
  return `кнопка «${label}»${where ? ` (${where})` : ''}`;
}

// UTM запоминаем при заходе: человек может оставить заявку не сразу и с другой страницы
function rememberUtm() {
  try {
    const params = new URLSearchParams(location.search);
    const found = {};
    UTM_KEYS.forEach((k) => { if (params.get(k)) found[k] = params.get(k).slice(0, 150); });
    if (Object.keys(found).length) sessionStorage.setItem('utm', JSON.stringify(found));
  } catch { /* приватный режим */ }
}
function readUtm() {
  try { return JSON.parse(sessionStorage.getItem('utm') || '{}'); } catch { return {}; }
}

// Форм на странице может быть две: секция «Праздник за 7 дней» и модалка из hero.
// Логика одна, состояния — у каждой свои.
export function initLeadForm(scope = document) {
  rememberUtm();
  document.addEventListener('click', (e) => {
    const el = e.target.closest('a[href$="#form"], [data-modal-open]');
    if (el) lastTrigger = describeTrigger(el);
  }, true);
  scope.querySelectorAll('[data-lead-form]').forEach(bindForm);
}

function bindForm(form) {
  const section = form.closest('.lead');
  if (section) initReveal(section);
  const phone = form.querySelector('[data-lead-phone]');
  const consent = form.querySelector('[data-lead-consent]');
  const msg = form.querySelector('[data-lead-msg]');
  const label = form.querySelector('[data-lead-label]');
  const hp = form.querySelector('[data-lead-hp]');
  const idleLabel = label.textContent;   // у модалки своя надпись на кнопке
  const formTitle = form.closest('[data-modal]')
    ? 'Окно «Обсудим ваше событие»'
    : 'Секция «Готовое мероприятие за 7 дней»';

  const state = (name, text = '') => {
    form.classList.remove('is-error', 'is-loading', 'is-success');
    if (name) form.classList.add(`is-${name}`);
    if (text instanceof Node) msg.replaceChildren(text); else msg.textContent = text;
    phone.setAttribute('aria-invalid', String(name === 'error' && digitsOf(phone.value).length < 11));
  };

  phone.addEventListener('input', () => {
    const raw = phone.value.replace(/\D/g, '');
    phone.value = raw ? format(digitsOf(phone.value)) : '';
    if (form.classList.contains('is-error')) state('');
  });
  phone.addEventListener('focus', () => { if (!phone.value) phone.value = '+7 ('; });
  phone.addEventListener('blur', () => { if (digitsOf(phone.value).length <= 1) phone.value = ''; });
  consent.addEventListener('change', () => { if (form.classList.contains('is-error')) state(''); });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (form.classList.contains('is-loading') || form.classList.contains('is-success')) return;

    const d = digitsOf(phone.value);
    if (d.length < 11) { state('error', 'Проверьте номер: нужно 10 цифр после +7'); phone.focus(); return; }
    if (!consent.checked) { state('error', 'Отметьте согласие на обработку персональных данных'); consent.focus(); return; }

    // бот заполнил скрытое поле — делаем вид, что всё хорошо, и ничего не отправляем
    if (hp.value) { success(); return; }

    let last = 0;
    try { last = Number(localStorage.getItem(RATE_KEY)) || 0; } catch { /* приватный режим */ }
    if (Date.now() - last < RATE_MS) { state('error', 'Заявка уже отправлена. Если что-то срочно — позвоните'); return; }

    state('loading', 'Отправляю…');
    label.textContent = 'Отправляю';
    try {
      const body = {
        phone: format(d),
        form_name: [formTitle, pageName(), lastTrigger || 'долистали до формы сами'].join(' · '),
        page_url: location.href.split('#')[0],
        consent: true,
      };
      const utm = readUtm();
      UTM_KEYS.forEach((k) => { if (utm[k]) body[k] = utm[k]; });

      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 15_000);
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: ctrl.signal,
      }).finally(() => clearTimeout(timer));
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.ok === false) throw new Error(String(res.status));
      try { localStorage.setItem(RATE_KEY, String(Date.now())); } catch { /* ок */ }
      reachGoal('lead');
      success();
    } catch {
      label.textContent = idleLabel;
      state('error', errorText());
    }
  });

  // Ошибка — сразу даём другие способы связи: телеграм и звонок
  function errorText() {
    const frag = document.createDocumentFragment();
    const link = (href, text, goal, blank) => {
      const a = document.createElement('a');
      a.href = href; a.textContent = text; a.dataset.goal = goal;
      if (blank) { a.target = '_blank'; a.rel = 'noopener'; }
      return a;
    };
    frag.append('Не получилось отправить заявку. Напишите мне в\u00a0',
      link(TG_URL, 'телеграм', 'telegram', true), ' или позвоните: ',
      link('tel:+79194459601', '+7\u00a0919\u00a0445\u00a096\u00a001', 'call'));
    return frag;
  }

  function success() {
    label.textContent = 'Готово';
    phone.readOnly = true;
    state('success', 'Успешно! Я перезвоню в течение часа.');
  }
}

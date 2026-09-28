// 18 · Форма «Праздник за 7 дней»: маска +7 (___) ___-__-__, проверка на клиенте,
// честные состояния loading / success / error, защита — honeypot + rate-limit.
// Отправка: POST /api/lead (JSON). Бэкенд пересылает в Telegram-бот и на почту (ТЗ §4) —
// в dev его имитирует middleware в vite.config.js, в проде нужен реальный обработчик.
import { reachGoal } from '../systems/goals.js';
import { initReveal } from '../systems/reveal.js';

const ENDPOINT = '/api/lead';
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

export function initLeadForm() {
  const form = document.querySelector('[data-lead-form]');
  if (!form) return;
  initReveal(form.closest('.lead'));
  const phone = form.querySelector('[data-lead-phone]');
  const consent = form.querySelector('[data-lead-consent]');
  const msg = form.querySelector('[data-lead-msg]');
  const label = form.querySelector('[data-lead-label]');
  const hp = form.querySelector('#lead-company');

  const state = (name, text = '') => {
    form.classList.remove('is-error', 'is-loading', 'is-success');
    if (name) form.classList.add(`is-${name}`);
    msg.textContent = text;
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
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: '+' + d, consent: true, page: location.href }),
      });
      if (!res.ok) throw new Error(String(res.status));
      try { localStorage.setItem(RATE_KEY, String(Date.now())); } catch { /* ок */ }
      reachGoal('lead');
      success();
    } catch {
      label.textContent = 'Далее';
      state('error', 'Не получилось отправить. Попробуйте ещё раз или позвоните: +7 919 445 96 01');
    }
  });

  function success() {
    label.textContent = 'Готово';
    phone.readOnly = true;
    state('success', 'Успешно! Я перезвоню в течение часа.');
  }
}

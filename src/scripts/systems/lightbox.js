// Лайтбокс фото кейса (ТЗ §6). Кадры коллажа со старого сайта лежат готовыми файлами
// public/img/cases/<кейс>-gNN.webp (готовит npm run case-photos); в разметке карточки
// только имя кейса и число кадров — 687 адресов в HTML не нужны, они собираются здесь.
// Нативный <dialog>: Esc, фокус-ловушка, инертный фон и подложка — от браузера.
import { gsap } from 'gsap';
import { sec, reduceMotion } from '../lib/tokens.js';
import { stopScroll, startScroll } from './lenis.js';

const SWIPE = 48;   // px: короче — это тап по фото, а не перелистывание
const pad = (n) => String(n).padStart(2, '0');

export function initLightbox() {
  const dialog = document.querySelector('[data-lightbox]');
  if (!dialog) return;
  const frame = dialog.querySelector('[data-lightbox-card]');
  const stage = dialog.querySelector('[data-lb-stage]');
  const img = dialog.querySelector('[data-lb-img]');
  const titleEl = dialog.querySelector('[data-lb-title]');
  const counter = dialog.querySelector('[data-lb-counter]');

  let base = '';       // имя кейса: cityholiday-01
  let shots = 0;       // сколько кадров в его галерее
  let label = '';      // мероприятие и город — для подписи и alt
  let at = 0;
  let opener = null;
  let closing = false;

  const src = (i) => `/img/cases/${base}-g${pad(i + 1)}.webp`;

  function show(i, dir = 0) {
    at = (i + shots) % shots;                       // листаем по кругу: 12 кадров, тупика не нужно
    stage.classList.add('is-loading');
    img.src = src(at);
    img.alt = `${label} — кадр ${at + 1} из ${shots}`;
    counter.textContent = `${pad(at + 1)} / ${pad(shots)}`;
    Promise.resolve(img.decode?.()).catch(() => {}).then(() => stage.classList.remove('is-loading'));
    // соседние кадры: пока смотрят этот, следующий и предыдущий уже в кеше
    for (const n of [at + 1, at - 1]) new Image().src = src((n + shots) % shots);
    if (!dir || reduceMotion()) return;
    gsap.fromTo(img, { x: dir * 24 }, { x: 0, duration: sec('--dur-fast'), ease: 'out', clearProps: 'transform' });
  }

  function open(trigger) {
    if (dialog.open) return;
    base = trigger.dataset.lb ?? '';
    shots = Number(trigger.dataset.lbShots) || 0;
    label = trigger.dataset.lbLabel ?? '';
    if (!base || !shots) return;

    opener = trigger;
    titleEl.textContent = label;
    dialog.showModal();
    stopScroll();                 // Lenis продолжал бы крутить страницу под окном
    show(0);
    frame.focus({ preventScroll: true });
    if (reduceMotion()) return;
    gsap.fromTo(frame,
      { autoAlpha: 0, scale: .96 },
      { autoAlpha: 1, scale: 1, duration: sec('--dur-base'), ease: 'out', clearProps: 'transform' });
  }

  function close() {
    if (!dialog.open || closing) return;
    const done = () => {
      dialog.close();
      startScroll();
      closing = false;
      img.removeAttribute('src');   // кадр на 1100 px в памяти держать незачем
      opener?.focus({ preventScroll: true });
    };
    if (reduceMotion()) { done(); return; }
    closing = true;
    gsap.to(frame, { autoAlpha: 0, scale: .97, duration: sec('--dur-fast'), ease: 'inout', onComplete: done });
  }

  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-lb]');
    if (trigger) { e.preventDefault(); open(trigger); return; }
    if (!dialog.open) return;
    if (e.target.closest('[data-lb-close]')) close();
    else if (e.target.closest('[data-lb-prev]')) show(at - 1, -1);
    else if (e.target.closest('[data-lb-next]')) show(at + 1, 1);
  });

  // клик мимо кадра: цель события — сам dialog, рамка его не пропускает
  dialog.addEventListener('click', (e) => { if (e.target === dialog) close(); });
  dialog.addEventListener('cancel', (e) => { e.preventDefault(); close(); });   // Esc — со своей анимацией
  dialog.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { e.preventDefault(); show(at - 1, -1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); show(at + 1, 1); }
  });

  // свайп по кадру на тач-экранах
  let from = null;
  stage.addEventListener('pointerdown', (e) => { from = e.pointerType === 'mouse' ? null : e.clientX; });
  stage.addEventListener('pointerup', (e) => {
    if (from === null) return;
    const dx = e.clientX - from;
    from = null;
    if (Math.abs(dx) > SWIPE) show(at + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
  });
  stage.addEventListener('pointercancel', () => { from = null; });
}

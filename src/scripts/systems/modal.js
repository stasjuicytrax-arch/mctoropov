// Поп-ап-форма (кнопка «Узнать условия» в hero). Нативный <dialog>: Esc, фокус-ловушка,
// инертный фон и подложка — от браузера. Нам остаётся анимация, закрытие по клику мимо
// карточки и возврат фокуса на кнопку, с которой окно открыли.
import { gsap } from 'gsap';
import { sec, reduceMotion } from '../lib/tokens.js';
import { stopScroll, startScroll } from './lenis.js';

export function initModal() {
  const dialog = document.querySelector('[data-modal]');
  if (!dialog) return;
  const card = dialog.querySelector('[data-modal-card]');
  let opener = null;
  let closing = false;

  function open(trigger) {
    if (dialog.open) return;
    opener = trigger ?? null;
    dialog.showModal();
    stopScroll();                 // Lenis продолжал бы крутить страницу под окном
    card.focus({ preventScroll: true });
    if (reduceMotion()) return;
    gsap.fromTo(card,
      { autoAlpha: 0, scale: .94, y: 24 },
      { autoAlpha: 1, scale: 1, y: 0, duration: sec('--dur-base'), ease: 'out', clearProps: 'transform' });
  }

  function close() {
    if (!dialog.open || closing) return;
    const done = () => {
      dialog.close();
      startScroll();
      closing = false;
      opener?.focus({ preventScroll: true });
    };
    if (reduceMotion()) { done(); return; }
    closing = true;
    gsap.to(card, { autoAlpha: 0, scale: .96, y: 12, duration: sec('--dur-fast'), ease: 'inout', onComplete: done });
  }

  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-modal-open]');
    if (trigger) { e.preventDefault(); open(trigger); return; }
    if (e.target.closest('[data-modal-close]')) close();
  });

  // клик мимо карточки: цель события — сам dialog, карточка его не пропускает
  dialog.addEventListener('click', (e) => { if (e.target === dialog) close(); });
  dialog.addEventListener('cancel', (e) => { e.preventDefault(); close(); });   // Esc
}

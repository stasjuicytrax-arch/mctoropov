// 16 · Главный CTA: построчный reveal заголовка; magnetic и пульс стрелки — в interactions.js и CSS.
import { initReveal } from '../systems/reveal.js';

export function initCta() {
  const section = document.querySelector('.cta');
  if (section) initReveal(section);
}

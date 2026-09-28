// 10 · Технологии: reveal заявления + бесконечная лента клиентов (systems/marquee.js).
import { initReveal } from '../systems/reveal.js';
import { initMarquee } from '../systems/marquee.js';

export function initTech() {
  const section = document.querySelector('.tech');
  if (!section) return;
  initReveal(section);
  initMarquee(section);
}

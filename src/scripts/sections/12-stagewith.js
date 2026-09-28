// 12 · Работал на одной сцене с: три встречные строки с разной скоростью (атрибуты в разметке).
import { initReveal } from '../systems/reveal.js';
import { initMarquee } from '../systems/marquee.js';

export function initStageWith() {
  const section = document.querySelector('.stagewith');
  if (!section) return;
  initReveal(section);
  initMarquee(section);
}

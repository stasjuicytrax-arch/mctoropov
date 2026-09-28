// 07 · Статистика: счётчики отсчитываются при входе в кадр (1.2 s, tabular-nums).
// Ширина держится «призраком» финального значения — макет не дёргается.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { sec, reduceMotion } from '../lib/tokens.js';
import { initReveal } from '../systems/reveal.js';

export function initStats() {
  const section = document.querySelector('[data-stats]');
  if (!section) return;
  initReveal(section);
  if (reduceMotion()) return;

  section.querySelectorAll('[data-count]').forEach((el) => {
    const out = el.querySelector('.count__val');
    const end = Number(el.dataset.count);
    const state = { v: 0 };
    out.textContent = '0';
    ScrollTrigger.create({
      trigger: el,
      start: 'top 85%',
      once: true,
      onEnter: () => gsap.to(state, {
        v: end,
        duration: sec('--count-dur'),
        ease: 'out',
        onUpdate: () => { out.textContent = Math.round(state.v); },
      }),
    });
  });
}

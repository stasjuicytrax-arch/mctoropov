// 08 · Меня видели в работе: появление волной по диагонали сетки (stagger grid).
import { gsap } from 'gsap';
import { sec, num, media, reduceMotion } from '../lib/tokens.js';
import { initReveal } from '../systems/reveal.js';

export function initPersons() {
  const section = document.querySelector('.persons');
  if (!section) return;
  initReveal(section);

  const items = section.querySelectorAll('.person');
  const cols = media.desktop.matches ? 3 : media.mobile.matches ? items.length : 2;
  const rows = Math.ceil(items.length / cols);
  const reduce = reduceMotion();

  gsap.fromTo(items, { autoAlpha: 0, y: reduce ? 0 : num('--reveal-y') }, {
    autoAlpha: 1,
    y: 0,
    duration: sec('--dur-slow'),
    ease: 'out',
    stagger: { grid: [rows, cols], from: 'start', amount: reduce ? 0 : sec('--stagger-cards') * 8 },
    scrollTrigger: { trigger: section.querySelector('.persons__grid'), start: 'top 85%', once: true },
  });
}

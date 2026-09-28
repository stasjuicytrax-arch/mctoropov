// 15 · FAQ: аккордеон, открыт только один. Высота анимируется CSS (grid-rows 0fr → 1fr).
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ms } from '../lib/tokens.js';
import { initReveal } from '../systems/reveal.js';

export function initFaq() {
  const section = document.querySelector('.faq');
  if (!section) return;
  initReveal(section);

  const items = [...section.querySelectorAll('[data-faq-item]')];
  const set = (item, open) => {
    item.classList.toggle('is-open', open);
    item.querySelector('.faq__q').setAttribute('aria-expanded', String(open));
  };

  items.forEach((item) => {
    item.querySelector('.faq__q').addEventListener('click', () => {
      const open = !item.classList.contains('is-open');
      items.forEach((it) => set(it, it === item && open));
      // ниже — pin-секция «Процесс»: пересчитать позиции, когда раскрытие закончится
      setTimeout(() => ScrollTrigger.refresh(), ms('--dur-base') + 40);
    });
  });
}

// 14 · Отзывы: masonry-карточки волной (reveal 'up'); длинные сворачиваются до 6 строк
// с кнопкой «Читать целиком». Короткие не трогаем — кнопки у них нет.
import { initReveal } from '../systems/reveal.js';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

const LINES = 6;

export function initReviews() {
  const section = document.querySelector('.reviews');
  if (!section) return;
  initReveal(section);

  section.querySelectorAll('[data-review]').forEach((card) => {
    const p = card.querySelector('[data-review-body] p');
    const btn = card.querySelector('[data-review-more]');
    const lh = parseFloat(getComputedStyle(p).lineHeight);
    if (p.scrollHeight <= lh * LINES + 2) return;

    card.classList.add('is-clamped');
    btn.hidden = false;
    btn.addEventListener('click', () => {
      const open = card.classList.toggle('is-clamped') === false;
      btn.setAttribute('aria-expanded', String(open));
      btn.textContent = open ? 'Свернуть' : 'Читать целиком';
      ScrollTrigger.refresh();   // высота колонки изменилась — ниже есть pin-секция
    });
  });
}

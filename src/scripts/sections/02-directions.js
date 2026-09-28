// 02 · Направления: горизонтальная лента. Мышь — перетаскивание и стрелки, тач — нативный свайп,
// клавиатура — фокус на ленте + стрелки. 3D-tilt, ч/б → цвет и блик — через CSS + interactions.js.
import { num, media } from '../lib/tokens.js';

export function initDirections() {
  const viewport = document.querySelector('[data-dir-viewport]');
  if (!viewport) return;
  const prev = document.querySelector('[data-dir-prev]');
  const next = document.querySelector('[data-dir-next]');

  const step = () => {
    const card = viewport.querySelector('.dir-card');
    return card ? card.getBoundingClientRect().width + num('--grid-gap') : viewport.clientWidth * .8;
  };
  const update = () => {
    const max = viewport.scrollWidth - viewport.clientWidth - 2;
    prev.disabled = viewport.scrollLeft <= 2;
    next.disabled = viewport.scrollLeft >= max;
  };
  prev.addEventListener('click', () => viewport.scrollBy({ left: -step(), behavior: 'smooth' }));
  next.addEventListener('click', () => viewport.scrollBy({ left: step(), behavior: 'smooth' }));
  viewport.addEventListener('scroll', update, { passive: true });
  addEventListener('resize', update);
  update();

  // ---------- drag-to-scroll для мыши ----------
  if (!media.fine.matches) return;
  let startX = 0, startLeft = 0, moved = false, down = false;
  const threshold = num('--s-2');

  viewport.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    down = true;
    moved = false;
    startX = e.clientX;
    startLeft = viewport.scrollLeft;
  });
  addEventListener('pointermove', (e) => {
    if (!down) return;
    const dx = e.clientX - startX;
    if (!moved && Math.abs(dx) > threshold) {
      moved = true;
      viewport.classList.add('is-dragging');
    }
    if (moved) viewport.scrollLeft = startLeft - dx;
  });
  addEventListener('pointerup', () => {
    if (!down) return;
    down = false;
    if (moved) {
      viewport.classList.remove('is-dragging');
      // вернуть snap к ближайшей карточке
      const s = step();
      viewport.scrollTo({ left: Math.round(viewport.scrollLeft / s) * s, behavior: 'smooth' });
    }
  });
  // после перетаскивания клик по карточке не должен уводить на страницу направления
  viewport.addEventListener('click', (e) => { if (moved) { e.preventDefault(); moved = false; } }, true);
  viewport.addEventListener('dragstart', (e) => e.preventDefault());
}

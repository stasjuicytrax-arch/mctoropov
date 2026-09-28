// Кейсы на странице направления: длинная сетка (21–22 карточки) свёрнута до первых девяти.
// Без JS видно всё — сворачивает только скрипт. Раскрытие одно, назад не сворачиваем:
// после «Показать все» человек уже листает список, прыжок страницы вверх ему не нужен.
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export function initCases() {
  const list = document.querySelector('[data-cases]');
  const more = document.querySelector('[data-cases-more]');
  if (!list || !more) return;

  list.classList.add('is-collapsed');
  more.hidden = false;

  more.addEventListener('click', () => {
    const first = list.querySelector('.case:nth-child(10)');
    list.classList.remove('is-collapsed');
    more.setAttribute('aria-expanded', 'true');
    more.hidden = true;
    first?.setAttribute('tabindex', '-1');
    first?.focus({ preventScroll: true });   // клавиатура продолжает с первого раскрытого кейса
    ScrollTrigger.refresh();
  });
}

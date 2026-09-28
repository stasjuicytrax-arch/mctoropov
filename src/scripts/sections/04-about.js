// 04 · Кто я такой: параллакс полароида 10 %, reveal фактов stagger 80 ms,
// прорисовка маркерного штриха под «кайфануть». Сами движки — в systems/reveal.js.
import { initReveal } from '../systems/reveal.js';

export function initAbout() {
  const section = document.querySelector('.about');
  if (!section) return;
  initReveal(section);
}

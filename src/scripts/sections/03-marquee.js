// 03 · Бегущая строка: движок — systems/marquee.js
import { initMarquee } from '../systems/marquee.js';

export function initStrip() {
  const section = document.querySelector('.marquee');
  if (section) initMarquee(section);
}

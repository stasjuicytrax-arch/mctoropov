// 11 · База артиста: видео-петля без звука играет только в зоне видимости (ТЗ §8),
// preload="none" — файл не качается, пока секция не рядом. Кнопка паузы доступна (ДС §13).
// reduced-motion: автоплея нет, виден постер, запуск — кнопкой.
import { initReveal } from '../systems/reveal.js';
import { reduceMotion } from '../lib/tokens.js';

export function initArtist() {
  const section = document.querySelector('[data-artist]');
  if (!section) return;
  initReveal(section);

  const figure = section.querySelector('[data-artist-video]');
  const video = figure.querySelector('video');
  const toggle = figure.querySelector('[data-artist-toggle]');
  const label = figure.querySelector('[data-artist-toggle-label]');
  let userPaused = reduceMotion();

  const sync = () => {
    const paused = video.paused;
    toggle.setAttribute('aria-pressed', String(paused));
    label.textContent = paused ? 'Запустить видео' : 'Поставить видео на паузу';
  };
  const play = () => { video.play().catch(() => {}).finally(sync); };

  new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !userPaused) play();
    else video.pause();
  }, { threshold: .25 }).observe(figure);

  const flip = () => {
    userPaused = !video.paused;
    if (userPaused) video.pause();
    else play();
  };
  toggle.addEventListener('click', (e) => { e.stopPropagation(); flip(); });
  figure.addEventListener('click', flip);
  video.addEventListener('pause', sync);
  video.addEventListener('play', sync);
  sync();
}

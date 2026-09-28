// Micro-physics: magnetic-кнопки (§10.7) и 3D-tilt карточек (§10.9).
// Только для мыши; reduced-motion — выключено.
import { gsap } from 'gsap';
import { num, sec, media, reduceMotion } from '../lib/tokens.js';

export function initMagnetic(scope = document) {
  if (!media.fine.matches || reduceMotion()) return;
  const max = num('--magnet-max');

  scope.querySelectorAll('[data-magnetic]').forEach((el) => {
    const xTo = gsap.quickTo(el, 'x', { duration: sec('--dur-base'), ease: 'out' });
    const yTo = gsap.quickTo(el, 'y', { duration: sec('--dur-base'), ease: 'out' });
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
      const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
      xTo(gsap.utils.clamp(-1, 1, dx) * max);
      yTo(gsap.utils.clamp(-1, 1, dy) * max);
    });
    el.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
  });
}

export function initTilt(scope = document) {
  if (!media.fine.matches || reduceMotion()) return;
  const max = num('--tilt-max');

  scope.querySelectorAll('[data-tilt]').forEach((el) => {
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;    // 0…1
      const py = (e.clientY - r.top) / r.height;
      el.style.setProperty('--ry', `${(px - .5) * 2 * max}deg`);
      el.style.setProperty('--rx', `${(.5 - py) * 2 * max}deg`);
      el.style.setProperty('--gx', `${(px - .5) * 120}%`);
    });
    el.addEventListener('pointerleave', () => {
      el.style.setProperty('--rx', '0deg');
      el.style.setProperty('--ry', '0deg');
      el.style.setProperty('--gx', '-60%');
    });
  });
}

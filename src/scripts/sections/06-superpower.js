// 06 · Суперспособность: буквы заголовка «перетекают» (blur + разрядка → норма, reveal 'morph'),
// а при движении курсора слово «АДАПТАЦИЯ» слегка плывёт — сила искажения от скорости мыши.
// Курсор остановился — искажение стекает в ноль и фильтр снимается: в покое текст без фильтра.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { sec, media, reduceMotion } from '../lib/tokens.js';
import { initReveal } from '../systems/reveal.js';

const MAX_SCALE = 12;   // единицы feDisplacementMap: заметно, но слово остаётся читаемым

export function initSuperpower() {
  const section = document.querySelector('[data-superpower]');
  if (!section) return;
  initReveal(section);
  if (reduceMotion() || !media.fine.matches) return;

  const word = section.querySelector('[data-superpower-word]');
  const disp = section.querySelector('[data-superpower-disp]');
  const noise = section.querySelector('[data-superpower-noise]');
  const s = { scale: 0 };
  let active = false, lastX = 0, lastY = 0, lastT = 0, seed = 4;

  const apply = () => {
    disp.setAttribute('scale', s.scale.toFixed(2));
    word.classList.toggle('is-warping', s.scale > .3);
  };

  ScrollTrigger.create({ trigger: section, start: 'top bottom', end: 'bottom top', onToggle: (st) => { active = st.isActive; } });

  section.addEventListener('pointermove', (e) => {
    if (!active) return;
    const now = performance.now();
    const v = Math.hypot(e.clientX - lastX, e.clientY - lastY) / Math.max(now - lastT, 16);   // px/ms
    lastX = e.clientX; lastY = e.clientY; lastT = now;
    if (v > 1.2) noise.setAttribute('seed', String(++seed % 50));   // резкое движение — новая «волна»

    gsap.to(s, {
      scale: Math.min(v * 10, MAX_SCALE),
      duration: sec('--dur-fast'),
      ease: 'out',
      overwrite: true,
      onUpdate: apply,
      onComplete: () => gsap.to(s, { scale: 0, duration: sec('--dur-slow'), ease: 'out', onUpdate: apply }),
    });
  });
}

// 05 · Я не боюсь: GSAP pin + горизонтальная прокрутка пунктов, счётчик 01–04 синхронно.
// Мобайл и reduced-motion — вертикальный список со stagger, без pin.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { sec, num } from '../lib/tokens.js';
import { initReveal } from '../systems/reveal.js';

export function initFearless() {
  const section = document.querySelector('[data-fearless]');
  if (!section) return;
  const pin = section.querySelector('[data-fearless-pin]');
  const viewport = section.querySelector('[data-fearless-viewport]');
  const track = section.querySelector('[data-fearless-track]');
  const items = section.querySelectorAll('[data-fearless-item]');
  const roll = section.querySelector('[data-fearless-roll]');
  const n = items.length;

  initReveal(section);

  const mm = gsap.matchMedia();

  mm.add('(min-width: 768px) and (prefers-reduced-motion: no-preference)', () => {
    section.classList.add('is-pinned');
    let index = -1;
    const setIndex = (i) => {
      if (i === index) return;
      index = i;
      roll.style.setProperty('--i', i);
      items.forEach((it, k) => it.toggleAttribute('aria-current', k === i));
    };
    setIndex(0);

    gsap.to(track, {
      xPercent: -100 * (n - 1),
      ease: 'none',
      scrollTrigger: {
        trigger: pin,
        pin: true,
        start: 'top top',
        end: () => `+=${viewport.offsetWidth * (n - 1)}`,
        scrub: 1,
        snap: { snapTo: 1 / (n - 1), duration: { min: .2, max: sec('--dur-slow') }, ease: 'inout' },
        invalidateOnRefresh: true,
        onUpdate: (self) => setIndex(Math.round(self.progress * (n - 1))),
      },
    });
    return () => {
      section.classList.remove('is-pinned');
      items.forEach((it) => it.removeAttribute('aria-current'));
    };
  });

  mm.add('(max-width: 767px), (prefers-reduced-motion: reduce)', () => {
    // fromTo: у пунктов есть CSS-переход opacity, from() прочитал бы промежуточное значение
    gsap.fromTo(items, { autoAlpha: 0, y: num('--reveal-y') }, {
      autoAlpha: 1,
      y: 0,
      duration: sec('--dur-slow'),
      stagger: sec('--stagger-cards'),
      ease: 'out',
      scrollTrigger: { trigger: track, start: 'top 85%', once: true },
    });
  });

  ScrollTrigger.refresh();
}

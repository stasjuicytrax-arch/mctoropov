// 17 · Процесс: pin на десктопе, линия прорисовывается по скроллу (stroke-dashoffset),
// карточки загораются по очереди, когда линия до них доходит.
// Планшет, мобайл и reduced-motion — без pin, всё видно сразу.
import { gsap } from 'gsap';
import { sec, num, reduceMotion } from '../lib/tokens.js';
import { initReveal } from '../systems/reveal.js';

export function initProcess() {
  const section = document.querySelector('[data-process]');
  if (!section) return;
  initReveal(section);

  const pin = section.querySelector('[data-process-pin]');
  const line = section.querySelector('[data-process-line]');
  const steps = [...section.querySelectorAll('[data-process-step]')];
  const mm = gsap.matchMedia();

  mm.add('(min-width: 1280px) and (prefers-reduced-motion: no-preference)', () => {
    section.classList.add('is-pinned');
    const light = (p) => steps.forEach((s, i) => s.classList.toggle('is-lit', p >= i / steps.length + .02));
    light(0);
    gsap.fromTo(line, { strokeDashoffset: 1 }, {
      strokeDashoffset: 0,
      ease: 'none',
      scrollTrigger: {
        trigger: pin,
        pin: true,
        start: 'top top',
        end: () => `+=${innerHeight * 1.2}`,
        scrub: .6,
        onUpdate: (s) => light(s.progress),
      },
    });
    return () => { section.classList.remove('is-pinned'); steps.forEach((s) => s.classList.remove('is-lit')); };
  });

  mm.add('(max-width: 1279px), (prefers-reduced-motion: reduce)', () => {
    gsap.fromTo(steps, { autoAlpha: 0, y: reduceMotion() ? 0 : num('--reveal-y') }, {
      autoAlpha: 1, y: 0, duration: sec('--dur-slow'), stagger: sec('--stagger-cards'), ease: 'out',
      scrollTrigger: { trigger: section.querySelector('.process__steps'), start: 'top 85%', once: true },
    });
  });
}

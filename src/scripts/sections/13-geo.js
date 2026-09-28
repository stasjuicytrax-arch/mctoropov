// 13 · География: список выезжает stagger 60 ms, маршруты прорисовываются из Перми,
// наведение на город подсвечивает точку и маршрут — и наоборот.
import { gsap } from 'gsap';
import { sec, num, reduceMotion } from '../lib/tokens.js';
import { initReveal } from '../systems/reveal.js';

export function initGeo() {
  const section = document.querySelector('[data-geo]');
  if (!section) return;
  initReveal(section);

  const reduce = reduceMotion();
  const cities = section.querySelectorAll('.geo__city');
  const routes = section.querySelectorAll('.geo__route');
  const points = section.querySelectorAll('.geo__point');
  const st = { trigger: section.querySelector('.geo__grid'), start: 'top 75%', once: true };

  gsap.fromTo(cities, { autoAlpha: 0, x: reduce ? 0 : -num('--reveal-y') }, {
    autoAlpha: 1, x: 0, duration: sec('--dur-base'), stagger: sec('--stagger-menu'), ease: 'out', scrollTrigger: st,
  });
  if (!reduce) {
    gsap.fromTo(routes, { strokeDashoffset: 1 }, {
      strokeDashoffset: 0, duration: sec('--dur-slow') * 1.4, stagger: sec('--stagger-cards'), ease: 'inout', scrollTrigger: st,
    });
    gsap.fromTo(points, { scale: 0, transformOrigin: '50% 50%' }, {
      scale: 1, duration: sec('--dur-base'), stagger: sec('--stagger-menu'), ease: 'back.out(2)', delay: sec('--dur-base'), scrollTrigger: st,
    });
  }

  const mark = (id, on) => section.querySelectorAll(`[data-city="${id}"]`).forEach((el) => el.classList.toggle('is-active', on));
  [...cities, ...points].forEach((el) => {
    el.addEventListener('pointerenter', () => mark(el.dataset.city, true));
    el.addEventListener('pointerleave', () => mark(el.dataset.city, false));
  });
}

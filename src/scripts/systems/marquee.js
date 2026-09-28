// Движок бегущих строк (§8.4): 40 s на цикл × множитель, реверс при смене направления скролла,
// пауза вне кадра. Атрибуты на треке:
//   data-marquee                 — трек из двух одинаковых групп
//   data-marquee-dir="-1"        — базовое направление (вправо)
//   data-marquee-speed="1.2"     — множитель длительности (больше — медленнее)
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { sec, reduceMotion } from '../lib/tokens.js';

export function initMarquee(scope = document) {
  if (reduceMotion()) return;
  scope.querySelectorAll('[data-marquee]').forEach((track) => {
    const base = Number(track.dataset.marqueeDir ?? 1);
    const k = Number(track.dataset.marqueeSpeed ?? 1);
    const tween = gsap.fromTo(track, { xPercent: base > 0 ? 0 : -50 }, {
      xPercent: base > 0 ? -50 : 0,
      duration: sec('--marquee-speed') * k,
      ease: 'none',
      repeat: -1,
    });
    tween.totalTime(tween.duration() * 50);   // запас, чтобы реверс не упирался в начало

    let dir = 1;
    ScrollTrigger.create({
      trigger: track.closest('section'),
      start: 'top bottom',
      end: 'bottom top',
      onToggle: (s) => (s.isActive ? tween.resume() : tween.pause()),
      onUpdate: (s) => {
        if (s.direction === dir) return;
        dir = s.direction;
        gsap.to(tween, { timeScale: dir, duration: sec('--dur-slow'), ease: 'inout', overwrite: true });
      },
    });
  });
}

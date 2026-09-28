// 01 · Hero: H1 выезжает построчно из-под маски (900 ms, stagger 90 ms), затем фото
// раскрывается шторкой снизу вверх, следом — подпись и кнопки. Вертикальная бегущая строка у края.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { sec, num, reduceMotion } from '../lib/tokens.js';

let hero, lines, intro, media;

export function prepareHero() {
  hero = document.querySelector('.hero');
  if (!hero) return;
  lines = hero.querySelectorAll('[data-hero-line] > span');
  intro = hero.querySelectorAll('[data-hero-intro]');
  media = hero.querySelector('[data-hero-media]');
  if (reduceMotion()) {
    gsap.set([...lines, ...intro], { autoAlpha: 0 });
    gsap.set(media, { '--curtain': 0 });
  } else {
    gsap.set(lines, { yPercent: 110 });
    gsap.set(intro, { autoAlpha: 0, y: num('--reveal-y') });
    gsap.set(media, { '--curtain': 1, '--zoom': 1.12 });
  }
  initVerticalMarquee();
}

export function playHero() {
  if (!hero) return;
  const tl = gsap.timeline();
  if (reduceMotion()) {
    tl.to([...lines, ...intro], { autoAlpha: 1, duration: sec('--dur-base'), stagger: .05 });
    return;
  }
  tl.to(lines, { yPercent: 0, duration: sec('--dur-slow'), stagger: sec('--stagger-hero'), ease: 'out' })
    .to(media, { '--curtain': 0, duration: sec('--dur-slow') * 1.2, ease: 'inout' }, '-=.6')
    .to(media, { '--zoom': 1, duration: sec('--dur-slow') * 1.8, ease: 'out' }, '<')
    .to(intro, { autoAlpha: 1, y: 0, duration: sec('--dur-slow'), stagger: sec('--stagger-cards'), ease: 'out' }, '-=.8');
}

function initVerticalMarquee() {
  const track = hero.querySelector('[data-vmarquee]');
  if (!track || reduceMotion()) return;
  const tween = gsap.to(track, { yPercent: -50, duration: sec('--marquee-speed'), ease: 'none', repeat: -1 });
  ScrollTrigger.create({ trigger: hero, start: 'top bottom', end: 'bottom top', onToggle: (s) => (s.isActive ? tween.play() : tween.pause()) });
}

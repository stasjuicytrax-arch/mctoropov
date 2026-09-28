// Движок scroll-reveal (§10.2–10.3, §8.8). Декларативно, через data-атрибуты:
//   data-reveal="lines"  — построчная маска, строки выезжают снизу, stagger 60 ms
//   data-reveal="fade"   — opacity + y 32 → 0
//   data-reveal="up"     — дети [data-reveal-item] волной, stagger 80 ms
//   data-reveal="draw"   — SVG-штрих прорисовывается (stroke-dashoffset)
//   data-reveal="morph"  — буквы «перетекают»: blur + разрядка → норма
// Без JS всё видно (скрытые состояния ставит только JS). reduced-motion → только opacity.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { sec, num, reduceMotion } from '../lib/tokens.js';

gsap.registerPlugin(ScrollTrigger, SplitText);

const START = 'top 85%';

export function initReveal(scope = document) {
  const reduce = reduceMotion();
  const els = scope.querySelectorAll('[data-reveal]');

  els.forEach((el) => {
    const type = el.dataset.reveal;
    const st = { trigger: el, start: START, once: true };

    if (reduce) {
      const targets = type === 'up' ? el.querySelectorAll('[data-reveal-item]') : el;
      if (type === 'draw') return;
      // fromTo с явным концом: from() берёт конец из текущего состояния и может «запомнить» 0
      gsap.fromTo(targets, { autoAlpha: 0 }, { autoAlpha: 1, duration: sec('--dur-base'), stagger: sec('--stagger-cards'), ease: 'none', scrollTrigger: st });
      return;
    }

    switch (type) {
      case 'lines': {
        const masked = el.dataset.revealMask !== 'off';
        SplitText.create(el, {
          type: 'lines',
          mask: masked ? 'lines' : undefined,
          linesClass: 'split-line',
          autoSplit: true,
          aria: 'none',   // строки — целые слова: скринридер читает их как обычный текст, никаких aria-label на <p>/<span>
          onSplit: (self) => gsap.from(self.lines, {
            yPercent: masked ? 110 : 40,
            autoAlpha: masked ? 1 : 0,
            duration: sec('--dur-slow'),
            stagger: sec('--stagger-lines'),
            ease: 'out',
            scrollTrigger: st,
          }),
        });
        break;
      }

      case 'fade':
        gsap.fromTo(el, { autoAlpha: 0, y: num('--reveal-y') }, { autoAlpha: 1, y: 0, duration: sec('--dur-slow'), delay: .2, ease: 'out', scrollTrigger: st });
        break;

      case 'up':
        gsap.fromTo(el.querySelectorAll('[data-reveal-item]'), { autoAlpha: 0, y: num('--reveal-y') }, {
          autoAlpha: 1,
          y: 0,
          duration: sec('--dur-slow'),
          stagger: sec('--stagger-cards'),
          ease: 'out',
          scrollTrigger: st,
        });
        break;

      case 'draw': {
        const path = el.querySelector('path');
        gsap.fromTo(path, { strokeDashoffset: 1 }, {
          strokeDashoffset: 0,
          duration: sec('--dur-slow'),
          delay: sec('--dur-base'),
          ease: 'inout',
          scrollTrigger: { ...st, trigger: el.closest('p, blockquote') ?? el },
        });
        break;
      }

      case 'morph': {
        // побуквенный сплит читается по буквам — имя даём заголовку целиком, буквы прячем
        const heading = el.closest('h1, h2, h3');
        if (heading && !heading.hasAttribute('aria-label')) heading.setAttribute('aria-label', heading.textContent.replace(/\s+/g, ' ').trim());
        el.setAttribute('aria-hidden', 'true');
        SplitText.create(el, {
          type: 'chars',
          autoSplit: true,
          aria: 'none',
          onSplit: (self) => gsap.from(self.chars, {
            autoAlpha: 0,
            filter: 'blur(16px)',
            xPercent: (i, _t, all) => (i - (all.length - 1) / 2) * 18,
            scaleY: 1.4,
            duration: sec('--dur-slow') * 1.4,
            stagger: { each: sec('--stagger-lines') / 2, from: 'center' },
            ease: 'out',
            clearProps: 'filter',
            scrollTrigger: { ...st, trigger: el.closest('h1, h2') ?? el, start: 'top 75%' },
          }),
        });
        break;
      }
    }
  });
}

/** Параллакс фото (§10.4): медленнее скролла на --parallax-photo; рваные края — ±20px */
export function initParallax() {
  if (reduceMotion()) return;
  const amount = num('--parallax-photo');
  document.querySelectorAll('[data-parallax]').forEach((el) => {
    gsap.fromTo(el, { yPercent: amount / 2 }, {
      yPercent: -amount / 2,
      ease: 'none',
      scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  });
  // фото внутри рамки: картинка чуть больше рамки и едет медленнее скролла
  document.querySelectorAll('[data-parallax-inner]').forEach((frame) => {
    const img = frame.querySelector('img');
    gsap.fromTo(img, { yPercent: -amount / 2 }, {
      yPercent: amount / 2,
      ease: 'none',
      scrollTrigger: { trigger: frame, start: 'top bottom', end: 'bottom top', scrub: true },
    });
  });
  const tear = num('--parallax-tear');
  document.querySelectorAll('.sec[data-tear]').forEach((sec_) => {
    gsap.fromTo(sec_, { '--tear-x': `${-tear}px` }, {
      '--tear-x': `${tear}px`,
      ease: 'none',
      scrollTrigger: { trigger: sec_, start: 'top bottom', end: 'top top', scrub: true },
    });
  });
}

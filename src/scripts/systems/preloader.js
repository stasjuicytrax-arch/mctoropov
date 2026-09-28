// Прелоадер (ТЗ §7): вордмарк + процент + шторка с рваным краем.
// Общая длительность вместе с уходом шторки — от --preloader-min до --preloader-max (1.2–1.8 s).
// Процент честный: пока не готовы шрифты первого экрана, счётчик не переваливает за 90.
import { gsap } from 'gsap';
import { ms, sec, reduceMotion } from '../lib/tokens.js';

export function runPreloader() {
  const el = document.querySelector('[data-preloader]');
  if (!el) return Promise.resolve();

  const pctEl = el.querySelector('[data-preloader-pct]');
  const word = el.querySelector('.preloader__word');
  const exit = ms('--dur-slow') * (reduceMotion() ? .4 : .6);
  const loadMin = ms('--preloader-min') - exit;
  const loadMax = ms('--preloader-max') - exit;
  const t0 = performance.now();

  let ready = false;
  const fonts = document.fonts?.ready ?? Promise.resolve();
  Promise.all([fonts, document.fonts?.load?.('900 1em Unbounded') ?? null]).then(() => { ready = true; });

  return new Promise((resolve) => {
    let shown = 0;
    const tick = () => {
      const t = performance.now() - t0;
      const timeP = Math.min(t / loadMin, 1);
      const cap = ready || t >= loadMax ? 1 : .9;
      shown = Math.max(shown, Math.min(timeP, cap));
      const p = Math.round(shown * 100);
      pctEl.textContent = p;
      word.style.setProperty('--p', `${p}%`);

      if (p >= 100) {
        gsap.ticker.remove(tick);
        leave();
      }
    };
    gsap.ticker.add(tick);

    function leave() {
      el.classList.add('is-done');
      resolve();   // интро hero стартует вместе с уходом шторки
      const tl = gsap.timeline({ onComplete: () => el.remove() });
      if (reduceMotion()) {
        tl.to(el, { autoAlpha: 0, duration: exit / 1000, ease: 'none' });
      } else {
        tl.to(el, { yPercent: -100, duration: exit / 1000, ease: 'inout' });
        tl.to(el.querySelector('.preloader__inner'), { yPercent: -30, autoAlpha: 0, duration: sec('--dur-base'), ease: 'out' }, 0);
      }
    }
  });
}

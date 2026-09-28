// 00 · Хедер: прячется при скролле вниз, выезжает вверх; подложка + рваный край после старта скролла;
// вордмарк искажается по буквам; мобильное меню — полноэкранная acid-шторка со stagger 60 ms.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { sec, num, media, reduceMotion } from '../lib/tokens.js';
import { stopScroll, startScroll, scrollToTarget } from '../systems/lenis.js';

// Фиксированная «деформация» по буквам Т-О-Р-О-П-О-В: не рандом в рантайме, повторяемо.
const WARP = [
  { skewX: -14, scaleY: 1.22, y: -2 },
  { skewX: 10, scaleY: .82, y: 1 },
  { skewX: -6, scaleY: 1.14, y: -1 },
  { skewX: 16, scaleY: .78, y: 2 },
  { skewX: -10, scaleY: 1.28, y: -2 },
  { skewX: 8, scaleY: .86, y: 1 },
  { skewX: -12, scaleY: 1.18, y: -1 },
];

export function initWordmarkWarp(el) {
  if (!el || reduceMotion()) return;
  const letters = el.querySelectorAll('span');
  const on = () => gsap.to(letters, {
    skewX: (i) => WARP[i % WARP.length].skewX,
    scaleY: (i) => WARP[i % WARP.length].scaleY,
    y: (i) => WARP[i % WARP.length].y,
    duration: sec('--dur-base'),
    ease: 'out',
    stagger: .02,
    overwrite: true,
  });
  const off = () => gsap.to(letters, { skewX: 0, scaleY: 1, y: 0, duration: sec('--dur-slow'), ease: 'elastic.out(1, .4)', stagger: .02, overwrite: true });
  el.addEventListener('pointerenter', on);
  el.addEventListener('pointerleave', off);
  el.addEventListener('focus', on);
  el.addEventListener('blur', off);
}

export function initHeader() {
  const hdr = document.querySelector('[data-header]');
  if (!hdr) return;

  initWordmarkWarp(hdr.querySelector('[data-wordmark]'));

  let menuOpen = false;
  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate(self) {
      const y = self.scroll();
      hdr.classList.toggle('is-scrolled', y > num('--s-2'));
      if (menuOpen) return;
      if (y < num('--header-h')) hdr.classList.remove('is-hidden');
      else if (self.direction === 1) hdr.classList.add('is-hidden');
      else hdr.classList.remove('is-hidden');
    },
  });
  // клавиатура: фокус внутри хедера всегда его показывает
  hdr.addEventListener('focusin', () => hdr.classList.remove('is-hidden'));

  // ---------- Меню ----------
  const toggle = hdr.querySelector('[data-menu-toggle]');
  const toggleLabel = hdr.querySelector('[data-menu-toggle-label]');
  const menu = hdr.querySelector('[data-menu]');
  const items = menu.querySelectorAll('[data-menu-item]');
  let tl = null;

  const open = () => {
    menuOpen = true;
    hdr.classList.add('is-menu-open');
    toggle.setAttribute('aria-expanded', 'true');
    toggleLabel.textContent = 'Закрыть меню';
    menu.hidden = false;
    stopScroll();
    tl?.kill();
    if (reduceMotion()) {
      tl = gsap.fromTo(menu, { autoAlpha: 0 }, { autoAlpha: 1, duration: sec('--dur-base') });
    } else {
      tl = gsap.timeline()
        .fromTo(menu, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: sec('--dur-slow') * .7, ease: 'inout' })
        .fromTo(items, { yPercent: 60, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: sec('--dur-base'), stagger: sec('--stagger-menu'), ease: 'out' }, '-=.2');
    }
    items[0]?.focus({ preventScroll: true });
  };

  const close = ({ restoreFocus = true } = {}) => {
    if (!menuOpen) return;
    menuOpen = false;
    toggle.setAttribute('aria-expanded', 'false');
    toggleLabel.textContent = 'Открыть меню';
    tl?.kill();
    const done = () => { menu.hidden = true; hdr.classList.remove('is-menu-open'); startScroll(); };
    if (reduceMotion()) gsap.to(menu, { autoAlpha: 0, duration: sec('--dur-fast'), onComplete: done });
    else gsap.to(menu, { clipPath: 'inset(0 0 100% 0)', duration: sec('--dur-base'), ease: 'inout', onComplete: done });
    if (restoreFocus) toggle.focus({ preventScroll: true });
  };

  toggle.addEventListener('click', () => (menuOpen ? close() : open()));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') close(); });
  media.desktop.addEventListener('change', (e) => e.matches && close({ restoreFocus: false }));

  menu.addEventListener('click', (e) => {
    const a = e.target.closest('a');
    if (!a) return;
    const id = a.getAttribute('href');
    const target = id?.startsWith('#') && id.length > 1 ? document.querySelector(id) : null;
    close({ restoreFocus: false });
    if (target) {
      e.preventDefault();
      e.stopPropagation();
      gsap.delayedCall(sec('--dur-base'), () => scrollToTarget(target));
    }
  });

  // простая ловушка фокуса внутри открытого меню
  hdr.addEventListener('keydown', (e) => {
    if (!menuOpen || e.key !== 'Tab') return;
    const f = [toggle, ...menu.querySelectorAll('a, button')];
    const i = f.indexOf(document.activeElement);
    if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
  });
}

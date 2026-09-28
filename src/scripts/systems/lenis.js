// Smooth scroll (§10.1): Lenis, lerp из токена, синхронизирован с ScrollTrigger.
// Якорная навигация с учётом высоты хедера. Скролл-прогресс — сверху.
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { num, reduceMotion } from '../lib/tokens.js';

gsap.registerPlugin(ScrollTrigger);

export let lenis = null;

export function initScroll() {
  if (!reduceMotion()) {
    lenis = new Lenis({ lerp: num('--lenis-lerp'), smoothWheel: true, anchors: false });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  initAnchors();
  initProgress();
}

export const stopScroll = () => lenis?.stop();
export const startScroll = () => lenis?.start();

export function scrollToTarget(target) {
  const offset = -num('--header-h');
  if (lenis) lenis.scrollTo(target, { offset, duration: 1.2, easing: (t) => 1 - Math.pow(1 - t, 4) });
  else target.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'start' });
}

function initAnchors() {
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href');
    if (id === '#' || id.length < 2) return;
    const target = document.querySelector(id);
    if (!target) return;                // блоки следующих итераций: якорь оживёт, когда секция появится
    e.preventDefault();
    scrollToTarget(target);
    history.replaceState(null, '', id);
  });
}

function initProgress() {
  const bar = document.querySelector('[data-progress]');
  if (!bar) return;
  const set = gsap.quickSetter(bar, 'scaleX');
  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate: (self) => set(self.progress),
  });
}

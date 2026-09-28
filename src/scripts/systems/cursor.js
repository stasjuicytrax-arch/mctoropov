// Кастомный курсор (§8.10): точка + кольцо с задержкой (lerp из токена).
// Состояния: обычный / кликабельный / над фото («СМОТРЕТЬ») / над видео («PLAY»).
// На тач-устройствах и узких экранах выключен.
import { gsap } from 'gsap';
import { num, media, reduceMotion } from '../lib/tokens.js';

const LABELS = { view: 'Смотреть', play: 'Play' };
const CLICKABLE = 'a, button, [role="button"], label, summary, [data-cursor="link"]';

export function initCursor() {
  const root = document.querySelector('[data-cursor-root]');
  if (!root || !media.fine.matches || media.mobile.matches) return;

  document.documentElement.classList.add('has-cursor');
  const dot = root.querySelector('.cursor__dot');
  const follow = root.querySelector('[data-cursor-follow]');
  const label = root.querySelector('[data-cursor-label]');
  const lerp = reduceMotion() ? 1 : num('--cursor-lerp');

  const target = { x: innerWidth / 2, y: innerHeight / 2 };
  const pos = { ...target };
  let state = '';

  root.classList.add('is-hidden');

  addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    target.x = e.clientX;
    target.y = e.clientY;
    root.classList.remove('is-hidden');
  }, { passive: true });

  document.addEventListener('pointerleave', () => root.classList.add('is-hidden'));
  document.addEventListener('pointerenter', () => root.classList.remove('is-hidden'));

  document.addEventListener('pointerover', (e) => {
    const t = e.target;
    const special = t.closest('[data-cursor="view"], [data-cursor="play"]');
    const next = special ? special.dataset.cursor : t.closest(CLICKABLE) ? 'link' : '';
    if (next !== state) {
      state = next;
      root.dataset.state = state;
      label.textContent = LABELS[state] ?? '';
    }
    root.dataset.theme = t.closest('[data-theme]')?.dataset.theme ?? 'dark';
  });

  gsap.ticker.add(() => {
    pos.x += (target.x - pos.x) * lerp;
    pos.y += (target.y - pos.y) * lerp;
    dot.style.transform = `translate3d(${target.x}px, ${target.y}px, 0) translate(-50%, -50%)`;
    follow.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
  });
}

// Чтение значений из tokens.css. В JS нет ни одного «своего» тайминга или размера:
// всё берётся из CSS-переменных, чтобы дизайн-система оставалась единственным источником правды.
import { gsap } from 'gsap';
import { CustomEase } from 'gsap/CustomEase';

gsap.registerPlugin(CustomEase);

const root = document.documentElement;
const cache = new Map();

export const token = (name) => {
  if (!cache.has(name)) cache.set(name, getComputedStyle(root).getPropertyValue(name).trim());
  return cache.get(name);
};

/** '420ms' | '40s' → миллисекунды */
export const ms = (name) => {
  const v = token(name);
  return v.endsWith('ms') ? parseFloat(v) : parseFloat(v) * 1000;
};
/** то же в секундах — для GSAP */
export const sec = (name) => ms(name) / 1000;
/** '88px' | '8deg' | '.09' | '10%' → число */
export const num = (name) => parseFloat(token(name));

/** Кривые из токенов → именованные GSAP-ease: 'out', 'inout' */
const bezier = (name) => token(name).replace(/cubic-bezier\(|\)/g, '');
CustomEase.create('out', bezier('--ease-out'));
CustomEase.create('inout', bezier('--ease-inout'));

export const media = {
  reduce: matchMedia('(prefers-reduced-motion: reduce)'),
  fine: matchMedia('(hover: hover) and (pointer: fine)'),
  mobile: matchMedia('(max-width: 767px)'),
  desktop: matchMedia('(min-width: 1280px)'),
};
export const reduceMotion = () => media.reduce.matches;

// Токены в @media меняются — сбрасываем кэш при смене брейкпоинта
[media.mobile, media.desktop].forEach((m) => m.addEventListener('change', () => cache.clear()));

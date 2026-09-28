// Точка входа. Порядок: скролл и курсор → подготовка hero (скрытые состояния под прелоадером)
// → прелоадер → интро hero → reveal остальных секций.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { initScroll, stopScroll, startScroll, scrollToTarget } from './systems/lenis.js';
import { runPreloader } from './systems/preloader.js';
import { initCursor } from './systems/cursor.js';
import { initReveal, initParallax } from './systems/reveal.js';
import { initMagnetic, initTilt } from './systems/interactions.js';

import { initHeader } from './sections/00-header.js';
import { prepareHero, playHero } from './sections/01-hero.js';
import { initDirections } from './sections/02-directions.js';
import { initStrip } from './sections/03-marquee.js';
import { initAbout } from './sections/04-about.js';
import { initFearless } from './sections/05-fearless.js';
import { initSuperpower } from './sections/06-superpower.js';
import { initStats } from './sections/07-stats.js';
import { initPersons } from './sections/08-persons.js';
import { initPrep } from './sections/09-prep.js';
import { initTech } from './sections/10-tech.js';
import { initArtist } from './sections/11-artist.js';
import { initStageWith } from './sections/12-stagewith.js';
import { initGeo } from './sections/13-geo.js';
import { initReviews } from './sections/14-reviews.js';
import { initFaq } from './sections/15-faq.js';
import { initCta } from './sections/16-cta.js';
import { initProcess } from './sections/17-process.js';
import { initLeadForm } from './sections/18-form.js';
import { initFooter } from './sections/19-footer.js';
import { initGoals } from './systems/goals.js';
import { initCookie } from './systems/cookie.js';

gsap.registerPlugin(ScrollTrigger);

// браузер не должен восстанавливать позицию посреди pin-секции до инициализации
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

initScroll();
stopScroll();
initCursor();
initHeader();
prepareHero();

// Отдать главный поток браузеру между задачами: одна длинная инициализация 20 секций
// давала TBT 750 мс на мобиле, по частям — короткие задачи, интро hero не дёргается.
const yieldToMain = () => (globalThis.scheduler?.yield ? scheduler.yield() : new Promise((r) => setTimeout(r, 0)));

// Порядок сверху вниз важен: pin-секции (05, 17) должны создаваться в порядке документа
const TASKS = [
  () => initReveal(document.querySelector('.directions')),
  initDirections, initStrip, initAbout, initFearless, initSuperpower,
  initStats, initPersons, initPrep, initTech, initArtist, initStageWith, initGeo,
  initReviews, initFaq, initCta, initProcess, initLeadForm, initFooter,
  initGoals, initParallax, initMagnetic, initTilt, initCookie,
];

runPreloader().then(async () => {
  startScroll();
  playHero();

  for (const task of TASKS) {
    await yieldToMain();
    task();
  }
  await yieldToMain();
  ScrollTrigger.refresh();
  document.fonts?.ready.then(() => ScrollTrigger.refresh());

  // пришли со внутренней страницы по ссылке вида /#about — доехать до секции, когда pin-секции уже посчитаны
  const target = location.hash.length > 1 && document.querySelector(location.hash);
  if (target) scrollToTarget(target);
});

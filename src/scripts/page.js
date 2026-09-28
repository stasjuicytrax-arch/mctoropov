// Точка входа внутренних страниц (ТЗ §6): те же сквозные системы, без прелоадера и тяжёлых секций главной.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { initScroll } from './systems/lenis.js';
import { initCursor } from './systems/cursor.js';
import { initReveal, initParallax } from './systems/reveal.js';
import { initMagnetic } from './systems/interactions.js';
import { initMarquee } from './systems/marquee.js';
import { initGoals } from './systems/goals.js';

import { initHeader } from './sections/00-header.js';
import { initFaq } from './sections/15-faq.js';
import { initLeadForm } from './sections/18-form.js';
import { initFooter } from './sections/19-footer.js';
import { initCases } from './pages/cases.js';

gsap.registerPlugin(ScrollTrigger);

initScroll();
initCursor();
initHeader();
initCases();   // до reveal: свёрнутые кейсы не должны получить ScrollTrigger по скрытым строкам
initReveal(document.querySelector('.dhero'));
initReveal(document.querySelector('.packs'));
initReveal(document.querySelector('.cases'));
initReveal(document.querySelector('.others'));
initFaq();     // FAQ и форма запускают reveal своих секций сами
initLeadForm();
initFooter();
initMarquee(document.querySelector('.marquee') ?? undefined);
initGoals();
initParallax();
initMagnetic();

document.fonts?.ready.then(() => ScrollTrigger.refresh());

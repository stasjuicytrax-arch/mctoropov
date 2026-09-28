// Точка входа юридических страниц (/privacy, /terms): только то, что на них есть, —
// хедер, футер и сквозные системы. Ни ScrollTrigger-сцен, ни тяжёлых секций.
import { initScroll } from './systems/lenis.js';
import { initCursor } from './systems/cursor.js';
import { initMagnetic } from './systems/interactions.js';
import { initGoals } from './systems/goals.js';
import { initCookie } from './systems/cookie.js';

import { initHeader } from './sections/00-header.js';
import { initFooter } from './sections/19-footer.js';

initScroll();
initCursor();
initHeader();
initFooter();
initGoals();
initCookie();
initMagnetic();

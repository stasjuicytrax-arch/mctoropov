// 09 · Подготовка: построчный reveal заголовка, текст — с задержкой 200 ms (тип 'fade' в reveal).
import { initReveal } from '../systems/reveal.js';

export function initPrep() {
  const section = document.querySelector('.prep');
  if (section) initReveal(section);
}

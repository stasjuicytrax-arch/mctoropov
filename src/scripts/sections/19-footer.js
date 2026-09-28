// 19 · Футер: по гигантскому вордмарку идёт волна — буквы приподнимаются вслед за курсором.
// Раньше здесь было то же искажение skew/scale, что в хедере; на кегле во всю ширину экрана
// оно читалось как «кривые буквы», клиент попросил спокойнее (правка 28.09).
import { initWordmarkWave } from './00-header.js';

export function initFooter() {
  initWordmarkWave(document.querySelector('.footer [data-wordmark]'));
}

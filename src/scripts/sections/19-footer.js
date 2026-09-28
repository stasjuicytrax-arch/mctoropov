// 19 · Футер: вордмарк искажается при наведении — тот же эффект, что в хедере.
import { initWordmarkWarp } from './00-header.js';

export function initFooter() {
  initWordmarkWarp(document.querySelector('.footer [data-wordmark]'));
}

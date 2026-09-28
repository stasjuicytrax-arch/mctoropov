// Статичный кадр 3D-объекта (ТЗ §8: на мобиле и при reduced-motion — вместо WebGL).
// Запуск при поднятом dev-сервере: node scripts/render-hero-still.mjs
import { chromium } from 'playwright-core';
import sharp from 'sharp';

const browser = await chromium.launch({ executablePath: process.env.CHROME ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const page = await browser.newPage({ viewport: { width: 1600, height: 1400 }, deviceScaleFactor: 1.5 });
await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });
await page.waitForFunction(() => typeof window.__heroStill === 'function', null, { timeout: 15000 });
const url = await page.evaluate(() => window.__heroStill());
await browser.close();

const png = Buffer.from(url.split(',')[1], 'base64');
const trimmed = await sharp(png).trim({ threshold: 1 }).toBuffer();
await sharp(trimmed)
  .resize({ width: 960, height: 960, fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .webp({ quality: 82, alphaQuality: 90 })
  .toFile('public/img/hero-still.webp');
console.log('public/img/hero-still.webp');

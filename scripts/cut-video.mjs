// Петля для блока 11 «База артиста» (ТЗ: 10–15 s, без звука, webm VP9 + mp4 фолбэк).
// Исходник — assets/video/emUalMy4-cw8FEgmK.mp4 (концерт, Стас на сцене), отрезок 3:11–3:23.
// Запуск: node scripts/cut-video.mjs
import ffmpeg from 'ffmpeg-static';
import { execFileSync } from 'node:child_process';

const SRC = 'assets/video/emUalMy4-cw8FEgmK.mp4';
const SS = '191', T = '12';
// исходник letterbox: полезная картинка 1280×620 (cropdetect), полосы по 50 px отрезаем
const VF = 'crop=1280:620:0:50,fps=25';
const run = (args) => execFileSync(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: 'inherit' });

run(['-ss', SS, '-t', T, '-i', SRC, '-an', '-vf', VF, '-c:v', 'libvpx-vp9', '-b:v', '0', '-crf', '38', '-row-mt', '1', '-deadline', 'good', '-cpu-used', '4', 'public/video/artist-loop.webm']);
run(['-ss', SS, '-t', T, '-i', SRC, '-an', '-vf', VF, '-c:v', 'libx264', '-crf', '27', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', 'public/video/artist-loop.mp4']);
run(['-ss', '196', '-i', SRC, '-frames:v', '1', '-vf', 'crop=1280:620:0:50', '-q:v', '3', 'public/video/artist-loop-poster.jpg']);
// постер для сайта — WebP (Lighthouse: modern-image-formats); jpg остаётся исходником
await (await import('sharp')).default('public/video/artist-loop-poster.jpg').webp({ quality: 72 }).toFile('public/video/artist-loop-poster.webp');
console.log('video ok');

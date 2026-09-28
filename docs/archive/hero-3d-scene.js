// 3D-объект hero (§8.6): глянцевая «жидкая» скульптура — torus knot с живой деформацией,
// хром-отражения violet → magenta → acid из токенов. Медленно вращается, реагирует на курсор до ±6°.
// Рендер останавливается, когда hero вне экрана или вкладка скрыта.
import {
  WebGLRenderer, Scene, PerspectiveCamera, TorusKnotGeometry, MeshPhysicalMaterial, Mesh,
  CanvasTexture, EquirectangularReflectionMapping, PMREMGenerator, SRGBColorSpace, ACESFilmicToneMapping,
  Color, MathUtils,
} from 'three';
import { gsap } from 'gsap';
import { token, num } from '../lib/tokens.js';

/** Окружение для отражений: вертикальные полосы фирменных цветов на тёмной базе. */
function makeEnv() {
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 512;
  const g = c.getContext('2d');
  g.fillStyle = token('--ink-900');
  g.fillRect(0, 0, c.width, c.height);

  const band = (x, w, color, alpha = 1) => {
    const grd = g.createLinearGradient(x - w, 0, x + w, 0);
    grd.addColorStop(0, 'transparent');
    grd.addColorStop(.5, color);
    grd.addColorStop(1, 'transparent');
    g.globalAlpha = alpha;
    g.fillStyle = grd;
    g.fillRect(x - w, 0, w * 2, c.height);
  };
  // горизонт: лаймовая полоса света, над ней magenta, violet — фоном
  const sky = g.createLinearGradient(0, 0, 0, c.height);
  sky.addColorStop(0, token('--violet'));
  sky.addColorStop(.42, token('--magenta'));
  sky.addColorStop(.5, token('--acid'));
  sky.addColorStop(.6, token('--ink-900'));
  sky.addColorStop(1, token('--ink-900'));
  g.globalAlpha = .9;
  g.fillStyle = sky;
  g.fillRect(0, 0, c.width, c.height);

  band(180, 60, token('--acid'), .95);
  band(430, 90, token('--magenta'), .8);
  band(700, 50, token('--white'), .9);
  band(880, 110, token('--violet'), .9);
  g.globalAlpha = 1;

  const tex = new CanvasTexture(c);
  tex.mapping = EquirectangularReflectionMapping;
  tex.colorSpace = SRGBColorSpace;
  return tex;
}

export async function mountHeroScene(canvas, hero) {
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new Scene();
  const camera = new PerspectiveCamera(32, 1, .1, 50);
  camera.position.set(0, 0, 8.6);

  const pmrem = new PMREMGenerator(renderer);
  const envTex = makeEnv();
  scene.environment = pmrem.fromEquirectangular(envTex).texture;
  envTex.dispose();
  pmrem.dispose();

  const material = new MeshPhysicalMaterial({
    color: new Color(token('--white')),
    metalness: 1,
    roughness: .14,
    clearcoat: 1,
    clearcoatRoughness: .06,
    iridescence: .35,
    iridescenceIOR: 1.6,
    envMapIntensity: 1.25,
  });

  // «жидкость»: мягкая деформация вершин по нормали
  const uniforms = { uTime: { value: 0 } };
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = uniforms.uTime;
    shader.vertexShader = 'uniform float uTime;\n' + shader.vertexShader.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
       float w = sin(position.x * 2.1 + uTime * .9) * .06
               + sin(position.y * 2.7 - uTime * 1.1) * .05
               + sin(position.z * 3.3 + uTime * .7) * .04;
       transformed += normal * w;`,
    );
  };

  const mesh = new Mesh(new TorusKnotGeometry(1.15, .38, 360, 64, 2, 3), material);
  mesh.rotation.set(.35, -.4, .1);
  mesh.position.x = .55;   // объект уходит вправо и не перекрывает дескриптор
  scene.add(mesh);

  // ---------- размер ----------
  const resize = () => {
    const { width, height } = canvas.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };
  new ResizeObserver(resize).observe(canvas);
  resize();

  // ---------- курсор: смещение до ±6° ----------
  const maxTilt = MathUtils.degToRad(num('--hero-tilt'));
  const tilt = { x: 0, y: 0 };
  const target = { x: 0, y: 0 };
  hero.addEventListener('pointermove', (e) => {
    target.y = ((e.clientX / innerWidth) - .5) * 2 * maxTilt;
    target.x = ((e.clientY / innerHeight) - .5) * 2 * maxTilt;
  }, { passive: true });

  // ---------- цикл ----------
  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(hero);

  const spin = { y: 0 };
  const render = (time) => {
    if (!visible || document.hidden) return;
    uniforms.uTime.value = time;
    spin.y += .0035;
    tilt.x += (target.x - tilt.x) * .06;
    tilt.y += (target.y - tilt.y) * .06;
    mesh.rotation.x = .35 + tilt.x + Math.sin(time * .3) * .08;
    mesh.rotation.y = -.4 + spin.y + tilt.y;
    renderer.render(scene, camera);
  };
  renderer.compile(scene, camera);
  render(0);
  gsap.ticker.add(render);

  // хук для генерации статичного кадра: /?still
  window.__heroStill = () => { render(1.2); return canvas.toDataURL('image/png'); };
}

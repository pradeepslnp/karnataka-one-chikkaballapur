/* WebGL version of the hero sheets (desktop, capable GPUs only).
   Build: `npm run build` bundles this file + the parts of three.js it uses
   into assets/js/scene3d.js. The site itself needs no build step. */
import {
  WebGLRenderer, Scene, PerspectiveCamera, PlaneGeometry, Mesh, MeshStandardMaterial,
  ShadowMaterial, CanvasTexture, SRGBColorSpace, HemisphereLight, DirectionalLight,
  PointLight, Group, PCFShadowMap, DoubleSide, MathUtils
} from "three";
import { drawSheet } from "../assets/js/sheet-art.js";

const DEG = Math.PI / 180;

export function initScene({ stage, layout, state, pose, motion }) {
  const canvas = document.createElement("canvas");
  let renderer;
  try {
    renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  } catch {
    return null;
  }
  stage.prepend(canvas);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFShadowMap;

  const scene = new Scene();
  const camera = new PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 0, 12);

  /* Lights: soft sky, a key light for shadows, the scanner bar, and the cursor light */
  scene.add(new HemisphereLight(0xdfe1ff, 0x2a2160, 1.6));
  const key = new DirectionalLight(0xffffff, 2.2);
  key.position.set(-4, 6, 9);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.radius = 9;
  key.shadow.blurSamples = 16;
  key.shadow.bias = -0.0005;
  Object.assign(key.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: 1, far: 30 });
  scene.add(key);
  const scanLight = new PointLight(0xd6dbff, 0, 9, 1.6);
  scanLight.position.set(-6, 0, 2.2);
  scene.add(scanLight);
  const cursorLight = new PointLight(0xa597ff, 4, 7, 2);
  cursorLight.position.set(0, 0, 3);
  scene.add(cursorLight);

  /* Copier glass behind the sheets: only shows their shadows */
  const glass = new Mesh(new PlaneGeometry(40, 40), new ShadowMaterial({ opacity: 0.22, color: 0x05031a }));
  glass.position.z = -3.2;
  glass.receiveShadow = true;
  scene.add(glass);

  /* Sheets: segmented planes that curl and flutter slightly */
  const group = new Group();
  scene.add(group);
  const geo = new PlaneGeometry(1, 1.414, 12, 16);
  const shared = { uTime: { value: 0 } };
  const maxAniso = renderer.capabilities.getMaxAnisotropy();

  const meshes = layout.map((s, i) => {
    const tex = new CanvasTexture(drawSheet(document.createElement("canvas"), s.kind, 512, s.seed));
    tex.colorSpace = SRGBColorSpace;
    tex.anisotropy = Math.min(8, maxAniso);
    const mat = new MeshStandardMaterial({ map: tex, roughness: 0.82, metalness: 0, side: DoubleSide });
    const local = { uCurl: { value: 0.06 + (i % 3) * 0.03 }, uPhase: { value: i * 1.9 }, uFlutter: { value: motion ? 1 : 0 } };
    mat.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, shared, local);
      sh.vertexShader = sh.vertexShader
        .replace("#include <common>", `#include <common>
          uniform float uTime; uniform float uCurl; uniform float uPhase; uniform float uFlutter;
          float sheetZ(vec3 p){ return uCurl * p.x * p.x * 2.0 + sin(uTime * 1.2 + uPhase + p.y * 2.6) * 0.022 * uFlutter * (p.y + 0.707); }`)
        .replace("#include <beginnormal_vertex>", `
          float dzx = uCurl * 4.0 * position.x;
          float dzy = 0.022 * uFlutter * (cos(uTime * 1.2 + uPhase + position.y * 2.6) * 2.6 * (position.y + 0.707) + sin(uTime * 1.2 + uPhase + position.y * 2.6));
          vec3 objectNormal = normalize(vec3(-dzx, -dzy, 1.0));
          #ifdef USE_TANGENT
            vec3 objectTangent = vec3( tangent.xyz );
          #endif`)
        .replace("#include <begin_vertex>", `vec3 transformed = vec3(position); transformed.z += sheetZ(position);`);
    };
    const m = new Mesh(geo, mat);
    m.castShadow = true;
    m.receiveShadow = true;
    m.renderOrder = i;
    group.add(m);
    return m;
  });

  /* Map stage-relative layout units to world units, matching the CSS version */
  let unitsPerPx = 0.01, sw = 1, sh = 1, cx = 0;
  const resize = () => {
    const r = canvas.getBoundingClientRect();
    const sr = stage.getBoundingClientRect();
    if (!r.width || !r.height) return;
    renderer.setSize(r.width, r.height, false);
    camera.aspect = r.width / r.height;
    camera.updateProjectionMatrix();
    const visH = 2 * camera.position.z * Math.tan((camera.fov * DEG) / 2);
    unitsPerPx = visH / r.height;
    sw = sr.width * unitsPerPx; sh = sr.height * unitsPerPx;
    cx = ((sr.left + sr.width / 2) - (r.left + r.width / 2)) * unitsPerPx;
    const cy = ((r.top + r.height / 2) - (sr.top + sr.height / 2)) * unitsPerPx;
    group.position.set(cx, cy, 0);
    const w = Math.min(sr.width * layout[0].w, sr.height * 0.48) * unitsPerPx;
    meshes.forEach(m => m.scale.set(w, w, 1));
  };
  const ro = new ResizeObserver(resize);
  ro.observe(stage);
  resize();

  const api = { onLost: null };
  canvas.addEventListener("webglcontextlost", e => { e.preventDefault(); api.onLost?.(); }, false);

  api.render = () => {
    shared.uTime.value = state.time;
    group.rotation.x = (6 - state.py * 9) * DEG;
    group.rotation.y = (-10 + state.px * 16) * DEG;

    meshes.forEach((m, i) => {
      const p = pose(layout[i], i, state.progress, state.time, motion);
      m.position.set(p.x * sw, -p.y * sh, p.z * sw);
      m.rotation.set(-p.rx * DEG, p.ry * DEG, -p.rz * DEG, "XYZ");
    });

    cursorLight.position.x = MathUtils.lerp(-3, 4, (state.px + 1) / 2) + cx;
    cursorLight.position.y = -state.py * 2.4;
    if (state.scan >= 0) {
      scanLight.position.x = MathUtils.lerp(-7, 7, state.scan);
      scanLight.intensity = 60 * Math.sin(Math.PI * Math.min(1, Math.max(0, state.scan)));
    } else scanLight.intensity = 0;

    renderer.render(scene, camera);
  };

  return api;
}

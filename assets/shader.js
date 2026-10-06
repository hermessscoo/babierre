/* Hermes V10 — hero shader (Three.js r170). Fluido domain-warped nei colori del brand. */
import * as THREE from "three";

const VERT = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;
const FRAG = `
precision highp float;
uniform float uTime; uniform vec2 uRes; uniform vec2 uMouse;
uniform vec3 uBg; uniform vec3 uAccent; uniform vec3 uSurface; uniform vec3 uFg;
varying vec2 vUv;
float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1,0)), u.x), mix(hash(i + vec2(0,1)), hash(i + vec2(1,1)), u.x), u.y); }
float fbm(vec2 p){ float v = 0.0, a = 0.5; mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 5; i++){ v += a * noise(p); p = m * p; a *= 0.5; } return v; }
void main(){
  vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  vec2 m = (uMouse - 0.5) * vec2(uRes.x / uRes.y, 1.0);
  float t = uTime * 0.05;
  vec2 q = vec2(fbm(p * 1.3 + t), fbm(p * 1.3 - t + 5.2));
  vec2 r = vec2(fbm(p * 1.7 + 3.0 * q + vec2(1.7, 9.2) + t * 1.4 + m * 0.4), fbm(p * 1.7 + 3.0 * q + vec2(8.3, 2.8) - t));
  float f = fbm(p * 1.1 + 2.6 * r);
  vec3 col = mix(uBg, uSurface, smoothstep(0.15, 0.85, f));
  col = mix(col, uAccent, smoothstep(0.35, 0.95, f * length(q) * 1.6) * 0.9);
  col += uAccent * 0.16 * smoothstep(0.5, 1.0, r.x);
  float d = length(p - m * 0.8);
  col = mix(col, uAccent, 0.16 * exp(-d * d * 4.0));
  col = mix(col, uFg, 0.04 * smoothstep(0.7, 1.0, r.y));
  col *= mix(1.0, 0.6, smoothstep(0.35, 1.25, length(p * vec2(0.8, 1.0))));
  col += (hash(gl_FragCoord.xy + fract(uTime)) - 0.5) * 0.035;
  gl_FragColor = vec4(col, 1.0);
}`;

function init() {
  const canvas = document.querySelector(".hero__canvas");
  if (!canvas) return;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: "high-performance" });
  } catch (e) {
    console.warn("[hermes] WebGL non disponibile, uso il gradiente CSS");
    canvas.remove();
    return;
  }
  THREE.ColorManagement.enabled = false;
  const css = getComputedStyle(document.documentElement);
  const col = (n) => new THREE.Color(css.getPropertyValue(n).trim() || "#000");
  const uniforms = {
    uTime: { value: Math.random() * 100 }, uRes: { value: new THREE.Vector2(1, 1) }, uMouse: { value: new THREE.Vector2(0.5, 0.5) },
    uBg: { value: col("--bg") }, uAccent: { value: col("--accent") }, uSurface: { value: col("--surface") }, uFg: { value: col("--fg") },
  };
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: FRAG, uniforms })));

  const dpr = Math.min(window.devicePixelRatio || 1, window.innerWidth < 900 ? 1 : 1.5);
  const resize = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    uniforms.uRes.value.set(w * dpr, h * dpr);
  };
  resize();
  new ResizeObserver(resize).observe(canvas);

  const target = new THREE.Vector2(0.5, 0.5);
  window.addEventListener("pointermove", (e) => target.set(e.clientX / innerWidth, 1 - e.clientY / innerHeight), { passive: true });

  let visible = true, last = performance.now(), first = true;
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; }).observe(canvas);
  const frame = (now) => {
    const dt = Math.min((now - last) / 1000, 0.05); last = now;
    if (!visible || document.hidden) return;
    uniforms.uTime.value += dt;
    uniforms.uMouse.value.lerp(target, 0.04);
    renderer.render(scene, camera);
    if (first) { first = false; canvas.classList.add("is-live"); }
  };
  if (reduce) { renderer.render(scene, camera); canvas.classList.add("is-live"); }
  else renderer.setAnimationLoop(frame);
}

try { init(); } catch (e) { console.warn("[hermes] shader disattivato:", e); }

/* Hermes V11 — object showcase: carosello 3D (dischi/card/scatole) con le immagini come texture, guidato dallo scroll. */
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const mobile = matchMedia("(max-width: 899px)").matches;

function init(sec) {
  const canvas = sec.querySelector(".showcase__canvas");
  const items = [...sec.querySelectorAll("[data-sc-item]")].map((li) => ({ title: li.dataset.title, cap: li.dataset.cap, src: li.dataset.src }));
  if (!canvas || items.length < 2 || reduce) return;
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); } catch (e) { return; }
  const shape = sec.dataset.showcase || "card";
  const css = getComputedStyle(document.documentElement);
  const surface = new THREE.Color(css.getPropertyValue("--surface").trim() || "#ddd");
  renderer.setPixelRatio(window.__HERMES_QA ? 0.5 : Math.min(devicePixelRatio, 1.6));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  const scene = new THREE.Scene();
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 0, 9);
  scene.add(new THREE.DirectionalLight(0xffffff, 1.2).translateX(2).translateY(3).translateZ(4));

  const loader = new THREE.TextureLoader();
  const rim = new THREE.MeshPhysicalMaterial({ color: 0xe8e8ec, metalness: 1, roughness: 0.18, clearcoat: 1 });
  const side = new THREE.MeshStandardMaterial({ color: surface, roughness: 0.6 });
  const objs = items.map((it) => {
    const tex = loader.load(it.src);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    const face = new THREE.MeshPhysicalMaterial({ map: tex, roughness: 0.32, clearcoat: 0.8, clearcoatRoughness: 0.15 });
    let mesh;
    if (shape === "disc") {
      mesh = new THREE.Group();
      const d = new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.25, 0.035, 128), [rim, face, face]);
      const hole = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.05, 64), new THREE.MeshPhysicalMaterial({ color: 0xf2f2f2, transmission: 0.6, roughness: 0.1, metalness: 0.4 }));
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.27, 0.035, 16, 64), rim);
      ring.rotation.x = Math.PI / 2;
      mesh.add(d, hole, ring);
      mesh.rotation.x = Math.PI / 2 - 0.55;  // disco inclinato verso la camera
    } else if (shape === "box") {
      mesh = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2, 0.6), [side, side, side, side, face, side]);
    } else {
      mesh = new THREE.Mesh(new THREE.BoxGeometry(1.7, 2.3, 0.025), [rim, rim, rim, rim, face, side]);
    }
    const holder = new THREE.Group();
    holder.add(mesh);
    scene.add(holder);
    return holder;
  });

  const resize = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  resize();
  new ResizeObserver(resize).observe(canvas);

  const st = { p: 0 };
  const step = mobile ? 2.1 : 2.55;
  const layout = (t) => {
    objs.forEach((o, i) => {
      const d = i - st.p;
      o.position.set(d * step, -d * (mobile ? 0.2 : 0.55), -Math.abs(d) * 1.1);
      o.rotation.y = -d * 0.35 + (shape === "disc" ? t * 0.15 : Math.sin(t * 0.6 + i) * 0.06);
      o.rotation.z = shape === "disc" ? 0 : d * 0.04;
      const s = 1 - Math.min(Math.abs(d), 2) * 0.12;
      o.scale.setScalar(s);
    });
  };
  const info = { idx: sec.querySelector("[data-sc-idx]"), title: sec.querySelector("[data-sc-title]"), cap: sec.querySelector("[data-sc-cap]") };
  const ringEl = sec.querySelector(".showcase__ring path");
  let active = -1;
  const setActive = (i) => {
    if (i === active) return;
    active = i;
    const it = items[i];
    info.idx.textContent = String(i + 1).padStart(2, "0") + " / " + String(items.length).padStart(2, "0");
    info.title.textContent = it.title;
    info.cap.textContent = it.cap || "";
    if (window.gsap) {
      window.gsap.fromTo([info.title, info.cap], { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, stagger: 0.05, ease: "power3.out" });
      if (ringEl) {
        const len = ringEl.getTotalLength();
        window.gsap.fromTo(ringEl, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: 1.1, ease: "power2.inOut" });
      }
    }
  };
  sec.classList.add("is-3d");
  setActive(0);
  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; }).observe(sec);
  renderer.setAnimationLoop((now) => {
    if (!visible || document.hidden) return;
    layout(now / 1000);
    renderer.render(scene, camera);
  });

  const start = () => {
    const gsap = window.gsap, ST = window.ScrollTrigger;
    if (!gsap || !ST) return;
    const pin = sec.querySelector(".showcase__pin");
    gsap.to(st, { p: items.length - 1, ease: "none",
      scrollTrigger: { trigger: pin, start: "top top", end: "+=" + (items.length * 70) + "%", pin: true, scrub: 0.8, anticipatePin: 1,
        snap: { snapTo: 1 / (items.length - 1), duration: 0.5, ease: "power2.inOut" },
        onUpdate: () => setActive(Math.round(st.p)) } });
    ST.refresh();
  };
  if (window.__hermesReady) start();
  else { const t = setInterval(() => { if (window.__hermesReady) { clearInterval(t); start(); } }, 120); setTimeout(() => clearInterval(t), 10000); }
}

document.querySelectorAll("[data-showcase]").forEach((s) => { try { init(s); } catch (e) { console.warn("[hermes] showcase off", e); } });

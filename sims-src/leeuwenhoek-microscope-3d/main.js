/*
 * Leeuwenhoek's microscope – 3D viewer, v1.0.0.
 * Source of public/sims/leeuwenhoek-microscope-3d/1.0.0/viewer.js (bundled by scripts/build-sim-bundles.mjs).
 * Talks to the platform only through the SLL bridge (protocol v1, capability level 3).
 */
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import {
  PLATE, LENS, RIVETS, MOUNT, LONG_SCREW, PIN_PATH, RANGES, PARTS, VIEWS, clamp, specimenAligned,
} from "./model.js";

const SIM_ID = "leeuwenhoek-microscope-3d";
const VERSION = "1.0.0";

const STRINGS = {
  he: {
    title: "המיקרוסקופ של ליווינהוק בתלת-ממד",
    canvas: "מודל תלת-ממדי של המיקרוסקופ של ליווינהוק. אפשר לסובב אותו בגרירה ולהגדיל בצביטה או בגלגלת, או להשתמש בכפתורים.",
    hint: "גררו כדי לסובב, צבטו או גללו כדי להגדיל",
    views: "מבטים",
    back: "מאחור – צד הדגימה",
    front: "מלפנים – צד העין",
    side: "מהצד",
    rotateLeft: "סיבוב שמאלה",
    rotateRight: "סיבוב ימינה",
    auto: "סיבוב אוטומטי",
    parts: "חלקי המיקרוסקופ",
    partsHint: "בחרו חלק כדי לראות אותו מודגש ולקרוא מה תפקידו.",
    adjust: "נסו להשתמש בו",
    height: "בורג המיקום: גובה הבמה",
    distance: "בורג המיקוד: מרחק מהעדשה",
    aligned: "הדגימה בדיוק מול העדשה – אפשר להסתכל!",
    notAligned: "הדגימה לא מול העדשה. הזיזו את הברגים עד שתהיה.",
    scale: "בגודל אמיתי הלוחות באורך של כ-5 ס\"מ בלבד.",
    model: "שחזור תלת-ממדי ללימוד: הפרופורציות לפי צילום של העתק מדויק (Jeroen Rouwkema, ויקימדיה, CC BY-SA 3.0), והחלקים שלא רואים בצילום הושלמו לפי תיאור המכשירים ששרדו.",
    noWebgl: "התצוגה התלת-ממדית לא נתמכת במכשיר הזה. הנה צילום של המכשיר, והסבר על החלקים למטה.",
    photoAlt: "צילום של העתק מדויק של המיקרוסקופ של ליווינהוק, מאחור",
    viewShown: { back: "מוצג מאחור, מצד הדגימה.", front: "מוצג מלפנים, מצד העין.", side: "מוצג מהצד." },
  },
  en: {
    title: "Leeuwenhoek's microscope in 3D",
    canvas: "3D model of Leeuwenhoek's microscope. Drag to rotate and pinch or scroll to zoom, or use the buttons.",
    hint: "Drag to rotate, pinch or scroll to zoom",
    views: "Views",
    back: "Back – specimen side",
    front: "Front – eye side",
    side: "Side",
    rotateLeft: "Rotate left",
    rotateRight: "Rotate right",
    auto: "Auto-rotate",
    parts: "Parts of the microscope",
    partsHint: "Choose a part to highlight it and read what it does.",
    adjust: "Try using it",
    height: "Positioning screw: mount height",
    distance: "Focusing screw: distance from the lens",
    aligned: "The specimen is right in front of the lens – you can look!",
    notAligned: "The specimen is not in front of the lens. Move the screws until it is.",
    scale: "In real life the plates are only about 5 cm long.",
    model: "A 3D reconstruction for teaching: proportions from a photo of an exact replica (Jeroen Rouwkema, Wikimedia Commons, CC BY-SA 3.0); parts the photo does not show are completed from descriptions of the surviving instruments.",
    noWebgl: "3D is not supported on this device. Here is a photo of the instrument, and the parts are explained below.",
    photoAlt: "Photo of an exact replica of Leeuwenhoek's microscope, from the back",
    viewShown: { back: "Shown from the back, the specimen side.", front: "Shown from the front, the eye side.", side: "Shown from the side." },
  },
};

const state = {
  locale: "he",
  part: null,
  height: 0,
  distance: 0,
  auto: true,
  partsExplored: [],
  viewsSeen: [],
  alignedAfterMoving: 0,
  moved: false,
};

const el = (id) => document.getElementById(id);
const t = (k) => STRINGS[state.locale][k];
const addOnce = (list, v) => { if (!list.includes(v)) list.push(v); };
const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
if (reduceMotion) state.auto = false;

// ---------------------------------------------------------------- 3D scene
let renderer = null;
try {
  const canvas = document.createElement("canvas");
  const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
  if (gl) renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: false });
} catch {
  renderer = null;
}

const scene = new THREE.Scene();
scene.background = new THREE.Color("#EEF2F7");
const camera = new THREE.PerspectiveCamera(32, 4 / 3, 1, 1000);
const partMeshes = Object.fromEntries(PARTS.map((p) => [p.id, []]));
const movable = new THREE.Group(); // mount, pin, knob, focusing screw: moved by the two screws
const focusGroup = new THREE.Group(); // the part the focusing screw moves (towards / away from the lens)
let controls = null;
let longScrewThreads = null;

function brass(shade = "#B8964A") {
  return new THREE.MeshStandardMaterial({ color: shade, metalness: 0.85, roughness: 0.32 });
}
function steel(shade = "#6E6A62") {
  return new THREE.MeshStandardMaterial({ color: shade, metalness: 0.8, roughness: 0.38 });
}
function add(part, mesh, parent = scene) {
  mesh.userData.part = part;
  mesh.material = mesh.material.clone(); // own material, so it can be highlighted alone
  partMeshes[part].push(mesh);
  parent.add(mesh);
  return mesh;
}
function box(x0, x1, y0, y1, z0, z1, material) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), material);
  m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  return m;
}
function threadedRod(x, z, y0, y1, r, material, axis = "y") {
  const g = new THREE.Group();
  const len = y1 - y0;
  const core = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.82, r * 0.82, len, 16), material);
  g.add(core);
  const n = Math.max(2, Math.floor(len / 0.5));
  const rings = new THREE.InstancedMesh(new THREE.TorusGeometry(r * 0.86, r * 0.18, 6, 16), material, n);
  const m4 = new THREE.Matrix4();
  for (let i = 0; i < n; i++) {
    m4.makeRotationX(Math.PI / 2);
    m4.setPosition(0, -len / 2 + (i + 0.5) * (len / n), 0);
    rings.setMatrixAt(i, m4);
  }
  g.add(rings);
  if (axis === "y") g.position.set(x, (y0 + y1) / 2, z);
  return { group: g, core, rings };
}

function roundedPlateGeometry(depth) {
  const { width: w, height: h, cornerRadius: r } = PLATE;
  const s = new THREE.Shape();
  s.moveTo(-w / 2 + r, -h / 2);
  s.lineTo(w / 2 - r, -h / 2);
  s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r);
  s.lineTo(w / 2, h / 2 - r);
  s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2);
  s.lineTo(-w / 2 + r, h / 2);
  s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r);
  s.lineTo(-w / 2, -h / 2 + r);
  s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
  const hole = new THREE.Path();
  hole.absarc(LENS.x, LENS.y, LENS.holeRadius, 0, Math.PI * 2, true);
  s.holes.push(hole);
  return new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.08, bevelSegments: 2, curveSegments: 24 });
}

function buildModel() {
  // Plates: back plate z ∈ [-0.8, 0], front plate z ∈ [-1.6, -0.8].
  const back = add("plates", new THREE.Mesh(roundedPlateGeometry(PLATE.thickness), brass("#BF9D52")));
  back.position.z = -PLATE.thickness;
  const front = add("plates", new THREE.Mesh(roundedPlateGeometry(PLATE.thickness), brass("#B08C42")));
  front.position.z = -2 * PLATE.thickness;

  // Lens: a glass bead between the plates, with a raised socket ring on each face.
  const glass = new THREE.MeshPhysicalMaterial({ color: "#DCEBFA", metalness: 0, roughness: 0.05, transmission: 0.9, thickness: 0.5, ior: 1.52, clearcoat: 1 });
  const bead = add("lens", new THREE.Mesh(new THREE.SphereGeometry(LENS.radius, 32, 16), glass));
  bead.position.set(LENS.x, LENS.y, -PLATE.thickness);
  for (const z of [0.12, -2 * PLATE.thickness - 0.12]) {
    const ring = add("lens", new THREE.Mesh(new THREE.TorusGeometry(1.05, 0.28, 12, 32), brass("#CDAE66")));
    ring.position.set(LENS.x, LENS.y, z);
  }

  // Rivets: through both plates, domed heads on both faces.
  for (const [x, y] of RIVETS) {
    for (const z of [0.02, -2 * PLATE.thickness - 0.02]) {
      const head = add("rivets", new THREE.Mesh(new THREE.SphereGeometry(0.9, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), brass("#D2B36C")));
      head.position.set(x, y, z);
      head.rotation.x = z > 0 ? Math.PI / 2 : -Math.PI / 2;
      head.scale.set(1, 0.35, 1);
    }
  }

  // Bracket: runs behind the plate up to its fixing screw, then an L-foot that carries the long screw.
  add("bracket", box(-3.6, 0.4, -31, -16, 0.15, 1.15, brass("#A9883E")));
  add("bracket", box(-3.6, 7.6, -33, -31, 0.15, 3.9, brass("#A9883E")));
  const fixHead = add("bracket", new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.5, 20), steel()));
  fixHead.rotation.x = Math.PI / 2;
  fixHead.position.set(-1.6, -17.5, -2 * PLATE.thickness - 0.25);
  const nut = add("bracket", new THREE.Mesh(new THREE.CylinderGeometry(1.25, 1.25, 0.8, 6), steel("#5B5751")));
  nut.rotation.x = Math.PI / 2;
  nut.position.set(-1.6, -17.5, 1.55);

  // Long positioning screw: fixed in the bracket; it turns when the mount moves.
  const ls = threadedRod(LONG_SCREW.x, LONG_SCREW.z, LONG_SCREW.y0, LONG_SCREW.y1, LONG_SCREW.radius, steel());
  ls.group.children.forEach((c) => add("longScrew", c, ls.group));
  ls.group.userData.part = "longScrew";
  scene.add(ls.group);
  longScrewThreads = ls.group;

  // Everything the screws move.
  scene.add(movable);
  movable.add(focusGroup);
  add("mount", box(MOUNT.x0, MOUNT.x1, MOUNT.y0, MOUNT.y1, MOUNT.z0, MOUNT.z1, brass("#C4A257")), focusGroup);
  add("mount", box(0.8, 3, 1.5, 9, 1, 2.6, brass("#B9984F")), focusGroup); // pin holder post
  const pinThread = threadedRod(1.9, 1.8, -1.7, 1.5, 0.6, steel());
  pinThread.group.children.forEach((c) => add("pin", c, pinThread.group));
  focusGroup.add(pinThread.group);

  // Specimen pin, curving to just behind the lens, with the specimen on its tip.
  const curve = new THREE.CatmullRomCurve3(PIN_PATH.map(([x, y, z]) => new THREE.Vector3(x, y, z)));
  add("pin", new THREE.Mesh(new THREE.TubeGeometry(curve, 40, 0.18, 8, false), steel("#7B776F")), focusGroup);
  const tip = PIN_PATH[PIN_PATH.length - 1];
  const specimen = add("pin", new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 8), new THREE.MeshStandardMaterial({ color: "#C8862E", roughness: 0.6 })), focusGroup);
  specimen.position.set(tip[0], tip[1], tip[2]);

  // Turning handle: a rod from the post with a brass ball.
  const rod = add("knob", new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 3.4, 12), brass("#C9A85C")), focusGroup);
  rod.rotation.z = Math.PI / 2;
  rod.position.set(4.6, 3.3, 1.8);
  const ball = add("knob", new THREE.Mesh(new THREE.SphereGeometry(1.7, 24, 16), brass("#D0AE60")), focusGroup);
  ball.position.set(6.6, 3.3, 1.8);

  // Focusing screw with its wing handle.
  const fs = new THREE.Group();
  const fsRod = threadedRod(0, 0, 0, 3.2, 0.5, steel());
  fsRod.group.rotation.z = -Math.PI / 2;
  fsRod.group.position.set(MOUNT.x1 + 1.6, -3.8, 1.9);
  fsRod.group.children.forEach((c) => add("focusScrew", c, fsRod.group));
  fs.add(fsRod.group);
  const wing = new THREE.Shape();
  wing.moveTo(0, -0.5);
  wing.quadraticCurveTo(3, -1.6, 6.5, -1.2);
  wing.quadraticCurveTo(7.4, 0, 6.2, 1.1);
  wing.quadraticCurveTo(3, 0.9, 0, 0.5);
  wing.lineTo(0, -0.5);
  const wingMesh = add("focusScrew", new THREE.Mesh(new THREE.ExtrudeGeometry(wing, { depth: 0.5, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.1, bevelSegments: 2 }), brass("#A7843A")), fs);
  wingMesh.position.set(MOUNT.x1 + 3.1, -3.8, 1.65);
  wingMesh.rotation.z = -0.35;
  movable.add(fs);
}

function frameView(view, instant) {
  const target = new THREE.Vector3(1.5, -8, 1);
  const d = 138;
  const pos = {
    back: new THREE.Vector3(10, 6, d),
    front: new THREE.Vector3(-10, 6, -d),
    side: new THREE.Vector3(d, 10, 8),
  }[view];
  addOnce(state.viewsSeen, view);
  el("live").textContent = t("viewShown")[view];
  report();
  if (!controls) return;
  if (instant || reduceMotion) {
    camera.position.copy(pos);
    controls.target.copy(target);
    controls.update();
    return;
  }
  const from = camera.position.clone();
  const fromT = controls.target.clone();
  const start = performance.now();
  const step = (now) => {
    const k = Math.min(1, (now - start) / 700);
    const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    camera.position.lerpVectors(from, pos, e);
    controls.target.lerpVectors(fromT, target, e);
    controls.update();
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function highlight() {
  for (const p of PARTS) {
    for (const m of partMeshes[p.id]) {
      const on = state.part === p.id;
      m.material.emissive = new THREE.Color(on ? "#FFB020" : "#000000");
      m.material.emissiveIntensity = on ? 0.55 : 0;
    }
  }
}

function applyAdjustments() {
  movable.position.y = clamp(state.height, RANGES.height);
  focusGroup.position.z = clamp(state.distance, RANGES.distance);
  if (longScrewThreads) longScrewThreads.rotation.y = state.height * 2.2;
  const ok = specimenAligned(state.height, state.distance);
  if (ok && state.moved) state.alignedAfterMoving = 1;
  const status = el("aligned");
  status.textContent = ok ? t("aligned") : t("notAligned");
  status.className = ok ? "status ok" : "status";
}

// ---------------------------------------------------------------- UI
function renderParts() {
  const list = el("parts");
  list.textContent = "";
  for (const p of PARTS) {
    const li = document.createElement("li");
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = state.locale === "he" ? p.he : p.en;
    b.setAttribute("aria-pressed", String(state.part === p.id));
    b.dataset.part = p.id;
    b.addEventListener("click", () => choosePart(p.id));
    li.appendChild(b);
    list.appendChild(li);
  }
  const p = PARTS.find((x) => x.id === state.part);
  el("part-text").textContent = p ? (state.locale === "he" ? p.textHe : p.textEn) : t("partsHint");
}

function choosePart(id) {
  state.part = state.part === id ? null : id;
  if (state.part) {
    addOnce(state.partsExplored, id);
    const p = PARTS.find((x) => x.id === id);
    setAuto(false);
    frameView(p.view);
  }
  highlight();
  renderParts();
  report();
}

function setAuto(on) {
  state.auto = on && !reduceMotion;
  if (controls) controls.autoRotate = state.auto;
  el("auto").setAttribute("aria-pressed", String(state.auto));
}

function rotateBy(angle) {
  if (!controls) return;
  setAuto(false);
  const offset = camera.position.clone().sub(controls.target);
  offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), angle);
  camera.position.copy(controls.target).add(offset);
  controls.update();
}

function applyLocale() {
  document.documentElement.lang = state.locale;
  document.documentElement.dir = state.locale === "he" ? "rtl" : "ltr";
  document.title = t("title");
  document.querySelectorAll("[data-i18n]").forEach((n) => {
    const v = t(n.getAttribute("data-i18n"));
    if (typeof v === "string") n.textContent = v;
  });
  el("stage").setAttribute("aria-label", t("canvas"));
  const img = el("fallback-img");
  if (img) img.alt = t("photoAlt");
  renderParts();
  applyAdjustments();
}

function report() {
  bridge.reportObservables({
    partsExplored: state.partsExplored.slice(),
    partsExploredCount: state.partsExplored.length,
    viewsSeen: state.viewsSeen.slice(),
    specimenAligned: specimenAligned(state.height, state.distance) ? 1 : 0,
    alignedAfterMoving: state.alignedAfterMoving,
  });
}

// ---------------------------------------------------------------- start
const bridge = window.SLL.connect({
  simId: SIM_ID,
  version: VERSION,
  capabilityLevel: 3,
  onInit(init) {
    state.locale = init.locale;
    state.part = null;
    state.partsExplored = [];
    state.viewsSeen = [];
    state.alignedAfterMoving = 0;
    state.moved = false;
    state.height = 0;
    state.distance = 0;
    el("height").value = "0";
    el("distance").value = "0";
    highlight();
    applyLocale();
    report();
  },
  onSetParams() {},
});
if (bridge.standalone && new URLSearchParams(location.search).get("lang") === "en") state.locale = "en";

for (const v of VIEWS) el(`view-${v}`).addEventListener("click", () => { setAuto(false); frameView(v); });
el("rot-left").addEventListener("click", () => rotateBy(-Math.PI / 6));
el("rot-right").addEventListener("click", () => rotateBy(Math.PI / 6));
el("auto").addEventListener("click", () => setAuto(!state.auto));
el("height").addEventListener("input", (e) => { state.height = Number(e.target.value); state.moved = true; applyAdjustments(); report(); });
el("distance").addEventListener("input", (e) => { state.distance = Number(e.target.value); state.moved = true; applyAdjustments(); report(); });

if (renderer) {
  const stage = el("stage");
  stage.appendChild(renderer.domElement);
  renderer.domElement.setAttribute("aria-hidden", "true");
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  const sun = new THREE.DirectionalLight("#FFFFFF", 1.2);
  sun.position.set(60, 80, 90);
  const fill = new THREE.DirectionalLight("#FFF4E0", 0.9);
  fill.position.set(-50, 40, -90); // the eye side
  scene.add(sun, fill, new THREE.HemisphereLight("#FFFFFF", "#8899AA", 0.6));
  buildModel();

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = !reduceMotion;
  controls.minDistance = 35;
  controls.maxDistance = 220;
  controls.autoRotateSpeed = 1.6;
  controls.addEventListener("start", () => setAuto(false));
  frameView("back", true);
  setAuto(state.auto);

  const resize = () => {
    const w = stage.clientWidth;
    // The instrument is tall and narrow: on narrow screens the frame is taller than wide.
    const h = Math.round(w < 520 ? w * 1.2 : w * 0.75);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(w, h, false);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "auto";
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  new ResizeObserver(resize).observe(stage);
  resize();
  renderer.setAnimationLoop(() => {
    if (document.hidden) return;
    controls.update();
    renderer.render(scene, camera);
  });
  document.body.classList.add("has-3d");
} else {
  document.body.classList.add("no-3d");
}

applyLocale();
report();

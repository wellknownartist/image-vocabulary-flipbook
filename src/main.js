import * as THREE from 'three';
import './styles.css';

const artworkBase = import.meta.env.BASE_URL || './';
const pages = [
  { type: 'cover', title: 'Image Vocabulary', subtitle: 'A typographic artist’s book' },
  { type: 'intro', title: 'Image Vocabulary', subtitle: 'four spatial reconstructions' },
  { type: 'art', src: `${artworkBase}artworks/pool-house.png`, alt: 'Typographic reconstruction: house by a pool' },
  { type: 'art', src: `${artworkBase}artworks/son-of-man.png`, alt: 'Typographic reconstruction: Son of Man' },
  { type: 'art', src: `${artworkBase}artworks/romantic-landscape.png`, alt: 'Typographic reconstruction: romantic landscape' },
  { type: 'art', src: `${artworkBase}artworks/reprint-300dpi.png`, alt: 'Typographic reconstruction extracted at print quality' },
  { type: 'colophon', title: 'Image Vocabulary', subtitle: '210 × 210 mm · digital maquette' }
];

const app = document.querySelector('#app');
app.innerHTML = `
  <canvas id="three-stage" aria-hidden="true"></canvas>
  <main class="experience">
    <header class="masthead"><span>Image Vocabulary</span><span>Artist’s book / 210 × 210 mm</span></header>
    <section class="viewer" aria-label="Interactive artist’s book">
      <div class="book-shell" id="book-shell">
        <div class="book-shadow"></div><div class="page-block block-left"></div><div class="page-block block-right"></div>
        <div class="spine"></div>
        <div class="spread"><div class="page left-page" id="left-page"></div><div class="page right-page" id="right-page"></div></div>
        <div class="turning-page" id="turning-page"><div class="page-face front" id="turn-front"></div><div class="page-face back" id="turn-back"></div></div>
      </div>
    </section>
    <nav class="controls" aria-label="Book navigation">
      <button id="previous" aria-label="Previous spread">← <span>Previous</span></button>
      <div class="folio" id="folio" aria-live="polite"></div>
      <button id="next" aria-label="Next spread"><span>Next</span> →</button>
    </nav>
    <p class="gesture-note">Drag a page corner or use the controls</p>
  </main>`;

const leftPage = document.querySelector('#left-page');
const rightPage = document.querySelector('#right-page');
const flipper = document.querySelector('#turning-page');
const turnFront = document.querySelector('#turn-front');
const turnBack = document.querySelector('#turn-back');
const previous = document.querySelector('#previous');
const next = document.querySelector('#next');
const folio = document.querySelector('#folio');
const book = document.querySelector('#book-shell');
let spread = 0;
let busy = false;
let gesture = null;

function pageMarkup(page) {
  if (!page) return '<div class="quiet-page"></div>';
  if (page.type === 'art') return `<div class="art-page"><img src="${page.src}" alt="${page.alt}" draggable="false"></div>`;
  if (page.type === 'cover') return `<div class="cover-page"><p class="cover-kicker">Image Vocabulary</p><h1>IMAGE<br>VOCABULARY</h1><div class="cover-rule"></div><p class="cover-subtitle">An artist’s book of<br>typographic reconstructions</p><p class="cover-foot">210 × 210 mm</p></div>`;
  if (page.type === 'intro') return `<div class="intro-page"><p class="small-cap">Image Vocabulary</p><h2>Reading pictures<br>through words</h2><p>Four typographic fields, each preserving the spatial syntax of an original work.</p><p class="page-number">01</p></div>`;
  return `<div class="colophon-page"><p class="small-cap">Image Vocabulary</p><h2>Four interior plates</h2><p>Digital flipbook edition<br>210 × 210 mm</p><p class="page-number">—</p></div>`;
}

function render() {
  const base = spread * 2;
  leftPage.innerHTML = pageMarkup(pages[base]);
  rightPage.innerHTML = pageMarkup(pages[base + 1]);
  folio.textContent = `Spread ${String(spread + 1).padStart(2, '0')} / ${String(Math.ceil(pages.length / 2)).padStart(2, '0')}`;
  previous.disabled = spread === 0 || busy;
  next.disabled = spread >= Math.ceil(pages.length / 2) - 1 || busy;
}

function turn(direction) {
  const max = Math.ceil(pages.length / 2) - 1;
  if (busy || (direction > 0 && spread >= max) || (direction < 0 && spread <= 0)) return;
  busy = true;
  const current = spread * 2;
  const target = (spread + direction) * 2;
  if (direction > 0) {
    turnFront.innerHTML = pageMarkup(pages[current + 1]);
    turnBack.innerHTML = pageMarkup(pages[target]);
    flipper.className = 'turning-page active forward';
  } else {
    turnFront.innerHTML = pageMarkup(pages[current]);
    turnBack.innerHTML = pageMarkup(pages[target + 1]);
    flipper.className = 'turning-page active backward';
  }
  window.setTimeout(() => {
    spread += direction;
    flipper.className = 'turning-page';
    render(); busy = false; render();
  }, 710);
}

previous.addEventListener('click', () => turn(-1));
next.addEventListener('click', () => turn(1));
document.addEventListener('keydown', (event) => { if (event.key === 'ArrowLeft') turn(-1); if (event.key === 'ArrowRight') turn(1); });

book.addEventListener('pointerdown', (event) => {
  if (busy) return;
  gesture = { x: event.clientX, y: event.clientY };
  book.setPointerCapture?.(event.pointerId);
  book.classList.add('dragging');
});
book.addEventListener('pointerup', (event) => {
  if (!gesture || busy) return;
  const dx = event.clientX - gesture.x;
  const dy = event.clientY - gesture.y;
  book.classList.remove('dragging'); gesture = null;
  if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy)) turn(dx < 0 ? 1 : -1);
});
book.addEventListener('pointercancel', () => { gesture = null; book.classList.remove('dragging'); });

// A subtle Three.js stage gives the book a softly lit, physical ground plane.
const canvas = document.querySelector('#three-stage');
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(33, 1, 0.1, 30);
camera.position.set(0, 0.5, 6);
const plane = new THREE.Mesh(new THREE.PlaneGeometry(7.6, 4.4), new THREE.MeshBasicMaterial({ color: 0x938878, transparent: true, opacity: 0.14 }));
plane.rotation.x = -0.02; scene.add(plane);
const glow = new THREE.Mesh(new THREE.CircleGeometry(1.9, 64), new THREE.MeshBasicMaterial({ color: 0xf9f4e9, transparent: true, opacity: 0.22 }));
glow.position.z = 0.01; scene.add(glow);
function resizeStage() { const { innerWidth: w, innerHeight: h } = window; renderer.setSize(w, h, false); renderer.setPixelRatio(Math.min(devicePixelRatio, 2)); camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.render(scene, camera); }
window.addEventListener('resize', resizeStage); resizeStage(); render();

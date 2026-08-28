// ETCH VALLEY - script.js
// Flexbox grid, left-click + drag to paint (no hover paint), pencil color picker + rainbow

const container = document.getElementById('container');
const newGridBtn = document.getElementById('new-grid-btn');
const clearBtn = document.getElementById('clear-btn');
const eraserBtn = document.getElementById('eraser-btn');
const classicBtn = document.getElementById('mode-classic');
const rainbowBtn = document.getElementById('mode-rainbow');
const sizeSlider = document.getElementById('size-slider');
const sliderValue = document.getElementById('slider-value');
const sizeDisplay = document.getElementById('size-display');
const frameTitleText = document.getElementById('frame-title-text');
const coordsEl = document.getElementById('coords');
const modal = document.getElementById('field-modal');
const modalInput = document.getElementById('modal-input');
const modalCancel = document.getElementById('modal-cancel');
const modalConfirm = document.getElementById('modal-confirm');
const modalError = document.getElementById('modal-error');
const pencilColorInput = document.getElementById('pencil-color');
const colorSwatch = document.getElementById('color-swatch');

let currentSize = 16;
let currentMode = 'classic'; // 'classic' | 'rainbow' | 'eraser'
let isDrawing = false; // true only while left button held
let pencilColor = '#2b1d12';

function hexToRgb(hex) {
  hex = hex.replace('#','');
  if (hex.length === 3) hex = hex.split('').map(c=>c+c).join('');
  const n = parseInt(hex, 16);
  return { r:(n>>16)&255, g:(n>>8)&255, b:n&255 };
}

function randomRGB() {
  const r = Math.floor(Math.random() * 256);
  const g = Math.floor(Math.random() * 256);
  const b = Math.floor(Math.random() * 256);
  return { r, g, b, str: `rgb(${r}, ${g}, ${b})` };
}

function updateLabels(size) {
  sizeDisplay.textContent = `${size} × ${size}`;
  sliderValue.textContent = size;
  sizeSlider.value = size;
  frameTitleText.textContent = `FIELD - ${size} × ${size} - ${size * size} TILES`;
  modalInput.value = size;
}

function createGrid(size) {
  // validate
  size = parseInt(size, 10);
  if (isNaN(size) || size < 1) size = 16;
  if (size > 100) size = 100;
  if (size < 4) size = 4;

  currentSize = size;
  updateLabels(size);

  // clear existing
  container.innerHTML = '';
  container.classList.add('show-grid');
  container.classList.remove('no-grid');

  const total = size * size;
  const cellSize = `calc(100% / ${size})`;

  // use DocumentFragment for performance
  const frag = document.createDocumentFragment();

  for (let i = 0; i < total; i++) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.style.flexBasis = cellSize;
    cell.style.width = cellSize;
    // track state for eraser
    cell.dataset.r = '';
    cell.dataset.g = '';
    cell.dataset.b = '';

    // coordinates for status bar (optional)
    const x = (i % size) + 1;
    const y = Math.floor(i / size) + 1;
    cell.dataset.x = x;
    cell.dataset.y = y;

    // paint only while left button held - no hover paint
    cell.addEventListener('mouseenter', handleCellEnter);
    cell.addEventListener('mousedown', handleCellEnter);
    // for touch, prevent scrolling
    cell.addEventListener('touchmove', (e) => {
      // touchmove will be handled via elementFromPoint in container touch handler
      e.preventDefault();
    }, { passive: false });

    // coords display
    cell.addEventListener('mouseenter', () => {
      coordsEl.textContent = `x: ${x} y: ${y}`;
    });

    frag.appendChild(cell);
  }

  container.appendChild(frag);
}

function paintCell(cell) {
  if (!cell || !cell.classList.contains('cell')) return;

  if (currentMode === 'eraser') {
    cell.style.backgroundColor = 'transparent';
    cell.dataset.r = '';
    cell.dataset.g = '';
    cell.dataset.b = '';
    return;
  }

  if (currentMode === 'rainbow') {
    const { r, g, b } = randomRGB();
    cell.dataset.r = r;
    cell.dataset.g = g;
    cell.dataset.b = b;
    cell.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
  } else {
    // classic (pencil): use chosen color as is
    const picked = hexToRgb(pencilColor);
    cell.dataset.r = picked.r;
    cell.dataset.g = picked.g;
    cell.dataset.b = picked.b;
    cell.style.backgroundColor = `rgb(${picked.r}, ${picked.g}, ${picked.b})`;
  }
}

function handleCellEnter(e) {
  // ONLY paint while left button is held - no hover painting
  if (!isDrawing) return;
  // extra guard: ensure left button
  if (e.buttons !== undefined && e.buttons !== 1 && e.type === 'mouseenter') return;
  if (e.type === 'mousedown' && e.button !== undefined && e.button !== 0) return;
  paintCell(e.currentTarget);
}

// container-level drawing handlers for smooth drag - left click only
container.addEventListener('mousedown', (e) => {
  if (e.button !== 0) return; // only left click
  isDrawing = true;
  // prevent text selection / drag
  e.preventDefault();
  const cell = e.target.closest('.cell');
  if (cell) paintCell(cell);
});
window.addEventListener('mouseup', (e) => {
  if (e.button !== undefined && e.button !== 0) return;
  isDrawing = false;
});
container.addEventListener('mouseover', (e) => {
  if (!isDrawing) return;
  const cell = e.target.closest('.cell');
  if (cell) paintCell(cell);
});
container.addEventListener('mouseleave', () => {
  coordsEl.textContent = 'x: -- y: --';
});
// prevent right-click menu on canvas so drag isn't interrupted
container.addEventListener('contextmenu', (e) => e.preventDefault());
// if mouse leaves window while held, stop drawing
window.addEventListener('dragend', () => { isDrawing = false; });
window.addEventListener('mouseleave', () => { isDrawing = false; });

// touch support: drag finger to paint
container.addEventListener('touchstart', (e) => {
  isDrawing = true;
  const touch = e.touches[0];
  const el = document.elementFromPoint(touch.clientX, touch.clientY);
  const cell = el && el.closest ? el.closest('.cell') : null;
  if (cell && container.contains(cell)) paintCell(cell);
  e.preventDefault();
}, { passive: false });

container.addEventListener('touchmove', (e) => {
  const touch = e.touches[0];
  const el = document.elementFromPoint(touch.clientX, touch.clientY);
  const cell = el && el.closest ? el.closest('.cell') : null;
  if (cell && container.contains(cell)) paintCell(cell);
  e.preventDefault();
}, { passive: false });

window.addEventListener('touchend', () => { isDrawing = false; });

// controls
function setMode(mode) {
  currentMode = mode;
  classicBtn.classList.toggle('active', mode === 'classic');
  rainbowBtn.classList.toggle('active', mode === 'rainbow');
  eraserBtn.classList.toggle('active', mode === 'eraser');
  // visual feedback: update cursor maybe?
}

classicBtn.addEventListener('click', () => setMode('classic'));
rainbowBtn.addEventListener('click', () => setMode('rainbow'));
eraserBtn.addEventListener('click', () => {
  if (currentMode === 'eraser') setMode('classic');
  else setMode('eraser');
});

// pencil color picker
function syncSwatch(){
  if (colorSwatch) colorSwatch.style.background = pencilColor;
  // also tint the pencil button icon to chosen color
  const icon = classicBtn.querySelector('i');
  if (icon) icon.style.background = pencilColor;
}
if (pencilColorInput) {
  pencilColor = pencilColorInput.value;
  syncSwatch();
  pencilColorInput.addEventListener('input', (e) => {
    pencilColor = e.target.value;
    syncSwatch();
    // auto-switch to pencil mode when picking a color
    setMode('classic');
  });
  pencilColorInput.addEventListener('change', (e) => {
    pencilColor = e.target.value;
    syncSwatch();
    setMode('classic');
  });
  // clicking swatch area also switches to pencil
  const pickLabel = document.querySelector('.color-pick');
  if (pickLabel) pickLabel.addEventListener('click', () => setMode('classic'));
}

clearBtn.addEventListener('click', () => {
  createGrid(currentSize);
});

sizeSlider.addEventListener('input', (e) => {
  sliderValue.textContent = e.target.value;
  sizeDisplay.textContent = `${e.target.value} × ${e.target.value}`;
  frameTitleText.textContent = `FIELD - ${e.target.value} × ${e.target.value} - ${e.target.value * e.target.value} TILES`;
});

sizeSlider.addEventListener('change', (e) => {
  const v = parseInt(e.target.value, 10);
  createGrid(v);
});

// modal logic
function openModal() {
  modal.classList.remove('hidden');
  modalInput.value = currentSize;
  modalError.textContent = '';
  setTimeout(() => modalInput.focus(), 50);
  modalInput.select();
}
function closeModal() {
  modal.classList.add('hidden');
  modalError.textContent = '';
}
function confirmModal() {
  const raw = modalInput.value.trim();
  const n = parseInt(raw, 10);
  if (isNaN(n) || raw === '') {
    modalError.textContent = 'Enter a number, partner!';
    return;
  }
  if (n < 4 || n > 100) {
    modalError.textContent = 'Hold it! 4 to 100 only - field too big crashes the tractor.';
    return;
  }
  closeModal();
  createGrid(n);
}

newGridBtn.addEventListener('click', openModal);
modalCancel.addEventListener('click', closeModal);
modalConfirm.addEventListener('click', confirmModal);
modal.addEventListener('click', (e) => {
  if (e.target === modal) closeModal();
});
modalInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') confirmModal();
  if (e.key === 'Escape') closeModal();
});

// fallback prompt if someone wants it via double-click header? Keep spec: button sends popup asking.
// Our modal is the popup. Also support legacy prompt via shift+click for testing.
newGridBtn.addEventListener('dblclick', () => {
  const ans = prompt('How many squares per side? (1-100)', currentSize);
  if (ans === null) return;
  const n = parseInt(ans, 10);
  if (isNaN(n) || n < 1 || n > 100) {
    alert('Please enter a number between 1 and 100.');
    return;
  }
  createGrid(n);
});

// keyboard shortcuts: c clear, e eraser, r rainbow
window.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT') return;
  if (e.key === 'c' || e.key === 'C') createGrid(currentSize);
  if (e.key === 'e' || e.key === 'E') eraserBtn.click();
  if (e.key === 'r' || e.key === 'R') rainbowBtn.click();
});

// init
createGrid(currentSize);

// Minimal pixel-art adventure engine
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const TILE = 16;
const SCALE = 3; // 16*16 -> 256x192 canvas, scaled via CSS to 768x576
const MAP_W = 16;
const MAP_H = 12;

const heroKey = localStorage.getItem('pixelquest.hero') || 'hero_blue';
const progress = JSON.parse(localStorage.getItem('pixelquest.progress') || '{"chapter":1,"flags":{}}');

// Load images
function loadImage(src) {
  return new Promise(res => {
    const img = new Image();
    img.src = src;
    img.onload = () => res(img);
  });
}

const assets = {
  hero_blue: 'assets/sprites/hero_blue.png',
  hero_red: 'assets/sprites/hero_red.png',
  hero_green: 'assets/sprites/hero_green.png',
  npc: 'assets/sprites/npc.png',
  grass: 'assets/sprites/tile_grass.png',
  path: 'assets/sprites/tile_path.png',
};

let sprites = {};

async function loadAssets() {
  for (const [k, v] of Object.entries(assets)) {
    sprites[k] = await loadImage(v);
  }
}
const dialogEl = document.getElementById('dialog');
const dialogText = document.getElementById('dialog-text');
const choicesEl = document.getElementById('choices');

function say(text, choices = []) {
  dialogEl.classList.remove('hidden');
  dialogText.textContent = text;
  choicesEl.innerHTML = '';
  for (const ch of choices) {
    const btn = document.createElement('button');
    btn.className = 'btn';
    btn.textContent = ch.label;
    btn.addEventListener('click', ch.onSelect);
    choicesEl.appendChild(btn);
  }
}

function hideDialog() {
  dialogEl.classList.add('hidden');
}

document.getElementById('reset').addEventListener('click', () => {
  localStorage.removeItem('pixelquest.progress');
  window.location.reload();
});

// Simple map (0 = grass, 1 = path), NPC position
const map = [
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,1,1,1,1,1,1,1,0,0,0,0,0],
  [0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0],
  [0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0],
  [0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0],
  [0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0],
  [0,0,0,0,1,0,0,0,0,0,1,0,0,0,0,0],
  [0,0,0,0,1,1,1,1,1,1,1,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
  [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
];
const npc = { x: 10, y: 3 };

// Player state
let player = { x: 5, y: 3, img: null, facing: 'down' };

function canWalk(x, y) {
  return x>=0 && y>=0 && x<MAP_W && y<MAP_H && map[y][x] === 1;
}

function draw() {
  // Clear
  ctx.fillStyle = '#000';
  ctx.fillRect(0,0,canvas.width, canvas.height);

  // Tiles
  for (let y=0; y<MAP_H; y++) {
    for (let x=0; x<MAP_W; x++) {
      const tile = map[y][x] === 1 ? sprites.path : sprites.grass;
      ctx.drawImage(tile, x*TILE, y*TILE);
    }
  }
  // NPC
  ctx.drawImage(sprites.npc, npc.x*TILE, npc.y*TILE);

  // Player
  ctx.drawImage(player.img, player.x*TILE, player.y*TILE);
}

let keys = {};
window.addEventListener('keydown', e => {
  keys[e.key] = true;
  if (e.key === ' ') {
    tryTalk();
    e.preventDefault();
  }
});
window.addEventListener('keyup', e => keys[e.key] = false);

function update() {
  let dx = 0, dy = 0;
  if (keys['ArrowLeft']) dx = -1;
  else if (keys['ArrowRight']) dx = 1;
  if (keys['ArrowUp']) dy = -1;
  else if (keys['ArrowDown']) dy = 1;

  const nx = player.x + dx;
  const ny = player.y + dy;
  if ((dx !== 0 || dy !== 0) && canWalk(nx, ny)) {
    player.x = nx; player.y = ny;
    saveProgress();
  }

  draw();
  requestAnimationFrame(update);
}

function saveProgress() {
  const p = JSON.parse(localStorage.getItem('pixelquest.progress') || '{"chapter":1,"flags":{}}');
  p.player = { x: player.x, y: player.y };
  localStorage.setItem('pixelquest.progress', JSON.stringify(p));
}

function loadProgress() {
  const p = JSON.parse(localStorage.getItem('pixelquest.progress') || '{"chapter":1,"flags":{}}');
  if (p.player) {
    player.x = p.player.x;
    player.y = p.player.y;
  }
}

function adjacent(a,b){ return Math.abs(a.x-b.x)+Math.abs(a.y-b.y) === 1; }

function tryTalk() {
  if (adjacent(player, npc)) {
    const p = JSON.parse(localStorage.getItem('pixelquest.progress') || '{"chapter":1,"flags":{}}');
    if (!p.flags.metGuide) {
      say("👤 Guardián del Bosque: Bienvenido viajero. Elige tu camino.", [
        { label: "🌱 Aprender sobre el bosque", onSelect: () => { p.flags.metGuide=true; p.flags.path='learn'; localStorage.setItem('pixelquest.progress', JSON.stringify(p)); hideDialog(); say("El bosque es frágil. Cuídalo y encontrarás aliados."); } },
        { label: "⚔️ Buscar aventura", onSelect: () => { p.flags.metGuide=true; p.flags.path='adventure'; localStorage.setItem('pixelquest.progress', JSON.stringify(p)); hideDialog(); say("¡Valor! Más adelante te espera un reto."); } },
      ]);
    } else {
      if (p.flags.path === 'learn') {
        say("🌿 Has elegido entender. Ve al claro al norte para leer los antiguos grabados.", [
          { label: "Ir al claro", onSelect: () => { hideDialog(); } }
        ]);
      } else {
        say("🔥 Forja tu camino al este. Enfrenta el desafío del puente roto.", [
          { label: "Avanzar al este", onSelect: () => { hideDialog(); } }
        ]);
      }
    }
  }
}

(async function main(){
  await loadAssets();
  player.img = sprites[heroKey];
  loadProgress();
  draw();
  requestAnimationFrame(update);
})();
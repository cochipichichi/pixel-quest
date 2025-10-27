const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const TILE=16, MAP_W=16, MAP_H=12;

const heroKey = localStorage.getItem('pixelquest.hero') || 'hero_blue';
const progress = JSON.parse(localStorage.getItem('pixelquest.progress') || '{"chapter":1,"flags":{}}');

function loadImage(src){return new Promise(res=>{const i=new Image(); i.src=src; i.onload=()=>res(i);});}

const assets = {
  hero_blue: 'assets/sprites/hero_blue.png',
  hero_red: 'assets/sprites/hero_red.png',
  hero_green: 'assets/sprites/hero_green.png',
  npc: 'assets/sprites/npc.png',
  enemy: 'assets/sprites/enemy.png',
  coin: 'assets/sprites/coin.png',
  grass: 'assets/sprites/tile_grass.png',
  path: 'assets/sprites/tile_path.png',
  water: 'assets/sprites/tile_water.png',
  bridge: 'assets/sprites/tile_bridge.png',
};

let sprites={};
async function loadAssets(){ for(const [k,v] of Object.entries(assets)) sprites[k]=await loadImage(v); }

const dialogEl = document.getElementById('dialog');
const dialogText = document.getElementById('dialog-text');
const choicesEl = document.getElementById('choices');
function say(text, choices=[]) {
  dialogEl.classList.remove('hidden');
  dialogText.textContent = text;
  choicesEl.innerHTML = '';
  for (const ch of choices) {
    const btn = document.createElement('button');
    btn.className='btn'; btn.textContent=ch.label; btn.addEventListener('click', ch.onSelect);
    choicesEl.appendChild(btn);
  }
}
function hideDialog(){ dialogEl.classList.add('hidden'); }

document.getElementById('reset').addEventListener('click',()=>{ localStorage.removeItem('pixelquest.progress'); location.reload(); });

// --- Map loading ---
async function loadMap(id){
  const cap = id===2? 'chapter2':'chapter1';
  const res = await fetch('maps/'+cap+'.json');
  const map = await res.json();
  return map;
}

let mapData=null;
const state = { coins:0, hp:3, chapter: progress.chapter||1 };

// Entities
let player={x:5,y:3,img:null};
let npcs=[], enemies=[], coins=[], portals=[];

function canWalk(x,y){
  if (x<0||y<0||x>=MAP_W||y>=MAP_H) return false;
  const t = mapData.grid[y][x];
  // walkable: path(1) and bridge(3)
  return t===1 || t===3;
}

function placeEntities(){
  npcs.length=0; enemies.length=0; coins.length=0; portals.length=0;
  for(const e of mapData.entities||[]){
    if (e.type==='playerStart'){ player.x=e.x; player.y=e.y; }
    else if (e.type==='npc') npcs.push({...e});
    else if (e.type==='enemy') enemies.push({...e, dir:e.dir||'lr', step:0, vx:1});
    else if (e.type==='coin') coins.push({...e, taken:false});
    else if (e.type==='portal') portals.push({...e});
  }
}

function draw(){
  // tiles
  for(let y=0;y<MAP_H;y++){
    for(let x=0;x<MAP_W;x++){
      const code = String(mapData.grid[y][x]);
      const name = mapData.tileset[code];
      ctx.drawImage(sprites[name], x*TILE, y*TILE);
    }
  }
  // entities
  for(const c of coins) if(!c.taken) ctx.drawImage(sprites.coin, c.x*TILE, c.y*TILE);
  for(const n of npcs) ctx.drawImage(sprites.npc, n.x*TILE, n.y*TILE);
  for(const en of enemies) ctx.drawImage(sprites.enemy, en.x*TILE, en.y*TILE);
  ctx.drawImage(player.img, player.x*TILE, player.y*TILE);

  // HUD
  ctx.fillStyle='#000a'; ctx.fillRect(0,0,256,12);
  ctx.fillStyle='#fff'; ctx.font='10px monospace';
  ctx.fillText('HP:'+state.hp+'  Monedas:'+state.coins+'  Capítulo:'+state.chapter, 4,10);
}

let keys={};
window.addEventListener('keydown', e=>{
  keys[e.key]=true;
  if (e.key===' ') { tryInteract(); e.preventDefault(); }
});
window.addEventListener('keyup', e=> keys[e.key]=false);

function update(){
  let dx=0,dy=0;
  if(keys['ArrowLeft']) dx=-1; else if(keys['ArrowRight']) dx=1;
  if(keys['ArrowUp']) dy=-1; else if(keys['ArrowDown']) dy=1;

  const nx = player.x+dx, ny=player.y+dy;
  if ((dx||dy) && canWalk(nx,ny)) { player.x=nx; player.y=ny; saveProgress(); }

  // enemy patrol
  for(const en of enemies){
    if (en.dir==='lr'){
      if (en.step>=en.range) en.vx*=-1, en.step=0;
      const ex = en.x+en.vx, ey=en.y;
      if (canWalk(ex,ey)) { en.x=ex; en.step++; }
    }
    // collision with player
    if (en.x===player.x && en.y===player.y){
      state.hp=Math.max(0, state.hp-1);
      if (state.hp===0){ say('💀 Te desmayaste. Volverás al inicio del capítulo.', [{label:'Reintentar', onSelect: ()=>{hideDialog(); placeEntities(); state.hp=3;}}]); }
    }
  }

  // coins
  for(const c of coins){
    if(!c.taken && c.x===player.x && c.y===player.y){ c.taken=true; state.coins++; }
  }

  draw();
  requestAnimationFrame(update);
}

function saveProgress(){
  const p = JSON.parse(localStorage.getItem('pixelquest.progress') || '{"chapter":1,"flags":{}}');
  p.player = {x:player.x, y:player.y};
  p.chapter = state.chapter;
  localStorage.setItem('pixelquest.progress', JSON.stringify(p));
}

function loadProgress(){
  const p = JSON.parse(localStorage.getItem('pixelquest.progress') || '{"chapter":1,"flags":{}}');
  if (p.player){ player.x=p.player.x; player.y=p.player.y; }
  if (p.chapter) state.chapter=p.chapter;
}

function adjacent(a,b){ return Math.abs(a.x-b.x)+Math.abs(a.y-b.y)===1; }

function tryInteract(){
  // NPCs
  for (const n of npcs){
    if (adjacent(player, n)){
      if (n.id==='guide'){
        say('👤 Guardián: Elige tu camino.', [
          {label:'🌱 Aprender', onSelect:()=>{hideDialog();}},
          {label:'⚔️ Aventurar', onSelect:()=>{hideDialog();}}
        ]);
        return;
      }
      if (n.id==='keeper'){
        say('🛡️ Guardián del Puente: Reúne una moneda y cruza sin miedo.', [{label:'Ok', onSelect:()=>hideDialog()}]);
        return;
      }
    }
  }
  // Portals
  for (const p of portals){
    if (player.x===p.x && player.y===p.y){
      if (p.to==='chapter2'){ state.chapter=2; loadChapter(2); return; }
      if (p.to==='chapter1'){ state.chapter=1; loadChapter(1); return; }
    }
  }
}

async function loadChapter(num){
  mapData = await loadMap(num);
  placeEntities();
  saveProgress();
}

(async function main(){
  await loadAssets();
  player.img = sprites[heroKey];
  await loadChapter(progress.chapter||1);
  loadProgress();
  draw();
  requestAnimationFrame(update);
})();
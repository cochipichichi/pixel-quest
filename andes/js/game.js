const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const TILE=16, MAP_W=16, MAP_H=12;

const heroKey = localStorage.getItem('pixelquest.hero') || 'hero_blue';
const progressKey = 'andes.progress';
const progress = JSON.parse(localStorage.getItem(progressKey) || '{"chapter":1,"coins":0,"flags":{}}');

function loadImage(src){return new Promise(res=>{const i=new Image(); i.src=src; i.onload=()=>res(i);});}

const assets = {
  hero_blue: '../assets/sprites/hero_blue.png',
  hero_red: '../assets/sprites/hero_red.png',
  hero_green: '../assets/sprites/hero_green.png',
  npc: '../assets/sprites/npc.png',
  condor: 'assets/sprites/condor.png',
  fisher: 'assets/sprites/fisher.png',
  coin: 'assets/sprites/coin.png',
  raft: 'assets/sprites/raft.png',
  snow: 'assets/sprites/tile_snow.png',
  rock: 'assets/sprites/tile_rock.png',
  river: 'assets/sprites/tile_river.png',
  forest: 'assets/sprites/tile_forest.png',
  sand: 'assets/sprites/tile_sand.png',
  board: 'assets/sprites/tile_board.png',
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
function hideDialog(){ dialogEl.classList.add('hidden'); choicesEl.innerHTML=''; }

document.getElementById('reset').addEventListener('click',()=>{ localStorage.removeItem(progressKey); location.reload(); });

async function loadMap(id){
  const names=['andes1','andes2','andes3','andes4','andes5'];
  const res = await fetch('maps/'+names[(id-1)%5]+'.json');
  return await res.json();
}
async function loadStory(id){
  const names=['andes1','andes2','andes3','andes4','andes5'];
  const res = await fetch('story/chapters/'+names[(id-1)%5]+'.json');
  return await res.json();
}

let mapData=null;
let player={x:4,y:2,img:null};
let npcs=[], coins=[], portals=[];

function isWalkable(x,y){
  if (x<0||y<0||x>=MAP_W||y>=MAP_H) return false;
  const t = mapData.grid[y][x];
  // walkable: rock(1), board(5), sand(4) (shore), forest path (we treat board as paths)
  return t===1 || t===5 || t===4;
}

function placeEntities(){
  npcs.length=0; coins.length=0; portals.length=0;
  for(const e of mapData.entities||[]){
    if (e.type==='playerStart') { player.x=e.x; player.y=e.y; }
    else if (e.type==='npc') npcs.push({...e});
    else if (e.type==='coin') coins.push({...e, taken:false});
    else if (e.type==='portal') portals.push({...e});
  }
}

function draw(){
  for(let y=0;y<MAP_H;y++){
    for(let x=0;x<MAP_W;x++){
      const code=String(mapData.grid[y][x]); const name=mapData.tileset[code];
      ctx.drawImage(sprites[name], x*TILE, y*TILE);
    }
  }
  for(const c of coins) if(!c.taken) ctx.drawImage(sprites.coin, c.x*TILE, c.y*TILE);
  for(const n of npcs){
    let img = sprites.npc;
    if (n.id==='condor' || n.id==='condor_final') img = sprites.condor;
    if (n.id==='fisher') img = sprites.fisher;
    ctx.drawImage(img, n.x*TILE, n.y*TILE);
  }
  ctx.drawImage(player.img, player.x*TILE, player.y*TILE);

  // HUD
  ctx.fillStyle='#000a'; ctx.fillRect(0,0,256,12);
  ctx.fillStyle='#fff'; ctx.font='10px monospace';
  ctx.fillText('Capítulo:'+progress.chapter+'  Monedas:'+progress.coins, 4,10);
}

let keys={};
window.addEventListener('keydown', e=>{
  keys[e.key.toLowerCase()]=true;
  if (e.key===' ') { interact(); e.preventDefault(); }
});
window.addEventListener('keyup', e=> keys[e.key.toLowerCase()]=false);

function update(){
  let dx=0,dy=0;
  if(keys['arrowleft']||keys['a']) dx=-1; else if(keys['arrowright']||keys['d']) dx=1;
  if(keys['arrowup']||keys['w']) dy=-1; else if(keys['arrowdown']||keys['s']) dy=1;
  const nx=player.x+dx, ny=player.y+dy;
  if((dx||dy) && isWalkable(nx,ny)){ player.x=nx; player.y=ny; saveProgress(); }
  // coin pickup
  for(const c of coins){ if(!c.taken && c.x===player.x && c.y===player.y){ c.taken=true; progress.coins++; saveProgress(); } }
  draw();
  requestAnimationFrame(update);
}

function saveProgress(){
  const p = JSON.parse(localStorage.getItem(progressKey) || '{"chapter":1,"coins":0,"flags":{}}');
  p.chapter=progress.chapter; p.coins=progress.coins; p.flags=progress.flags||{}; p.player={x:player.x,y:player.y};
  localStorage.setItem(progressKey, JSON.stringify(p));
}
function loadProgress(){
  const p = JSON.parse(localStorage.getItem(progressKey) || '{"chapter":1,"coins":0,"flags":{}}');
  progress.chapter=p.chapter||1; progress.coins=p.coins||0; progress.flags=p.flags||{};
  if(p.player){ player.x=p.player.x; player.y=p.player.y; }
}

function adjacent(a,b){ return Math.abs(a.x-b.x)+Math.abs(a.y-b.y)===1; }

function interact(){
  for(const n of npcs){
    if(adjacent(player,n)){
      if(n.id==='condor') say('🦅 Cóndor: Desciende con respeto por la montaña.', [{label:'Seguir', onSelect:()=>hideDialog()}]);
      else if(n.id==='baquiano') say('⛰️ Baquiano: Mantén el rumbo, el río te espera.', [{label:'Ok', onSelect:()=>hideDialog()}]);
      else if(n.id==='fisher') {
        if(progress.coins>0) say('🎣 Pescador: Con tu moneda, el cruce es tuyo.', [{label:'Cruzar', onSelect:()=>{hideDialog();}}]);
        else say('🎣 Pescador: Vuelve con una moneda y cruzas.', [{label:'Entendido', onSelect:()=>hideDialog()}]);
      }
      else if(n.id==='guardabosque') say('🌲 Guardabosque: El bosque escucha tus pasos.', [{label:'Seguir', onSelect:()=>hideDialog()}]);
      else if(n.id==='condor_final') say('🌊 Cóndor: Has tocado mar. Ñuble te recuerda.', [{label:'Fin', onSelect:()=>hideDialog()}]);
      return;
    }
  }
  for(const p of portals){
    if(player.x===p.x && player.y===p.y){
      if(p.need==='coin' && progress.coins<=0){ say('🔒 Necesitas una moneda para cruzar.', [{label:'Ok', onSelect:()=>hideDialog()}]); return; }
      // move to next chapter
      if(p.to==='andes2') loadChapter(2);
      if(p.to==='andes3') loadChapter(3);
      if(p.to==='andes4') loadChapter(4);
      if(p.to==='andes5') loadChapter(5);
      if(p.to==='andes1') loadChapter(1);
      return;
    }
  }
}

async function loadChapter(n){
  progress.chapter=n;
  mapData = await loadMap(n);
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
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
// --- Audio (WebAudio chiptune) ---
const Audio = (()=>{
  let ctx, master, musicGain, sfxGain; let playing=false;
  function ensure(){
    if(ctx) return; ctx = new (window.AudioContext||window.webkitAudioContext)();
    master = ctx.createGain(); master.connect(ctx.destination);
    musicGain = ctx.createGain(); musicGain.gain.value = Number(localStorage.getItem('pixelquest.settings.volume')||0.5);
    sfxGain = ctx.createGain(); sfxGain.gain.value = Number(localStorage.getItem('pixelquest.settings.volume')||0.5);
    musicGain.connect(master); sfxGain.connect(master);
  }
  function tone(freq, dur=0.2, destination=sfxGain){
    ensure();
    const o=ctx.createOscillator(); const g=ctx.createGain();
    o.type='square'; o.frequency.value=freq;
    o.connect(g); g.connect(destination);
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime+0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime+dur);
    o.start(); o.stop(ctx.currentTime+dur);
  }
  function playCoin(){ tone(880,0.15); }
  function hit(){ tone(220,0.2); }
  function musicStart(){
    if(playing) return;
    const allow = localStorage.getItem('pixelquest.settings.music')!=='0';
    if(!allow) return;
    ensure();
    playing=true;
    // simple looping melody
    const seq=[440,494,523,587,523,494,440,392];
    let i=0;
    function step(){
      if(!playing) return;
      const o=ctx.createOscillator(); const g=ctx.createGain();
      o.type='triangle'; o.frequency.value=seq[i%seq.length];
      o.connect(g); g.connect(musicGain);
      g.gain.setValueAtTime(0.0001, ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime+0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime+0.35);
      o.start(); o.stop(ctx.currentTime+0.36);
      i++; setTimeout(step, 360);
    }
    step();
  }
  function musicStop(){ playing=false; }
  return { playCoin, hit, musicStart, musicStop };
})();

// --- Quest Log ---
const Quest = (()=>{
  const key='pixelquest.quests';
  function load(){ return JSON.parse(localStorage.getItem(key)||'[]'); }
  function save(q){ localStorage.setItem(key, JSON.stringify(q)); }
  function add(id, title){ const q=load(); if(!q.find(x=>x.id===id)){ q.push({id,title,done:false}); save(q); } }
  function complete(id){ const q=load(); const it=q.find(x=>x.id===id); if(it){ it.done=true; save(q);} }
  return { load, add, complete };
})();

// --- Story loader ----
async function loadStory(chapter){
  const res = await fetch('story/chapters/'+(chapter===2?'chapter2':'chapter1')+'.json');
  return await res.json();
}

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
      state.hp=Math.max(0, state.hp-1); Audio.hit();
      if (state.hp===0){ say('💀 Te desmayaste. Volverás al inicio del capítulo.', [{label:'Reintentar', onSelect: ()=>{hideDialog(); placeEntities(); state.hp=3;}}]); }
    }
  }

  // coins
  for(const c of coins){
    if(!c.taken && c.x===player.x && c.y===player.y){ c.taken=true; state.coins++; Audio.playCoin(); Quest.complete('getCoin'); renderQuests(); }
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

function tryInteract(){ Audio.musicStart();
  // NPCs
  for (const n of npcs){
    if (adjacent(player, n)){
      if (n.id==='guide'){
        // load chapter1 story
        loadStory(1).then(st=>{ /* could use st.nodes; keeping simple for demo */ });
        say('👤 Guardián: Elige tu camino.', [
          {label:'🌱 Aprender', onSelect:()=>{hideDialog();}},
          {label:'⚔️ Aventurar', onSelect:()=>{hideDialog();}}
        ]);
        return;
      }
      if (n.id==='keeper'){
        loadStory(2).then(st=>{});
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

(async function main(){ Quest.add('getCoin','Consigue una moneda en el capítulo 2'); renderQuests(); Audio.musicStart(); 
  await loadAssets();
  player.img = sprites[heroKey];
  await loadChapter(progress.chapter||1);
  loadProgress();
  draw();
  requestAnimationFrame(update);
})();

// HUD Quest panel (DOM created lazily)
let questPanel;
function ensureQuestPanel(){
  if(questPanel) return;
  questPanel = document.createElement('div');
  questPanel.className='dialog';
  questPanel.style.position='absolute';
  questPanel.style.right='10px'; questPanel.style.top='40px'; questPanel.style.maxWidth='220px';
  document.body.appendChild(questPanel);
}
function renderQuests(){
  ensureQuestPanel();
  const list = Quest.load();
  questPanel.innerHTML = '<strong>Misiones</strong><ul style="padding-left:18px; margin:6px 0 0 0">'+
    list.map(q=>'<li>'+ (q.done?'✅ ':'🟡 ') + q.title +'</li>').join('') + '</ul>';
}

// Input layout mapping
const layout = localStorage.getItem('pixelquest.settings.layout')||'arrows';
const KEYMAP = {
  arrows: {left:'ArrowLeft', right:'ArrowRight', up:'ArrowUp', down:'ArrowDown'},
  wasd:   {left:'a', right:'d', up:'w', down:'s'},
  esdf:   {left:'s', right:'f', up:'e', down:'d'}
}[layout];

window.addEventListener('keydown', e=>{
  if (advanceWithEnter && !dialogEl.classList.contains('hidden') && (e.key==='Enter')){
    const first = choicesEl.querySelector('.btn'); if(first){ first.click(); e.preventDefault(); }
  }
});

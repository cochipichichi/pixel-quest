const TILE=16, W=16, H=12;
const canvas=document.getElementById('canvas'); const ctx=canvas.getContext('2d');
const tilesImgs={}, entsImgs={};
const tileset={'0':'grass','1':'path','2':'water','3':'bridge'};
const tileNames=['grass','path','water','bridge'];

function loadImage(src){return new Promise(r=>{const i=new Image(); i.src=src; i.onload=()=>r(i);});}
async function loadAssets(){
  tilesImgs.grass=await loadImage('assets/sprites/tile_grass.png');
  tilesImgs.path=await loadImage('assets/sprites/tile_path.png');
  tilesImgs.water=await loadImage('assets/sprites/tile_water.png');
  tilesImgs.bridge=await loadImage('assets/sprites/tile_bridge.png');
  entsImgs.npc=await loadImage('assets/sprites/npc.png');
  entsImgs.enemy=await loadImage('assets/sprites/enemy.png');
  entsImgs.coin=await loadImage('assets/sprites/coin.png');
  entsImgs.playerStart=await loadImage('assets/sprites/hero_blue.png');
}
let currentTile=1, currentEnt=null;
const map = { id:'custom', title:'Nuevo', width:W, height:H, tileset: {'0':'grass','1':'path','2':'water','3':'bridge'},
  grid: Array.from({length:H},()=>Array.from({length:W},()=>0)),
  entities: [] };

function draw(){
  for(let y=0;y<H;y++){
    for(let x=0;x<W;x++){
      const name = tileset[String(map.grid[y][x])];
      ctx.drawImage(tilesImgs[name], x*TILE, y*TILE);
    }
  }
  for(const e of map.entities){
    const img = entsImgs[e.type] || entsImgs.npc;
    ctx.drawImage(img, e.x*TILE, e.y*TILE);
  }
}

canvas.addEventListener('click', (ev)=>{
  const rect=canvas.getBoundingClientRect();
  const gx=Math.floor((ev.clientX-rect.left)/ (rect.width/W));
  const gy=Math.floor((ev.clientY-rect.top)/ (rect.height/H));
  if (currentEnt){
    if (ev.shiftKey){
      const idx=map.entities.findIndex(e=>e.x===gx && e.y===gy);
      if(idx>=0) map.entities.splice(idx,1);
    } else {
      const existing=map.entities.find(e=>e.x===gx && e.y===gy);
      if(!existing) map.entities.push({type:currentEnt,x:gx,y:gy});
    }
  } else {
    map.grid[gy][gx]=currentTile;
  }
  draw();
});

document.querySelectorAll('.tile').forEach(b=>b.addEventListener('click',()=>{currentTile=Number(b.dataset.tile); currentEnt=null;}));
document.querySelectorAll('.ent').forEach(b=>b.addEventListener('click',()=>{currentEnt=b.dataset.ent; }));

document.getElementById('newMap').addEventListener('click',()=>{
  for(let y=0;y<H;y++) for(let x=0;x<W;x++) map.grid[y][x]=0;
  map.entities.length=0; draw();
});
document.getElementById('loadCh1').addEventListener('click', async ()=>{
  const res=await fetch('maps/chapter1.json'); Object.assign(map, await res.json()); draw();
});
document.getElementById('loadCh2').addEventListener('click', async ()=>{
  const res=await fetch('maps/chapter2.json'); Object.assign(map, await res.json()); draw();
});
document.getElementById('export').addEventListener('click',()=>{
  const blob=new Blob([JSON.stringify(map,null,2)],{type:'application/json'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=(map.id||'map')+'.json'; a.click();
});
document.getElementById('import').addEventListener('change',async (e)=>{
  const f=e.target.files[0]; if(!f) return;
  const text=await f.text(); Object.assign(map, JSON.parse(text)); draw();
});

await loadAssets(); draw();
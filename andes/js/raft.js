const canvas=document.getElementById('river'); const ctx=canvas.getContext('2d');
const W=canvas.width, H=canvas.height;
let keys={}; window.addEventListener('keydown',e=>keys[e.key]=true); window.addEventListener('keyup',e=>keys[e.key]=false);

const raft={x:40,y:H/2-8,w:16,h:12,hp:3};
let t=0, dist=0, won=false, lost=false;

function rand(min,max){ return Math.random()*(max-min)+min; }
const obs=[];
function spawn(){
  obs.push({x:W+20, y:rand(10,H-20), r: rand(6,14), vx: rand(1.2,2.4)});
}
setInterval(spawn, 700);

function step(){
  if(keys['ArrowUp']) raft.y-=2;
  if(keys['ArrowDown']) raft.y+=2;
  if(keys['ArrowLeft']) raft.x-=1.2;
  if(keys['ArrowRight']) raft.x+=1.2;
  raft.y=Math.max(0, Math.min(H-raft.h, raft.y));
  raft.x=Math.max(0, Math.min(W-raft.w, raft.x));

  ctx.fillStyle='#0b2c5a'; ctx.fillRect(0,0,W,H);
  // flow
  for(let i=0;i<10;i++){ ctx.fillStyle='rgba(255,255,255,0.06)'; ctx.fillRect((t*0.8+i*32)%W, i*18%H, 24, 2); }
  // obstacles
  ctx.fillStyle='#784421';
  for(const o of obs){
    o.x-=o.vx;
    ctx.beginPath(); ctx.arc(o.x,o.y,o.r,0,Math.PI*2); ctx.fill();
    // collision
    if(!won && !lost){
      if(Math.abs(o.x-(raft.x+raft.w/2))<o.r+raft.w/2 && Math.abs(o.y-(raft.y+raft.h/2))<o.r+raft.h/2){
        raft.hp=Math.max(0, raft.hp-1); o.x=-999;
        if(raft.hp===0){ lost=true; localStorage.setItem('andes.raft','lost'); }
      }
    }
  }
  // raft
  ctx.fillStyle='#b0793d'; ctx.fillRect(raft.x,raft.y,raft.w,raft.h);
  ctx.fillStyle='#000'; ctx.fillRect(raft.x+4,raft.y+2,8,2);

  // HUD
  ctx.fillStyle='#000a'; ctx.fillRect(0,0,W,12);
  ctx.fillStyle='#fff'; ctx.font='10px monospace';
  ctx.fillText('HP:'+raft.hp+'  Dist:'+Math.floor(dist)+' / 1000', 4,10);

  if(!won && !lost){
    dist+=2; if(dist>=1000){ won=true; localStorage.setItem('andes.raft','won'); }
  }

  if(won){
    ctx.fillStyle='rgba(0,0,0,0.6)'; ctx.fillRect(0,0,W,H);
    ctx.fillStyle='#b8ff9f'; ctx.font='16px monospace'; ctx.fillText('¡Victoria! Cruce desbloqueado', 50,H/2);
  } else if(lost){
    ctx.fillStyle='rgba(0,0,0,0.6)'; ctx.fillRect(0,0,W,H);
    ctx.fillStyle='#ffb0a0'; ctx.font='16px monospace'; ctx.fillText('Derrota. Intenta nuevamente', 50,H/2);
  }

  t+=1; requestAnimationFrame(step);
}
step();

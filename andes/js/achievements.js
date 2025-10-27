const ACHS=[
  {id:'raft_won', name:'Maestro de la balsa', img:'assets/sprites/badge_raft.png', desc:'Gana el mini-juego del río Ñuble.'},
  {id:'forest_signs_complete', name:'Señales del bosque', img:'assets/sprites/badge_forest.png', desc:'Recolecta 3 señales del bosque.'},
  {id:'boss_defeated', name:'Guardían de las olas', img:'assets/sprites/badge_boss.png', desc:'Vence al gólem marino en Cobquecura.'},
  {id:'all_collectibles', name:'Coleccionista Ñuble', img:'assets/sprites/badge_collection.png', desc:'Encuentra todos los coleccionables.'},
  {id:'campaign_complete', name:'Travesía Ñuble', img:'assets/sprites/badge_campaign.png', desc:'Recorre de cordillera a mar.'},
];
const got = JSON.parse(localStorage.getItem('andes.achievements')||'[]');
const root = document.getElementById('ach');
root.innerHTML = ACHS.map(a=>{
  const ok = got.includes(a.id);
  return `<div class="card"><h3>${ok?'✅':'🟡'} ${a.name}</h3><img src="${a.img}" alt="" style="width:64px;height:64px;border-radius:12px;image-rendering:pixelated"/><p>${a.desc}</p></div>`;
}).join('');

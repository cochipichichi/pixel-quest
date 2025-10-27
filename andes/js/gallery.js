async function main(){
  const r = await fetch('data/collectibles.json'); const data = await r.json();
  const found = JSON.parse(localStorage.getItem('andes.collect')||'[]');
  const root = document.getElementById('gallery');
  root.innerHTML = data.items.map(it=>{
    const ok = found.includes(it.id);
    return `<div class="card"><h3>${ok?'✅':'🟡'} ${it.name}</h3><p>${it.type} — cap. ${it.chapter}</p><p>${it.desc}</p></div>`;
  }).join('');
}
main();
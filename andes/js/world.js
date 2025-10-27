const visited = JSON.parse(localStorage.getItem('andes.visited')||'[]');
document.querySelectorAll('button[data-ch]').forEach(b=>{
  const ch = Number(b.dataset.ch);
  if(!visited.includes(ch)) { b.disabled=true; b.title='Aún no disponible'; }
  b.addEventListener('click', ()=>{
    const p = JSON.parse(localStorage.getItem('andes.progress')||'{}');
    p.chapter = ch; localStorage.setItem('andes.progress', JSON.stringify(p));
    location.href='game.html';
  });
});
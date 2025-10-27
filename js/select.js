// Handle character selection and persist in localStorage
const buttons = document.querySelectorAll('.char');
let selected = localStorage.getItem('pixelquest.hero') || 'hero_blue';

buttons.forEach(btn => {
  if (btn.dataset.id === selected) btn.classList.add('active');
  btn.addEventListener('click', () => {
    selected = btn.dataset.id;
    buttons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    localStorage.setItem('pixelquest.hero', selected);
  });
});

document.getElementById('play').addEventListener('click', () => {
  if (!selected) selected = 'hero_blue';
  localStorage.setItem('pixelquest.hero', selected);
  // Initialize story progress
  const progress = { chapter: 1, flags: {} };
  localStorage.setItem('pixelquest.progress', JSON.stringify(progress));
  window.location.href = 'game.html';
});


// v3 Theme toggle
const themeBtn = document.getElementById('themeToggle');
let menu;
function ensureMenu(){
  if(menu) return;
  menu = document.createElement('div');
  menu.className='theme-menu';
  menu.innerHTML = `
    <button data-theme="default">☀️ Claro/Oscuro</button>
    <button data-theme="contrast">⚡ Alto contraste</button>
    <button data-theme="sunset">🌇 Atardecer</button>
  `;
  document.body.appendChild(menu);
  menu.addEventListener('click',(e)=>{
    if(e.target.dataset.theme){
      const t=e.target.dataset.theme;
      if(t==='contrast'){ document.body.classList.add('theme-contrast'); document.body.classList.remove('theme-sunset'); }
      else if(t==='sunset'){ document.body.classList.add('theme-sunset'); document.body.classList.remove('theme-contrast'); }
      else { document.body.classList.remove('theme-contrast','theme-sunset'); }
      localStorage.setItem('pixelquest.theme', t);
      menu.classList.remove('open');
    }
  });
}
if(themeBtn){
  themeBtn.addEventListener('click',()=>{ ensureMenu(); menu.classList.toggle('open'); });
}
(function initTheme(){
  const t=localStorage.getItem('pixelquest.theme');
  if(t==='contrast') document.body.classList.add('theme-contrast');
  if(t==='sunset') document.body.classList.add('theme-sunset');
})();    

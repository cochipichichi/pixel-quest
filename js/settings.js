// Persist settings
const key = (k)=>'pixelquest.settings.'+k;
const qs = (s)=>document.querySelector(s);
const layout = localStorage.getItem(key('layout')) || 'arrows';
document.querySelectorAll('input[name="layout"]').forEach(r=>{
  if(r.value===layout) r.checked=true;
  r.addEventListener('change',()=>localStorage.setItem(key('layout'), r.value));
});
qs('#enableEnter').checked = localStorage.getItem(key('enter'))==='1';
qs('#enableEnter').addEventListener('change', e=>localStorage.setItem(key('enter'), e.target.checked?'1':'0'));
qs('#music').checked = localStorage.getItem(key('music'))!=='0';
qs('#sfx').checked = localStorage.getItem(key('sfx'))!=='0';
qs('#music').addEventListener('change', e=>localStorage.setItem(key('music'), e.target.checked?'1':'0'));
qs('#sfx').addEventListener('change', e=>localStorage.setItem(key('sfx'), e.target.checked?'1':'0'));
qs('#volume').value = localStorage.getItem(key('volume')) || 0.5;
qs('#volume').addEventListener('input', e=>localStorage.setItem(key('volume'), e.target.value));

qs('#contrast').addEventListener('click',()=>{ document.body.classList.add('theme-contrast'); document.body.classList.remove('theme-sunset'); localStorage.setItem('pixelquest.theme','contrast'); });
qs('#sunset').addEventListener('click',()=>{ document.body.classList.add('theme-sunset'); document.body.classList.remove('theme-contrast'); localStorage.setItem('pixelquest.theme','sunset'); });
qs('#default').addEventListener('click',()=>{ document.body.classList.remove('theme-contrast','theme-sunset'); localStorage.setItem('pixelquest.theme','default'); });

(function initTheme(){
  const t=localStorage.getItem('pixelquest.theme');
  if(t==='contrast') document.body.classList.add('theme-contrast');
  if(t==='sunset') document.body.classList.add('theme-sunset');
})();    

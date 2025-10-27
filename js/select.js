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

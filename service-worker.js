const CACHE='pixelquest-v3';
const ASSETS=[
  '/', 'index.html','game.html','credits.html','editor.html','settings.html',
  'manifest.webmanifest',
  'assets/style.css',
  'js/select.js','js/game.js','js/editor.js','js/settings.js',
  'assets/sprites/hero_blue.png','assets/sprites/hero_red.png','assets/sprites/hero_green.png',
  'assets/sprites/npc.png','assets/sprites/tile_grass.png','assets/sprites/tile_path.png',
  'assets/sprites/tile_water.png','assets/sprites/tile_bridge.png','assets/sprites/enemy.png','assets/sprites/coin.png',
  'maps/chapter1.json','maps/chapter2.json',
  'story/chapters/chapter1.json','story/chapters/chapter2.json'
];
self.addEventListener('install',e=>{ e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))); });
self.addEventListener('fetch',e=>{ e.respondWith(caches.match(e.request).then(r=> r || fetch(e.request))); });

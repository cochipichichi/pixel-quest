# Pixel Quest — Starter (HTML/JS Canvas)

Un repositorio base para un **juego estilo pixel-art** listo para GitHub Pages:
- Selector de personaje con sprites 16×16 escalados (pixelados).
- Capítulo 1 con **mapa simple**, movimiento y diálogo con NPC.
- **Sistema de decisiones** con ramificaciones iniciales.
- Progreso guardado con `localStorage`.
- **Accesible y ligero**: solo HTML + CSS + JS (Canvas 2D).

## Estructura
```
pixel-quest-repo/
  index.html        # Selector de personaje
  game.html         # Mapa y capítulo 1
  credits.html
  assets/style.css
  assets/sprites/*.png
  js/select.js
  js/game.js
  README.md
  LICENSE
```

## Cómo usar
1. Sube la carpeta al repositorio en GitHub y habilita **GitHub Pages (root)**.
2. Abre `index.html`, elige tu personaje y pulsa **Comenzar historia**.
3. En el mapa (`game.html`): mueve con flechas y habla con **Espacio**.

## Extender la historia
- Agrega nuevos **capítulos** y mapas (matrices 16×16).
- Crea más sprites en `assets/sprites/` (16×16) y expándelos.
- Usa `progress.flags` para desbloquear eventos o rutas.

## Accesibilidad
- Controles visibles, `aria-label`, `role="dialog"`, colores de alto contraste.
- Fuente de sistema para rendimiento.

## Licencia
MIT — Úsalo, modifícalo y compártelo.


## Novedades v2
- **Capítulo 2: Puente Viejo** con enemigo que patrulla y monedas.
- **Editor visual de mapas** (`editor.html`) para pintar tiles y colocar entidades (NPC, enemigo, portal, etc.).
- Mapas externos en `/maps/*.json` — listos para versionar/compartir.


## v3 — Qué se agregó
- 🎨 **Index colorido** (temas: defecto, alto contraste, atardecer) y botón de tema.
- 🌳 **Árbol narrativo** en `/story/chapters/*.json` (separación historia/motor).
- 📜 **Quest Log** (misiones) con UI y persistencia.
- ♿ **Accesibilidad**: remapeo de teclas (Flechas/WASD/ESDF), avanzar diálogos con Enter, alto contraste.
- 🎵 **Audio retro (WebAudio)**: música simple + SFX (moneda, golpe).
- 📦 **PWA offline**: `manifest.webmanifest` + `service-worker.js`.
- 🧰 **Ajustes** en `settings.html` (tema, audio, controles).

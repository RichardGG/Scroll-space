# Scroll Space

A webpage that turns into a 3D world. Scroll to the end of the page and keep going: you leave the red line and can walk, turn
and strafe through a grid world with live computer screens, control zones, curved paths, a barrel roll and a loop.

## Run

The code uses ES modules, so serve the folder over HTTP (opening `index.html` from `file://` won't work):

```
npx serve .        # or: python3 -m http.server
```

Three.js (r128) is vendored in `vendor/`. Only the Syne font is loaded from Google Fonts (it falls back to system fonts).

## Layout

```
index.html          page markup (the article, on-screen controls, the screen template)
css/                base.css (theme, page) · controls.css (look pad, bars, hint) · screens.css (CSS3D screens)
js/
  main.js           entry point and frame loop
  config.js         constants          state.js   shared player state
  rules.js          movement rules     theme.js   theme colours + repaint hooks
  scene.js          renderer, camera, grid
  mode.js           native-scroll / free-movement modes
  movement.js       one frame of free movement and snapping
  path-follow.js    riding paths, junction switching
  snap-arrow.js     the heading preview arrow
  world/            data.js (screens, zones, paths, labels) · build.js · line, zones, paths, screens, labels, obstacles, pickups, targets, skybox, portals, ramps, grass, ice
  input/            gesture (shared) · wheel · drag · touch-feed · keyboard · look-pad · bars
vendor/             three.min.js
```

To change the world, edit `js/world/data.js`.

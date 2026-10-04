// Entry point: wires the modules together and runs the frame loop.
import {s} from './state.js';
import {page,hideHint} from './dom.js';
import {applyTheme} from './theme.js';
import {renderer,camera,updateCamera,render,resize} from './scene.js';
import {buildWorld} from './world/build.js';
import {measurePage} from './world/line.js';
import {updateScreenTouch,layoutScreens} from './world/screens.js';
import {setMode,stepNative} from './mode.js';
import {stepFree} from './movement.js';
import {updateSnapArrow} from './snap-arrow.js';
import {updateGrass} from './world/grass.js';
import {renderPortals} from './world/portals.js';
import {updateSkybox} from './world/skybox.js';
import {updateTargets} from './world/targets.js';
import {updatePickups} from './world/pickups.js';
import {updateGun} from './gun.js';
import './input/wheel.js';
import './input/drag.js';
import './input/touch-feed.js';
import './input/keyboard.js';
import {showLookPad} from './input/look-pad.js';
import {showBars} from './input/bars.js';

addEventListener('scroll',hideHint,{passive:true});
matchMedia('(prefers-color-scheme: dark)').addEventListener('change',applyTheme);
addEventListener('resize',function(){measurePage();resize();});
setMode('native');

var last=performance.now(),ov=1; // ov: how visible the plain page is (it fades out as you leave the red line)

function frame(now){
  var dt=Math.min((now-last)/1000,0.05);last=now;
  var k=1-Math.exp(-dt*7);
  if(s.mode==='native')stepNative(now,k);else stepFree(dt,now,k);

  // The 3D world is invisible at the start (a plain webpage) and fades in as you move away from it.
  var wt=Math.max(0,Math.min(1,Math.sqrt(s.x*s.x+s.z*s.z)/900)),we=wt*wt*(3-2*wt);
  renderer.domElement.style.opacity=we;
  ov+=((s.mode==='native'?1:0)-ov)*k;
  page.style.opacity=ov;page.style.visibility=ov<0.01?'hidden':'visible';

  if(!s.padActive&&!s.barLook)s.pitch-=s.pitch*(1-Math.exp(-dt*6)); // vertical look returns to the horizon when not swiping
  updatePickups(now);
  updateTargets(now,dt);
  updateGun(now);
  updateScreenTouch();
  showBars(s.mode==='free'&&s.curRules.bars);
  showLookPad(s.mode==='free'&&s.curRules.pad);

  updateCamera();
  updateSkybox(camera.position);
  updateGrass(now,camera.position);
  updateSnapArrow(now,dt,k);
  renderPortals();
  render();
  layoutScreens(we,dt);
  requestAnimationFrame(frame);
}

function start(){
  buildWorld();applyTheme();
  requestAnimationFrame(function(t){last=t;frame(t);});
}
if(document.fonts&&document.fonts.load)document.fonts.load('800 64px Syne').then(start,start);else start();

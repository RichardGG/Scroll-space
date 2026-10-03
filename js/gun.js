// The gun: once collected, a reticle sits in the middle of the view and a view model is fixed to the viewport.
// Tapping the view model fires: it kicks back, flashes, and a ring pops where the shot lands on the ground.
import {s} from './state.js';
import {hideHint} from './dom.js';
import {scene,camera} from './scene.js';
import {col,onTheme} from './theme.js';
import {shootTargets} from './world/targets.js';

var score=document.getElementById('score'),shownScore=-1,gun=document.getElementById('gun'),reticle=document.getElementById('reticle'),shown=false,lastShot=0,fireTimer=0;
var RELOAD=160,RANGE=3500,FX=450; // ms between shots, world units, ms an impact ring lasts

// Impact rings (a small pool, reused).
var ringGeo=new THREE.RingGeometry(5,11,24);ringGeo.rotateX(-Math.PI/2);
var rings=[];
for(var i=0;i<8;i++){
  var m=new THREE.Mesh(ringGeo,new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide}));
  m.visible=false;scene.add(m);rings.push({mesh:m,t:0});
}
onTheme(function(){rings.forEach(function(r){r.mesh.material.color.set(col('--accent2'));});});

var ray=new THREE.Raycaster(),ground=new THREE.Plane(new THREE.Vector3(0,1,0),150),hit=new THREE.Vector3(),ndc=new THREE.Vector2(0,0),ringI=0;
function fire(now){
  if(now-lastShot<RELOAD)return;
  lastShot=now;hideHint();
  gun.classList.add('fire');clearTimeout(fireTimer);fireTimer=setTimeout(function(){gun.classList.remove('fire');},90);
  camera.updateMatrixWorld();
  ray.setFromCamera(ndc,camera); // straight through the reticle
  var td=shootTargets(ray,RANGE),gd=ray.ray.direction.y<0&&ray.ray.intersectPlane(ground,hit)?hit.distanceTo(camera.position):Infinity;
  if(gd<RANGE&&gd<td){ // the shot reached the ground before any target
    var r=rings[ringI++%rings.length];
    r.mesh.position.set(hit.x,-149.4,hit.z);r.t=now;r.mesh.visible=true;
  }
}
gun.addEventListener('pointerdown',function(e){e.preventDefault();fire(performance.now());});

export function updateGun(now){
  var on=s.hasGun&&s.mode==='free';
  if(on!==shown){shown=on;gun.classList.toggle('on',on);reticle.classList.toggle('on',on);score.classList.toggle('on',on);if(!on)gun.classList.remove('fire');}
  if(s.score!==shownScore){shownScore=s.score;score.textContent='Score '+s.score;}
  rings.forEach(function(r){
    if(!r.mesh.visible)return;
    var a=(now-r.t)/FX;
    if(a>=1){r.mesh.visible=false;return;}
    r.mesh.scale.setScalar(1+a*2.5);r.mesh.material.opacity=0.9*(1-a);
  });
}

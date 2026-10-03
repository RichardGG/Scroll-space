// Shooting targets: a bullseye on a post. A hit flashes it and knocks it back on a spring; three hits knock it flat,
// and it stands back up a few seconds later. A hit in the centre ring scores more.
import {s} from '../state.js';
import {scene} from '../scene.js';
import {col,onTheme} from '../theme.js';
import {showHint} from '../dom.js';

var GROUND=-150,R=62,HEIGHT=95,HITS_TO_DROP=3,RESPAWN=3000,BULL=0.12; // BULL: centre ring radius as a fraction of the disc
var targets=[],discs=[],tex,cv=document.createElement('canvas');
cv.width=cv.height=256;
tex=new THREE.CanvasTexture(cv);
onTheme(function(){ // concentric rings in the theme colours
  var c=cv.getContext('2d'),ring=[['--fg',128],['--bg',104],['--accent2',84],['--bg',60],['--accent4',40],['--accent3',BULL*256]];
  ring.forEach(function(r){c.fillStyle=col(r[0]);c.beginPath();c.arc(128,128,r[1],0,Math.PI*2);c.fill();});
  tex.needsUpdate=true;
});
var discGeo=new THREE.CircleGeometry(R,40),postGeo=new THREE.BoxGeometry(10,HEIGHT,10);
var postMat=new THREE.MeshBasicMaterial();
onTheme(function(){postMat.color.set(col('--fg'));});

export function addTarget(cfg){
  var T={cfg:cfg,hits:0,a:0,v:0,state:'up',downAt:0,flash:0,pop:0};
  T.group=new THREE.Group();T.group.position.set(cfg.x,GROUND,cfg.z);T.group.rotation.y=(cfg.rot||0)*Math.PI/180;
  T.body=new THREE.Group();T.group.add(T.body); // pivots at the foot of the post
  var post=new THREE.Mesh(postGeo,postMat);post.position.y=HEIGHT/2;T.body.add(post);
  T.disc=new THREE.Mesh(discGeo,new THREE.MeshBasicMaterial({map:tex,side:THREE.DoubleSide}));
  T.disc.position.set(0,HEIGHT+R*0.55,6);T.body.add(T.disc);
  T.glow=new THREE.Mesh(discGeo,new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide}));
  T.glow.position.set(0,HEIGHT+R*0.55,6.5);T.body.add(T.glow);
  T.disc.userData.target=T;
  scene.add(T.group);targets.push(T);discs.push(T.disc);
}

// Test a shot ray against every standing target. Returns the distance to the nearest hit (Infinity if none) and reacts to it.
var tmp=new THREE.Raycaster();
export function shootTargets(ray,maxDist){
  tmp.ray.copy(ray.ray);tmp.far=maxDist;
  var live=discs.filter(function(d){return d.userData.target.state==='up';});
  scene.updateMatrixWorld();
  var h=tmp.intersectObjects(live,false)[0];
  if(!h)return Infinity;
  var T=h.object.userData.target,uv=h.uv,r=Math.hypot(uv.x-0.5,uv.y-0.5)*2; // 0 centre .. 1 rim
  var bull=r<BULL;
  T.hits++;T.v-=bull?5.5:4;T.flash=1;
  s.score+=bull?3:1;
  if(bull)showHint('Bullseye!',900);
  if(T.hits>=HITS_TO_DROP){T.state='down';T.downAt=performance.now();T.hits=0;}
  return h.distance;
}

export function updateTargets(now,dt){
  targets.forEach(function(T){
    if(T.state==='up'){ // damped spring back to upright
      T.v+=(-60*T.a-5*T.v)*dt;T.a+=T.v*dt;
    }else if(T.state==='down'){ // knocked flat
      T.a+=(-1.45-T.a)*(1-Math.exp(-dt*9));T.v=0;
      if(now-T.downAt>RESPAWN){T.state='rising';}
    }else{ // standing back up
      T.a+=(0-T.a)*(1-Math.exp(-dt*5));
      if(Math.abs(T.a)<0.02){T.state='up';T.a=0;T.v=0;}
    }
    T.body.rotation.x=T.a;
    T.flash=Math.max(0,T.flash-dt*5);T.glow.material.opacity=0.85*T.flash;
  });
}

// Snap preview: while you turn, a floating arrow points the way the turn will settle. The arrow is an SVG-style path
// (drawn with Path2D) painted once into a transparent texture on a flat plane, so it has crisp mitred corners (a sharp point)
// and one even opacity with no double-blending where the strokes meet.
import {STEP,SNAP_L,SNAP_W,SNAP_SC as SC} from './config.js';
import {s} from './state.js';
import {wrap} from './util.js';
import {scene,renderer} from './scene.js';
import {col,onTheme} from './theme.js';
import {ppoint} from './world/paths.js';
import {pathCandidates} from './path-follow.js';

var snapCv=document.createElement('canvas');snapCv.width=Math.round(SNAP_W*SC);snapCv.height=Math.round(SNAP_L*SC);
(function(){
  var g=snapCv.getContext('2d'),cx=snapCv.width/2,tip=24,hl=16*SC,hw=9*SC;
  g.strokeStyle='#fff';g.lineWidth=3*SC;g.lineJoin='miter';g.miterLimit=10;g.lineCap='butt';
  g.stroke(new Path2D('M'+cx+' '+snapCv.height+' L'+cx+' '+tip));                                  // shaft
  g.stroke(new Path2D('M'+(cx-hw)+' '+(tip+hl)+' L'+cx+' '+tip+' L'+(cx+hw)+' '+(tip+hl)));        // head: a pointed V
})();
var snapTex=new THREE.CanvasTexture(snapCv);snapTex.anisotropy=renderer.capabilities.getMaxAnisotropy();
var snapMat=new THREE.MeshBasicMaterial({map:snapTex,transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide});
var snapGeo=new THREE.PlaneGeometry(SNAP_W,SNAP_L);snapGeo.rotateX(-Math.PI/2); // flat, length along z, tip toward -z
var snapMesh=new THREE.Mesh(snapGeo,snapMat),snapFwd=new THREE.Vector3(0,0,-1),tmpV=new THREE.Vector3();
snapMesh.visible=false;scene.add(snapMesh);
onTheme(function(){snapMat.color.set(col('--accent'));});

var snapA=0,snapDir=null,snapPend=null;
export function updateSnapArrow(now,dt,k){
  var sdir=null;
  if(s.mode==='free'&&(Math.abs(s.pr)>0.003||now-s.lastRotT<250)){
    if(s.onPath&&s.cp){
      var cand=pathCandidates(),ya0=ppoint(s.cp,s.pathS).yaw+s.poff+s.pr,bestc=null,bdd=9;
      cand.forEach(function(e){var dd=Math.abs(wrap(e.a-ya0));if(dd<bdd){bdd=dd;bestc=e;}});
      if(bestc)sdir=bestc.f;
    }else if(s.curRules.snapRot){
      var th2=Math.round((s.yaw+s.pr)/STEP)*STEP;sdir={x:Math.sin(th2),y:0,z:-Math.cos(th2)};
    }
  }
  // The arrow fades in slowly. When the target moves on to the next snap direction, the old arrow fades out quickly
  // and the new one then fades in slowly in turn, instead of jumping.
  if(sdir){
    if(!snapDir||snapA<0.03){snapDir=sdir;snapPend=null;}
    else if(snapDir.x*sdir.x+snapDir.y*sdir.y+snapDir.z*sdir.z<0.999)snapPend=sdir;
    else snapPend=null;
  }else snapPend=null;
  var snapUp=sdir&&!snapPend;
  snapA+=((snapUp?1:0)-snapA)*(snapUp?1-Math.exp(-dt*1.8):(sdir?1-Math.exp(-dt*10):k));
  if(snapA>0.02&&snapDir){
    var dn=s.onPath&&s.cp&&s.cp.spatial?s.cbU:{x:0,y:1,z:0},dd2=110+SNAP_L/2;
    snapMesh.visible=true;
    snapMesh.position.set(s.x+snapDir.x*dd2-dn.x*60,s.camY+snapDir.y*dd2-dn.y*60,s.z+snapDir.z*dd2-dn.z*60);
    snapMesh.quaternion.setFromUnitVectors(snapFwd,tmpV.set(snapDir.x,snapDir.y,snapDir.z));
    snapMat.opacity=0.5*snapA;
  }else snapMesh.visible=false;
}

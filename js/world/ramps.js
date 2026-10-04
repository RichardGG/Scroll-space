// Ramp walls: a vertical wall whose base curves down to meet the ground (a quarter-pipe). Walk up to it on the ground and the curve
// carries you onto the wall, which then works as your floor. See ../ramp-walk.js for the walking.
//
// The surface is a profile in the (y,z) plane swept across the wall's width. Distance s along it starts on the ground at z0+r,
// follows a quarter circle of radius r up to the wall's foot, then runs straight up. The wall faces +z.
import {s} from '../state.js';
import {scene} from '../scene.js';
import {col,onTheme} from '../theme.js';
import {addObstacle} from './obstacles.js';

var GROUND=-150,CELL=200,SEG=24;
export var ramps=[];

// Where the surface is at distance sv along the profile: height y, depth z, tangent (ty,tz) and up-normal (ny,nz).
export function rampPoint(R,sv){
  if(sv<R.arc){
    var a=sv/R.r,sa=Math.sin(a),ca=Math.cos(a);
    return {y:GROUND+R.r-R.r*ca,z:R.z0+R.r-R.r*sa,ty:sa,tz:-ca,ny:ca,nz:sa};
  }
  return {y:GROUND+R.r+(sv-R.arc),z:R.z0,ty:1,tz:0,ny:0,nz:1};
}

// Grid texture so the surface reads as a floor while you move over it.
var cv=document.createElement('canvas');cv.width=cv.height=256;
var tex=new THREE.CanvasTexture(cv);tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.anisotropy=4;
function rgba(h,a){h=h.replace('#','');return 'rgba('+parseInt(h.slice(0,2),16)+','+parseInt(h.slice(2,4),16)+','+parseInt(h.slice(4,6),16)+','+a+')';}
var edgeMat=new THREE.LineBasicMaterial();
onTheme(function(){
  var c=cv.getContext('2d');
  c.fillStyle=col('--bg');c.fillRect(0,0,256,256);
  c.fillStyle=rgba(col('--accent4'),0.14);c.fillRect(0,0,256,256);
  c.fillStyle=rgba(col('--fg'),0.45);c.fillRect(0,0,256,3);c.fillRect(0,0,3,256);
  tex.needsUpdate=true;
  edgeMat.color.set(col('--accent4'));
});
var surfMat=new THREE.MeshBasicMaterial({map:tex,side:THREE.DoubleSide});

// cfg: x, z = where the wall stands (centre, and the wall plane); w = width; r = curve radius (more than the eye height);
// h = wall height above the curve.
export function addRamp(cfg){
  var R={x0:cfg.x,z0:cfg.z,w:cfg.w,r:cfg.r,h:cfg.h,arc:Math.PI*cfg.r/2,prevZ:1e9};
  R.smax=R.arc+R.h;
  var hw=R.w/2,pos=[],uv=[],idx=[],left=[],right=[],i,n=SEG+1,sv,pt;
  for(i=0;i<=n;i++){ // SEG steps round the curve, then one more up the wall
    sv=i<n?R.arc*i/SEG:R.smax;pt=rampPoint(R,sv);
    pos.push(R.x0-hw,pt.y,pt.z,R.x0+hw,pt.y,pt.z);
    uv.push(-hw/CELL,sv/CELL,hw/CELL,sv/CELL);
    left.push(R.x0-hw,pt.y,pt.z);right.push(R.x0+hw,pt.y,pt.z);
    if(i<n){var j=i*2;idx.push(j,j+1,j+2,j+1,j+3,j+2);}
  }
  var g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);
  scene.add(new THREE.Mesh(g,surfMat));
  var edge=[];for(i=0;i<left.length;i+=3)edge.push(left[i],left[i+1],left[i+2]);
  for(i=right.length-3;i>=0;i-=3)edge.push(right[i],right[i+1],right[i+2]);
  var eg=new THREE.BufferGeometry();eg.setAttribute('position',new THREE.Float32BufferAttribute(edge,3));
  scene.add(new THREE.LineLoop(eg,edgeMat));
  // The curve's footprint is solid on the ground, except where you cross its front edge onto it.
  addObstacle(R.x0-hw,R.x0+hw,R.z0-60,R.z0+R.r-1);
  ramps.push(R);return R;
}

// Crossing a ramp's front edge (z0+r) from the ground, inside its width, puts you on the surface.
export function checkRampEntry(){
  for(var i=0;i<ramps.length;i++){
    var R=ramps[i],u=s.x-R.x0;
    if(R.prevZ>R.z0+R.r&&s.z<=R.z0+R.r&&s.z>R.z0&&Math.abs(u)<R.w/2){
      s.surf=R;s.su=u;s.ss=Math.max(0,R.z0+R.r-s.z);s.phi=s.yaw;s.snapping=false;s.snapped=true;
      return;
    }
    R.prevZ=s.z;
  }
}

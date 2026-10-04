// The three.js renderer, camera and ground grid.
import {S} from './config.js';
import {s} from './state.js';
import {col,onTheme} from './theme.js';

export var renderer=new THREE.WebGLRenderer({antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));
renderer.setSize(innerWidth,innerHeight);
document.body.appendChild(renderer.domElement);

export var scene=new THREE.Scene();
scene.fog=new THREE.Fog(0x000000,300,3000);
export var camera=new THREE.PerspectiveCamera(70,innerWidth/innerHeight,1,6000);
camera.rotation.order='YXZ';

// Square grid, 200-unit cells. Position snaps to grid intersections, yaw to 45 degree steps.
var grid=new THREE.GridHelper(6000,30,0xffffff,0xffffff);
grid.material.transparent=true;grid.material.opacity=0.3;
grid.position.y=-150;
scene.add(grid);

onTheme(function(){
  var bg=new THREE.Color(col('--bg'));
  scene.background=bg;scene.fog.color.copy(bg);
  grid.material.color.set(col('--fg'));
});

export function resize(){
  renderer.setSize(innerWidth,innerHeight);
  camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();
}

var tmpM=new THREE.Matrix4(),tmpR=new THREE.Vector3(),tmpU=new THREE.Vector3(),tmpF=new THREE.Vector3();
export function updateCamera(){
  if(!s.onPath&&!s.surf)s.camY=0;
  camera.position.set(s.x,s.camY,s.z);
  if(s.surf||(s.onPath&&s.cp&&s.cp.spatial)){ // loops, rolls and ramp walls orient the camera from their own frame
    tmpM.makeBasis(tmpR.set(s.cbR.x,s.cbR.y,s.cbR.z),tmpU.set(s.cbU.x,s.cbU.y,s.cbU.z),tmpF.set(-s.cbF.x,-s.cbF.y,-s.cbF.z));
    camera.quaternion.setFromRotationMatrix(tmpM);
  }else camera.rotation.set(s.pitch,-s.yaw,0);
}

export function render(){
  grid.position.x=Math.round(s.x/S)*S;
  grid.position.z=Math.round(s.z/S)*S;
  renderer.render(scene,camera);
}

// Portals: a pair of doorways that each show the world from the other one, with correct perspective, and that you can walk through.
//
// How it works. Each doorway has a frame, facing "front" along its normal (heading psi, same convention as the player's yaw).
// Walking into the front of A leaves you just behind B, moving out of B's front. As one rigid transform that is
//     T(A->B) = B * rotateY(180deg) * A^-1     (A and B being the doorways' world matrices)
// Seeing through A: a virtual camera = T(A->B) * the real camera renders the scene into a texture the size of the screen, with everything
// behind B's plane clipped away. A's opening then shows that texture, sampled in screen space, so it lines up exactly like a window.
// Walking through A: when you get within TRIG units of A's plane inside the opening, your position and heading are mapped by the same T.
// At that distance the opening fills the whole view, so the swap is invisible. Portals are not drawn inside portal views (one level deep).
import {s} from '../state.js';
import {wrap} from '../util.js';
import {scene,camera,renderer} from '../scene.js';
import {col,onTheme} from '../theme.js';
import {updateSkybox} from './skybox.js';
import {setGrassView} from './grass.js';

var DW=140,DH=260,FT=14,CY=-20,TRIG=6; // opening width/height, frame thickness, height of the opening's centre, walk-through distance
var portals=[],frameMats=[];

var VERT='void main(){gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}';
var FRAG='uniform sampler2D map;uniform vec2 res;void main(){gl_FragColor=texture2D(map,gl_FragCoord.xy/res);}';

function makePortal(c){
  var psi=c.yaw*Math.PI/180,P={x:c.x,z:c.z,nx:Math.sin(psi),nz:-Math.cos(psi),prevD:null,prevL:0,live:false,rt:null,rtW:0,rtH:0};
  P.tx=-P.nz;P.tz=P.nx; // along the opening
  var g=new THREE.Group();g.position.set(c.x,CY,c.z);g.rotation.y=Math.PI-psi; // local +z is the front
  var mat=new THREE.MeshBasicMaterial();frameMats.push([mat,c.tint||'--accent']);
  function box(w,h,x,y){var b=new THREE.Mesh(new THREE.BoxGeometry(w,h,FT),mat);b.position.set(x,y,0);g.add(b);}
  box(FT,DH+FT,-(DW/2+FT/2),0);box(FT,DH+FT,DW/2+FT/2,0);box(DW+2*FT,FT,0,DH/2+FT/2); // posts and lintel
  P.mat=new THREE.ShaderMaterial({uniforms:{map:{value:null},res:{value:new THREE.Vector2(1,1)}},vertexShader:VERT,fragmentShader:FRAG});
  P.quad=new THREE.Mesh(new THREE.PlaneGeometry(DW,DH),P.mat);P.quad.visible=false;g.add(P.quad);
  scene.add(g);g.updateMatrixWorld(true);P.group=g;
  P.plane=new THREE.Plane().setFromNormalAndCoplanarPoint(new THREE.Vector3(P.nx,0,P.nz),new THREE.Vector3(c.x,0,c.z)); // keeps what is in front
  portals.push(P);return P;
}

export function addPortalPair(cfg){
  var A=makePortal(cfg.a),B=makePortal(cfg.b),flip=new THREE.Matrix4().makeRotationY(Math.PI);
  function link(P,Q){P.partner=Q;P.toPartner=new THREE.Matrix4().multiplyMatrices(Q.group.matrixWorld,flip).multiply(new THREE.Matrix4().copy(P.group.matrixWorld).invert());}
  link(A,B);link(B,A);
}
onTheme(function(){frameMats.forEach(function(f){f[0].color.set(col(f[1]));});});

var vcam=new THREE.PerspectiveCamera(),frustum=new THREE.Frustum(),projScreen=new THREE.Matrix4(),size=new THREE.Vector2();
vcam.matrixAutoUpdate=false;

function target(P,w,h){ // the screen-sized texture a portal is drawn into
  if(P.rt&&P.rtW===w&&P.rtH===h)return P.rt;
  if(P.rt)P.rt.dispose();
  P.rt=renderer.capabilities.isWebGL2?new THREE.WebGLMultisampleRenderTarget(w,h):new THREE.WebGLRenderTarget(w,h);
  P.rtW=w;P.rtH=h;return P.rt;
}

// Draw each portal that is in view into its texture. Call before the main render.
export function renderPortals(){
  var active=s.mode==='free'&&!s.onPath,i,P;
  for(i=0;i<portals.length;i++){portals[i].live=false;portals[i].quad.visible=false;}
  if(!active){portals.forEach(function(Q){Q.prevD=null;});return;}
  camera.updateMatrixWorld();
  projScreen.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);frustum.setFromProjectionMatrix(projScreen);
  renderer.getDrawingBufferSize(size);
  var w=size.x,h=size.y,cp=camera.position;
  for(i=0;i<portals.length;i++){
    P=portals[i];
    if((cp.x-P.x)*P.nx+(cp.z-P.z)*P.nz<=0||!frustum.intersectsObject(P.quad))continue; // behind it, or off screen
    vcam.matrixWorld.multiplyMatrices(P.toPartner,camera.matrixWorld);
    vcam.matrixWorldInverse.copy(vcam.matrixWorld).invert();
    vcam.projectionMatrix.copy(camera.projectionMatrix);vcam.projectionMatrixInverse.copy(camera.projectionMatrixInverse);
    vcam.position.setFromMatrixPosition(vcam.matrixWorld);
    updateSkybox(vcam.position);setGrassView(vcam.position);
    renderer.clippingPlanes=[P.partner.plane]; // nothing between the virtual camera and the exit doorway
    renderer.setRenderTarget(target(P,w,h));
    renderer.render(scene,vcam);
    renderer.setRenderTarget(null);renderer.clippingPlanes=[];
    P.mat.uniforms.map.value=P.rt.texture;P.mat.uniforms.res.value.set(w,h);P.live=true;
  }
  updateSkybox(camera.position);setGrassView(camera.position);
  for(i=0;i<portals.length;i++)portals[i].quad.visible=portals[i].live;
}

var tmpP=new THREE.Vector3(),tmpF=new THREE.Vector3();
function teleport(P){ // carry the player, and which way they face, through the same transform the view used
  tmpP.set(s.x,0,s.z).applyMatrix4(P.toPartner);
  tmpF.set(Math.sin(s.yaw),0,-Math.cos(s.yaw)).transformDirection(P.toPartner);
  var dY=wrap(Math.atan2(tmpF.x,-tmpF.z)-s.yaw),cD=Math.cos(dY),sD=Math.sin(dY),vx=s.vx; // slide velocity turns with you
  s.vx=vx*cD-s.vz*sD;s.vz=vx*sD+s.vz*cD;
  s.x=tmpP.x;s.z=tmpP.z;s.yaw+=dY;
  s.snapping=false;s.snapped=false; // any grid-snap target was in the old place
}

// Call once per frame after movement: crossing a doorway's trigger line (inside the opening, coming from the front) sends you through.
export function checkPortals(){
  var i,P,fired=false;
  if(s.mode!=='free'||s.onPath){portals.forEach(function(Q){Q.prevD=null;});return;}
  for(i=0;i<portals.length&&!fired;i++){
    P=portals[i];
    var dx=s.x-P.x,dz=s.z-P.z,d=dx*P.nx+dz*P.nz,l=dx*P.tx+dz*P.tz;
    if(P.prevD!==null&&P.prevD>TRIG&&d<=TRIG){
      var f=(P.prevD-TRIG)/(P.prevD-d),lc=P.prevL+(l-P.prevL)*f; // where along the opening the trigger line was crossed
      if(Math.abs(lc)<DW/2-8){teleport(P);fired=true;}
    }
    P.prevD=d;P.prevL=l;
  }
  if(fired)portals.forEach(function(Q){Q.prevD=null;});
}

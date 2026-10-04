// A meadow of dense, windy grass that bends away from you, drawn with GPU instancing.
//
// Efficiency:
//  - One 7-vertex blade is drawn thousands of times; per-blade data (position, turn, height, tint) lives in one small buffer
//    that every chunk shares. Each chunk just shifts the pattern by a random amount so the repeat doesn't show.
//  - The meadow is cut into chunks. Three culls the ones off screen, and every frame each chunk draws only as many blades as its
//    distance deserves: all of them up close, a thinning fraction further out (with wider blades to keep the field looking full),
//    none beyond the fade-out distance. Blades are shuffled, so any prefix of them is an even sprinkle.
//  - Wind, bending and colour are done in the vertex / fragment shader; no CPU work per blade, no textures, no transparency.
import {s} from '../state.js';
import {scene} from '../scene.js';
import {col,onTheme} from '../theme.js';

var GROUND=-150,CH=250,PER_CHUNK=matchMedia('(pointer:coarse)').matches?5500:9000, // touch devices (phones) get a lighter field
    BLADE_H=55,BLADE_W=3.4;
var NEAR=380,FAR=1400,MIN_DENSITY=0.1,MAX_WIDEN=2.6; // full detail inside NEAR, thinning to MIN_DENSITY at FAR, gone beyond

var VERT=[
'attribute vec4 aData;attribute float aVar;',
'uniform float uTime,uLod,uBladeH,uBladeW,uCh;uniform vec2 uSeed,uPlayer;',
'varying float vH;varying float vVar;varying vec2 vWorld;',
'#include <fog_pars_vertex>',
'void main(){',
'  float h=position.y;',
'  vec2 loc=mod(aData.xy+uSeed,uCh);',
'  vec3 base=(modelMatrix*vec4(loc.x,0.0,loc.y,1.0)).xyz;',
'  float H=uBladeH*aData.w,c=cos(aData.z),s=sin(aData.z);',
'  vec3 p=vec3(position.x*uBladeW*uLod,h*H,0.0);',
'  p.xz=vec2(c*p.x-s*p.z,s*p.x+c*p.z);',
'  float bend=h*h;',
'  float w=sin(uTime*1.7+base.x*0.011+base.z*0.016)+0.5*sin(uTime*3.3+base.x*0.047+aVar*6.2831);', // slow swell plus a flutter
'  p.xz+=vec2(0.8,0.6)*(0.10+0.10*w)*H*bend;',                                                    // lean downwind, swaying
'  p.xz+=vec2(-s,c)*(aVar-0.5)*0.35*H*bend;',                                                     // each blade curls its own way
'  vec2 d=base.xz-uPlayer;float dist=length(d);float push=1.0-smoothstep(0.0,110.0,dist);',
'  p.xz+=d/(dist+0.001)*push*H*0.9*bend;p.y-=push*H*0.3*bend;',                                    // flattened away from the player
'  vec4 mvPosition=viewMatrix*vec4(base+p,1.0);',
'  gl_Position=projectionMatrix*mvPosition;',
'  vH=h;vVar=aVar;vWorld=base.xz;',
'  #include <fog_vertex>',
'}'].join('\n');

var FRAG=[
'uniform vec3 uBase,uTip,uDry,uTint;',
'varying float vH;varying float vVar;varying vec2 vWorld;',
'#include <fog_pars_fragment>',
'void main(){',
'  float lush=0.5+0.5*sin(vWorld.x*0.0045)*sin(vWorld.y*0.0057+1.3);',                            // slow dry / lush patches
'  vec3 tip=mix(uTip,uDry,lush*0.65*smoothstep(0.2,1.0,vVar));',
'  vec3 c=mix(uBase,tip,pow(vH,0.8))*(0.8+0.4*vVar)*mix(0.55,1.0,vH);',                            // dark at the roots
'  gl_FragColor=vec4(c*uTint,1.0);',
'  #include <fog_fragment>',
'}'].join('\n');

// One blade: four rungs up, narrowing to a point.  (x across, y height 0..1)
var BLADE=[[-0.5,0],[0.5,0],[-0.42,0.33],[0.42,0.33],[-0.26,0.66],[0.26,0.66],[0,1]];
var INDEX=[0,1,2,1,3,2,2,3,4,3,5,4,4,5,6];

// Per-blade data shared by every chunk: stratified positions (even coverage, no clumps) in shuffled order.
function bladeData(){
  var n=Math.ceil(Math.sqrt(PER_CHUNK)),cell=CH/n,list=[],i,j,k;
  for(i=0;i<n;i++)for(j=0;j<n;j++)list.push([(i+Math.random())*cell,(j+Math.random())*cell]);
  for(k=list.length-1;k>0;k--){var m=Math.floor(Math.random()*(k+1)),t=list[k];list[k]=list[m];list[m]=t;}
  var cnt=list.length,data=new Float32Array(cnt*4),vr=new Float32Array(cnt);
  for(k=0;k<cnt;k++){data[k*4]=list[k][0];data[k*4+1]=list[k][1];data[k*4+2]=Math.random()*Math.PI*2;data[k*4+3]=0.6+Math.random()*0.8;vr[k]=Math.random();}
  return {data:new THREE.InstancedBufferAttribute(data,4),vr:new THREE.InstancedBufferAttribute(vr,1),count:cnt};
}

var shared={uTime:{value:0},uPlayer:{value:new THREE.Vector2(1e9,1e9)},uTint:{value:new THREE.Vector3(1,1,1)},
  uBase:{value:new THREE.Color('#1c3812')},uTip:{value:new THREE.Color('#86b83c')},uDry:{value:new THREE.Color('#c2ad52')}};
var chunks=[],blades=null,soilMat=new THREE.MeshBasicMaterial({color:0x2b4020});

onTheme(function(){ // darker grass in the dark theme
  var c=new THREE.Color(col('--bg')),dark=(c.r+c.g+c.b)/3<0.25,t=dark?0.42:1;
  shared.uTint.value.set(t,t,t);soilMat.color.setRGB(0.17*t,0.25*t,0.125*t);
});

// cfg: x,z = corner of the meadow; w,d = size (rounded up to whole chunks)
export function addGrass(cfg){
  if(!blades)blades=bladeData();
  var nx=Math.ceil(cfg.w/CH),nz=Math.ceil(cfg.d/CH),i,j;
  var soil=new THREE.Mesh(new THREE.PlaneGeometry(nx*CH,nz*CH),soilMat); // the ground between the blades
  soil.rotation.x=-Math.PI/2;soil.position.set(cfg.x+nx*CH/2,GROUND+0.4,cfg.z+nz*CH/2);scene.add(soil);
  var proto=new THREE.InstancedBufferGeometry();
  proto.setAttribute('position',new THREE.Float32BufferAttribute(BLADE.reduce(function(a,v){return a.concat([v[0],v[1],0]);},[]),3));
  proto.setIndex(INDEX);
  for(i=0;i<nx;i++)for(j=0;j<nz;j++){
    var g=new THREE.InstancedBufferGeometry();
    g.setAttribute('position',proto.getAttribute('position'));g.setIndex(proto.getIndex());
    g.setAttribute('aData',blades.data);g.setAttribute('aVar',blades.vr); // the same buffers for every chunk
    g.instanceCount=blades.count;
    g.boundingSphere=new THREE.Sphere(new THREE.Vector3(CH/2,BLADE_H/2,CH/2),CH*0.71+BLADE_H); // for culling (the blades sit inside the chunk)
    var m=new THREE.ShaderMaterial({vertexShader:VERT,fragmentShader:FRAG,side:THREE.DoubleSide,fog:true,
      uniforms:Object.assign(THREE.UniformsUtils.clone(THREE.UniformsLib.fog),shared,{
        uLod:{value:1},uBladeH:{value:BLADE_H},uBladeW:{value:BLADE_W},uCh:{value:CH},
        uSeed:{value:new THREE.Vector2(Math.random()*CH,Math.random()*CH)}})});
    var mesh=new THREE.Mesh(g,m);mesh.position.set(cfg.x+i*CH,GROUND,cfg.z+j*CH);scene.add(mesh);
    chunks.push({mesh:mesh,g:g,m:m,cx:cfg.x+i*CH+CH/2,cz:cfg.z+j*CH+CH/2});
  }
}

// Choose how many blades each chunk draws for a viewer at pos. (Called for the main camera, and for portal views.)
export function setGrassView(pos){
  for(var i=0;i<chunks.length;i++){
    var C=chunks[i],d=Math.max(0,Math.hypot(pos.x-C.cx,pos.z-C.cz)-CH*0.5); // distance to the chunk's near side, roughly
    if(d>=FAR){C.mesh.visible=false;continue;}
    C.mesh.visible=true;
    var f=d<=NEAR?1:1-(1-MIN_DENSITY)*Math.pow((d-NEAR)/(FAR-NEAR),0.7);
    C.g.instanceCount=Math.max(1,Math.floor(blades.count*f));
    C.m.uniforms.uLod.value=Math.min(MAX_WIDEN,1/Math.sqrt(f)); // fewer blades, so each is wider
  }
}

export function updateGrass(now,pos){
  shared.uTime.value=now/1000;shared.uPlayer.value.set(s.x,s.z);
  setGrassView(pos);
}

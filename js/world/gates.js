// Medieval gatehouses with a portcullis you raise and lower with a lever.
//
// The gate: two crenellated stone towers, a wall over the passage, curtain walls either side, and an iron portcullis in the passage.
// The lever: a stone post with a handle that swings up and down on a pivot, over an arc plate. Drag the handle (start the drag ON the
// handle or its knob) and it follows your finger; the portcullis rises or falls behind it, slowly, on its chains. A drag that starts anywhere
// else, including on the arc plate, moves you as usual. While the portcullis is low it is solid; raise it to walk through.
import {s} from '../state.js';
import {scene,camera} from '../scene.js';
import {col,onTheme} from '../theme.js';
import {addObstacle} from './obstacles.js';
import {showHint} from '../dom.js';

var GROUND=-150,OPEN_W=200,OPEN_H=270,TOWER_H=520,RAISE=235,LIM=50*Math.PI/180,LEVER_L=130,RISE_SPEED=0.3,SOLID_BELOW=0.7,REACH=550,BRICK=80;
export var gates=[];

// Stone: a brick-pattern texture, with each face of every block shaded a little differently so the shapes read without lighting.
var cv=document.createElement('canvas');cv.width=cv.height=256;
var tex=new THREE.CanvasTexture(cv);tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.anisotropy=4;
var stoneMat=new THREE.MeshBasicMaterial({map:tex,vertexColors:true}),ironMat=new THREE.MeshBasicMaterial(),woodMat=new THREE.MeshBasicMaterial(),
    knobMat=new THREE.MeshBasicMaterial(),flagMat=new THREE.MeshBasicMaterial({side:THREE.DoubleSide}),plateMat=new THREE.MeshBasicMaterial({transparent:true,opacity:0.55,side:THREE.DoubleSide});
function lum(h){h=h.replace('#','');return (parseInt(h.slice(0,2),16)+parseInt(h.slice(2,4),16)+parseInt(h.slice(4,6),16))/765;}
onTheme(function(){
  var dark=lum(col('--bg'))<0.3,c=cv.getContext('2d'),r=0,y,x;
  c.fillStyle=dark?'#3d3a44':'#6e6960';c.fillRect(0,0,256,256);                  // mortar
  for(y=0;y<8;y++){
    for(x=0;x<4;x++){
      var bx=x*64+(y%2?32:0)-32,v=((x*7+y*13)%5)/5; // each brick a slightly different shade
      c.fillStyle=dark?'hsl(260,8%,'+(24+v*9)+'%)':'hsl(35,10%,'+(56+v*14)+'%)';
      c.fillRect(bx+2,y*32+2,60,28);c.fillRect(bx+256+2,y*32+2,60,28);          // wrap round the tile edge
    }
  }
  tex.needsUpdate=true;
  ironMat.color.set(dark?0x6d6f7c:0x2b2c34);woodMat.color.set(dark?0x5a4331:0x6b4a2b);
  knobMat.color.set(col('--accent4'));flagMat.color.set(dark?0xa8333c:0xb3202a);plateMat.color.set(dark?0x9aa0b4:0x2b2c34);
});

// A stone block of w x h x d with the brick pattern scaled to real size and a brightness per face (+x,-x,+y,-y,+z,-z).
var FACE=[0.78,0.68,1.0,0.5,0.9,0.62];
function brick(w,h,d,x,y,z){
  var g=new THREE.BoxGeometry(w,h,d),uv=g.attributes.uv,dims=[[d,h],[d,h],[w,d],[w,d],[w,h],[w,h]],col=[],f,i;
  for(f=0;f<6;f++)for(i=0;i<4;i++){
    var k=f*4+i;uv.setXY(k,uv.getX(k)*dims[f][0]/BRICK,uv.getY(k)*dims[f][1]/BRICK);col.push(FACE[f],FACE[f],FACE[f]);
  }
  g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));
  var m=new THREE.Mesh(g,stoneMat);m.position.set(x,y,z);return m;
}
function plain(w,h,d,mat,x,y,z){var m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);m.position.set(x,y,z);return m;}

// Crenellations along a straight run on top of a wall: merlons every 'step' units.
function merlons(g,x0,x1,y,z,step,depthAlong){
  for(var x=x0;x<=x1+0.1;x+=step)g.add(brick(depthAlong?30:36,38,depthAlong?36:30,x,y+19,z));
}

function pennant(g,x,y,z){
  g.add(plain(6,100,6,woodMat,x,y+50,z));
  var sh=new THREE.Shape();sh.moveTo(0,0);sh.lineTo(60,-14);sh.lineTo(0,-28);sh.lineTo(0,0);
  var f=new THREE.Mesh(new THREE.ShapeGeometry(sh),flagMat);f.position.set(x+3,y+98,z);g.add(f);
}

// cfg: x,z = centre of the gate passage on the ground; yaw = degrees, a multiple of 90, the way its front faces (0 faces -z, -90 faces -x);
// lever = [local x, local z] of the lever post (local +z is the front of the gate, +x is to the right as you face it).
export function addGate(cfg){
  var psi=cfg.yaw*Math.PI/180,theta=Math.PI-psi,ct=Math.round(Math.cos(theta)),st=Math.round(Math.sin(theta));
  var G={x:cfg.x,z:cfg.z,g:0,lever:-LIM,grab:null,hinted:false};
  var grp=new THREE.Group();grp.position.set(cfg.x,0,cfg.z);grp.rotation.y=theta;scene.add(grp);G.group=grp;
  function toWorld(lx,lz){return [cfg.x+lx*ct+lz*st,cfg.z-lx*st+lz*ct];}
  function solid(lx0,lx1,lz0,lz1,pad,active){ // a footprint (local box) as a world-space obstacle, padded by the walking radius
    var a=toWorld(lx0,lz0),b=toWorld(lx1,lz1);
    addObstacle(Math.min(a[0],b[0])-pad,Math.max(a[0],b[0])+pad,Math.min(a[1],b[1])-pad,Math.max(a[1],b[1])+pad,active);
  }
  var cy=GROUND+TOWER_H/2,hw=OPEN_W/2,tw=160,td=200,wallLen=700;
  // towers
  [-1,1].forEach(function(sd){
    var tx=sd*(hw+tw/2);
    grp.add(brick(tw,TOWER_H,td,tx,cy,0));
    grp.add(brick(tw+20,24,td+20,tx,GROUND+TOWER_H+12,0));                       // overhanging parapet
    var top=GROUND+TOWER_H+24;
    merlons(grp,tx-60,tx+60,top,td/2+4,60,false);merlons(grp,tx-60,tx+60,top,-td/2-4,60,false);
    [-50,0,50].forEach(function(zz){grp.add(brick(30,38,36,tx-tw/2-4,top+19,zz));grp.add(brick(30,38,36,tx+tw/2+4,top+19,zz));});
    pennant(grp,tx,top+38,0);
    solid(tx-tw/2,tx+tw/2,-td/2,td/2,35);
  });
  // wall over the passage, with a beam under it
  grp.add(brick(OPEN_W+4,TOWER_H-OPEN_H,td-40,0,GROUND+OPEN_H+(TOWER_H-OPEN_H)/2,0));
  grp.add(plain(OPEN_W,22,td-20,woodMat,0,GROUND+OPEN_H-11,0));
  merlons(grp,-hw+10,hw-10,GROUND+TOWER_H,td/2-24,60,false);
  // curtain walls either side
  [-1,1].forEach(function(sd){
    var x0=sd*(hw+tw),len=wallLen,cx=x0+sd*len/2,wh=250,wd=90;
    grp.add(brick(len,wh,wd,cx,GROUND+wh/2,0));
    merlons(grp,Math.min(x0,x0+sd*len)+30,Math.max(x0,x0+sd*len)-30,GROUND+wh,wd/2-18,70,false);
    solid(Math.min(x0,x0+sd*len),Math.max(x0,x0+sd*len),-wd/2,wd/2,35);
  });
  // portcullis: iron bars in a frame, spiked at the bottom; it slides up into the wall above
  var pc=new THREE.Group();G.portcullis=pc;grp.add(pc);
  var pw=OPEN_W-10,i;
  for(i=0;i<=8;i++){var bx=-pw/2+pw*i/8;pc.add(plain(9,OPEN_H,9,ironMat,bx,GROUND+OPEN_H/2,0));
    var sp=new THREE.Mesh(new THREE.ConeGeometry(7,26,6),ironMat);sp.rotation.x=Math.PI;sp.position.set(bx,GROUND-10+2,0);pc.add(sp);}
  for(i=0;i<6;i++)pc.add(plain(pw+9,9,12,ironMat,0,GROUND+36+i*(OPEN_H-50)/5,0));
  solid(-hw,hw,-40,40,35,function(){return G.g<SOLID_BELOW;}); // the closed gate is a wall
  // lever: a stone post with the handle swinging in a vertical plane that faces the front of the gate
  var lp=cfg.lever||[-330,380],lg=new THREE.Group();lg.position.set(lp[0],0,lp[1]);grp.add(lg);G.leverGroup=lg;
  lg.add(brick(80,170,80,0,GROUND+85,0));lg.add(brick(100,18,100,0,GROUND+9,0));
  var pivotY=GROUND+105,pz=46;
  var anchor=new THREE.Object3D();anchor.position.set(0,pivotY,pz);lg.add(anchor);G.anchor=anchor;
  var arc=new THREE.Mesh(new THREE.RingGeometry(LEVER_L-16,LEVER_L+16,40,1,Math.PI-LIM,2*LIM),plateMat);arc.position.set(0,pivotY,pz-2);lg.add(arc); // the range of swing
  [-LIM,LIM].forEach(function(a){lg.add(plain(36,8,6,ironMat,-(LEVER_L)*Math.cos(a),pivotY+LEVER_L*Math.sin(a),pz-1));}); // end stops
  var pivot=new THREE.Group();pivot.position.set(0,pivotY,pz+8);lg.add(pivot);G.pivot=pivot;
  pivot.add(plain(LEVER_L,10,10,ironMat,-LEVER_L/2,0,0));
  var boss=new THREE.Mesh(new THREE.CylinderGeometry(15,15,12,16),ironMat);boss.rotation.x=Math.PI/2;pivot.add(boss);
  var knob=new THREE.Mesh(new THREE.SphereGeometry(17,16,12),knobMat);knob.position.set(-LEVER_L,0,0);pivot.add(knob);
  // generous, invisible hit shapes that move with the handle: the handle and its knob only, never the arc plate
  var hitRod=new THREE.Mesh(new THREE.BoxGeometry(LEVER_L,34,34));hitRod.position.set(-LEVER_L/2,0,0);hitRod.visible=false;pivot.add(hitRod);
  var hitKnob=new THREE.Mesh(new THREE.SphereGeometry(30,8,6));hitKnob.position.set(-LEVER_L,0,0);hitKnob.visible=false;pivot.add(hitKnob);
  G.hits=[hitRod,hitKnob];
  solid(lp[0]-50,lp[0]+50,lp[1]-50,lp[1]+50,25);
  gates.push(G);setPose(G);return G;
}

function setPose(G){
  G.pivot.rotation.z=-G.lever;                       // handle up = positive angle
  G.portcullis.position.y=G.g*RAISE;
}

var ray=new THREE.Raycaster(),ndc=new THREE.Vector2(),plane=new THREE.Plane(),nrm=new THREE.Vector3(),pv=new THREE.Vector3(),hit=new THREE.Vector3();
function angleAt(G,cx,cy){ // elevation of the pointer around the pivot, in the swing plane (null if the view is edge-on)
  ndc.set(cx/innerWidth*2-1,-(cy/innerHeight*2-1));ray.setFromCamera(ndc,camera);
  G.anchor.getWorldPosition(pv);nrm.set(0,0,1).transformDirection(G.anchor.matrixWorld);
  plane.setFromNormalAndCoplanarPoint(nrm,pv);
  if(!ray.ray.intersectPlane(plane,hit))return null;
  G.anchor.worldToLocal(hit);
  return Math.atan2(hit.y,-hit.x);
}

// A touch that starts on a handle (or knob) takes hold of it; otherwise returns null and the touch is an ordinary movement drag.
export function grabLever(cx,cy){
  ndc.set(cx/innerWidth*2-1,-(cy/innerHeight*2-1));ray.setFromCamera(ndc,camera);
  for(var i=0;i<gates.length;i++){
    var G=gates[i];G.leverGroup.getWorldPosition(pv);
    if(Math.hypot(pv.x-s.x,pv.z-s.z)>REACH)continue;
    if(ray.intersectObjects(G.hits,false).length){
      var a=angleAt(G,cx,cy);if(a===null)continue;
      G.grab={a0:a,l0:G.lever};return G;
    }
  }
  return null;
}
export function dragLever(G,cx,cy){
  var a=angleAt(G,cx,cy);if(a===null)return;
  G.lever=Math.max(-LIM,Math.min(LIM,G.grab.l0+(a-G.grab.a0)));
}
export function releaseLever(G){G.grab=null;}

// Each frame: the portcullis chases the lever's position slowly, and the pose follows.
export function updateGates(dt){
  gates.forEach(function(G){
    var target=(G.lever+LIM)/(2*LIM),d=target-G.g,step=RISE_SPEED*dt;
    G.g+=Math.abs(d)<=step?d:Math.sign(d)*step;
    setPose(G);
    if(!G.hinted&&s.mode==='free'){G.leverGroup.getWorldPosition(pv);if(Math.hypot(pv.x-s.x,pv.z-s.z)<450){G.hinted=true;showHint('Drag the lever handle up to raise the gate.',4000);}}
  });
}

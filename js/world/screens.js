// Computer screens: solid, upright screens. You can't walk through one; walk up to it and its live page (scrollable, with buttons)
// becomes touchable on its face. Touches that start on it never move you. Add more with addScreen({x,z,title,heading}),
// anywhere you like; each gets its own page, preview image, solid footprint and touch handling.
// The page is laid onto the 3D screen with the same camera (a CSS 3D transform set every frame).
import {EL_PX} from '../config.js';
import {s} from '../state.js';
import {docEl} from '../dom.js';
import {scene,camera} from '../scene.js';
import {col,onTheme,applyTheme} from '../theme.js';
import {setControls,onControlsChange} from '../rules.js';
import {addObstacle} from './obstacles.js';

var css3d=document.getElementById('css3d'),cam3d=document.getElementById('cam3d'),lastFov=0;
export var screens=[];
var scrFrameMat=new THREE.MeshBasicMaterial(),screenTpl=document.querySelector('.screen');
var rayC=new THREE.Raycaster(),ndcV=new THREE.Vector2(),hitV=new THREE.Vector3();
onTheme(function(){scrFrameMat.color.set(col('--fg'));});

export function addScreen(cfg){
  var Sc={x:cfg.x,z:cfg.z,size:75,cy:-4,shown:false,so:0,vel:0};
  Sc.el=screens.length?screenTpl.cloneNode(true):screenTpl;
  if(screens.length)cam3d.appendChild(Sc.el);
  Sc.el.querySelector('.sbar').textContent=cfg.title;Sc.el.querySelector('h3').textContent=cfg.heading;
  Sc.body=Sc.el.querySelector('.sbody');
  Sc.plane=new THREE.Plane(new THREE.Vector3(0,0,1),-(Sc.z+10));
  addObstacle(Sc.x-90,Sc.x+90,Sc.z-70,Sc.z+170); // the base's footprint plus a little walking room
  Sc.cv=document.createElement('canvas');Sc.cv.width=Sc.cv.height=512;Sc.tex=new THREE.CanvasTexture(Sc.cv);
  var g=new THREE.Group();
  function box(w,h,d,bx,by,bz){var b=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),scrFrameMat);b.position.set(bx,by,bz);g.add(b);}
  box(Sc.size+16,Sc.size+16,16,0,Sc.cy,0); // bezel
  box(24,100,14,0,-100,0);                 // neck
  box(140,8,180,0,-146,60);                // base: a long foot reaching out in front, which also keeps you from getting too close
  var d=new THREE.Mesh(new THREE.PlaneGeometry(Sc.size,Sc.size),new THREE.MeshBasicMaterial({map:Sc.tex}));
  d.position.set(0,Sc.cy,8.5);g.add(d);
  g.position.set(Sc.x,0,Sc.z);scene.add(g);
  Sc.draw=function(){ // the preview you see from a distance
    var c=Sc.cv.getContext('2d'),W=512,fg=col('--fg'),bg=col('--bg'),ac=col('--accent4'),i;
    c.fillStyle=bg;c.fillRect(0,0,W,W);
    c.fillStyle=ac;c.fillRect(0,0,W,58);
    c.fillStyle=bg;c.font='800 30px Syne,system-ui,sans-serif';c.textBaseline='middle';c.textAlign='left';c.fillText(cfg.title,22,30);
    c.fillStyle=fg;c.globalAlpha=0.35;
    for(i=0;i<8;i++)c.fillRect(24,96+i*30,i%3===2?250:410,12);
    c.globalAlpha=1;c.strokeStyle=ac;c.lineWidth=5;
    for(i=0;i<3;i++)c.strokeRect(26+i*160,380,128,70);
    c.strokeStyle=fg;c.lineWidth=8;c.strokeRect(4,4,W-8,W-8);
    Sc.tex.needsUpdate=true;
  };
  onTheme(Sc.draw);
  // Place the page on the screen face: element centre at the face, y flipped (CSS is y-down), scaled to the screen size.
  Sc.el.style.transform='translate(-50%,-50%)matrix3d(1,0,0,0,0,-1,0,0,0,0,1,0,'+Sc.x+','+Sc.cy+','+(Sc.z+10)+',1)scale('+(Sc.size/EL_PX)+')';
  // The page is laid onto the 3D face, so touches are hit-tested against that face directly: a ray from the camera through the touch
  // point is intersected with the screen's plane, giving the spot in the page's own pixels. That drives scrolling, taps and the wheel.
  Sc.local=function(cx,cy){
    ndcV.set(cx/innerWidth*2-1,-(cy/innerHeight*2-1));
    rayC.setFromCamera(ndcV,camera);
    if(rayC.ray.direction.z>=0||!rayC.ray.intersectPlane(Sc.plane,hitV))return null;
    var k=Sc.size/EL_PX;
    return {u:(hitV.x-Sc.x)/k+EL_PX/2,v:(Sc.cy-hitV.y)/k+EL_PX/2};
  };
  Sc.hit=function(cx,cy){ // a touch or wheel that lands on this screen while it is visible and close enough
    if(!Sc.shown||Sc.so<0.3)return null;
    var p=Sc.local(cx,cy);
    return p&&p.u>=0&&p.u<=EL_PX&&p.v>=0&&p.v<=EL_PX?p:null;
  };
  Sc.tap=function(u,v){ // press whichever button is under the tap (with a little slop for fingers)
    var bx=u-Sc.el.clientLeft-Sc.body.offsetLeft,by=v-Sc.el.clientTop-Sc.body.offsetTop+Sc.body.scrollTop,btns=Sc.el.querySelectorAll('button');
    for(var i=0;i<btns.length;i++){
      var b=btns[i],pd=8;
      if(bx>=b.offsetLeft-pd&&bx<=b.offsetLeft+b.offsetWidth+pd&&by>=b.offsetTop-pd&&by<=b.offsetTop+b.offsetHeight+pd){
        b.classList.add('press');setTimeout(function(bb){bb.classList.remove('press');}.bind(null,b),160);b.click();return;
      }
    }
  };
  // The page's own buttons (each screen keeps its own count and message).
  var count=0,hi=0,out=Sc.el.querySelector('.sout'),cb=Sc.el.querySelector('[data-act="count"]');
  cb.textContent='Count: 0';out.textContent='';
  Sc.ctrlBtn=Sc.el.querySelector('[data-act="ctrl"]');Sc.ctrlBtn.textContent='Controls: '+(s.ctrlFree?'Free':'Grid');
  Sc.ctrlBtn.addEventListener('click',function(){setControls(!s.ctrlFree);});
  cb.addEventListener('click',function(){count++;cb.textContent='Count: '+count;});
  Sc.el.querySelector('[data-act="hi"]').addEventListener('click',function(){hi++;out.textContent=hi%2?'Hello! This screen says hi back.':'';});
  Sc.el.querySelector('[data-act="theme"]').addEventListener('click',function(){
    var cur=docEl.getAttribute('data-theme')||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');
    docEl.setAttribute('data-theme',cur==='dark'?'light':'dark');applyTheme();
  });
  screens.push(Sc);return Sc;
}

onControlsChange(function(){screens.forEach(function(Sc){Sc.ctrlBtn.textContent='Controls: '+(s.ctrlFree?'Free':'Grid');});});

export function screenAt(cx,cy){ // the screen (if any) under a touch point, with the spot on its page
  for(var i=0;i<screens.length;i++){var p=screens[i].hit(cx,cy);if(p)return {S:screens[i],p:p};}
  return null;
}

// Close enough and in front of a screen (facing it perfectly isn't needed): its page becomes touchable.
export function updateScreenTouch(){
  screens.forEach(function(Sc){
    var on=false;
    if(s.mode==='free'&&!s.onPath){var dxs=s.x-Sc.x,dzs=s.z-Sc.z;on=dzs>0&&dzs<320&&Math.abs(dxs)<200;}
    if(on!==Sc.shown){Sc.shown=on;Sc.el.classList.toggle('on',on);}
  });
}

// Lay each live page onto its 3D screen using this frame's camera (the same maths a CSS3D renderer uses).
// we = how far the 3D world has faded in; screens also fade with distance.
export function layoutScreens(we,dt){
  var camDone=false;
  screens.forEach(function(Sc){
    var sd=Math.hypot(s.x-Sc.x,s.camY-Sc.cy,s.z-Sc.z),so=we*Math.max(0,Math.min(1,(2600-sd)/1400));
    if(so>0.01){
      if(!camDone){
        camDone=true;
        var hh=innerHeight/2,hw=innerWidth/2,fv=camera.projectionMatrix.elements[5]*hh,m=camera.matrixWorldInverse.elements;
        if(fv!==lastFov){lastFov=fv;css3d.style.perspective=fv+'px';}
        cam3d.style.transform='translateZ('+fv+'px)matrix3d('+[m[0],-m[1],m[2],m[3],m[4],-m[5],m[6],m[7],m[8],-m[9],m[10],m[11],m[12],-m[13],m[14],m[15]].join(',')+')translate('+hw+'px,'+hh+'px)';
      }
      Sc.el.style.visibility='visible';
    }else Sc.el.style.visibility='hidden';
    Sc.el.style.opacity=so;Sc.so=so;
    if(Math.abs(Sc.vel)>0.01){Sc.body.scrollTop+=Sc.vel*dt*1000;Sc.vel*=Math.exp(-dt*4);}else Sc.vel=0;
  });
}

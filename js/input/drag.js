// Pointer drags on the canvas (free mode). A drag that starts on a live screen only scrolls / taps that screen, and one that starts on a
// lever handle only works the lever; anywhere else it moves you.
import {s} from '../state.js';
import {hideHint} from '../dom.js';
import {renderer} from '../scene.js';
import {screenAt} from '../world/screens.js';
import {grabLever,dragLever,releaseLever} from '../world/gates.js';
import {pushGesture} from './gesture.js';

var cvs=renderer.domElement,lx=0,ly=0,scrTouch=null,leverTouch=null;
cvs.addEventListener('pointerdown',function(e){
  if(s.mode!=='free')return;
  var h=screenAt(e.clientX,e.clientY);
  if(h){ // started on the screen: only the screen reacts
    scrTouch={S:h.S,u0:h.p.u,v0:h.p.v,v:h.p.v,t:performance.now(),moved:false};h.S.vel=0;hideHint();
    try{cvs.setPointerCapture(e.pointerId);}catch(_){}
    return;
  }
  var lv=grabLever(e.clientX,e.clientY);
  if(lv){ // started on a lever handle: only the lever reacts. Starting anywhere else (even on its arc) moves you.
    leverTouch=lv;hideHint();try{cvs.setPointerCapture(e.pointerId);}catch(_){}
    return;
  }
  s.drag=true;s.gx=0;s.gy=0;lx=e.clientX;ly=e.clientY;try{cvs.setPointerCapture(e.pointerId);}catch(_){}
});
cvs.addEventListener('pointermove',function(e){
  if(leverTouch){dragLever(leverTouch,e.clientX,e.clientY);return;}
  if(scrTouch){
    var Sx=scrTouch.S,pl=Sx.local(e.clientX,e.clientY),tn=performance.now();
    if(pl){
      var dv=pl.v-scrTouch.v;
      if(Math.abs(pl.v-scrTouch.v0)>8||Math.abs(pl.u-scrTouch.u0)>8)scrTouch.moved=true;
      if(scrTouch.moved){Sx.body.scrollTop-=dv;Sx.vel=0.6*Sx.vel+0.4*(-dv/Math.max(1,tn-scrTouch.t));}
      scrTouch.v=pl.v;scrTouch.t=tn;
    }
    return;
  }
  if(!s.drag)return;
  pushGesture(-(e.clientX-lx),-(e.clientY-ly),3,0.011);
  lx=e.clientX;ly=e.clientY;
});
['pointerup','pointercancel'].forEach(function(n){cvs.addEventListener(n,function(e){
  if(leverTouch){releaseLever(leverTouch);leverTouch=null;return;}
  if(scrTouch){
    if(!scrTouch.moved&&e.type==='pointerup')scrTouch.S.tap(scrTouch.u0,scrTouch.v0);
    if(performance.now()-scrTouch.t>80)scrTouch.S.vel=0; // finger had stopped: no fling
    scrTouch=null;return;
  }
  s.drag=false;
});});

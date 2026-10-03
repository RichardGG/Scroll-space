// Look pad (strafe zone): swiping it pans the view. Left/right turns, up/down tilts and springs back to the horizon on release.
import {s} from '../state.js';
import {hideHint} from '../dom.js';

var pad=document.getElementById('pad'),padDot=pad.firstElementChild,pxl=0,pyl=0,shown=false;
function padDotAt(e){
  var r=pad.getBoundingClientRect();
  padDot.style.left=Math.max(9,Math.min(r.width-9,e.clientX-r.left))+'px';
  padDot.style.top=Math.max(9,Math.min(r.height-9,e.clientY-r.top))+'px';
}
pad.addEventListener('pointerdown',function(e){
  e.preventDefault();s.padActive=true;pxl=e.clientX;pyl=e.clientY;pad.classList.add('down');padDotAt(e);
  hideHint();try{pad.setPointerCapture(e.pointerId);}catch(_){}
});
pad.addEventListener('pointermove',function(e){
  if(!s.padActive)return;
  s.lastRotT=performance.now();s.yaw-=(e.clientX-pxl)*0.01; // flipped: swipe right turns left
  s.pitch=Math.max(-1.1,Math.min(1.1,s.pitch+(e.clientY-pyl)*0.008)); // flipped: swipe up looks down
  pxl=e.clientX;pyl=e.clientY;padDotAt(e);
});
['pointerup','pointercancel'].forEach(function(n){pad.addEventListener(n,function(){s.padActive=false;pad.classList.remove('down');});});

export function showLookPad(on){
  if(on===shown)return;
  shown=on;pad.classList.toggle('on',on);
  if(!on){s.padActive=false;pad.classList.remove('down');}
}

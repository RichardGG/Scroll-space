// Bar zone: a strip along the bottom strafes (it keeps the grid snapping), a strip down the right edge looks up and down
// (the tilt springs back to the horizon on release).
import {s} from '../state.js';
import {hideHint} from '../dom.js';

var barB=document.getElementById('barB'),barR=document.getElementById('barR'),dotB=barB.firstElementChild,dotR=barR.firstElementChild;
var shown=false,bx0=0,by0=0;
function pushStrafe(d){s.ps+=d;s.snapped=false;s.snapping=false;s.pSnapOn=false;s.lastInput=performance.now();hideHint();}
function barDot(bar,dot,e,horiz){
  var r=bar.getBoundingClientRect();
  if(horiz){dot.style.left=Math.max(15,Math.min(r.width-15,e.clientX-r.left))+'px';dot.style.top='50%';}
  else{dot.style.top=Math.max(15,Math.min(r.height-15,e.clientY-r.top))+'px';dot.style.left='50%';}
}
barB.addEventListener('pointerdown',function(e){
  e.preventDefault();s.bActive=true;bx0=e.clientX;barB.classList.add('down');barDot(barB,dotB,e,true);
  try{barB.setPointerCapture(e.pointerId);}catch(_){}
});
barB.addEventListener('pointermove',function(e){
  if(!s.bActive)return;
  var dx=e.clientX-bx0;
  pushStrafe(-dx*3*(1+Math.min(Math.abs(dx)/30,3))); // flipped: drag right strafes left
  bx0=e.clientX;barDot(barB,dotB,e,true);
});
['pointerup','pointercancel'].forEach(function(n){barB.addEventListener(n,function(){s.bActive=false;barB.classList.remove('down');});});
barR.addEventListener('pointerdown',function(e){
  e.preventDefault();s.barLook=true;by0=e.clientY;barR.classList.add('down');barDot(barR,dotR,e,false);hideHint();
  try{barR.setPointerCapture(e.pointerId);}catch(_){}
});
barR.addEventListener('pointermove',function(e){
  if(!s.barLook)return;
  s.pitch=Math.max(-1.1,Math.min(1.1,s.pitch+(e.clientY-by0)*0.006)); // flipped: drag up looks down
  by0=e.clientY;barDot(barR,dotR,e,false);
});
['pointerup','pointercancel'].forEach(function(n){barR.addEventListener(n,function(){s.barLook=false;barR.classList.remove('down');});});

export function showBars(on){
  if(on===shown)return;
  shown=on;barB.classList.toggle('on',on);barR.classList.toggle('on',on);
  if(!on){s.bActive=false;s.barLook=false;barB.classList.remove('down');barR.classList.remove('down');}
}

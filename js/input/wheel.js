import {s} from '../state.js';
import {screenAt} from '../world/screens.js';
import {enterFree,onModeChange} from '../mode.js';
import {push,filterX,filterY} from './gesture.js';

var lastWheel=0;
function wheelPush(e){
  var m=e.deltaMode===1?32:e.deltaMode===2?400:1,dx=e.deltaX*m,dy=e.deltaY*m;
  if(e.shiftKey&&!dx){dx=dy;dy=0;}
  var t=performance.now();
  if(t-lastWheel>200){s.gx=0;s.gy=0;}
  lastWheel=t;
  s.gx+=Math.abs(dx);s.gy+=Math.abs(dy);
  push(filterY(dy),filterX(dx),2.2,0.007);
}
function freeWheel(e){
  var hw=screenAt(e.clientX,e.clientY);
  e.preventDefault();
  if(hw){hw.S.body.scrollTop+=e.deltaY*(e.deltaMode===1?32:e.deltaMode===2?400:1);return;} // over the screen: scroll it, no movement
  wheelPush(e);
}
// On the page the wheel listener is passive (native scrolling untouched) and only watches for scrolling past the end of the page.
function nativeWheel(e){if(e.deltaY>0&&window.scrollY>=s.maxScroll-1){enterFree();wheelPush(e);}}

onModeChange(function(m){
  if(m==='free'){removeEventListener('wheel',nativeWheel);addEventListener('wheel',freeWheel,{passive:false});}
  else{removeEventListener('wheel',freeWheel,{passive:false});addEventListener('wheel',nativeWheel,{passive:true});}
});

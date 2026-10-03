// Touch scrolling past the end of the page (finger moving up at the bottom) switches to 3D movement mid-gesture.
import {s} from '../state.js';
import {enterFree} from '../mode.js';
import {pushGesture} from './gesture.js';

var tx0=0,ty0=0,tFeed=false;
addEventListener('touchstart',function(e){var t=e.touches[0];tx0=t.clientX;ty0=t.clientY;tFeed=false;s.gx=0;s.gy=0;},{passive:true});
addEventListener('touchmove',function(e){
  var t=e.touches[0];
  if(!tFeed&&s.mode==='native'&&window.scrollY>=s.maxScroll-1&&t.clientY<ty0-4){enterFree();tFeed=true;}
  if(tFeed)pushGesture(-(t.clientX-tx0),-(t.clientY-ty0),3,0.011);
  tx0=t.clientX;ty0=t.clientY;
},{passive:true});
['touchend','touchcancel'].forEach(function(n){addEventListener(n,function(){tFeed=false;},{passive:true});});

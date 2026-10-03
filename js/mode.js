// Two modes. 'native': the browser scrolls the page and the camera follows it back along the red line.
// 'free': off the red line, custom movement, page scrolling locked.
import {TAU} from './config.js';
import {s} from './state.js';
import {docEl} from './dom.js';
import {DEFAULT_RULES} from './rules.js';

var subs=[];
export function onModeChange(fn){subs.push(fn);}
export function setMode(m){
  s.mode=m;s.drag=false;docEl.classList.toggle('free',m==='free');
  subs.forEach(function(f){f(m);});
}
export function enterFree(){
  if(s.mode==='free')return;
  s.x=0;s.z=Math.max(0,Math.min(s.maxScroll,window.scrollY))/s.ppu;s.pf=0;s.pr=0;s.ps=0;s.snapped=true;s.snapping=false;
  setMode('free');
}
export function enterNative(z,now){ // stepping back onto the red line hands control to the browser's scrolling at the matching spot
  setMode('native');s.pf=0;s.pr=0;s.ps=0;s.snapping=false;
  window.scrollTo(0,Math.max(0,z)*s.ppu);s.lastSy=window.scrollY;s.lastScrollChange=now;
}

export function stepNative(now,k){
  var sy=Math.max(0,Math.min(s.maxScroll,window.scrollY));
  if(sy!==s.lastSy){s.lastSy=sy;s.lastScrollChange=now;}
  s.x=0;s.z=sy/s.ppu;s.pf=0;s.pr=0;s.ps=0;s.curRules=DEFAULT_RULES;
  s.yaw+=(Math.round(s.yaw/TAU)*TAU-s.yaw)*k;
  // Reaching the end of the page and staying there hands control to free movement.
  if(sy>=s.maxScroll-1&&now-s.lastScrollChange>120)enterFree();
}

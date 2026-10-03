// Turns raw wheel / drag / touch / key deltas into pending motion, shared by every input source.
import {s} from '../state.js';
import {hideHint} from '../dom.js';

// Rotation acceleration curve: a slow finger turns gently (about a third of the base rate), a quick throw turns up to ~1.8x.
// The input is how far the finger/wheel moved in one event, so it follows swipe speed.
function rotGain(ax){return 0.35+1.45*Math.pow(Math.min(1,ax/50),1.4);}

export function push(dy,dx,fk,rk){
  // Fast input is boosted (up to 4x) so quick swipes travel far; slow input stays 1:1.
  s.pf-=dy*fk*(1+Math.min(Math.abs(dy)/30,3));
  if(s.curRules.strafe)s.ps+=dx*rk*300;else{s.pr+=dx*rk*rotGain(Math.abs(dx));if(dx)s.lastRotT=performance.now();} // strafe zone: sideways slide instead of turning
  s.snapped=false;s.snapping=false;s.pSnapOn=false;s.lastInput=performance.now();
  hideHint();
}

// Moving and turning are exclusive now, so each gesture keeps only its dominant axis.
// lockAxis: false = both axes always; true = only the dominant axis; 'soft' = drop only the minor axis of a clearly one-sided
// swipe (more than 2:1), so diagonal swipes still do both but stray sideways drift in an up/down swipe is ignored.
export function filterX(dx){
  var m=s.curRules.lockAxis,gx=s.gx,gy=s.gy;
  if(!m)return dx;
  if(m==='soft')return gx+gy<8?(gx>gy?dx:0):(gy<=2*gx?dx:0);
  return (gx+gy>=8&&gy<=gx)?dx:0;
}
export function filterY(dy){
  var m=s.curRules.lockAxis,gx=s.gx,gy=s.gy;
  if(!m)return dy;
  if(m==='soft')return gx+gy<8?(gy>=gx?dy:0):(gx<=2*gy?dy:0);
  return (gx+gy>=8&&gx<gy)?dy:0;
}

// Feed a gesture step (finger or wheel moved by dx,dy) through the axis lock, then into pending motion.
export function pushGesture(dx,dy,fk,rk){
  s.gx+=Math.abs(dx);s.gy+=Math.abs(dy);
  push(filterY(dy),filterX(dx),fk,rk);
}

// On a path: vertical input moves along the curve and the view follows the curve. Rotation is normal, then settles facing
// along the line or straight back (180 degrees apart). At a crossing it also settles onto the other path's two directions.
import {JR} from './config.js';
import {s} from './state.js';
import {wrap,cross3} from './util.js';
import {paths,junctions,ppoint} from './world/paths.js';

function switchTo(q,sq,yawAbs){ // hop onto another path at the crossing, keeping position (it glides in) and facing
  var old={x:s.x,z:s.z},P=ppoint(q,sq);
  s.cp=q;s.pathS=sq;s.ox=old.x-P.x;s.oz=old.z-P.z;s.poff=wrap(yawAbs-P.yaw);
}

// Every heading a turn can settle on right now: along the path both ways, plus both ways along any path crossing here.
export function pathCandidates(){
  var Q=ppoint(s.cp,s.pathS),c=[{p:s.cp,s:s.pathS,a:Q.yaw,f:Q.f},{p:s.cp,s:s.pathS,a:Q.yaw+Math.PI,f:{x:-Q.f.x,y:-Q.f.y,z:-Q.f.z}}];
  for(var i=0;i<junctions.length;i++){
    var J=junctions[i],o=null;
    if(J.p1===s.cp&&Math.abs(J.s1-s.pathS)<JR)o={p:J.p2,s:J.s2};
    else if(J.p2===s.cp&&Math.abs(J.s2-s.pathS)<JR)o={p:J.p1,s:J.s1};
    if(o){var T=ppoint(o.p,o.s);c.push({p:o.p,s:o.s,a:T.yaw,f:T.f},{p:o.p,s:o.s,a:T.yaw+Math.PI,f:{x:-T.f.x,y:-T.f.y,z:-T.f.z}});}
  }
  return c;
}

function snapHeading(){
  var ya=ppoint(s.cp,s.pathS).yaw+s.poff,c=pathCandidates(),best=c[0],bd=9;
  c.forEach(function(e){var d=Math.abs(wrap(e.a-ya));if(d<bd){bd=d;best=e;}});
  if(best.p!==s.cp)switchTo(best.p,best.s,ya);
  s.ptarget=wrap(best.a-ppoint(s.cp,s.pathS).yaw);s.pSnapOn=true;s.pr=0;
}

export function enterPath(P,sv){
  var pt=ppoint(P,sv);
  s.onPath=true;s.cp=P;s.pathS=sv;s.ox=s.x-pt.x;s.oz=s.z-pt.z;s.poff=wrap(s.yaw-pt.yaw);
  s.pr=0;s.ps=0;s.snapping=false;s.snapped=true;
  snapHeading();
}

export function stepPath(dt,now){
  var k=1-Math.exp(-dt*7);
  var dr=s.pr*k;s.pr-=dr;s.poff+=dr;s.ps=0;
  if(!s.drag&&!s.snapped&&Math.abs(s.pr)<0.1&&now-s.lastInput>50){snapHeading();s.snapped=true;}
  if(s.pSnapOn){
    var d=wrap(s.ptarget-s.poff);s.poff+=d*(1-Math.exp(-dt*9));
    if(Math.abs(d)<0.002){s.poff=s.ptarget;s.pSnapOn=false;}
  }
  var df=s.pf*(1-Math.exp(-dt*(3.5+3.5*Math.exp(-Math.abs(s.pf)/300))));s.pf-=df;
  var raw=s.pathS+df*Math.cos(s.poff),out=raw<0||raw>s.cp.len;
  s.pathS=Math.max(0,Math.min(s.cp.len,raw));
  var P=ppoint(s.cp,s.pathS),g=Math.exp(-dt*5);
  s.ox*=g;s.oz*=g;s.x=P.x+s.ox;s.z=P.z+s.oz;s.camY=P.y;
  // The view frame on the path, turned about its own up axis by the free rotation offset.
  var rv=cross3(P.f,P.u),cs=Math.cos(s.poff),sn=Math.sin(s.poff);
  s.cbF={x:P.f.x*cs+rv.x*sn,y:P.f.y*cs+rv.y*sn,z:P.f.z*cs+rv.z*sn};
  s.cbR={x:rv.x*cs-P.f.x*sn,y:rv.y*cs-P.f.y*sn,z:rv.z*cs-P.f.z*sn};s.cbU=P.u;
  s.yaw=s.cp.spatial?Math.atan2(s.cbF.x,-s.cbF.z):P.yaw+s.poff;
  if(out){s.onPath=false;s.pArmed=false;s.snapped=false;s.snapping=false;s.ox=0;s.oz=0;s.camY=0;} // ran off an end: back on the grid, leftover momentum carries on
}

// Arriving at a path's end, facing along the grid line it sits on, steps you onto it.
export function checkPathEntry(){
  var near=999,hit=null;
  for(var pi=0;pi<paths.length;pi++)for(var e=0;e<2;e++){
    var P2=paths[pi],E=P2.end[e],de=Math.hypot(s.x-E.x,s.z-E.z),te=E.yaw;
    near=Math.min(near,de);
    if(de<80&&!hit&&Math.abs(Math.sin(s.yaw)*Math.sin(te)+Math.cos(s.yaw)*Math.cos(te))>0.9)hit={p:P2,s:e?P2.len:0};
  }
  if(near>150)s.pArmed=true;
  if(s.pArmed&&hit)enterPath(hit.p,hit.s);
}

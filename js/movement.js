// One frame of free movement: turning, travelling, sideways slide, grid snapping, collisions, path entry.
import {S,STEP} from './config.js';
import {s} from './state.js';
import {glide} from './util.js';
import {showHint} from './dom.js';
import {PATH_RULES} from './rules.js';
import {rulesAt} from './world/zones.js';
import {collide,clearSpot} from './world/obstacles.js';
import {stepPath,checkPathEntry} from './path-follow.js';
import {enterNative} from './mode.js';
import {checkPortals} from './world/portals.js';
import {checkRampEntry} from './world/ramps.js';
import {stepRamp} from './ramp-walk.js';

var ICE_FRIC=0.8,GROUND_FRIC=9; // how fast slide speed fades per second, on ice and off it

export function stepFree(dt,now,k){
  if(s.surf){stepRamp(dt,now,k);return;} // walking on a wall: its own movement
  var r=s.curRules=s.onPath?PATH_RULES:rulesAt(s.x,s.z);
  if(s.onPath){
    stepPath(dt,now);
  }else if(!r.snapRot){
    // No rotation snapping here: turn and move together at any heading.
    var dr0=s.pr*k;s.pr-=dr0;s.yaw+=dr0;
    var df0=glide(s.pf,dt);s.pf-=df0;
    if(r.ice){s.vx+=Math.sin(s.yaw)*df0*ICE_FRIC;s.vz-=Math.cos(s.yaw)*df0*ICE_FRIC;} // ice: pushes build speed instead of moving you
    else{s.x+=Math.sin(s.yaw)*df0;s.z-=Math.cos(s.yaw)*df0;}
  }else if(Math.abs(s.pf)>1&&!s.snapping){
    // Forward/back travel runs along the closest grid heading and starts at once, even while the view is still swinging round to it.
    var hd=Math.round((s.yaw+s.pr)/STEP)*STEP;
    s.pr=0;
    s.yaw+=(hd-s.yaw)*(1-Math.exp(-dt*16));
    if(Math.abs(hd-s.yaw)<0.02)s.yaw=hd;
    var df=glide(s.pf,dt);s.pf-=df;
    s.x+=Math.sin(hd)*df;s.z-=Math.cos(hd)*df;
  }else if(!s.snapping){
    var dr=s.pr*k;s.pr-=dr;s.yaw+=dr;
  }
  // Sideways slide (from the strafe zone), with the same long-glide feel as forward motion.
  if(Math.abs(s.ps)>0.05){
    var ds=glide(s.ps,dt);s.ps-=ds;
    if(r.ice){s.vx+=Math.cos(s.yaw)*ds*ICE_FRIC;s.vz+=Math.sin(s.yaw)*ds*ICE_FRIC;}
    else{s.x+=Math.cos(s.yaw)*ds;s.z+=Math.sin(s.yaw)*ds;}
  }
  // Slide. Speed set on ice stays in the world direction it was built in, whichever way you turn, and fades slowly. Off the ice
  // it dies away fast, so you carry a little slide across the edge but not far.
  if(!s.onPath&&(s.vx||s.vz)){
    s.x+=s.vx*dt;s.z+=s.vz*dt;
    var dec=Math.exp(-(r.ice?ICE_FRIC:GROUND_FRIC)*dt);s.vx*=dec;s.vz*=dec;
    if(Math.abs(s.vx)+Math.abs(s.vz)<2)s.vx=s.vz=0;
  }
  if(r.ice&&!s.iceHinted){s.iceHinted=true;showHint('Ice! You keep sliding the way you were going.',3500);}
  // Snap a little before the momentum ends: predict where the remaining pending motion would come to rest,
  // round that to the grid, and hand the remaining motion over to the snap so it flows on without a pause.
  // Inside a zone that turns snapping off this never fires; once you leave it, it does, and settles you on the grid.
  if((r.snapPos||r.snapRot)&&!s.drag&&!s.bActive&&!s.snapped&&Math.abs(s.vx)+Math.abs(s.vz)<20&&Math.abs(s.pf)<40&&Math.abs(s.ps)<40&&Math.abs(s.pr)<0.1&&now-s.lastInput>50){
    var th=s.yaw+s.pr; // resting keeps your heading as it is; heading only snaps when you move (the alignment step above)
    var mh=r.snapRot?Math.round(th/STEP)*STEP:th; // the heading forward/back travel actually runs along
    var rx=s.x+Math.sin(mh)*s.pf+Math.cos(th)*s.ps,rz=s.z-Math.cos(mh)*s.pf+Math.sin(th)*s.ps;
    s.tx=r.snapPos?Math.round(rx/S)*S:rx;s.tz=r.snapPos?Math.round(rz/S)*S:rz;s.tyaw=th;
    var cs2=clearSpot(s.tx,s.tz);s.tx=cs2[0];s.tz=cs2[1];
    s.pf=0;s.pr=0;s.ps=0;s.snapped=true;s.snapping=true;
  }
  if(s.snapping){
    s.x+=(s.tx-s.x)*k;s.z+=(s.tz-s.z)*k;s.yaw+=(s.tyaw-s.yaw)*k;
    if(Math.abs(s.tx-s.x)+Math.abs(s.tz-s.z)<0.3&&Math.abs(s.tyaw-s.yaw)<0.0005){s.x=s.tx;s.z=s.tz;s.yaw=s.tyaw;s.snapping=false;}
  }
  if(!s.onPath){
    checkRampEntry(); // before collisions: the ramp's footprint is solid except through its front edge
    if(s.surf)return;
    collide();
    checkPortals();
    checkPathEntry();
  }
  // Stepping back onto the red line hands control to the browser's scrolling at the matching spot.
  if(Math.abs(s.x)<50&&s.z>=-1&&s.z<=s.lineL-1)enterNative(s.z,now);
}

// Walking on a ramp wall. Position is (su across the wall, ss along the profile from the ground up) and phi is the heading
// (0 = straight up the wall). Movement works like the ground: forward goes along the heading, turning is free. The wall's edges
// and top stop you. Walking back down past the foot of the curve returns you to the ground.
import {s} from './state.js';
import {glide} from './util.js';
import {FREE_RULES} from './rules.js';
import {rampPoint} from './world/ramps.js';

var EYE=150,EDGE=40; // eye height above the surface, how close to an edge you can get

export function stepRamp(dt,now,k){
  var R=s.surf;
  s.curRules=FREE_RULES;
  var dr=s.pr*k;s.pr-=dr;s.phi+=dr;
  var df=glide(s.pf,dt);s.pf-=df;
  s.su+=Math.sin(s.phi)*df;s.ss+=Math.cos(s.phi)*df;
  if(Math.abs(s.ps)>0.05){var ds=glide(s.ps,dt);s.ps-=ds;s.su+=Math.cos(s.phi)*ds;s.ss-=Math.sin(s.phi)*ds;}
  // The sides and the top are stopped; you slide along them.
  var lim=R.w/2-EDGE;
  s.su=Math.max(-lim,Math.min(lim,s.su));
  s.ss=Math.min(R.smax-EDGE,s.ss);
  s.yaw=s.phi;
  if(s.ss<0){ // back down past the foot of the curve: onto the ground again
    s.x=R.x0+s.su;s.z=R.z0+R.r-s.ss;s.camY=0;s.surf=null;R.prevZ=s.z;
    return;
  }
  // The view frame: forward along the heading in the surface, up along its normal, then pitched by the look angle.
  var P=rampPoint(R,s.ss),sp=Math.sin(s.phi),cp=Math.cos(s.phi),sP=Math.sin(s.pitch),cP=Math.cos(s.pitch);
  var f0={x:sp,y:cp*P.ty,z:cp*P.tz},u0={x:0,y:P.ny,z:P.nz};
  var rt={x:f0.y*u0.z-f0.z*u0.y,y:f0.z*u0.x-f0.x*u0.z,z:f0.x*u0.y-f0.y*u0.x};
  s.cbR=rt;
  s.cbF={x:f0.x*cP+u0.x*sP,y:f0.y*cP+u0.y*sP,z:f0.z*cP+u0.z*sP};
  s.cbU={x:u0.x*cP-f0.x*sP,y:u0.y*cP-f0.y*sP,z:u0.z*cP-f0.z*sP};
  s.x=R.x0+s.su;s.camY=P.y+P.ny*EYE;s.z=P.z+P.nz*EYE;
}

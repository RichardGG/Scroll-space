// Solid obstacles block walking (boxes in the ground plane, already padded by the walking radius).
import {S} from '../config.js';
import {s} from '../state.js';

var obstacles=[];
export function addObstacle(x0,x1,z0,z1){obstacles.push({x0:x0,x1:x1,z0:z0,z1:z1});}

export function collide(){ // push you back out of any box you've walked into
  for(var i=0;i<obstacles.length;i++){
    var O=obstacles[i];
    if(s.x>O.x0&&s.x<O.x1&&s.z>O.z0&&s.z<O.z1){
      var dl=s.x-O.x0,dr=O.x1-s.x,df=s.z-O.z0,db=O.z1-s.z,m=Math.min(dl,dr,df,db);
      if(m===dl)s.x=O.x0;else if(m===dr)s.x=O.x1;else if(m===df)s.z=O.z0;else s.z=O.z1;
      s.pf=0;s.ps=0;s.snapping=false;s.snapped=false;
    }
  }
}

export function clearSpot(px,pz){ // if a snap target lands inside a box, use the nearest grid intersection outside it
  for(var i=0;i<obstacles.length;i++){
    var O=obstacles[i];
    if(px>O.x0&&px<O.x1&&pz>O.z0&&pz<O.z1){
      var c=[[Math.floor(O.x0/S)*S,pz],[Math.ceil(O.x1/S)*S,pz],[px,Math.floor(O.z0/S)*S],[px,Math.ceil(O.z1/S)*S]],best=c[0],bd=1e9;
      c.forEach(function(q){var d=Math.hypot(q[0]-px,q[1]-pz);if(d<bd){bd=d;best=q;}});
      return best;
    }
  }
  return [px,pz];
}

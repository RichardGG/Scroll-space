// Path network: curved lines between grid intersections, the start of a map for navigating the world.
// Each path's ends sit on grid intersections and leave along a grid axis, so the ends hand you straight back to the grid controls.
// Where two paths cross, rotating to face the other one switches you onto it (see ../path-follow.js).
import {PN,RIDE} from '../config.js';
import {smooth,nrm,dot3,cross3} from '../util.js';
import {scene} from '../scene.js';
import {col,onTheme} from '../theme.js';

export var paths=[],junctions=[];
var pathMat=new THREE.MeshBasicMaterial({side:THREE.DoubleSide});
onTheme(function(){pathMat.color.set(col('--accent3'));});

// Every path is stored as samples: camera position, forward vector and up vector. The track itself is drawn RIDE below the camera
// along "up", so on a loop or a roll the camera rides on the inside / corkscrews around the line.
// Flat curves, kind 'z': runs from a to b along z with an S-shaped sideways shift; kind 'x': the same with the axes swapped.
function pcurve(P,t){return P.kind==='z'?{x:P.ax+(P.bx-P.ax)*smooth(t),z:P.az+(P.bz-P.az)*t}:{x:P.ax+(P.bx-P.ax)*t,z:P.az+(P.bz-P.az)*smooth(t)};}
function ptan(P,t){var w=6*t*(1-t);return P.kind==='z'?Math.atan2((P.bx-P.ax)*w,-(P.bz-P.az)):Math.atan2(P.bx-P.ax,-(P.bz-P.az)*w);}

export function ppoint(P,sv){ // camera position, ground heading and frame at arc length sv
  var lo=0,hi=PN;
  while(hi-lo>1){var m=(lo+hi)>>1;if(P.cum[m]<=sv)lo=m;else hi=m;}
  var f=Math.max(0,Math.min(1,(sv-P.cum[lo])/((P.cum[lo+1]-P.cum[lo])||1))),A=P.s[lo],B=P.s[lo+1];
  function L(k){return A[k]+(B[k]-A[k])*f;}
  var fv=nrm({x:L('fx'),y:L('fy'),z:L('fz')}),uv={x:L('ux'),y:L('uy'),z:L('uz')},d=dot3(uv,fv);
  uv=nrm({x:uv.x-d*fv.x,y:uv.y-d*fv.y,z:uv.z-d*fv.z});
  return {x:L('x'),y:L('y'),z:L('z'),yaw:L('yaw'),f:fv,u:uv};
}

function finishPath(P){
  var i,pp=[],pidx=[];
  P.cum=[0];
  for(i=1;i<=PN;i++){var a=P.s[i-1],b=P.s[i];P.cum.push(P.cum[i-1]+Math.hypot(b.x-a.x,b.y-a.y,b.z-a.z));}
  P.len=P.cum[PN];
  for(i=0;i<=PN;i++){ // ribbon: twists with the frame, so a roll shows as a twisting ribbon
    var q=P.s[i],r=cross3({x:q.fx,y:q.fy,z:q.fz},{x:q.ux,y:q.uy,z:q.uz}),o=(q.rad||RIDE)-1.8;
    var cx=q.x-q.ux*o,cy=q.y-q.uy*o,cz=q.z-q.uz*o;
    pp.push(cx-r.x*8,cy-r.y*8,cz-r.z*8,cx+r.x*8,cy+r.y*8,cz+r.z*8);
    if(i<PN){var j=i*2;pidx.push(j,j+1,j+2,j+1,j+3,j+2);}
  }
  var geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute(pp,3));geo.setIndex(pidx);
  scene.add(new THREE.Mesh(geo,pathMat));
  P.end=[0,PN].map(function(k){var q=P.s[k];return {x:q.x,z:q.z,yaw:Math.atan2(q.fx,-q.fz)};});
  P.end.forEach(function(E){ // crossbars mark the two ends
    var g=new THREE.Group(),cap=new THREE.Mesh(new THREE.PlaneGeometry(140,16),pathMat);
    cap.rotation.x=-Math.PI/2;g.add(cap);g.position.set(E.x,-148.2,E.z);g.rotation.y=-E.yaw;scene.add(g);
  });
  paths.push(P);return P;
}

export function addPath(kind,ax,az,bx,bz){
  var P={kind:kind,ax:ax,az:az,bx:bx,bz:bz,s:[]};
  for(var i=0;i<=PN;i++){var t=i/PN,c=pcurve(P,t),y=ptan(P,t);P.s.push({x:c.x,y:0,z:c.z,fx:Math.sin(y),fy:0,fz:-Math.cos(y),ux:0,uy:1,uz:0,yaw:y});}
  return finishPath(P);
}

// Spatial paths run from (ax,az) toward -z for len units and end level on the grid.
// 'roll': the line rises and the view does one full barrel roll around it. 'loop': a roller-coaster loop (view rides inside it).
export function addSpatial(type,ax,az,len,o){
  var P={type:type,spatial:true,s:[]},tr=[],ur=[],rd=[],i,t,c=len/(2*Math.PI),R=o.R||500,lat=o.lat||0,swell=o.swell||150,turns=o.turns||1;
  for(i=0;i<=PN;i++){
    t=i/PN;
    if(type==='loop'){
      var th=2*Math.PI*t,tF=c+R*Math.cos(th),tH=R*Math.sin(th),n=Math.hypot(tF,tH);
      tr.push({x:ax+lat*smooth(t),y:-150+R*(1-Math.cos(th)),z:az-(c*th+R*Math.sin(th))});
      ur.push({x:0,y:tF/n,z:tH/n}); // points to the inside of the loop
      rd.push(RIDE);
    }else{
      // Corkscrew: the camera stays on a straight axis (rising a little as the coil swells) and the line spirals around it.
      var w=Math.max(0,Math.min(1,(t-0.15)/0.7)),sn=Math.sin(Math.PI*w),rad=RIDE+swell*sn*sn;
      tr.push({x:ax,y:-150+rad,z:az-len*t});
      ur.push({x:0,y:1,z:0});
      rd.push(rad);
    }
  }
  for(i=0;i<=PN;i++){
    var p0=tr[Math.max(0,i-1)],p1=tr[Math.min(PN,i+1)],f=nrm({x:p1.x-p0.x,y:p1.y-p0.y,z:p1.z-p0.z}),u=ur[i],d=dot3(u,f);
    u=nrm({x:u.x-d*f.x,y:u.y-d*f.y,z:u.z-d*f.z});
    if(type==='roll'){
      var w2=Math.max(0,Math.min(1,(i/PN-0.15)/0.7)),phi=2*Math.PI*turns*smooth(w2),r0=cross3(f,u),cp_=Math.cos(phi),sp_=Math.sin(phi);
      u={x:u.x*cp_+r0.x*sp_,y:u.y*cp_+r0.y*sp_,z:u.z*cp_+r0.z*sp_};
    }
    var off=type==='roll'?0:RIDE; // a roll's camera sits on the axis; a loop's camera rides RIDE inside the track
    P.s.push({x:tr[i].x+u.x*off,y:tr[i].y+u.y*off,z:tr[i].z+u.z*off,fx:f.x,fy:f.y,fz:f.z,ux:u.x,uy:u.y,uz:u.z,yaw:0,rad:rd[i]});
  }
  return finishPath(P);
}

export function findJunctions(){ // where two flat paths cross, remember the arc length of the crossing on each
  for(var i=0;i<paths.length;i++)for(var j=i+1;j<paths.length;j++){
    var P=paths[i],Q=paths[j];
    if(P.spatial||Q.spatial)continue;
    for(var a=0;a<PN;a++){
      var p0=pcurve(P,a/PN),p1=pcurve(P,(a+1)/PN),rx=p1.x-p0.x,rz=p1.z-p0.z;
      for(var b=0;b<PN;b++){
        var q0=pcurve(Q,b/PN),q1=pcurve(Q,(b+1)/PN),sx=q1.x-q0.x,sz=q1.z-q0.z,den=rx*sz-rz*sx;
        if(Math.abs(den)<1e-9)continue;
        var u=((q0.x-p0.x)*sz-(q0.z-p0.z)*sx)/den,v=((q0.x-p0.x)*rz-(q0.z-p0.z)*rx)/den;
        if(u>=0&&u<1&&v>=0&&v<1)junctions.push({p1:P,s1:P.cum[a]+u*(P.cum[a+1]-P.cum[a]),p2:Q,s2:Q.cum[b]+v*(Q.cum[b+1]-Q.cum[b])});
      }
    }
  }
}

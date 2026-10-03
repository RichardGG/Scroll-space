// Control zones: squares on the ground that change how movement behaves while you stand inside them.
// Anything a zone doesn't list falls back to DEFAULT_RULES.
import {s} from '../state.js';
import {scene} from '../scene.js';
import {col,onTheme} from '../theme.js';
import {DEFAULT_RULES,onControlsChange} from '../rules.js';

var zones=[];
export function addZone(cfg){
  var cx=cfg.x,cz=cfg.z,size=cfg.size,rules=cfg.rules;
  var g=new THREE.Group(),h=size/2,fm=new THREE.MeshBasicMaterial({transparent:true,opacity:0.16,depthWrite:false,side:THREE.DoubleSide}),
      em=new THREE.MeshBasicMaterial({transparent:true,opacity:0.9,side:THREE.DoubleSide});
  var fill=new THREE.Mesh(new THREE.PlaneGeometry(size,size),fm);fill.rotation.x=-Math.PI/2;g.add(fill);
  [[size+8,8,0,h],[size+8,8,0,-h],[8,size+8,h,0],[8,size+8,-h,0]].forEach(function(e){
    var m=new THREE.Mesh(new THREE.PlaneGeometry(e[0],e[1]),em);m.rotation.x=-Math.PI/2;m.position.set(e[2],0.5,e[3]);g.add(m);
  });
  g.position.set(cx,-148.6,cz);scene.add(g);
  zones.push({x:cx,z:cz,h:h,over:rules||{},rules:Object.assign({},DEFAULT_RULES,rules),tint:cfg.tint||'--accent',fm:fm,em:em});
}

export function rulesAt(px,pz){
  for(var i=0;i<zones.length;i++){var Z=zones[i];if(Math.abs(px-Z.x)<Z.h-1&&Math.abs(pz-Z.z)<Z.h-1)return Z.rules;}
  return DEFAULT_RULES;
}

onControlsChange(function(){zones.forEach(function(Z){Z.rules=Object.assign({},DEFAULT_RULES,Z.over);});});
onTheme(function(){zones.forEach(function(Z){var c=col(Z.tint);Z.fm.color.set(c);Z.em.color.set(c);});});

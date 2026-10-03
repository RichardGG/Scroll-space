// Things you can collect by walking into them. The gun is a small floating pistol built from boxes.
import {s} from '../state.js';
import {scene} from '../scene.js';
import {col,onTheme} from '../theme.js';
import {showHint} from '../dom.js';

var pickups=[],mat=new THREE.MeshBasicMaterial();
onTheme(function(){mat.color.set(col('--accent3'));});

function gunModel(){
  var g=new THREE.Group();
  function box(w,h,d,x,y,z,rz){var b=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);b.position.set(x,y,z);if(rz)b.rotation.z=rz;g.add(b);}
  box(70,16,14,0,10,0);        // slide
  box(16,36,13,-16,-14,0,0.2); // grip
  box(26,5,12,8,-3,0);         // trigger guard
  g.scale.setScalar(1.3);
  return g;
}

export function addPickup(cfg){
  var g=gunModel();
  g.position.set(cfg.x,cfg.y,cfg.z);scene.add(g);
  pickups.push({cfg:cfg,group:g,taken:false});
}

export function updatePickups(now){
  pickups.forEach(function(P){
    if(P.taken)return;
    P.group.rotation.y=now/700;
    P.group.position.y=P.cfg.y+Math.sin(now/450)*8;
    if(s.mode==='free'&&!s.onPath&&Math.hypot(s.x-P.cfg.x,s.z-P.cfg.z)<110){
      P.taken=true;scene.remove(P.group);
      s.hasGun=true;showHint('You got a gun. Tap it to shoot.',3500);
    }
  });
}

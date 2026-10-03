// The red line on the ground, running from the start back along +z. Its top end (the crossbar, at the start) is the top of the page.
import {S,PX_PER_UNIT} from '../config.js';
import {s} from '../state.js';
import {docEl} from '../dom.js';
import {scene} from '../scene.js';

var lineMat=new THREE.MeshBasicMaterial({color:0xe5322b,side:THREE.DoubleSide});
var line=new THREE.Mesh(new THREE.PlaneGeometry(16,1),lineMat);
line.rotation.x=-Math.PI/2;line.scale.y=s.lineL;line.position.set(0,-148,s.lineL/2);scene.add(line);
var cap=new THREE.Mesh(new THREE.PlaneGeometry(140,16),lineMat);
cap.rotation.x=-Math.PI/2;cap.position.set(0,-148,0);scene.add(cap);

// Line length follows the page height (rounded to whole cells so its end sits on a grid intersection),
// so text speed is a steady ~PX_PER_UNIT pixels per world unit.
export function measurePage(){
  s.maxScroll=Math.max(1,docEl.scrollHeight-innerHeight);
  s.lineL=Math.max(600,Math.round(s.maxScroll/PX_PER_UNIT/S)*S);
  s.ppu=s.maxScroll/s.lineL;line.scale.y=s.lineL;line.position.z=s.lineL/2;
}

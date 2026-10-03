// Text labels floating in the world: canvas textures on planes, repainted when the theme changes.
import {scene,renderer} from '../scene.js';
import {col,onTheme} from '../theme.js';

var PX=128,CH=200,labels=[];
var measure=document.createElement('canvas').getContext('2d');

// items: [text, x, y, z, rotateY deg, size, accent]
export function addLabels(items){
  items.forEach(function(it){
    var font='800 '+PX+'px Syne,system-ui,sans-serif';
    measure.font=font;
    var cv=document.createElement('canvas');
    cv.width=Math.ceil(measure.measureText(it[0]).width)+64;cv.height=CH;
    var tex=new THREE.CanvasTexture(cv);
    tex.anisotropy=renderer.capabilities.getMaxAnisotropy();
    var k=it[5]/PX;
    var mesh=new THREE.Mesh(new THREE.PlaneGeometry(cv.width*k,CH*k),
      new THREE.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false,side:THREE.DoubleSide}));
    mesh.position.set(it[1],it[2],it[3]);
    mesh.rotation.y=it[4]*Math.PI/180;
    scene.add(mesh);
    labels.push({text:it[0],accent:it[6],font:font,cv:cv,tex:tex});
  });
}

onTheme(function(){
  labels.forEach(function(l){
    var g=l.cv.getContext('2d');
    g.clearRect(0,0,l.cv.width,l.cv.height);
    g.font=l.font;g.textAlign='center';g.textBaseline='middle';
    g.fillStyle=col(l.accent===1?'--accent':(l.accent||'--fg'));
    g.fillText(l.text,l.cv.width/2,l.cv.height/2);
    l.tex.needsUpdate=true;
  });
});

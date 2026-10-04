// The look of an icy patch: a pale, glassy slab with frost and cracks, slightly see-through so the grid shows faintly beneath.
// (How it feels is the 'ice' movement rule in ../rules.js; a zone with that rule and surface:'ice' gets this slab.)
import {scene} from '../scene.js';
import {col,onTheme} from '../theme.js';

var cv=document.createElement('canvas');cv.width=cv.height=512;
var tex=new THREE.CanvasTexture(cv);tex.wrapS=tex.wrapT=THREE.RepeatWrapping;tex.anisotropy=8;

function rng(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;var t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function lum(h){h=h.replace('#','');return (parseInt(h.slice(0,2),16)+parseInt(h.slice(2,4),16)+parseInt(h.slice(4,6),16))/765;}

// Painted again when the theme changes. The pattern wraps, so a big slab is the tile repeated.
onTheme(function(){
  var c=cv.getContext('2d'),dark=lum(col('--bg'))<0.3,r=rng(5),i,j;
  c.fillStyle=dark?'#245068':'#b6e5fb';c.fillRect(0,0,512,512);
  for(i=0;i<8;i++){ // soft lighter / deeper patches, wrapped so the tile repeats without a seam
    var bx=r()*512,by=r()*512,br=90+r()*110,lite=r()<0.5;
    [[0,0],[-512,0],[512,0],[0,-512],[0,512],[-512,-512],[512,512],[-512,512],[512,-512]].forEach(function(o){
      var rg=c.createRadialGradient(bx+o[0],by+o[1],0,bx+o[0],by+o[1],br);
      rg.addColorStop(0,lite?'rgba(255,255,255,0.28)':(dark?'rgba(5,25,40,0.3)':'rgba(90,160,210,0.22)'));rg.addColorStop(1,'rgba(255,255,255,0)');
      c.fillStyle=rg;c.fillRect(bx+o[0]-br,by+o[1]-br,br*2,br*2);
    });
  }
  for(i=0;i<260;i++){ // frost flecks and bubbles
    c.fillStyle='rgba(255,255,255,'+(0.04+r()*0.14)+')';
    c.beginPath();c.arc(r()*512,r()*512,1+r()*5,0,Math.PI*2);c.fill();
  }
  c.lineCap='round';
  for(i=0;i<9;i++){ // cracks: wandering lines, drawn twice (a dark line and a bright edge) and wrapped round the tile
    var x=r()*512,y=r()*512,a=r()*Math.PI*2,pts=[[x,y]];
    for(j=0;j<14;j++){a+=(r()-0.5)*0.9;x+=Math.cos(a)*(14+r()*22);y+=Math.sin(a)*(14+r()*22);pts.push([x,y]);}
    [[3,dark?'rgba(10,30,45,0.5)':'rgba(70,130,170,0.35)'],[1.2,'rgba(255,255,255,0.55)']].forEach(function(st){
      c.lineWidth=st[0];c.strokeStyle=st[1];
      [[0,0],[-512,0],[512,0],[0,-512],[0,512]].forEach(function(o){
        c.beginPath();pts.forEach(function(p,k){if(k)c.lineTo(p[0]+o[0],p[1]+o[1]);else c.moveTo(p[0]+o[0],p[1]+o[1]);});c.stroke();
      });
    });
  }
  tex.needsUpdate=true;
});

export function addIceSurface(cx,cz,size){
  tex.repeat.set(size/600,size/600);
  var m=new THREE.Mesh(new THREE.PlaneGeometry(size,size),
    new THREE.MeshBasicMaterial({map:tex,transparent:true,opacity:0.92,depthWrite:false}));
  m.rotation.x=-Math.PI/2;m.position.set(cx,-149.2,cz);scene.add(m);
}

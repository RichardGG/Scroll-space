// Mountain skybox: a big inside-out sphere that follows the camera, painted once (and again on theme change) from a procedural
// equirectangular panorama. Sky gradient, sun or moon (with stars at night) and five ridgelines that fade into the horizon haze.
// The ground below the horizon is the scene's fog colour, so the grid floor melts into it.
import {scene} from '../scene.js';
import {col,onTheme} from '../theme.js';

var W=4096,H=2048,HZ=H/2,PXDEG=H/180;
var cv=document.createElement('canvas');cv.width=W;cv.height=H;
var tex=new THREE.CanvasTexture(cv);
tex.anisotropy=4;

var sky=new THREE.Mesh(new THREE.SphereGeometry(5000,48,24),
  new THREE.MeshBasicMaterial({map:tex,side:THREE.BackSide,fog:false,depthWrite:false}));
sky.renderOrder=-1000;sky.frustumCulled=false;scene.add(sky);
export function updateSkybox(pos){sky.position.copy(pos);}

function rgb(h){if(h.charAt(0)==='r')return h.match(/\d+/g).map(Number); // 'rgb(r,g,b)' from mix()
  h=h.replace('#','');if(h.length===3)h=h.replace(/./g,'$&$&');return [parseInt(h.slice(0,2),16),parseInt(h.slice(2,4),16),parseInt(h.slice(4,6),16)];}
function mix(a,b,t){var A=rgb(a),B=rgb(b);return 'rgb('+A.map(function(v,i){return Math.round(v+(B[i]-v)*t);}).join(',')+')';}
function rgba(h,a){var A=rgb(h);return 'rgba('+A[0]+','+A[1]+','+A[2]+','+a+')';}
function rng(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;var t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}

// A ridgeline: a sum of "ridged" sine octaves at whole-number frequencies, so it wraps seamlessly around the panorama.
// Returns heights in 0..1 for each pixel column.
function ridge(seed,rough){
  var r=rng(seed),oct=[],sum=0,i,x,out=new Float32Array(W);
  [3,5,8,13,21,34,55,89,144,233].forEach(function(f,k){var a=Math.pow(f,-rough);oct.push([f,r()*Math.PI,a]);sum+=a;});
  for(x=0;x<W;x++){
    var u=x/W,h=0;
    for(i=0;i<oct.length;i++)h+=oct[i][2]*(1-Math.abs(Math.sin(Math.PI*oct[i][0]*u+oct[i][1])));
    out[x]=Math.pow(h/sum,1.6);
  }
  return out;
}

// layers far to near: [seed, roughness, base degrees, extra degrees, how much of the mountain colour (vs haze)]
var LAYERS=[[11,0.45,3,26,0.2],[23,0.55,2,20,0.35],[37,0.65,1.5,15,0.55],[41,0.75,1,10,0.75],[59,0.85,0.5,6,0.95]];
var ridges=LAYERS.map(function(L){return ridge(L[0],L[1]);});

function paint(){
  var c=cv.getContext('2d'),bg=col('--bg'),fg=col('--fg'),ac=col('--accent'),sun=col('--accent3'),i,x,y;
  var dark=rgb(bg).reduce(function(a,b){return a+b;},0)<300;
  c.fillStyle=bg;c.fillRect(0,0,W,H);
  // sky: haze colour at the horizon, tinted toward the accent overhead
  var g=c.createLinearGradient(0,0,0,HZ);
  g.addColorStop(0,mix(bg,ac,dark?0.16:0.32));g.addColorStop(0.55,mix(bg,ac,dark?0.07:0.12));g.addColorStop(1,bg);
  c.fillStyle=g;c.fillRect(0,0,W,HZ);
  if(dark){ // stars
    var r=rng(7);c.fillStyle=fg;
    for(i=0;i<700;i++){c.globalAlpha=0.2+r()*0.6;var sy=r()*HZ*0.85,sr=0.6+r()*1.4;c.beginPath();c.arc(r()*W,sy,sr,0,Math.PI*2);c.fill();}
    c.globalAlpha=1;
  }
  // sun / moon with a soft glow, sitting just above the far ridges
  var sx=W*0.7,sy2=HZ-PXDEG*13,glow=c.createRadialGradient(sx,sy2,0,sx,sy2,PXDEG*22);
  glow.addColorStop(0,rgba(sun,dark?0.3:0.55));glow.addColorStop(1,rgba(sun,0));
  c.fillStyle=glow;c.fillRect(sx-PXDEG*22,sy2-PXDEG*22,PXDEG*44,PXDEG*44);
  c.fillStyle=sun;c.beginPath();c.arc(sx,sy2,PXDEG*(dark?2.2:2.8),0,Math.PI*2);c.fill();
  // ridgelines, far to near. Each fades into the horizon haze at its foot so there is no hard base line.
  // light theme: ridges get darker toward you; dark theme: they darken from a lit haze down to near black
  var mountain=dark?'#06050f':mix(fg,ac,0.45),haze=dark?mix(bg,ac,0.3):bg;
  LAYERS.forEach(function(L,k){
    var top=HZ-PXDEG*(L[2]+L[3]),body=mix(haze,mountain,L[4]),foot=mix(bg,mix(haze,mountain,L[4]),0.3);
    var gr=c.createLinearGradient(0,top,0,HZ);gr.addColorStop(0,body);gr.addColorStop(1,foot);
    c.fillStyle=gr;c.beginPath();c.moveTo(0,HZ);
    for(x=0;x<=W;x+=2)c.lineTo(x,HZ-PXDEG*(L[2]+L[3]*ridges[k][Math.min(x,W-1)]));
    c.lineTo(W,HZ);c.closePath();c.fill();
  });
  tex.needsUpdate=true;
}
onTheme(paint);

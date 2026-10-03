export function smooth(t){return t*t*(3-2*t);}
export function nrm(v){var l=Math.hypot(v.x,v.y,v.z)||1;return {x:v.x/l,y:v.y/l,z:v.z/l};}
export function dot3(a,b){return a.x*b.x+a.y*b.y+a.z*b.z;}
export function cross3(a,b){return {x:a.y*b.z-a.z*b.y,y:a.z*b.x-a.x*b.z,z:a.x*b.y-a.y*b.x};}
export function wrap(a){return Math.atan2(Math.sin(a),Math.cos(a));}

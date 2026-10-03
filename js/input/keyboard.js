import {s} from '../state.js';
import {enterFree} from '../mode.js';
import {push} from './gesture.js';

addEventListener('keydown',function(e){
  if(e.target&&e.target.closest&&e.target.closest('.screen'))return;
  if(s.mode==='native'){
    if((e.key==='ArrowDown'||e.key==='PageDown'||e.key===' ')&&window.scrollY>=s.maxScroll-1){enterFree();push(60,0,2.2,0.007);}
    return;
  }
  var m={ArrowUp:[-60,0],ArrowDown:[60,0],ArrowLeft:[0,-60],ArrowRight:[0,60]}[e.key];
  if(m){e.preventDefault();push(m[0],m[1],2.2,0.007);}
});

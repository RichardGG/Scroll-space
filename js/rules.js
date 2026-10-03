// Movement rules. FREE: no snapping, move and turn together, sideways drift in an up/down swipe ignored. GRID: snapping.
// A zone lists only what it overrides; the rest follows DEFAULT_RULES, which the button on the computer screens switches.
// Rule keys: snapPos (land on grid points), snapRot (land on 45 degree headings), lockAxis (a swipe either moves or turns, not both),
// strafe (horizontal scroll slides sideways instead of turning), pad (show the look pad), bars (show strafe and look bars).
import {s} from './state.js';
export var FREE_RULES={snapPos:false,snapRot:false,lockAxis:'soft',strafe:false,pad:false,bars:false};
export var SNAP_RULES={snapPos:true,snapRot:true,lockAxis:true,strafe:false,pad:false,bars:false};
export var DEFAULT_RULES=Object.assign({},FREE_RULES);
export var PATH_RULES=Object.assign({},DEFAULT_RULES,{snapPos:false,snapRot:false,lockAxis:true});
s.curRules=DEFAULT_RULES;
var subs=[];
export function onControlsChange(fn){subs.push(fn);}
export function setControls(free){
  s.ctrlFree=free;Object.assign(DEFAULT_RULES,free?FREE_RULES:SNAP_RULES);
  Object.assign(PATH_RULES,DEFAULT_RULES,{snapPos:false,snapRot:false,lockAxis:true});
  s.snapped=false;s.snapping=false;s.lastInput=performance.now(); // if you switched to grid controls, settle onto the grid
  subs.forEach(function(f){f();});
}

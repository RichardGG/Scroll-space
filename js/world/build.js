// Builds the world from data.js. Call once, after the font has loaded (labels measure their text).
import {SCREENS,ZONES,PATHS,ITEMS} from './data.js';
import {addPath,addSpatial,findJunctions} from './paths.js';
import {addScreen} from './screens.js';
import {addZone} from './zones.js';
import {addLabels} from './labels.js';
import {measurePage} from './line.js';

export function buildWorld(){
  PATHS.forEach(function(p){
    if(p.type==='flat')addPath(p.kind,p.ax,p.az,p.bx,p.bz);else addSpatial(p.type,p.x,p.z,p.len,p.opts);
  });
  findJunctions();
  SCREENS.forEach(addScreen);
  ZONES.forEach(addZone);
  addLabels(ITEMS);
  measurePage();
}

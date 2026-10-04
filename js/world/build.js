// Builds the world from data.js. Call once, after the font has loaded (labels measure their text).
import {SCREENS,ZONES,PATHS,PICKUPS,TARGETS,PORTALS,RAMPS,MEADOWS,GATES,ITEMS} from './data.js';
import {addPath,addSpatial,findJunctions} from './paths.js';
import {addScreen} from './screens.js';
import {addZone} from './zones.js';
import {addPickup} from './pickups.js';
import {addTarget} from './targets.js';
import {addPortalPair} from './portals.js';
import {addRamp} from './ramps.js';
import {addGrass} from './grass.js';
import {addGate} from './gates.js';
import {addLabels} from './labels.js';
import {measurePage} from './line.js';

export function buildWorld(){
  PATHS.forEach(function(p){
    if(p.type==='flat')addPath(p.kind,p.ax,p.az,p.bx,p.bz);else addSpatial(p.type,p.x,p.z,p.len,p.opts);
  });
  findJunctions();
  SCREENS.forEach(addScreen);
  ZONES.forEach(addZone);
  PICKUPS.forEach(addPickup);
  TARGETS.forEach(addTarget);
  PORTALS.forEach(addPortalPair);
  RAMPS.forEach(addRamp);
  MEADOWS.forEach(addGrass);
  GATES.forEach(addGate);
  addLabels(ITEMS);
  measurePage();
}

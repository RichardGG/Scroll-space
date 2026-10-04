// The player's mutable state, shared by movement, input and rendering.
// Input adds to the "pending" motion (pf forward, pr rotation, ps sideways); each frame consumes a time-based fraction of it.
export const s={
  mode:'native',                        // 'native': the browser scrolls the page; 'free': custom 3D movement
  x:0,z:0,yaw:0,pitch:0,camY:0,
  vx:0,vz:0,iceHinted:false,            // slide velocity (world units/s), and whether the ice hint has been shown
  pf:0,pr:0,ps:0,                       // pending forward / rotation / sideways motion
  snapped:true,snapping:false,tx:0,tz:0,tyaw:0, // grid-snap bookkeeping and target
  lastInput:0,lastRotT:0,drag:false,
  gx:0,gy:0,                            // per-gesture totals, used to ignore sideways drift in vertical swipes
  maxScroll:1,ppu:1.2,lineL:2000,       // page height, scroll px per world unit, red line length
  lastSy:0,lastScrollChange:0,
  ctrlFree:true,curRules:null,
  hasGun:false,score:0,                 // picked up the gun / target score
                         // picked up the gun
  padActive:false,barLook:false,bActive:false, // on-screen look pad / bars being held
  // walking on a ramp wall: su across, ss up the profile, phi heading (0 = up the wall)
  surf:null,su:0,ss:0,phi:0,
  // path riding
  onPath:false,cp:null,pathS:0,poff:0,ptarget:0,pSnapOn:false,ox:0,oz:0,pArmed:true,
  cbF:{x:0,y:0,z:-1},cbU:{x:0,y:1,z:0},cbR:{x:1,y:0,z:0} // view frame on a spatial path
};

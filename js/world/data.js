// The world as plain data. Add screens, zones, paths and labels here; build.js turns them into objects.

export var SCREENS=[
  {x:400,z:-1500,title:'SCREEN.EXE',heading:'Hello from the screen'},   // out in the open
  {x:-500,z:900,title:'SCREEN2.EXE',heading:'A second screen'}          // out in the open, outside every zone
];

export var ZONES=[
  // Strafe zone: horizontal scroll slides sideways; looking around is done with the on-screen pad (vertical look springs back to the horizon).
  {x:-1200,z:-1000,size:1200,rules:{snapPos:false,snapRot:false,lockAxis:false,strafe:true,pad:true},tint:'--accent2'},
  // Bar zone: the default controls (whichever is selected), plus an on-screen bar to strafe and another to look up and down.
  {x:-2200,z:400,size:1200,rules:{bars:true},tint:'--accent4'}
];

// Things to collect. (200,-1000) is a grid intersection, so grid controls can land right on it.
export var PICKUPS=[
  {type:'gun',x:200,y:-60,z:-1000}
];

export var PATHS=[
  {type:'flat',kind:'z',ax:1600,az:0,bx:2400,bz:-1000},                  // the S-bend
  {type:'flat',kind:'x',ax:1400,az:-800,bx:2600,bz:-200},                // a second curve that crosses it in the middle
  {type:'roll',x:1000,z:1800,len:1600,opts:{turns:2,swell:150}},         // corkscrew / barrel roll
  {type:'loop',x:-1000,z:1800,len:1200,opts:{R:500,lat:200}}             // roller-coaster loop
];

// Labels: [text, x, y, z, rotateY deg, size, accent]  (accent 1 = theme accent, or a CSS variable name)
var ITEMS=[
  ["Scroll to move",0,0,-600,0,56],
  ["Screen",400,85,-1480,0,28,"--accent4"],
  ["Screen 2",-500,85,880,0,28,"--accent4"],
  ["Strafe zone",-1200,-60,-1600,0,52,"--accent2"],
  ["S-bend",1600,-80,-150,0,52,"--accent3"],
  ["Bar zone",-2200,-60,-200,0,52,"--accent4"],
  ["Barrel roll",1000,-80,1950,0,52,"--accent3"],
  ["Loop",-1000,-80,1950,0,52,"--accent3"],
  ["Welcome",0,-70,-1300,0,120,1],
  ["Pick up the gun",200,20,-1000,0,26,"--accent3"],
  ["Depth",-420,-20,-1900,28,76],
  ["Turn sideways",430,20,-2500,-28,68],
  ["Keep going",0,0,-3300,0,92,1]
];
// A ring of labels around the origin, turning to face you as you circle.
var RING=[[70,"Behind you"],[140,"Keep turning"],[180,"Full circle",1],[220,"Still here"],[290,"Nearly back"]],R=1700;
RING.forEach(function(r){var a=r[0]*Math.PI/180;ITEMS.push([r[1],R*Math.sin(a),0,-R*Math.cos(a),-r[0],70,r[2]]);});
export {ITEMS};

// Tunable constants shared across the app.
export const S=200;                 // grid cell size
export const STEP=Math.PI/4;        // yaw snaps to 45 degree steps (so diagonals land on intersections too)
export const PX_PER_UNIT=1.2;       // page scroll pixels per world unit along the red line
export const PN=240;                // samples per path
export const JR=50;                 // how close to a crossing counts as "at the junction"
export const RIDE=150;              // how far the track is drawn below the camera
export const EL_PX=300;             // a screen's page is laid out at this many CSS pixels square
export const SNAP_L=150,SNAP_W=40,SNAP_SC=3.2; // snap arrow plane size (world units) and canvas pixels per unit
export const TAU=Math.PI*2;

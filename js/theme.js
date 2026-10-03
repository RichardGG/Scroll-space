// Theme colours come from CSS variables. Modules register a repaint callback; applyTheme() runs them all.
const root=getComputedStyle(document.documentElement),subs=[];
export function col(n){return root.getPropertyValue(n).trim();}
export function onTheme(fn){subs.push(fn);}
export function applyTheme(){subs.forEach(function(f){f();});}

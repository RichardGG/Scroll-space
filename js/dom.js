// Handles to the static elements in index.html.
export const docEl=document.documentElement;
export const page=document.getElementById('page');
export const hint=document.getElementById('hint');
export function hideHint(){hint.classList.add('off');}
var hintTimer=0;
export function showHint(text,ms){ // bring the hint back with new text for a moment
  hint.textContent=text;hint.classList.remove('off');
  clearTimeout(hintTimer);hintTimer=setTimeout(hideHint,ms||3000);
}

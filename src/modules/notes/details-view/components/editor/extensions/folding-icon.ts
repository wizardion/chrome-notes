// eslint-disable-next-line @typescript-eslint/no-var-requires
const unfoldedIcon = require('../assets/chevron-right.svg?inline');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const foldedIcon = require('../assets/chevron-down.svg?inline');


export function markFolding(folded: boolean): HTMLElement {
  const marker = document.createElement('div');

  marker.classList.add('cm-gutter-folding');
  marker.classList.add(folded ? 'unfolded' : 'folded');
  marker.innerHTML = folded ? foldedIcon : unfoldedIcon;

  return marker;
}

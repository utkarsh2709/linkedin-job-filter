import { HIDDEN_ATTRIBUTE } from '../shared/constants';

const STYLE_ID = 'lcf-hide-style';

export function injectHideStyle(doc: Document = document): void {
  if (doc.getElementById(STYLE_ID)) return;
  const style = doc.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `[${HIDDEN_ATTRIBUTE}] { display: none !important; }`;
  (doc.head ?? doc.documentElement).append(style);
}

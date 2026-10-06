import { describe, expect, it } from 'vitest';
import { injectHideStyle } from '../../src/content/hide-style';
import { HIDDEN_ATTRIBUTE } from '../../src/shared/constants';

describe('injectHideStyle', () => {
  it('injects a single style rule that hides marked elements', () => {
    injectHideStyle();
    injectHideStyle();

    const styles = document.querySelectorAll('#lcf-hide-style');
    expect(styles).toHaveLength(1);

    const card = document.createElement('li');
    card.setAttribute(HIDDEN_ATTRIBUTE, '');
    document.body.append(card);
    expect(getComputedStyle(card).display).toBe('none');
  });
});

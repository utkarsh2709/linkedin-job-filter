import {
  CARD_ANCHOR_SELECTOR,
  DISMISS_BUTTON_SELECTOR,
  JOB_ID_ATTRIBUTES,
  JOB_ID_IN_HREF,
  JOB_LINK_SELECTOR,
  MAX_CARD_DEPTH,
  MAX_CARD_TEXT_LENGTH,
} from './selectors';

/** Set on every element recognized as a job card, so later lookups are a cheap closest(). */
export const CARD_ATTRIBUTE = 'data-lcf-card';

/** Lists whose children have all been scanned at least once. */
const scannedLists = new WeakSet<Element>();

/**
 * Finds job cards in or around `node`: cards inside it, plus the card containing it.
 *
 * A card is found structurally, without class names: start at an anchor (job id,
 * job link or dismiss button) and climb to the largest ancestor that still holds
 * only one job. Its parent is the list.
 */
export function findJobCards(node: Node): Set<HTMLElement> {
  const cards = new Set<HTMLElement>();
  const element = node instanceof Element ? node : node.parentElement;
  if (!element) return cards;

  const enclosing = element.closest<HTMLElement>(`[${CARD_ATTRIBUTE}]`);
  if (enclosing) cards.add(enclosing);

  const anchors = Array.from(element.querySelectorAll(CARD_ANCHOR_SELECTOR));
  if (element.matches(CARD_ANCHOR_SELECTOR)) anchors.push(element);

  for (const anchor of anchors) {
    const card = cardForAnchor(anchor);
    if (!card) continue;
    cards.add(card);

    // A list's first card can render before the second exists, when it is not
    // yet recognizable as a card. Rescan each list once to pick it up.
    const list = card.parentElement;
    if (list && !scannedLists.has(list)) {
      scannedLists.add(list);
      for (const sibling of list.querySelectorAll(CARD_ANCHOR_SELECTOR)) {
        const siblingCard = cardForAnchor(sibling);
        if (siblingCard) cards.add(siblingCard);
      }
    }
  }
  return cards;
}

function cardForAnchor(anchor: Element): HTMLElement | null {
  const known = anchor.closest<HTMLElement>(`[${CARD_ATTRIBUTE}]`);
  if (known) return known;

  let current = anchor;
  for (let depth = 0; depth < MAX_CARD_DEPTH; depth++) {
    const parent = current.parentElement;
    if (!parent || parent === anchor.ownerDocument.body) return null;
    if (containsMultipleJobs(parent)) {
      if (!(current instanceof HTMLElement) || (current.textContent?.length ?? 0) > MAX_CARD_TEXT_LENGTH) return null;
      current.setAttribute(CARD_ATTRIBUTE, '');
      return current;
    }
    current = parent;
  }
  return null;
}

/** True if `element` holds more than one job: two distinct job ids, or two dismiss buttons. */
function containsMultipleJobs(element: Element): boolean {
  if (element.querySelectorAll(DISMISS_BUTTON_SELECTOR).length > 1) return true;

  const ids = new Set<string>();
  const selector = [JOB_LINK_SELECTOR, ...JOB_ID_ATTRIBUTES.map((attribute) => `[${attribute}]`)].join(', ');
  for (const candidate of element.querySelectorAll(selector)) {
    const id = jobIdOf(candidate);
    if (id) ids.add(id);
    if (ids.size > 1) return true;
  }
  return false;
}

export function jobIdOf(element: Element): string | undefined {
  for (const attribute of JOB_ID_ATTRIBUTES) {
    const value = element.getAttribute(attribute);
    if (value && /^\d+$/.test(value)) return value;
  }
  const match = element.getAttribute('href')?.match(JOB_ID_IN_HREF);
  return match?.[1] ?? match?.[2];
}

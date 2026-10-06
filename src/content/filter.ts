import { HIDDEN_ATTRIBUTE } from '../shared/constants';
import type { JobMatcher } from '../shared/matcher';
import type { Job } from '../shared/types';

export interface JobCardAdapter {
  findJobCards(node: Node): Set<HTMLElement>;
  extractJob(card: HTMLElement): Job | null;
}

export interface JobFilter {
  /** Filters cards in or around the given nodes (e.g. from a mutation batch). */
  process(nodes: Iterable<Node>): void;
  /** Re-evaluates every card under `root`, e.g. after the blocklist changed. */
  processAll(root: Node): { cards: number; hidden: number };
}

export function createJobFilter(adapter: JobCardAdapter, getMatcher: () => JobMatcher): JobFilter {
  function apply(card: HTMLElement): boolean {
    const job = adapter.extractJob(card);
    const hide = job !== null && getMatcher()(job);
    // Only touch the DOM when the state actually changes.
    if (card.hasAttribute(HIDDEN_ATTRIBUTE) !== hide) card.toggleAttribute(HIDDEN_ATTRIBUTE, hide);
    return hide;
  }

  return {
    process(nodes) {
      const cards = new Set<HTMLElement>();
      for (const node of nodes) adapter.findJobCards(node).forEach((card) => cards.add(card));
      cards.forEach(apply);
    },

    processAll(root) {
      const cards = adapter.findJobCards(root);
      let hidden = 0;
      cards.forEach((card) => apply(card) && hidden++);
      return { cards: cards.size, hidden };
    },
  };
}

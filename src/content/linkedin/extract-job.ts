import type { Job } from '../../shared/types';
import { jobIdOf } from './find-job-cards';
import {
  CARD_ANCHOR_SELECTOR,
  COMPANY_SELECTORS,
  IGNORED_TEXT_CONTAINERS,
  MAX_CANDIDATE_LINES,
  TITLE_SELECTORS,
} from './selectors';

/** Reads a job card into a generic Job. Returns null while the card has no text yet (lazy rendering). */
export function extractJob(card: HTMLElement): Job | null {
  const anchor = card.matches(CARD_ANCHOR_SELECTOR) ? card : card.querySelector(CARD_ANCHOR_SELECTOR);
  const id = anchor ? jobIdOf(anchor) : undefined;
  const title = firstText(card, TITLE_SELECTORS);

  const company = firstText(card, COMPANY_SELECTORS);
  const lines = textLines(card, MAX_CANDIDATE_LINES);
  if (!company && lines.length === 0) return null;

  // The selector text can be doubled ("Nexal IITNexal IIT") or merged with the
  // location, so the card's first lines are always offered to the matcher too.
  const candidates = [...(company ? [company] : []), ...lines].flatMap((line) => [
    line,
    firstSegment(line),
    undoubled(line),
  ]);
  return { id, title, company: company ? firstSegment(company) : undefined, companyCandidates: [...new Set(candidates)] };
}

/** "Nexal IITNexal IIT" → "Nexal IIT" (aria-hidden + visually-hidden copies). */
function undoubled(text: string): string {
  const half = text.length / 2;
  return Number.isInteger(half) && text.slice(0, half) === text.slice(half) ? text.slice(0, half) : text;
}

function firstText(card: HTMLElement, selectors: readonly string[]): string | undefined {
  for (const selector of selectors) {
    const text = clean(card.querySelector(selector)?.textContent ?? '');
    if (text) return text;
  }
  return undefined;
}

function textLines(card: HTMLElement, limit: number): string[] {
  const lines: string[] = [];
  const walker = card.ownerDocument.createTreeWalker(card, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node && lines.length < limit; node = walker.nextNode()) {
    if (node.parentElement?.closest(IGNORED_TEXT_CONTAINERS)) continue;
    const text = clean(node.textContent ?? '');
    if (text && !lines.includes(text)) lines.push(text);
  }
  return lines;
}

/** "Teradata · Bengaluru (Hybrid)" → "Teradata" */
function firstSegment(text: string): string {
  return clean(text.split('·')[0] ?? text);
}

function clean(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

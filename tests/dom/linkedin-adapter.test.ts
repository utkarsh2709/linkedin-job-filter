import { beforeEach, describe, expect, it } from 'vitest';
import { extractJob } from '../../src/content/linkedin/extract-job';
import { findJobCards } from '../../src/content/linkedin/find-job-cards';
import {
  CIRCANA,
  classicCard,
  detailsPane,
  emptyClassicCard,
  obfuscatedCard,
  page,
  RAOCHRA,
  TERADATA_1,
  TERADATA_2,
} from './fixtures';

beforeEach(() => {
  document.body.innerHTML = '';
});

const cardTexts = (cards: Set<HTMLElement>) => [...cards].map((card) => card.querySelector('p > span, a')?.textContent?.trim());

describe('findJobCards — obfuscated layout', () => {
  it('finds each <li> card via its dismiss button, not the details pane', () => {
    document.body.innerHTML = page(
      [RAOCHRA, CIRCANA, TERADATA_1, TERADATA_2].map(obfuscatedCard).join(''),
      detailsPane('Raochra', RAOCHRA.title),
    );

    const cards = findJobCards(document.body);

    expect(cards.size).toBe(4);
    for (const card of cards) expect(card.tagName).toBe('LI');
  });

  it('distinguishes two cards with identical titles', () => {
    document.body.innerHTML = page([TERADATA_1, TERADATA_2].map(obfuscatedCard).join(''));
    expect(findJobCards(document.body).size).toBe(2);
  });

  it('finds the first card once a second one is appended', () => {
    document.body.innerHTML = page(obfuscatedCard(RAOCHRA));
    expect(findJobCards(document.body).size).toBe(0); // one card alone is indistinguishable from its list

    const list = document.querySelector('ul')!;
    list.insertAdjacentHTML('beforeend', obfuscatedCard(CIRCANA));
    const cards = findJobCards(list.lastElementChild!);

    expect(cardTexts(cards).sort()).toEqual([CIRCANA.title, RAOCHRA.title].sort());
  });

  it('returns the enclosing card for a node inside it', () => {
    document.body.innerHTML = page([RAOCHRA, CIRCANA].map(obfuscatedCard).join(''));
    findJobCards(document.body);
    const inner = document.querySelector('.k4')!;
    expect([...findJobCards(inner)][0]).toBe(inner.closest('li'));
  });
});

describe('findJobCards — classic layout', () => {
  it('uses the occludable <li>, including empty placeholders', () => {
    document.body.innerHTML = page(classicCard(RAOCHRA) + classicCard(CIRCANA) + emptyClassicCard('999'));
    const cards = findJobCards(document.body);
    expect(cards.size).toBe(3);
    for (const card of cards) expect(card.hasAttribute('data-occludable-job-id')).toBe(true);
  });
});

describe('extractJob', () => {
  it('reads company from known classes in the classic layout', () => {
    document.body.innerHTML = page(classicCard(TERADATA_1) + classicCard(CIRCANA));
    const card = [...findJobCards(document.body)][0]!;
    expect(extractJob(card)).toMatchObject({ id: '103', title: 'Senior AI Engineer', company: 'Teradata' });
  });

  it('falls back to leading text lines in the obfuscated layout, skipping svg and button text', () => {
    document.body.innerHTML = page([TERADATA_1, CIRCANA].map(obfuscatedCard).join(''));
    const card = [...findJobCards(document.body)][0]!;
    const job = extractJob(card)!;

    expect(job.company).toBeUndefined();
    expect(job.companyCandidates).toEqual(
      expect.arrayContaining(['Senior AI Engineer', 'Teradata', 'Bengaluru (Hybrid)']),
    );
    expect(job.companyCandidates).not.toContain('Verified job');
    expect(job.companyCandidates).not.toContain('Dismiss');
  });

  it('splits "Company · Location" lines', () => {
    document.body.innerHTML = page(
      obfuscatedCard({ ...TERADATA_1, company: 'Teradata · Bengaluru' }) + obfuscatedCard(CIRCANA),
    );
    const card = [...findJobCards(document.body)][0]!;
    expect(extractJob(card)!.companyCandidates).toContain('Teradata');
  });

  it('returns null for a card without text yet', () => {
    document.body.innerHTML = page(emptyClassicCard('1') + emptyClassicCard('2'));
    const card = [...findJobCards(document.body)][0]!;
    expect(extractJob(card)).toBeNull();
  });
});

describe('extractJob — messy company text', () => {
  const card = (inner: string) => {
    document.body.innerHTML = `<ul><li>${inner}</li></ul>`;
    return document.querySelector('li')!;
  };

  it('matches a doubled company name from the selector', () => {
    const job = extractJob(card('<a href="/jobs/view/1/">Dev</a><div class="artdeco-entity-lockup__subtitle">Nexal IITNexal IIT</div>'))!;
    expect(job.companyCandidates).toContain('Nexal IIT');
  });

  it('matches a company merged with its location by a line break', () => {
    const job = extractJob(card('<a href="/jobs/view/1/">Dev</a><div class="artdeco-entity-lockup__subtitle"><span>Nexal IIT</span><span>India (Remote)</span></div>'))!;
    expect(job.companyCandidates).toContain('Nexal IIT');
  });
});

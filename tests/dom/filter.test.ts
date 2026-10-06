import { beforeEach, describe, expect, it } from 'vitest';
import { createJobFilter } from '../../src/content/filter';
import { extractJob } from '../../src/content/linkedin/extract-job';
import { findJobCards } from '../../src/content/linkedin/find-job-cards';
import { observeMutations } from '../../src/content/observer';
import { HIDDEN_ATTRIBUTE } from '../../src/shared/constants';
import { createMatcher, type JobMatcher } from '../../src/shared/matcher';
import { normalizeCompanyName } from '../../src/shared/normalize';
import {
  CIRCANA,
  classicCard,
  detailsPane,
  obfuscatedCard,
  page,
  RAOCHRA,
  TERADATA_1,
  TERADATA_2,
  WONDERBOTZ,
  type CardSpec,
} from './fixtures';

const blockMatcher = (...names: string[]) =>
  createMatcher(names.map((name) => ({ name, key: normalizeCompanyName(name), addedAt: 0 })));

let matcher: JobMatcher;
const filter = createJobFilter({ findJobCards, extractJob }, () => matcher);

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

function hiddenCompanies(): string[] {
  return [...document.querySelectorAll(`[${HIDDEN_ATTRIBUTE}]`)].map(
    (card) => extractJob(card as HTMLElement)?.company ?? extractJob(card as HTMLElement)?.companyCandidates?.[1] ?? '',
  );
}

beforeEach(() => {
  document.body.innerHTML = '';
  matcher = blockMatcher('Teradata');
});

describe.each([
  ['obfuscated', obfuscatedCard],
  ['classic', classicCard],
] as const)('%s layout', (_, renderCard: (spec: CardSpec) => string) => {
  it('hides blocked companies on the initial scan and leaves others visible', () => {
    document.body.innerHTML = page([RAOCHRA, CIRCANA, TERADATA_1, TERADATA_2].map(renderCard).join(''));

    expect(filter.processAll(document.body)).toEqual({ cards: 4, hidden: 2 });
    expect(hiddenCompanies()).toEqual(['Teradata', 'Teradata']);
  });

  it('hides cards appended later (infinite scroll / next page)', async () => {
    document.body.innerHTML = page([RAOCHRA, CIRCANA].map(renderCard).join(''));
    filter.processAll(document.body);
    const stop = observeMutations(document.body, (nodes) => filter.process(nodes));

    document.querySelector('ul')!.insertAdjacentHTML('beforeend', [TERADATA_1, WONDERBOTZ].map(renderCard).join(''));
    await flush();

    expect(hiddenCompanies()).toEqual(['Teradata']);
    stop();
  });

  it('re-evaluates when the blocklist changes', () => {
    document.body.innerHTML = page([RAOCHRA, CIRCANA, TERADATA_1].map(renderCard).join(''));
    filter.processAll(document.body);

    matcher = blockMatcher('Circana');
    filter.processAll(document.body);
    expect(hiddenCompanies()).toEqual(['Circana']);

    matcher = blockMatcher();
    expect(filter.processAll(document.body).hidden).toBe(0);
  });
});

it('hides a lazily rendered card once its content arrives', async () => {
  document.body.innerHTML = page(
    classicCard(RAOCHRA) + `<li class="scaffold-layout__list-item" data-occludable-job-id="${TERADATA_1.id}"></li>`,
  );
  filter.processAll(document.body);
  const stop = observeMutations(document.body, (nodes) => filter.process(nodes));

  const placeholder = document.querySelector(`[data-occludable-job-id="${TERADATA_1.id}"]`)!;
  expect(placeholder.hasAttribute(HIDDEN_ATTRIBUTE)).toBe(false);

  const filled = document.createElement('template');
  filled.innerHTML = classicCard(TERADATA_1);
  placeholder.append(...filled.content.firstElementChild!.childNodes);
  await flush();

  expect(placeholder.hasAttribute(HIDDEN_ATTRIBUTE)).toBe(true);
  stop();
});

it('never hides the job details pane, even when it shows a blocked company', () => {
  document.body.innerHTML = page(
    [TERADATA_1, CIRCANA].map(obfuscatedCard).join(''),
    detailsPane('Teradata', TERADATA_1.title),
  );
  filter.processAll(document.body);
  expect(document.querySelector('.details-pane [data-lcf-hidden], .details-pane[data-lcf-hidden]')).toBeNull();
  expect(document.querySelectorAll(`[${HIDDEN_ATTRIBUTE}]`)).toHaveLength(1);
});

it('does not hide a card whose title merely contains a blocked name', () => {
  matcher = blockMatcher('Senior AI');
  document.body.innerHTML = page([TERADATA_1, CIRCANA].map(obfuscatedCard).join(''));
  expect(filter.processAll(document.body).hidden).toBe(0);
});

// Every LinkedIn-specific selector lives here. See DOM_RESEARCH.md.
// Class names are tried first where they exist, but card detection must not
// depend on them: the newer /jobs/search-results/ UI uses obfuscated classes.

/** Attributes whose value is a job id. */
export const JOB_ID_ATTRIBUTES = ['data-occludable-job-id', 'data-job-id'] as const;

/** Hrefs that identify one job: /jobs/view/<id> and ?currentJobId=<id>. */
export const JOB_LINK_SELECTOR = 'a[href*="/jobs/view/"], a[href*="currentJobId="]';
export const JOB_ID_IN_HREF = /\/jobs\/view\/(\d+)|[?&]currentJobId=(\d+)/;

/** The "✕" button each card has; its aria-label is e.g. "Dismiss Senior AI Engineer job". */
export const DISMISS_BUTTON_SELECTOR = 'button[aria-label^="Dismiss"]';

/** Anything that marks "a job card is here". Each card has at least one. */
export const CARD_ANCHOR_SELECTOR = [
  ...JOB_ID_ATTRIBUTES.map((attribute) => `[${attribute}]`),
  JOB_LINK_SELECTOR,
  DISMISS_BUTTON_SELECTOR,
].join(', ');

/** Known company elements (older search UI, guest pages). Tried before the text fallback. */
export const COMPANY_SELECTORS = [
  '.artdeco-entity-lockup__subtitle',
  '.job-card-container__primary-description',
  '.job-card-container__company-name',
  '.base-search-card__subtitle',
];

export const TITLE_SELECTORS = ['.job-card-list__title', '.artdeco-entity-lockup__title', '.base-search-card__title'];

/** Text inside these never holds the company name. */
export const IGNORED_TEXT_CONTAINERS = 'svg, button, script, style, template';

/** How many leading text lines of a card are company-name candidates in the fallback. */
export const MAX_CANDIDATE_LINES = 8;

/** Cards are short; anything longer (e.g. the job details pane) is not a card. */
export const MAX_CARD_TEXT_LENGTH = 1500;
export const MAX_CARD_DEPTH = 12;

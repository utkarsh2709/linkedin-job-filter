import { createMatcher, type JobMatcher } from '../shared/matcher';
import { createCompanyStorage } from '../storage/company-storage';
import { createJobFilter } from './filter';
import { injectHideStyle } from './hide-style';
import { extractJob } from './linkedin/extract-job';
import { findJobCards } from './linkedin/find-job-cards';
import { observeMutations } from './observer';
import { isJobsPage, watchUrl } from './navigation';

const LOG_PREFIX = '[LinkedIn Company Filter]';

let matcher: JobMatcher = createMatcher([]);
const filter = createJobFilter({ findJobCards, extractJob }, () => matcher);

function rescan(reason: string): void {
  if (!isJobsPage(location)) return;
  const { cards, hidden } = filter.processAll(document.body);
  console.debug(LOG_PREFIX, `${reason}: ${cards} job cards found, ${hidden} hidden`);
}

async function init(): Promise<void> {
  injectHideStyle();
  const storage = createCompanyStorage();

  storage.subscribe((companies) => {
    matcher = createMatcher(companies);
    rescan('blocklist changed');
  });

  try {
    matcher = createMatcher(await storage.getCompanies());
  } catch (error) {
    console.warn(LOG_PREFIX, 'could not load blocklist:', error);
  }

  // The script runs on all of linkedin.com because entering Jobs from the feed
  // is a client-side navigation that never re-injects it. Outside /jobs it only
  // compares URLs.
  const url = watchUrl(() => rescan('navigation'));
  observeMutations(document.body, (nodes) => {
    url.check();
    if (isJobsPage(location)) filter.process(nodes);
  });
  rescan('initial scan');
}

void init();

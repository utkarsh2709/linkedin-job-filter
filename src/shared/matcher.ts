import { normalizeCompanyName } from './normalize';
import type { BlockedCompany, Job } from './types';

export type JobMatcher = (job: Job) => boolean;

/** Builds an O(1)-per-name exact-match check; rebuild it when the blocklist changes. */
export function createMatcher(blocked: readonly BlockedCompany[]): JobMatcher {
  const keys = new Set(blocked.map((company) => company.key));
  return (job) => {
    if (keys.size === 0) return false;
    const names = [...(job.company !== undefined ? [job.company] : []), ...(job.companyCandidates ?? [])];
    return names.some((name) => keys.has(normalizeCompanyName(name)));
  };
}

export function isBlockedCompany(company: string, blocked: readonly BlockedCompany[]): boolean {
  return createMatcher(blocked)({ company });
}

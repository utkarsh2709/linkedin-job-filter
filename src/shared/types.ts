/** A job listing, independent of how LinkedIn renders it. */
export interface Job {
  id?: string;
  title?: string;
  /** Display text of the company, when the adapter could locate it. */
  company?: string;
  /**
   * Extra text snippets that may be the company (e.g. the card's first lines). A job matches if any candidate matches.
   */
  companyCandidates?: string[];
  /** From a /company/<slug>/ link, when the card has one. */
  companySlug?: string;
  url?: string;
  isPromoted?: boolean;
}

export interface BlockedCompany {
  /** As the user typed it, for display. */
  name: string;
  /** normalizeCompanyName(name), for matching and dedup. */
  key: string;
  addedAt: number;
}

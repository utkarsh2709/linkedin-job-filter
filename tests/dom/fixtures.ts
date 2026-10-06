// SYNTHETIC markup shaped like LinkedIn's job lists. Not copied from LinkedIn;
// replace or supplement with sanitized real snapshots in tests/fixtures/.

export interface CardSpec {
  id: string;
  title: string;
  company: string;
  location: string;
}

/** Newer /jobs/search-results/ UI: obfuscated classes, no stable class names. */
export function obfuscatedCard({ title, company, location }: CardSpec): string {
  return `
    <li class="a1b2c3">
      <div class="x9y8" role="button" tabindex="0">
        <img class="q1" alt="" src="data:," />
        <div class="z7">
          <p class="k3"><span>${title}</span>
            <svg aria-label="Verified job"><title>Verified job</title></svg></p>
          <p class="k4">${company}</p>
          <p class="k5">${location}</p>
          <p class="k6">You'd be a top applicant</p>
          <p class="k7">1 day ago</p>
        </div>
        <button aria-label="Dismiss ${title} job"><svg><title>Dismiss</title></svg></button>
      </div>
    </li>`;
}

/** Older /jobs/search/ UI: data-occludable-job-id + BEM classes. */
export function classicCard({ id, title, company, location }: CardSpec): string {
  return `
    <li class="scaffold-layout__list-item" data-occludable-job-id="${id}">
      <div class="job-card-container" data-job-id="${id}">
        <a class="job-card-list__title" href="/jobs/view/${id}/?trk=abc" aria-label="${title}">
          <strong>${title}</strong>
        </a>
        <div class="artdeco-entity-lockup__subtitle"><span>${company}</span></div>
        <ul><li>${location}</li></ul>
        <button aria-label="Dismiss ${title} job">✕</button>
      </div>
    </li>`;
}

/** Lazily rendered placeholder: the <li> exists, its content arrives later. */
export function emptyClassicCard(id: string): string {
  return `<li class="scaffold-layout__list-item" data-occludable-job-id="${id}"></li>`;
}

export function detailsPane(company: string, title: string): string {
  return `
    <section class="details">
      <a href="/company/${company.toLowerCase()}/">${company}</a>
      <h1>${title}</h1>
      <p>India · 1 day ago · Over 100 applicants</p>
      <button>Easy Apply</button><button>Save</button>
      <article>${'About the job. '.repeat(150)} ${company}</article>
    </section>`;
}

export function page(list: string, details = ''): string {
  return `
    <main>
      <div class="list-pane">
        <header><h2>Jobs based on your preferences</h2><p>99+ results</p></header>
        <ul class="list">${list}</ul>
      </div>
      <div class="details-pane">${details}</div>
    </main>`;
}

export const RAOCHRA: CardSpec = { id: '101', title: 'Senior Full Stack Engineer', company: 'Raochra', location: 'India (Remote)' };
export const CIRCANA: CardSpec = { id: '102', title: 'Lead Software Engineer - AI Automation', company: 'Circana', location: 'Bengaluru' };
export const TERADATA_1: CardSpec = { id: '103', title: 'Senior AI Engineer', company: 'Teradata', location: 'Bengaluru (Hybrid)' };
export const TERADATA_2: CardSpec = { id: '104', title: 'Senior AI Engineer', company: 'Teradata', location: 'Bengaluru (Hybrid)' };
export const WONDERBOTZ: CardSpec = { id: '105', title: 'Senior AI Engineer (Generative AI & Agentic Systems)', company: 'WonderBotz', location: 'India (Remote)' };

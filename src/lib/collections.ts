import { ROLES, type Publication, type NewsItem, type Person, type Role } from './schemas';

/** Generic ascending sort for any collection carrying an `order` field. */
export function byOrder<T extends { order: number }>(items: T[]): T[] {
  return items.slice().sort((a, b) => a.order - b.order);
}

/** Featured publications, newest first, title-tiebroken for determinism. */
export function latestPublications(pubs: Publication[], limit = 4): Publication[] {
  return pubs
    .filter((p) => p.featured)
    .slice()
    .sort((a, b) => b.year - a.year || a.title.localeCompare(b.title))
    .slice(0, limit);
}

/** All publications in descending year buckets. */
export function byYear(pubs: Publication[]): { year: number; items: Publication[] }[] {
  const buckets = new Map<number, Publication[]>();
  for (const p of pubs) {
    const b = buckets.get(p.year);
    if (b) b.push(p);
    else buckets.set(p.year, [p]);
  }
  return [...buckets.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([year, items]) => ({ year, items: items.slice().sort((a, b) => a.title.localeCompare(b.title)) }));
}

/** News items, newest first. */
export function latestNews(items: NewsItem[], limit = 3): NewsItem[] {
  return items.slice().sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, limit);
}

/** Active members grouped by role in canonical seniority order; empty groups dropped. */
export function groupPeople(people: Person[]): { role: Role; members: Person[] }[] {
  const active = people.filter((p) => !p.alumni);
  return ROLES.map((role) => ({
    role,
    members: active.filter((p) => p.role === role).sort((a, b) => a.order - b.order),
  })).filter((g) => g.members.length > 0);
}

/** Former members, alphabetical. */
export function alumniOf(people: Person[]): Person[] {
  return people.filter((p) => p.alumni).sort((a, b) => a.name.localeCompare(b.name));
}

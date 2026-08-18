# Lab Website (Phases 1–3) Implementation Plan

> **SUPERSEDED** by `2026-08-18-landing-page.md`, written once the real content and assets
> were available. Kept for the reasoning it records; do not execute it.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete, locally-running lab website — landing page, People page, Publications page — backed by four content collections, plus the Pages CMS config that turns those collections into web forms for a non-technical editor.

**Architecture:** Astro 5 static site. All content lives as Markdown files under `src/content/`, validated at build time by Zod schemas. Pure TypeScript helpers in `src/lib/collections.ts` do all selecting/sorting/grouping and are unit-tested with Vitest; `.astro` components stay dumb and just render what the helpers return. Styling is plain CSS with custom-property design tokens — no Tailwind, no CSS framework — so a future maintainer can read it. The only JavaScript shipped to the browser is the ~40-line hero slider.

**Tech Stack:** Astro 5, TypeScript (strict), Vitest, plain CSS. No UI framework, no runtime dependencies.

**Spec:** `docs/superpowers/specs/2026-08-18-lab-website-design.md`

---

## Scope

**In scope (Phases 1–3):** project scaffold, 4 content collections + schemas, collection helpers, landing page (9 sections), People page, Publications page, `.pages.yml` CMS config.

**Out of scope (separate plans):** Research / Participate / News-detail pages (Phase 2 remainder); GitHub push, Cloudflare Pages, DNS cutover (Phase 4); ORCID/PubMed sync Action (Phase 5).

## Deviations from the spec — read before starting

1. **Spec §7.1 says "Astro's image optimisation".** This plan instead stores media in `public/images/` and references it by plain string path, with explicit `width`/`height`, `loading="lazy"` and `decoding="async"` on every `<img>`.
   **Why:** Astro's `astro:assets` pipeline requires images imported from `src/`, which fights a Git-based CMS that writes uploads to a fixed folder. The spec's actual goal — no layout shift, fast loads — is met by explicit dimensions and lazy loading. Revisit only if page weight becomes a real problem.
2. **Spec §11 (visual identity) is unresolved.** Task 5 establishes a deliberately restrained neutral palette and system-font stack as a *placeholder*, isolated in one file (`src/styles/tokens.css`) so it can be retuned with the user without touching any component. **Task 15 is the checkpoint where that happens.**

## File Structure

| File | Responsibility |
|---|---|
| `package.json`, `astro.config.mjs`, `tsconfig.json`, `vitest.config.ts`, `.gitignore` | Project scaffold |
| `src/lib/schemas.ts` | Zod schemas for all 4 collections. Plain `astro/zod` so they are unit-testable outside Astro |
| `src/content.config.ts` | Wires schemas to Astro collections via the glob loader |
| `src/content/pages/home.yaml` | Editable homepage body copy (spec §6.5) — so the PI can reword the site without a developer |
| `src/lib/collections.ts` | Pure functions: select/sort/group. **All business logic lives here** |
| `tests/collections.test.ts`, `tests/schemas.test.ts`, `tests/build.test.ts` | Unit + build-output tests |
| `src/styles/tokens.css` | Design tokens — the single file to edit when tuning visual identity |
| `src/styles/global.css` | Reset, base typography, shared utility classes |
| `src/layouts/Base.astro` | HTML shell, `<head>`, nav + footer slots |
| `src/components/Nav.astro` | Sticky header, mobile hamburger |
| `src/components/Hero.astro` | Rotating research-question slider (only JS on the site) |
| `src/components/SplitBlock.astro` | Reusable two-column text/image block, reversible |
| `src/components/PublicationItem.astro` | One publication row |
| `src/components/NewsCard.astro` | One news card |
| `src/components/PersonCard.astro` | One person card |
| `src/components/CtaBanner.astro` | Full-width call-to-action |
| `src/components/Footer.astro` | Contact, affiliations, socials |
| `src/pages/index.astro` | Landing page — composes the 9 sections |
| `src/pages/people.astro` | People, grouped by role |
| `src/pages/publications.astro` | All publications, grouped by year |
| `.pages.yml` | CMS form definitions |

**Dependency direction:** `pages → components → lib`. Components never import from `pages`; `lib` imports nothing from Astro. This keeps all logic testable without a browser or build.

---

### Task 1: Project scaffold

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `vitest.config.ts`, `.gitignore`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "lab-website",
  "type": "module",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "test": "vitest run"
  },
  "dependencies": {
    "astro": "^5.2.0"
  },
  "devDependencies": {
    "vitest": "^2.1.0"
  }
}
```

- [ ] **Step 2: Create `astro.config.mjs`**

```js
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://www.theattentivebrain.com',
});
```

- [ ] **Step 3: Create `tsconfig.json`**

```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"]
}
```

- [ ] **Step 4: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
```

- [ ] **Step 5: Create `.gitignore`**

```
node_modules/
dist/
.astro/
.DS_Store
*.log
```

- [ ] **Step 6: Install dependencies**

Run: `cd /Users/thib/Desktop/lab_website && npm install`
Expected: completes with no `ERR!` lines; `node_modules/` exists.

- [ ] **Step 7: Initialise git and commit**

```bash
cd /Users/thib/Desktop/lab_website
git init
git add -A
git commit -m "chore: scaffold Astro project with Vitest"
```

---

### Task 2: Content schemas

Schemas live in plain TypeScript importing `astro/zod`, **not** `astro:content`, because `astro:content` is a virtual module that does not resolve inside Vitest. This is what makes them testable.

**Files:**
- Create: `src/lib/schemas.ts`
- Test: `tests/schemas.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/schemas.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { publicationSchema, personSchema, newsSchema, heroSchema } from '../src/lib/schemas';

describe('publicationSchema', () => {
  it('accepts a complete publication', () => {
    const result = publicationSchema.safeParse({
      title: 'Memory consolidation during sleep',
      authors: 'Delavy, T., & Sani, I.',
      year: 2026,
      journal: 'Nature Neuroscience',
      featured: true,
    });
    expect(result.success).toBe(true);
  });

  it('rejects a publication with no title', () => {
    const result = publicationSchema.safeParse({
      authors: 'Delavy, T.',
      year: 2026,
      journal: 'Nature Neuroscience',
      featured: false,
    });
    expect(result.success).toBe(false);
  });

  it('defaults featured to false when omitted', () => {
    const result = publicationSchema.parse({
      title: 'A paper',
      authors: 'Someone',
      year: 2025,
      journal: 'A journal',
    });
    expect(result.featured).toBe(false);
  });
});

describe('personSchema', () => {
  it('rejects a role outside the allowed list', () => {
    const result = personSchema.safeParse({
      name: 'Jane Doe',
      role: 'Supreme Overlord',
      order: 1,
    });
    expect(result.success).toBe(false);
  });

  it('defaults alumni to false', () => {
    const result = personSchema.parse({ name: 'Jane Doe', role: 'Postdoc', order: 1 });
    expect(result.alumni).toBe(false);
  });
});

describe('newsSchema', () => {
  it('coerces an ISO date string into a Date', () => {
    const result = newsSchema.parse({
      title: 'Lab wins grant',
      date: '2026-06-12',
      body: 'Great news.',
    });
    expect(result.date).toBeInstanceOf(Date);
    expect(result.date.getUTCFullYear()).toBe(2026);
  });
});

describe('heroSchema', () => {
  it('requires a question, an image and an order', () => {
    expect(heroSchema.safeParse({ question: 'Why?', image: '/images/a.jpg', order: 1 }).success).toBe(true);
    expect(heroSchema.safeParse({ question: 'Why?', order: 1 }).success).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `cd /Users/thib/Desktop/lab_website && npx vitest run tests/schemas.test.ts`
Expected: FAIL — `Failed to resolve import "../src/lib/schemas"`.

- [ ] **Step 3: Write the implementation**

Create `src/lib/schemas.ts`:

```ts
import { z } from 'astro/zod';

export const ROLES = ['PI', 'Postdoc', 'PhD Student', 'Research Assistant'] as const;
export type Role = (typeof ROLES)[number];

export const heroSchema = z.object({
  question: z.string().min(1),
  image: z.string().min(1),
  credit: z.string().optional(),
  link: z.string().optional(),
  order: z.number(),
});

export const personSchema = z.object({
  name: z.string().min(1),
  role: z.enum(ROLES),
  photo: z.string().optional(),
  bio: z.string().optional(),
  email: z.string().optional(),
  links: z.array(z.object({ label: z.string(), url: z.string() })).default([]),
  order: z.number(),
  alumni: z.boolean().default(false),
});

export const publicationSchema = z.object({
  title: z.string().min(1),
  authors: z.string().min(1),
  year: z.number().int(),
  journal: z.string().min(1),
  doi: z.string().optional(),
  pdf: z.string().optional(),
  image: z.string().optional(),
  featured: z.boolean().default(false),
});

export const newsSchema = z.object({
  title: z.string().min(1),
  date: z.coerce.date(),
  image: z.string().optional(),
  body: z.string().min(1),
  link: z.string().optional(),
});

export type HeroSlide = z.infer<typeof heroSchema>;
export type Person = z.infer<typeof personSchema>;
export type Publication = z.infer<typeof publicationSchema>;
export type NewsItem = z.infer<typeof newsSchema>;
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/schemas.test.ts`
Expected: PASS — 7 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/schemas.ts tests/schemas.test.ts
git commit -m "feat: add content schemas with validation tests"
```

---

### Task 3: Publication and news selection helpers

**Files:**
- Create: `src/lib/collections.ts`
- Test: `tests/collections.test.ts`

- [ ] **Step 1: Write the failing test**

Create `tests/collections.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { latestPublications, byYear, latestNews } from '../src/lib/collections';
import type { Publication, NewsItem } from '../src/lib/schemas';

const pub = (title: string, year: number, featured = true): Publication => ({
  title, year, featured, authors: 'A. Author', journal: 'J. Test',
});

describe('latestPublications', () => {
  it('returns only featured publications', () => {
    const result = latestPublications([pub('A', 2026), pub('B', 2025, false)]);
    expect(result.map((p) => p.title)).toEqual(['A']);
  });

  it('sorts by year descending', () => {
    const result = latestPublications([pub('old', 2020), pub('new', 2026), pub('mid', 2023)]);
    expect(result.map((p) => p.title)).toEqual(['new', 'mid', 'old']);
  });

  it('breaks ties on title so ordering is deterministic', () => {
    const result = latestPublications([pub('Zebra', 2026), pub('Apple', 2026)]);
    expect(result.map((p) => p.title)).toEqual(['Apple', 'Zebra']);
  });

  it('limits to 4 by default', () => {
    const many = [2026, 2025, 2024, 2023, 2022].map((y) => pub(`p${y}`, y));
    expect(latestPublications(many)).toHaveLength(4);
  });

  it('honours an explicit limit', () => {
    const many = [2026, 2025, 2024].map((y) => pub(`p${y}`, y));
    expect(latestPublications(many, 2)).toHaveLength(2);
  });

  it('does not mutate its input', () => {
    const input = [pub('old', 2020), pub('new', 2026)];
    latestPublications(input);
    expect(input.map((p) => p.title)).toEqual(['old', 'new']);
  });
});

describe('byYear', () => {
  it('groups publications into year buckets, newest first', () => {
    const result = byYear([pub('a', 2024), pub('b', 2026), pub('c', 2024)]);
    expect(result.map((g) => g.year)).toEqual([2026, 2024]);
    expect(result[1].items.map((p) => p.title)).toEqual(['a', 'c']);
  });

  it('includes non-featured publications', () => {
    const result = byYear([pub('hidden', 2026, false)]);
    expect(result[0].items).toHaveLength(1);
  });
});

const news = (title: string, date: string): NewsItem =>
  ({ title, date: new Date(date), body: 'x' } as NewsItem);

describe('latestNews', () => {
  it('sorts by date descending and limits to 3 by default', () => {
    const result = latestNews([
      news('oldest', '2026-01-01'),
      news('newest', '2026-08-01'),
      news('middle', '2026-05-01'),
      news('ancient', '2025-01-01'),
    ]);
    expect(result.map((n) => n.title)).toEqual(['newest', 'middle', 'oldest']);
  });

  it('does not mutate its input', () => {
    const input = [news('a', '2025-01-01'), news('b', '2026-01-01')];
    latestNews(input);
    expect(input.map((n) => n.title)).toEqual(['a', 'b']);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/collections.test.ts`
Expected: FAIL — cannot resolve `../src/lib/collections`.

- [ ] **Step 3: Write the implementation**

Create `src/lib/collections.ts`:

```ts
import type { Publication, NewsItem } from './schemas';

/** Featured publications, newest first, title-tiebroken. Used by the homepage block. */
export function latestPublications(pubs: Publication[], limit = 4): Publication[] {
  return pubs
    .filter((p) => p.featured)
    .slice()
    .sort((a, b) => b.year - a.year || a.title.localeCompare(b.title))
    .slice(0, limit);
}

/** All publications grouped into year buckets, newest year first. Used by /publications. */
export function byYear(pubs: Publication[]): { year: number; items: Publication[] }[] {
  const buckets = new Map<number, Publication[]>();
  for (const p of pubs) {
    const bucket = buckets.get(p.year);
    if (bucket) bucket.push(p);
    else buckets.set(p.year, [p]);
  }
  return [...buckets.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([year, items]) => ({
      year,
      items: items.slice().sort((a, b) => a.title.localeCompare(b.title)),
    }));
}

/** News items, newest first. Used by the homepage block. */
export function latestNews(items: NewsItem[], limit = 3): NewsItem[] {
  return items
    .slice()
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, limit);
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run tests/collections.test.ts`
Expected: PASS — 10 tests.

- [ ] **Step 5: Commit**

```bash
git add src/lib/collections.ts tests/collections.test.ts
git commit -m "feat: add publication and news selection helpers"
```

---

### Task 4: People grouping helpers

**Files:**
- Modify: `src/lib/collections.ts` (append)
- Modify: `tests/collections.test.ts` (append)

- [ ] **Step 1: Write the failing test**

Append to `tests/collections.test.ts`:

```ts
import { groupPeople, alumniOf } from '../src/lib/collections';
import type { Person } from '../src/lib/schemas';

const person = (name: string, role: Person['role'], order: number, alumni = false): Person =>
  ({ name, role, order, alumni, links: [] } as Person);

describe('groupPeople', () => {
  it('returns groups in canonical role order, not alphabetical', () => {
    const result = groupPeople([
      person('Rita RA', 'Research Assistant', 1),
      person('Paula PI', 'PI', 1),
      person('Poppy Postdoc', 'Postdoc', 1),
    ]);
    expect(result.map((g) => g.role)).toEqual(['PI', 'Postdoc', 'Research Assistant']);
  });

  it('sorts members within a group by order', () => {
    const result = groupPeople([
      person('Second', 'Postdoc', 2),
      person('First', 'Postdoc', 1),
    ]);
    expect(result[0].members.map((p) => p.name)).toEqual(['First', 'Second']);
  });

  it('omits empty role groups entirely', () => {
    const result = groupPeople([person('Paula PI', 'PI', 1)]);
    expect(result.map((g) => g.role)).toEqual(['PI']);
  });

  it('excludes alumni from the active groups', () => {
    const result = groupPeople([
      person('Current', 'Postdoc', 1),
      person('Departed', 'Postdoc', 2, true),
    ]);
    expect(result[0].members.map((p) => p.name)).toEqual(['Current']);
  });
});

describe('alumniOf', () => {
  it('returns only alumni, sorted by name', () => {
    const result = alumniOf([
      person('Zoe', 'Postdoc', 1, true),
      person('Adam', 'PhD Student', 2, true),
      person('Active', 'Postdoc', 3),
    ]);
    expect(result.map((p) => p.name)).toEqual(['Adam', 'Zoe']);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run tests/collections.test.ts`
Expected: FAIL — `groupPeople is not exported`.

- [ ] **Step 3: Write the implementation**

First, change the import on line 1 of `src/lib/collections.ts` from:

```ts
import type { Publication, NewsItem } from './schemas';
```

to:

```ts
import { ROLES, type Publication, type NewsItem, type Person, type Role } from './schemas';
```

Then append to the same file:

```ts
/** Active lab members grouped by role, in canonical seniority order. Empty groups are dropped. */
export function groupPeople(people: Person[]): { role: Role; members: Person[] }[] {
  const active = people.filter((p) => !p.alumni);
  return ROLES.map((role) => ({
    role,
    members: active.filter((p) => p.role === role).sort((a, b) => a.order - b.order),
  })).filter((group) => group.members.length > 0);
}

/** Former lab members, alphabetical by name. */
export function alumniOf(people: Person[]): Person[] {
  return people.filter((p) => p.alumni).sort((a, b) => a.name.localeCompare(b.name));
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run`
Expected: PASS — 22 tests across both files.

- [ ] **Step 5: Commit**

```bash
git add src/lib/collections.ts tests/collections.test.ts
git commit -m "feat: add people grouping helpers"
```

---

### Task 5: Content collections wiring

**Files:**
- Create: `src/content.config.ts`

- [ ] **Step 1: Create the collection config**

```ts
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { heroSchema, personSchema, publicationSchema, newsSchema } from './lib/schemas';

const hero = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/hero' }),
  schema: heroSchema,
});

const people = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/people' }),
  schema: personSchema,
});

const publications = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/publications' }),
  schema: publicationSchema,
});

const news = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/news' }),
  schema: newsSchema,
});

export const collections = { hero, people, publications, news };
```

- [ ] **Step 2: Commit**

```bash
git add src/content.config.ts
git commit -m "feat: wire content collections to schemas"
```

---

### Task 6: Seed placeholder content

Content is deliberately generic — real content comes from the user (spec §11.3). Every file below must be created exactly as written so later tasks have predictable data.

**Files:**
- Create: 3 files in `src/content/hero/`, 3 in `src/content/people/`, 5 in `src/content/publications/`, 3 in `src/content/news/`
- Create: `public/images/.gitkeep`, `public/pdfs/.gitkeep`

- [ ] **Step 1: Create the hero slides**

`src/content/hero/01-attention-selection.md`:
```markdown
---
question: How does the brain decide what deserves our attention?
image: /images/placeholder-hero-1.svg
credit: Sani et al., Journal of Neuroscience
order: 1
---
```

`src/content/hero/02-motion-perception.md`:
```markdown
---
question: What happens in the moment a moving object becomes a conscious percept?
image: /images/placeholder-hero-2.svg
credit: Delavy et al., in preparation
order: 2
---
```

`src/content/hero/03-tms-causality.md`:
```markdown
---
question: Can we change what someone sees by briefly interrupting a single brain area?
image: /images/placeholder-hero-3.svg
credit: Lab research programme
order: 3
---
```

- [ ] **Step 2: Create the people**

`src/content/people/01-pi.md`:
```markdown
---
name: Principal Investigator
role: PI
photo: /images/placeholder-person.svg
email: pi@example.org
order: 1
alumni: false
---

Placeholder biography. Replace through the CMS.
```

`src/content/people/02-phd-student.md`:
```markdown
---
name: Thibaud Delavy
role: PhD Student
photo: /images/placeholder-person.svg
order: 1
alumni: false
---

Placeholder biography. Replace through the CMS.
```

`src/content/people/03-alumnus.md`:
```markdown
---
name: Former Member
role: Postdoc
order: 1
alumni: true
---

Placeholder biography. Replace through the CMS.
```

- [ ] **Step 3: Create the publications**

Create five files `src/content/publications/2026-a.md` … `2022-e.md` following this exact shape, varying only the values shown in the table below:

```markdown
---
title: <TITLE>
authors: <AUTHORS>
year: <YEAR>
journal: <JOURNAL>
doi: 10.1000/placeholder
featured: <FEATURED>
---
```

| File | TITLE | AUTHORS | YEAR | JOURNAL | FEATURED |
|---|---|---|---|---|---|
| `2026-a.md` | Attentional selection under uncertainty | Delavy, T., & Sani, I. | 2026 | Journal of Neuroscience | `true` |
| `2025-b.md` | Cortical dynamics of motion integration | Sani, I., et al. | 2025 | Nature Communications | `true` |
| `2024-c.md` | Causal contributions of parietal cortex to visual awareness | Sani, I., & Colleagues | 2024 | eLife | `true` |
| `2023-d.md` | Temporal precision in perceptual decisions | Delavy, T., et al. | 2023 | Cerebral Cortex | `true` |
| `2022-e.md` | Early work on visual attention | Sani, I. | 2022 | Vision Research | `false` |

- [ ] **Step 4: Create the news items**

`src/content/news/2026-06-grant.md`:
```markdown
---
title: Lab awarded new research funding
date: 2026-06-12
image: /images/placeholder-news.svg
body: Placeholder news item. Replace through the CMS.
---
```

`src/content/news/2026-04-conference.md`:
```markdown
---
title: Lab presents at the annual vision conference
date: 2026-04-03
image: /images/placeholder-news.svg
body: Placeholder news item. Replace through the CMS.
---
```

`src/content/news/2026-02-new-member.md`:
```markdown
---
title: Welcome to our newest lab member
date: 2026-02-18
image: /images/placeholder-news.svg
body: Placeholder news item. Replace through the CMS.
---
```

- [ ] **Step 5: Create the media folders**

```bash
mkdir -p public/images public/pdfs
touch public/pdfs/.gitkeep

for n in 1 2 3; do
  cat > "public/images/placeholder-hero-$n.svg" <<SVG
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1f4e5f"/><stop offset="1" stop-color="#0d2129"/></linearGradient></defs><rect width="1920" height="1080" fill="url(#g)"/></svg>
SVG
done

cat > public/images/placeholder-person.svg <<'SVG'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><rect width="400" height="400" fill="#e8e6e1"/><circle cx="200" cy="160" r="62" fill="#c9c5bd"/><path d="M70 400c0-72 58-130 130-130s130 58 130 130z" fill="#c9c5bd"/></svg>
SVG

cat > public/images/placeholder-news.svg <<'SVG'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 400"><rect width="640" height="400" fill="#e8e6e1"/><rect x="60" y="150" width="520" height="12" fill="#c9c5bd"/><rect x="60" y="185" width="380" height="12" fill="#c9c5bd"/></svg>
SVG
```

These are flat SVG placeholders, not photographs. They exist so the local preview is not full of broken-image icons, and so Task 15 shows the real layout. They are replaced by the lab's own photography via the CMS.

- [ ] **Step 6: Verify the content validates**

Run: `npx astro sync && npx astro check`
Expected: no content-collection errors. (`astro check` may report zero errors overall; content errors are the ones that matter here.)

- [ ] **Step 7: Commit**

```bash
git add src/content public/images/.gitkeep public/pdfs/.gitkeep
git commit -m "feat: add placeholder content for all four collections"
```

---

### Task 7: Design tokens and global styles

**This is the only file to edit when tuning visual identity (spec §11).** Values below are a deliberately neutral placeholder.

**Files:**
- Create: `src/styles/tokens.css`, `src/styles/global.css`

- [ ] **Step 1: Create `src/styles/tokens.css`**

```css
:root {
  /* Colour — PLACEHOLDER, retuned with the user in Task 15 */
  --ink: #16181d;
  --ink-soft: #4a5058;
  --ink-faint: #7b828b;
  --paper: #ffffff;
  --paper-tint: #f6f5f2;
  --accent: #1f4e5f;
  --accent-deep: #143743;
  --on-accent: #ffffff;
  --rule: #e4e2dd;

  /* Type — system stacks, no web fonts, no network dependency */
  --font-display: Georgia, 'Iowan Old Style', 'Times New Roman', serif;
  --font-body: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;

  /* Fluid type scale */
  --text-sm: clamp(0.875rem, 0.85rem + 0.1vw, 0.9375rem);
  --text-base: clamp(1rem, 0.96rem + 0.2vw, 1.125rem);
  --text-lg: clamp(1.125rem, 1.05rem + 0.4vw, 1.375rem);
  --text-xl: clamp(1.5rem, 1.3rem + 0.9vw, 2rem);
  --text-2xl: clamp(1.875rem, 1.5rem + 1.6vw, 2.75rem);
  --text-hero: clamp(2rem, 1.4rem + 3.2vw, 4rem);

  /* Space */
  --gutter: clamp(1.25rem, 4vw, 3rem);
  --section-y: clamp(3.5rem, 8vw, 7rem);
  --max-width: 1200px;
  --measure: 62ch;

  --radius: 4px;
  --transition: 200ms ease;
}
```

- [ ] **Step 2: Create `src/styles/global.css`**

```css
@import './tokens.css';

*, *::before, *::after { box-sizing: border-box; }
* { margin: 0; }

html { -webkit-text-size-adjust: 100%; scroll-behavior: smooth; }

@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}

body {
  font-family: var(--font-body);
  font-size: var(--text-base);
  line-height: 1.65;
  color: var(--ink);
  background: var(--paper);
  -webkit-font-smoothing: antialiased;
}

img { display: block; max-width: 100%; height: auto; }

h1, h2, h3 {
  font-family: var(--font-display);
  font-weight: 600;
  line-height: 1.15;
  letter-spacing: -0.015em;
  text-wrap: balance;
}

a { color: inherit; }

p { text-wrap: pretty; }

:focus-visible {
  outline: 3px solid var(--accent);
  outline-offset: 3px;
}

.wrap {
  max-width: var(--max-width);
  margin-inline: auto;
  padding-inline: var(--gutter);
}

.section { padding-block: var(--section-y); }
.section--tint { background: var(--paper-tint); }

.section-title {
  font-size: var(--text-2xl);
  margin-bottom: 2.5rem;
}

.eyebrow {
  font-family: var(--font-body);
  font-size: var(--text-sm);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--ink-faint);
  margin-bottom: 0.75rem;
}

.skip-link {
  position: absolute;
  left: -9999px;
  top: 0;
  background: var(--accent);
  color: var(--on-accent);
  padding: 0.75rem 1.25rem;
  z-index: 200;
}
.skip-link:focus { left: 0; }
```

- [ ] **Step 3: Commit**

```bash
git add src/styles
git commit -m "feat: add design tokens and global styles"
```

---

### Task 8: Base layout, Nav and Footer

**Files:**
- Create: `src/layouts/Base.astro`, `src/components/Nav.astro`, `src/components/Footer.astro`

- [ ] **Step 1: Create `src/components/Nav.astro`**

```astro
---
const links = [
  { label: 'Research', href: '/#research' },
  { label: 'People', href: '/people' },
  { label: 'Publications', href: '/publications' },
  { label: 'News', href: '/#news' },
  { label: 'Participate', href: '/#participate' },
];
---

<header class="nav">
  <div class="nav__inner wrap">
    <a class="nav__brand" href="/">The Attentive Brain</a>
    <input type="checkbox" id="nav-toggle" class="nav__checkbox" />
    <label for="nav-toggle" class="nav__burger" aria-label="Toggle menu">
      <span></span><span></span><span></span>
    </label>
    <nav class="nav__links" aria-label="Main">
      {links.map((l) => <a href={l.href}>{l.label}</a>)}
    </nav>
  </div>
</header>

<style>
  .nav {
    position: sticky;
    top: 0;
    z-index: 100;
    background: color-mix(in srgb, var(--paper) 88%, transparent);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid var(--rule);
  }
  .nav__inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 68px;
    gap: 1rem;
  }
  .nav__brand {
    font-family: var(--font-display);
    font-size: var(--text-lg);
    font-weight: 600;
    text-decoration: none;
    letter-spacing: -0.01em;
  }
  .nav__links { display: flex; gap: clamp(1rem, 2.5vw, 2rem); }
  .nav__links a {
    font-size: var(--text-sm);
    text-decoration: none;
    color: var(--ink-soft);
    transition: color var(--transition);
  }
  .nav__links a:hover { color: var(--accent); }
  .nav__checkbox, .nav__burger { display: none; }

  @media (max-width: 820px) {
    .nav__burger {
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 5px;
      width: 44px;
      height: 44px;
      cursor: pointer;
      align-items: center;
    }
    .nav__burger span {
      display: block;
      width: 22px;
      height: 2px;
      background: var(--ink);
    }
    .nav__links {
      display: none;
      position: absolute;
      inset-inline: 0;
      top: 100%;
      flex-direction: column;
      gap: 0;
      background: var(--paper);
      border-bottom: 1px solid var(--rule);
      padding: 0.5rem var(--gutter) 1.25rem;
    }
    .nav__checkbox:checked ~ .nav__links { display: flex; }
    .nav__links a { padding: 0.85rem 0; font-size: var(--text-base); }
  }
</style>
```

- [ ] **Step 2: Create `src/components/Footer.astro`**

```astro
---
const affiliations = [
  'Department of Basic Neurosciences',
  'Faculty of Medicine',
  'University of Geneva',
];
---

<footer class="foot">
  <div class="wrap foot__inner">
    <div>
      <p class="foot__brand">The Attentive Brain</p>
      <p class="foot__muted">Contact: <a href="mailto:pi@example.org">pi@example.org</a></p>
    </div>
    <ul class="foot__list">
      {affiliations.map((a) => <li>{a}</li>)}
    </ul>
  </div>
  <div class="wrap foot__legal">
    <small>&copy; {new Date().getFullYear()} The Attentive Brain Lab.</small>
  </div>
</footer>

<style>
  .foot {
    background: var(--accent-deep);
    color: var(--on-accent);
    padding-block: clamp(2.5rem, 6vw, 4rem) 1.5rem;
  }
  .foot__inner {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 2rem;
  }
  .foot__brand {
    font-family: var(--font-display);
    font-size: var(--text-lg);
    margin-bottom: 0.5rem;
  }
  .foot__muted { color: color-mix(in srgb, var(--on-accent) 75%, transparent); font-size: var(--text-sm); }
  .foot__list { list-style: none; padding: 0; font-size: var(--text-sm); line-height: 2; }
  .foot__legal {
    margin-top: 2.5rem;
    padding-top: 1.25rem;
    border-top: 1px solid color-mix(in srgb, var(--on-accent) 20%, transparent);
    color: color-mix(in srgb, var(--on-accent) 60%, transparent);
  }
</style>
```

- [ ] **Step 3: Create `src/layouts/Base.astro`**

```astro
---
import Nav from '../components/Nav.astro';
import Footer from '../components/Footer.astro';
import '../styles/global.css';

interface Props {
  title: string;
  description?: string;
}

const { title, description = 'Research on attention, perception and the human brain.' } = Astro.props;
---

<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <meta name="description" content={description} />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
  </head>
  <body>
    <a class="skip-link" href="#main">Skip to content</a>
    <Nav />
    <main id="main">
      <slot />
    </main>
    <Footer />
  </body>
</html>
```

- [ ] **Step 4: Create a favicon so the build has no 404**

```bash
cat > public/favicon.svg <<'SVG'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="14" fill="#1f4e5f"/><circle cx="16" cy="16" r="5" fill="#fff"/></svg>
SVG
```

- [ ] **Step 5: Commit**

```bash
git add src/layouts src/components public/favicon.svg
git commit -m "feat: add base layout, nav and footer"
```

---

### Task 9: Hero slider

The signature element (spec §7.2). Must auto-advance, be keyboard-navigable, and stop entirely under `prefers-reduced-motion`.

**Files:**
- Create: `src/components/Hero.astro`

- [ ] **Step 1: Create the component**

```astro
---
import type { HeroSlide } from '../lib/schemas';

interface Props { slides: HeroSlide[] }
const { slides } = Astro.props;
---

<section class="hero" aria-roledescription="carousel" aria-label="Research questions">
  <div class="hero__stage">
    {slides.map((slide, i) => {
      // Only the first slide carries the <h1>. Emitting one per slide would give the
      // page multiple top-level headings, which breaks the document outline for
      // screen readers. Task 14 asserts there is exactly one.
      const Heading = i === 0 ? 'h1' : 'p';
      return (
        <article class="hero__slide" data-slide={i} aria-hidden={i === 0 ? 'false' : 'true'}>
          <img
            class="hero__img"
            src={slide.image}
            alt=""
            width="1920"
            height="1080"
            loading={i === 0 ? 'eager' : 'lazy'}
            decoding="async"
          />
          <div class="hero__veil"></div>
          <div class="hero__body wrap">
            <Heading class="hero__question">
              {slide.link ? <a href={slide.link}>{slide.question}</a> : slide.question}
            </Heading>
            {slide.credit && <p class="hero__credit">{slide.credit}</p>}
          </div>
        </article>
      );
    })}
  </div>

  {slides.length > 1 && (
    <div class="hero__dots" role="group" aria-label="Choose slide">
      {slides.map((_, i) => (
        <button
          class="hero__dot"
          data-dot={i}
          type="button"
          aria-label={`Show slide ${i + 1} of ${slides.length}`}
          aria-current={i === 0 ? 'true' : 'false'}
        ></button>
      ))}
    </div>
  )}
</section>

<style>
  .hero { position: relative; min-height: min(78vh, 780px); display: grid; }
  .hero__stage { position: relative; display: grid; }
  .hero__slide {
    position: absolute;
    inset: 0;
    display: grid;
    align-items: end;
    opacity: 0;
    transition: opacity 700ms ease;
    pointer-events: none;
  }
  .hero__slide[aria-hidden='false'] { opacity: 1; pointer-events: auto; position: relative; }
  .hero__img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; background: var(--accent-deep); }
  .hero__veil {
    position: absolute;
    inset: 0;
    background: linear-gradient(to top, rgb(8 18 22 / 0.85) 0%, rgb(8 18 22 / 0.45) 45%, rgb(8 18 22 / 0.2) 100%);
  }
  .hero__body { position: relative; padding-block: clamp(4rem, 12vw, 8rem) clamp(3.5rem, 9vw, 6rem); }
  .hero__question {
    font-size: var(--text-hero);
    color: #fff;
    max-width: 22ch;
  }
  .hero__question a { text-decoration: none; }
  .hero__question a:hover { text-decoration: underline; text-underline-offset: 6px; }
  .hero__credit {
    margin-top: 1.25rem;
    color: rgb(255 255 255 / 0.8);
    font-size: var(--text-sm);
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
  .hero__dots {
    position: absolute;
    bottom: 1.5rem;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 0.6rem;
    z-index: 3;
  }
  .hero__dot {
    width: 40px;
    height: 4px;
    border: 0;
    padding: 0;
    cursor: pointer;
    background: rgb(255 255 255 / 0.35);
    transition: background var(--transition);
  }
  .hero__dot[aria-current='true'] { background: #fff; }
</style>

<script>
  const root = document.querySelector('.hero');
  if (root) {
    const slides = [...root.querySelectorAll<HTMLElement>('[data-slide]')];
    const dots = [...root.querySelectorAll<HTMLButtonElement>('[data-dot]')];
    let index = 0;
    let timer: number | undefined;

    const show = (next: number) => {
      index = (next + slides.length) % slides.length;
      slides.forEach((s, i) => s.setAttribute('aria-hidden', String(i !== index)));
      dots.forEach((d, i) => d.setAttribute('aria-current', String(i === index)));
    };

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const start = () => {
      if (reduced || slides.length < 2) return;
      stop();
      timer = window.setInterval(() => show(index + 1), 7000);
    };
    const stop = () => { if (timer) window.clearInterval(timer); timer = undefined; };

    dots.forEach((dot, i) => {
      dot.addEventListener('click', () => { show(i); start(); });
    });

    root.addEventListener('keydown', (e) => {
      const key = (e as KeyboardEvent).key;
      if (key === 'ArrowRight') { show(index + 1); start(); }
      if (key === 'ArrowLeft') { show(index - 1); start(); }
    });

    root.addEventListener('mouseenter', stop);
    root.addEventListener('mouseleave', start);
    root.addEventListener('focusin', stop);

    start();
  }
</script>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Hero.astro
git commit -m "feat: add rotating research-question hero"
```

---

### Task 10: Content block components

**Files:**
- Create: `src/components/SplitBlock.astro`, `src/components/CtaBanner.astro`

- [ ] **Step 1: Create `src/components/SplitBlock.astro`**

```astro
---
interface Props {
  eyebrow?: string;
  title: string;
  image?: string;
  imageAlt?: string;
  reverse?: boolean;
  ctaHref?: string;
  ctaLabel?: string;
  id?: string;
}
const { eyebrow, title, image, imageAlt = '', reverse = false, ctaHref, ctaLabel, id } = Astro.props;
---

<section class="section" id={id}>
  <div class="wrap split" data-reverse={reverse ? 'true' : 'false'}>
    <div class="split__text">
      {eyebrow && <p class="eyebrow">{eyebrow}</p>}
      <h2 class="split__title">{title}</h2>
      <div class="split__body"><slot /></div>
      {ctaHref && ctaLabel && <a class="split__cta" href={ctaHref}>{ctaLabel} &rarr;</a>}
    </div>
    <div class="split__media">
      {image
        ? <img src={image} alt={imageAlt} width="960" height="720" loading="lazy" decoding="async" />
        : <div class="split__placeholder" aria-hidden="true"></div>}
    </div>
  </div>
</section>

<style>
  .split {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: clamp(2rem, 6vw, 4.5rem);
    align-items: center;
  }
  .split[data-reverse='true'] .split__text { order: 2; }
  .split__title { font-size: var(--text-xl); margin-bottom: 1.25rem; }
  .split__body { max-width: var(--measure); color: var(--ink-soft); }
  .split__body :global(p + p) { margin-top: 1rem; }
  .split__cta {
    display: inline-block;
    margin-top: 1.75rem;
    font-weight: 600;
    color: var(--accent);
    text-decoration: none;
  }
  .split__cta:hover { text-decoration: underline; text-underline-offset: 4px; }
  .split__media img, .split__placeholder {
    width: 100%;
    aspect-ratio: 4 / 3;
    object-fit: cover;
    border-radius: var(--radius);
  }
  .split__placeholder { background: var(--paper-tint); border: 1px solid var(--rule); }

  @media (max-width: 820px) {
    .split { grid-template-columns: 1fr; }
    .split[data-reverse='true'] .split__text { order: 0; }
  }
</style>
```

- [ ] **Step 2: Create `src/components/CtaBanner.astro`**

```astro
---
interface Props { title: string; href: string; label: string; id?: string }
const { title, href, label, id } = Astro.props;
---

<section class="cta" id={id}>
  <div class="wrap cta__inner">
    <h2 class="cta__title">{title}</h2>
    <div class="cta__body"><slot /></div>
    <a class="cta__button" href={href}>{label}</a>
  </div>
</section>

<style>
  .cta {
    background: linear-gradient(135deg, var(--accent) 0%, var(--accent-deep) 100%);
    color: var(--on-accent);
    padding-block: var(--section-y);
  }
  .cta__inner { text-align: center; max-width: 720px; }
  .cta__title { font-size: var(--text-2xl); margin-bottom: 1rem; }
  .cta__body { color: color-mix(in srgb, var(--on-accent) 82%, transparent); }
  .cta__button {
    display: inline-block;
    margin-top: 2rem;
    padding: 0.9rem 2rem;
    background: var(--on-accent);
    color: var(--accent-deep);
    font-weight: 600;
    text-decoration: none;
    border-radius: var(--radius);
    transition: transform var(--transition);
  }
  .cta__button:hover { transform: translateY(-2px); }
</style>
```

- [ ] **Step 3: Commit**

```bash
git add src/components/SplitBlock.astro src/components/CtaBanner.astro
git commit -m "feat: add split block and CTA banner components"
```

---

### Task 11: List item components

**Files:**
- Create: `src/components/PublicationItem.astro`, `src/components/NewsCard.astro`, `src/components/PersonCard.astro`

- [ ] **Step 1: Create `src/components/PublicationItem.astro`**

```astro
---
import type { Publication } from '../lib/schemas';
interface Props { pub: Publication }
const { pub } = Astro.props;
---

<article class="pub">
  <h3 class="pub__title">{pub.title}</h3>
  <p class="pub__authors">{pub.authors}</p>
  <p class="pub__meta"><em>{pub.journal}</em>, {pub.year}</p>
  <p class="pub__links">
    {pub.doi && <a href={`https://doi.org/${pub.doi}`}>DOI</a>}
    {pub.pdf && <a href={pub.pdf}>PDF</a>}
  </p>
</article>

<style>
  .pub { padding-block: 1.5rem; border-bottom: 1px solid var(--rule); }
  .pub__title { font-size: var(--text-lg); margin-bottom: 0.4rem; }
  .pub__authors { color: var(--ink-soft); font-size: var(--text-sm); }
  .pub__meta { color: var(--ink-faint); font-size: var(--text-sm); }
  .pub__links { display: flex; gap: 1rem; margin-top: 0.6rem; }
  .pub__links a {
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--accent);
    text-decoration: none;
  }
  .pub__links a:hover { text-decoration: underline; text-underline-offset: 3px; }
</style>
```

- [ ] **Step 2: Create `src/components/NewsCard.astro`**

```astro
---
import type { NewsItem } from '../lib/schemas';
interface Props { item: NewsItem }
const { item } = Astro.props;
const stamp = item.date.toISOString().slice(0, 10);
const shown = item.date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
---

<article class="card">
  {item.image
    ? <img class="card__img" src={item.image} alt="" width="640" height="400" loading="lazy" decoding="async" />
    : <div class="card__img card__img--empty" aria-hidden="true"></div>}
  <time class="card__date" datetime={stamp}>{shown}</time>
  <h3 class="card__title">
    {item.link ? <a href={item.link}>{item.title}</a> : item.title}
  </h3>
  <p class="card__body">{item.body}</p>
</article>

<style>
  .card__img {
    width: 100%;
    aspect-ratio: 16 / 10;
    object-fit: cover;
    border-radius: var(--radius);
    margin-bottom: 1rem;
  }
  .card__img--empty { background: var(--paper-tint); border: 1px solid var(--rule); }
  .card__date {
    display: block;
    font-size: var(--text-sm);
    color: var(--ink-faint);
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin-bottom: 0.4rem;
  }
  .card__title { font-size: var(--text-lg); margin-bottom: 0.5rem; }
  .card__title a { text-decoration: none; }
  .card__title a:hover { color: var(--accent); }
  .card__body { color: var(--ink-soft); font-size: var(--text-sm); }
</style>
```

- [ ] **Step 3: Create `src/components/PersonCard.astro`**

```astro
---
import type { Person } from '../lib/schemas';
interface Props { person: Person }
const { person } = Astro.props;
---

<article class="person">
  {person.photo
    ? <img class="person__photo" src={person.photo} alt={person.name} width="400" height="400" loading="lazy" decoding="async" />
    : <div class="person__photo person__photo--empty" aria-hidden="true"></div>}
  <h3 class="person__name">{person.name}</h3>
  <p class="person__role">{person.role}</p>
  {person.email && <a class="person__link" href={`mailto:${person.email}`}>{person.email}</a>}
  <ul class="person__links">
    {person.links.map((l) => <li><a href={l.url}>{l.label}</a></li>)}
  </ul>
</article>

<style>
  .person__photo {
    width: 100%;
    aspect-ratio: 1;
    object-fit: cover;
    border-radius: var(--radius);
    margin-bottom: 0.9rem;
  }
  .person__photo--empty { background: var(--paper-tint); border: 1px solid var(--rule); }
  .person__name { font-size: var(--text-lg); }
  .person__role { color: var(--ink-faint); font-size: var(--text-sm); margin-bottom: 0.4rem; }
  .person__link { font-size: var(--text-sm); color: var(--accent); }
  .person__links { list-style: none; padding: 0; display: flex; gap: 0.75rem; margin-top: 0.4rem; font-size: var(--text-sm); }
</style>
```

- [ ] **Step 4: Commit**

```bash
git add src/components/PublicationItem.astro src/components/NewsCard.astro src/components/PersonCard.astro
git commit -m "feat: add publication, news and person card components"
```

---

### Task 12: Landing page

Composes the nine sections from spec §7.

Spec §6.5 requires the homepage body copy to be *content*, not hard-coded, so the PI can
reword it through the CMS. Steps 1–3 add that; Step 4 consumes it.

**Files:**
- Modify: `src/lib/schemas.ts`, `src/content.config.ts`
- Create: `src/content/pages/home.yaml`, `src/pages/index.astro`

- [ ] **Step 1: Add the homepage schema**

Append to `src/lib/schemas.ts`:

```ts
export const homeSchema = z.object({
  intro: z.string().min(1),
  researchTitle: z.string().min(1),
  researchBody: z.array(z.string()).min(1),
  participateTitle: z.string().min(1),
  participateBody: z.array(z.string()).min(1),
  ctaTitle: z.string().min(1),
  ctaBody: z.string().min(1),
});

export type HomeCopy = z.infer<typeof homeSchema>;
```

Body copy is an **array of paragraph strings**, not one blob of Markdown. That keeps
rendering to a plain `.map()` with no HTML injection and no Markdown pipeline, and gives
the CMS a clean repeatable field.

- [ ] **Step 2: Register the collection**

In `src/content.config.ts`, add `homeSchema` to the import from `./lib/schemas`, then add:

```ts
const pages = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/pages' }),
  schema: homeSchema,
});
```

and change the final line to:

```ts
export const collections = { hero, people, publications, news, pages };
```

- [ ] **Step 3: Create `src/content/pages/home.yaml`**

```yaml
intro: >-
  The Attentive Brain Lab studies how the human brain selects, sustains and directs
  attention — combining behavioural experiments, neuroimaging and brain stimulation.
researchTitle: Our Research
researchBody:
  - We use behavioural methods, functional neuroimaging and non-invasive brain
    stimulation to ask how attention shapes perception, and how those mechanisms
    change across the lifespan.
  - Placeholder copy — replace through the CMS.
participateTitle: Take part in a study
participateBody:
  - Our studies are open to volunteers across a wide age range. Sessions take place
    on site and participants are reimbursed for their time.
ctaTitle: Participate
ctaBody: >-
  We are recruiting volunteers for several ongoing studies. Get in touch to find out more.
```

- [ ] **Step 4: Create the page**

```astro
---
import { getCollection, getEntry } from 'astro:content';
import Base from '../layouts/Base.astro';
import Hero from '../components/Hero.astro';
import SplitBlock from '../components/SplitBlock.astro';
import CtaBanner from '../components/CtaBanner.astro';
import PublicationItem from '../components/PublicationItem.astro';
import NewsCard from '../components/NewsCard.astro';
import { latestPublications, latestNews } from '../lib/collections';

const slides = (await getCollection('hero')).map((e) => e.data).sort((a, b) => a.order - b.order);
const pubs = latestPublications((await getCollection('publications')).map((e) => e.data));
const news = latestNews((await getCollection('news')).map((e) => e.data));

const home = (await getEntry('pages', 'home'))!.data;
---

<Base title="The Attentive Brain Lab">
  <Hero slides={slides} />

  <section class="section intro">
    <div class="wrap">
      <h2 class="intro__text">{home.intro}</h2>
    </div>
  </section>

  <SplitBlock
    id="research"
    eyebrow="What we do"
    title={home.researchTitle}
    ctaHref="/publications"
    ctaLabel="See our publications"
  >
    {home.researchBody.map((para) => <p>{para}</p>)}
  </SplitBlock>

  <SplitBlock
    eyebrow="Get involved"
    title={home.participateTitle}
    reverse={true}
    ctaHref="#participate"
    ctaLabel="Learn more"
  >
    {home.participateBody.map((para) => <p>{para}</p>)}
  </SplitBlock>

  <section class="section section--tint" id="publications">
    <div class="wrap">
      <h2 class="section-title">Latest Publications</h2>
      {pubs.map((pub) => <PublicationItem pub={pub} />)}
      <p class="more"><a href="/publications">All publications &rarr;</a></p>
    </div>
  </section>

  <section class="section" id="news">
    <div class="wrap">
      <h2 class="section-title">News &amp; Events</h2>
      <div class="news-grid">
        {news.map((item) => <NewsCard item={item} />)}
      </div>
    </div>
  </section>

  <CtaBanner
    id="participate"
    title={home.ctaTitle}
    href="mailto:pi@example.org"
    label="Contact the lab"
  >
    <p>{home.ctaBody}</p>
  </CtaBanner>
</Base>

<style>
  .intro__text {
    font-size: var(--text-xl);
    font-weight: 400;
    max-width: 28ch;
    line-height: 1.35;
  }
  .news-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: clamp(1.5rem, 4vw, 2.5rem);
  }
  .more { margin-top: 2rem; }
  .more a { color: var(--accent); font-weight: 600; text-decoration: none; }
</style>
```

- [ ] **Step 5: Verify it builds and renders**

Run: `npm run build`
Expected: `[build] Complete!` with no errors.

- [ ] **Step 6: Commit**

```bash
git add src/pages/index.astro src/content/pages src/lib/schemas.ts src/content.config.ts
git commit -m "feat: add landing page with editable homepage copy"
```

---

### Task 13: People and Publications pages

**Files:**
- Create: `src/pages/people.astro`, `src/pages/publications.astro`

- [ ] **Step 1: Create `src/pages/people.astro`**

```astro
---
import { getCollection } from 'astro:content';
import Base from '../layouts/Base.astro';
import PersonCard from '../components/PersonCard.astro';
import { groupPeople, alumniOf } from '../lib/collections';

const all = (await getCollection('people')).map((e) => e.data);
const groups = groupPeople(all);
const alumni = alumniOf(all);
---

<Base title="People — The Attentive Brain Lab">
  <section class="section">
    <div class="wrap">
      <h1 class="section-title">People</h1>
      {groups.map((group) => (
        <div class="group">
          <h2 class="group__label">{group.role}</h2>
          <div class="people-grid">
            {group.members.map((person) => <PersonCard person={person} />)}
          </div>
        </div>
      ))}

      {alumni.length > 0 && (
        <div class="group">
          <h2 class="group__label">Alumni</h2>
          <ul class="alumni">
            {alumni.map((person) => <li>{person.name}</li>)}
          </ul>
        </div>
      )}
    </div>
  </section>
</Base>

<style>
  .group { margin-bottom: 3.5rem; }
  .group__label {
    font-size: var(--text-sm);
    font-family: var(--font-body);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--ink-faint);
    padding-bottom: 0.75rem;
    margin-bottom: 1.75rem;
    border-bottom: 1px solid var(--rule);
  }
  .people-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: clamp(1.5rem, 3vw, 2.5rem);
  }
  .alumni { list-style: none; padding: 0; columns: 2; color: var(--ink-soft); }
</style>
```

- [ ] **Step 2: Create `src/pages/publications.astro`**

```astro
---
import { getCollection } from 'astro:content';
import Base from '../layouts/Base.astro';
import PublicationItem from '../components/PublicationItem.astro';
import { byYear } from '../lib/collections';

const groups = byYear((await getCollection('publications')).map((e) => e.data));
---

<Base title="Publications — The Attentive Brain Lab">
  <section class="section">
    <div class="wrap">
      <h1 class="section-title">Publications</h1>
      {groups.map((group) => (
        <div class="year">
          <h2 class="year__label">{group.year}</h2>
          {group.items.map((pub) => <PublicationItem pub={pub} />)}
        </div>
      ))}
    </div>
  </section>
</Base>

<style>
  .year { margin-bottom: 3rem; }
  .year__label {
    font-size: var(--text-sm);
    font-family: var(--font-body);
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--ink-faint);
    padding-bottom: 0.6rem;
    border-bottom: 1px solid var(--rule);
  }
</style>
```

- [ ] **Step 3: Verify the build**

Run: `npm run build`
Expected: `[build] Complete!`, and `dist/people/index.html` and `dist/publications/index.html` exist.

- [ ] **Step 4: Commit**

```bash
git add src/pages/people.astro src/pages/publications.astro
git commit -m "feat: add people and publications pages"
```

---

### Task 14: Build-output tests

Verifies the rendered HTML, not just the helpers. Catches regressions no unit test would.

**Files:**
- Create: `tests/build.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';

let home = '';

beforeAll(() => {
  if (!existsSync('dist/index.html')) {
    execSync('npm run build', { stdio: 'inherit' });
  }
  home = readFileSync('dist/index.html', 'utf8');
}, 120_000);

describe('landing page output', () => {
  it('renders all nine landmark sections', () => {
    for (const marker of [
      'The Attentive Brain',   // nav brand
      'hero__question',        // hero
      'intro__text',           // mission statement
      'Our Research',          // split block 1
      'Take part in a study',  // split block 2
      'Latest Publications',
      'News &amp; Events',
      'id="participate"',
      'foot__brand',           // footer
    ]) {
      expect(home, `missing: ${marker}`).toContain(marker);
    }
  });

  it('shows exactly four featured publications on the homepage', () => {
    expect(home.match(/class="pub"/g) ?? []).toHaveLength(4);
  });

  it('excludes non-featured publications from the homepage', () => {
    expect(home).not.toContain('Early work on visual attention');
  });

  it('shows three news cards', () => {
    expect(home.match(/class="card__date"/g) ?? []).toHaveLength(3);
  });

  it('gives every image an alt attribute', () => {
    for (const tag of home.match(/<img[^>]*>/g) ?? []) {
      expect(tag, `img without alt: ${tag}`).toMatch(/\salt=/);
    }
  });

  it('gives every image explicit width and height to prevent layout shift', () => {
    for (const tag of home.match(/<img[^>]*>/g) ?? []) {
      expect(tag, `img without dimensions: ${tag}`).toMatch(/\swidth=/);
      expect(tag, `img without dimensions: ${tag}`).toMatch(/\sheight=/);
    }
  });

  it('has exactly one h1', () => {
    expect(home.match(/<h1[\s>]/g) ?? []).toHaveLength(1);
  });
});

describe('people page output', () => {
  it('groups by role and separates alumni', () => {
    const people = readFileSync('dist/people/index.html', 'utf8');
    expect(people).toContain('PhD Student');
    expect(people).toContain('Alumni');
    expect(people).toContain('Former Member');
  });
});

describe('publications page output', () => {
  it('lists every publication including non-featured ones', () => {
    const pubs = readFileSync('dist/publications/index.html', 'utf8');
    expect(pubs.match(/class="pub"/g) ?? []).toHaveLength(5);
    expect(pubs).toContain('Early work on visual attention');
  });
});
```

- [ ] **Step 2: Run the test**

Run: `npm test`
Expected: PASS — all suites.

If the single-`h1` assertion fails, the fix is in `src/components/Hero.astro`, not in the test: the `Heading` variable must resolve to `h1` for `i === 0` and `p` for every other slide. Do not relax this assertion — one `<h1>` per page is the requirement.

- [ ] **Step 3: Commit**

```bash
git add tests/build.test.ts
git commit -m "test: verify rendered HTML structure and accessibility basics"
```

---

### Task 15: Visual identity checkpoint — STOP AND ASK THE USER

**This task is a conversation, not code.** Spec §11 items 1, 2 and 6 are unresolved and cannot be guessed.

- [ ] **Step 1: Start the dev server**

Run: `npm run dev`
Expected: serving at `http://localhost:4321`.

- [ ] **Step 2: Ask the user to look at it and answer**

1. Visual direction: (a) reference's structure with an independent look, (b) close to the reference's restrained academic aesthetic, or (c) more personality than either?
2. Any brand constraints — university colours, an existing logo, a colour the PI prefers?
3. Does the lab have usable photography? The hero depends on it entirely.
4. Real lab name, PI name, and the three research questions for the hero.

- [ ] **Step 3: Apply the answers**

Colour and type changes go in `src/styles/tokens.css` **only**. If a change appears to require editing a component, that is a signal the token set is missing a variable — add the token rather than hard-coding a value.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "style: apply agreed visual identity"
```

---

### Task 16: Pages CMS configuration

Turns the collections into the editor's forms. Cannot be fully tested until the repo is on GitHub (Phase 4), but the file is written and reviewed now.

**Files:**
- Create: `.pages.yml`

- [ ] **Step 1: Create the config**

```yaml
media:
  input: public/images
  output: /images

content:
  - name: publications
    label: Publications
    type: collection
    path: src/content/publications
    view:
      fields: [title, year, journal, featured]
      sort: [year, title]
    fields:
      - { name: title, label: Title, type: string, required: true }
      - { name: authors, label: Authors, type: string, required: true, description: "As they should appear, e.g. Delavy, T., & Sani, I." }
      - { name: year, label: Year, type: number, required: true }
      - { name: journal, label: Journal, type: string, required: true }
      - { name: doi, label: DOI, type: string, description: "Numbers only, e.g. 10.1038/s41586-024-00001" }
      - { name: pdf, label: PDF, type: file, options: { input: public/pdfs, output: /pdfs } }
      - { name: image, label: Thumbnail, type: image }
      - { name: featured, label: Show on homepage, type: boolean, default: false }

  - name: people
    label: People
    type: collection
    path: src/content/people
    view:
      fields: [name, role, alumni]
    fields:
      - { name: name, label: Full name, type: string, required: true }
      - name: role
        label: Role
        type: select
        required: true
        options:
          values: [PI, Postdoc, PhD Student, Research Assistant]
      - { name: photo, label: Photo, type: image, description: "Square, at least 600px" }
      - { name: email, label: Email, type: string }
      - name: links
        label: Links
        type: object
        list: true
        fields:
          - { name: label, label: Label, type: string }
          - { name: url, label: URL, type: string }
      - { name: order, label: Display order, type: number, required: true, default: 1 }
      - { name: alumni, label: Former member, type: boolean, default: false }
      - { name: body, label: Biography, type: rich-text }

  - name: news
    label: News
    type: collection
    path: src/content/news
    view:
      fields: [title, date]
      sort: [date]
    fields:
      - { name: title, label: Title, type: string, required: true }
      - { name: date, label: Date, type: date, required: true }
      - { name: image, label: Image, type: image }
      - { name: body, label: Text, type: text, required: true }
      - { name: link, label: External link, type: string }

  - name: home
    label: Homepage text
    type: file
    path: src/content/pages/home.yaml
    fields:
      - { name: intro, label: Opening statement, type: text, required: true }
      - { name: researchTitle, label: "Research block — heading", type: string, required: true }
      - { name: researchBody, label: "Research block — paragraphs", type: text, list: true, required: true }
      - { name: participateTitle, label: "Recruitment block — heading", type: string, required: true }
      - { name: participateBody, label: "Recruitment block — paragraphs", type: text, list: true, required: true }
      - { name: ctaTitle, label: "Call to action — heading", type: string, required: true }
      - { name: ctaBody, label: "Call to action — text", type: text, required: true }

  - name: hero
    label: Homepage slides
    type: collection
    path: src/content/hero
    view:
      fields: [question, order]
      sort: [order]
    fields:
      - { name: question, label: Research question, type: string, required: true, description: "10–20 words, phrased as a question" }
      - { name: image, label: Background image, type: image, required: true, description: "Landscape, at least 1920px wide" }
      - { name: credit, label: Credit, type: string, description: "e.g. Sani et al., Journal of Neuroscience" }
      - { name: link, label: Link, type: string }
      - { name: order, label: Slide order, type: number, required: true, default: 1 }
```

- [ ] **Step 2: Verify the YAML parses**

Run: `node -e "const{readFileSync}=require('fs');console.log(readFileSync('.pages.yml','utf8').length+' bytes')"`

Then confirm by eye that every field name matches the corresponding Zod schema in `src/lib/schemas.ts`. A mismatch here produces content the build rejects — the most likely bug in this task.

- [ ] **Step 3: Confirm the build still passes**

Run: `npm test && npm run build`
Expected: all tests pass, build completes.

- [ ] **Step 4: Commit**

```bash
git add .pages.yml
git commit -m "feat: add Pages CMS configuration"
```

---

## Definition of done

- `npm test` passes — schema, helper and build-output suites.
- `npm run build` completes with no errors.
- `npm run dev` serves a landing page with all nine sections at 375px, 768px and 1280px.
- The hero rotates, responds to arrow keys and dot clicks, pauses on hover, and does not auto-advance under `prefers-reduced-motion`.
- Deleting `title:` from any publication file makes `npm run build` **fail with a readable message** — verify this manually, then restore the file.
- `.pages.yml` field names match `src/lib/schemas.ts` exactly.
- The user has seen it in a browser and approved the visual direction (Task 15).

## Next plans

1. **Phase 2 remainder** — Research, Participate and News-detail pages.
2. **Phase 4 — deployment.** Requires the user to run `brew install gh` and `gh auth login` as `attentivelab` first.
3. **Phase 5 — ORCID/PubMed sync Action.** Requires the PI's ORCID iD.

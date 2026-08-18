# Landing Page Implementation Plan (v2 — real content)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.
>
> **Supersedes** `2026-08-18-lab-website-phase1.md`, which was written before the real content and assets existed. Where the two disagree, this document wins.

**Goal:** Build the Attentive Brains & Behaviors Lab landing page with the lab's real content, assets and brand colour, plus stub pages so every nav link resolves.

**Architecture:** Astro 5 static site. Content in Markdown/YAML collections validated by Zod; pure helpers in `src/lib/` hold all logic and are unit-tested; `.astro` components render only. Plain CSS with design tokens derived from the lab logo. Ships ~2 KB of JS: a scroll-reveal observer and the hero slider.

**Tech Stack:** Astro 5, TypeScript strict, Vitest, plain CSS, Pillow for image conversion.

---

## Brand

Sampled from `pictures/Icon_lab.png`: dominant lavender **`#d4b1fa`**. The full palette is derived from it, not invented.

## Assets on disk

| Source | Role | Notes |
|---|---|---|
| `pictures/Icon_lab.png` (1334×1179, alpha) | Site logo, top-left | Circular lavender badge, "Attentive Brains & Behaviors" |
| `pictures/Fiave et al., 2026.png` (1448×1086, **57% transparent**) | Hero figure | Cut-out scientific figure — **cannot** be a full-bleed background |
| `pictures/Lab_Picture.jpg` (1013×1381, portrait) | Our Team photo | |
| `pictures/Logo_UNIGE.webp` (500×145) | Footer | Already WebP |
| `papers/Fiave_et_al_2026.pdf` (9.1 MB) | Hero button target | Opens in a new tab |

## Deviations from the reference site — deliberate, with reasons

1. **Hero is split, not full-bleed-overlay.** Preston overlays white text on a photograph. Our hero image is a transparent cut-out figure; text over it would be unreadable and would wreck the figure. Layout: question + credit + button on the left, figure on a tinted panel on the right. The "big research question first" pattern is preserved.
2. **Hero remains a collection, seeded with one slide.** Preston rotates three. With one entry the dots hide and rotation is inert — but the PI can add a second slide through the CMS and it starts rotating with no code change.
3. **Nav has six items, per the user**, replacing Preston's five: Research · Lab members · Publications · News · Collaborations · Contact.
4. **YouTube uses a click-to-play facade** pointing at `youtube-nocookie.com`. **Honest caveat: this cannot guarantee an ad-free video** — whether ads play is controlled by the video owner's monetisation settings, not by the embedding site. What the facade *does* guarantee is that no YouTube script, cookie or tracker loads until the visitor clicks, which keeps the page fast and private.

---

## File Structure

| File | Responsibility |
|---|---|
| `scripts/prepare-assets.py` | One-shot conversion of source images to WebP into `public/images/` |
| `src/lib/schemas.ts` | Zod schemas for every collection |
| `src/lib/collections.ts` | Pure select/sort/group helpers |
| `src/content.config.ts` | Binds schemas to collections |
| `src/content/hero/`, `research/`, `people/`, `publications/`, `news/`, `pages/` | Content |
| `src/styles/tokens.css` | **Brand palette — the only file to touch for visual retuning** |
| `src/styles/global.css` | Reset, base type, shared utilities, scroll-reveal CSS |
| `src/layouts/Base.astro` | Shell, head, nav, footer |
| `src/components/Nav.astro` | Logo left, six links right, sticky, shadow on scroll |
| `src/components/Hero.astro` | Split hero + slider mechanics |
| `src/components/ResearchGrid.astro` | The four research questions |
| `src/components/SplitBlock.astro` | Reversible two-column text/image |
| `src/components/VideoEmbed.astro` | Click-to-play YouTube facade |
| `src/components/Footer.astro` | UNIGE logo + contact |
| `src/components/Reveal.astro` | Scroll-reveal wrapper |
| `src/pages/index.astro` | Landing page |
| `src/pages/{research,lab-members,publications,news,collaborations,contact}.astro` | Stubs so no nav link 404s |
| `.pages.yml` | CMS forms |

---

### Task 1: Scaffold

**Files:** Create `package.json`, `astro.config.mjs`, `tsconfig.json`, `vitest.config.ts`, `.gitignore`

- [ ] **Step 1: `package.json`**

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
  "dependencies": { "astro": "^5.2.0" },
  "devDependencies": { "vitest": "^2.1.0" }
}
```

- [ ] **Step 2: `astro.config.mjs`**

```js
import { defineConfig } from 'astro/config';
export default defineConfig({ site: 'https://www.theattentivebrain.com' });
```

- [ ] **Step 3: `tsconfig.json`**

```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"]
}
```

- [ ] **Step 4: `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: { environment: 'node', include: ['tests/**/*.test.ts'] },
});
```

- [ ] **Step 5: `.gitignore`**

```
node_modules/
dist/
.astro/
.DS_Store
*.log
```

- [ ] **Step 6: Install and commit**

```bash
cd /Users/thib/Desktop/lab_website
npm install
git init
git add -A
git commit -m "chore: scaffold Astro project"
```

---

### Task 2: Convert assets to WebP

Source images total ~2.5 MB of PNG/JPEG. WebP cuts that substantially, which is the single biggest lever on scroll smoothness.

**Files:** Create `scripts/prepare-assets.py`

- [ ] **Step 1: Write the script**

```python
#!/usr/bin/env python3
"""Convert source images in pictures/ to web-ready WebP in public/images/.

Run once, and again whenever a source image changes:
    python3 scripts/prepare-assets.py
"""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "pictures"
OUT = ROOT / "public" / "images"

# (source filename, output stem, max width, keep alpha)
JOBS = [
    ("Icon_lab.png", "logo", 320, True),
    ("Fiave et al., 2026.png", "hero-fiave-2026", 1600, True),
    ("Lab_Picture.jpg", "lab-team", 1200, False),
]


def convert(src_name: str, stem: str, max_w: int, alpha: bool) -> None:
    src = SRC / src_name
    if not src.exists():
        raise SystemExit(f"missing source image: {src}")
    im = Image.open(src)
    im = im.convert("RGBA" if alpha else "RGB")
    if im.width > max_w:
        h = round(im.height * max_w / im.width)
        im = im.resize((max_w, h), Image.LANCZOS)
    dest = OUT / f"{stem}.webp"
    im.save(dest, "WEBP", quality=88, method=6)
    kb = dest.stat().st_size / 1024
    print(f"{src_name:32} -> {dest.name:24} {im.width}x{im.height}  {kb:6.1f} KB")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for job in JOBS:
        convert(*job)
    # Already WebP and correctly sized — copy verbatim.
    unige = SRC / "Logo_UNIGE.webp"
    if unige.exists():
        (OUT / "logo-unige.webp").write_bytes(unige.read_bytes())
        print(f"{'Logo_UNIGE.webp':32} -> logo-unige.webp (copied)")


if __name__ == "__main__":
    main()
```

- [ ] **Step 2: Run it**

```bash
mkdir -p public/images public/papers
python3 scripts/prepare-assets.py
```

Expected: four lines of output, each well under 300 KB.

- [ ] **Step 3: Copy the PDF**

```bash
cp "papers/Fiave_et_al_2026.pdf" public/papers/Fiave_et_al_2026.pdf
```

- [ ] **Step 4: Record the real dimensions**

```bash
python3 -c "
from PIL import Image
for n in ['logo','hero-fiave-2026','lab-team','logo-unige']:
    im = Image.open(f'public/images/{n}.webp'); print(n, im.width, im.height)
"
```

Use these exact numbers in the `width`/`height` attributes of every `<img>` in Tasks 7–11. Guessed dimensions cause layout shift, which is precisely what the "smooth scrolling" requirement rules out.

- [ ] **Step 5: Commit**

```bash
git add scripts public/images public/papers
git commit -m "feat: convert lab assets to WebP"
```

---

### Task 3: Schemas

**Files:** Create `src/lib/schemas.ts`, `tests/schemas.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';
import {
  heroSchema, researchSchema, personSchema, publicationSchema, newsSchema, homeSchema,
} from '../src/lib/schemas';

describe('heroSchema', () => {
  it('accepts a slide with a call-to-action button', () => {
    const r = heroSchema.safeParse({
      question: 'How does the brain direct attention?',
      image: '/images/hero-fiave-2026.webp',
      credit: 'Fiave et al., 2026',
      buttonLabel: 'Read the publication',
      buttonHref: '/papers/Fiave_et_al_2026.pdf',
      order: 1,
    });
    expect(r.success).toBe(true);
  });

  it('requires a question and an image', () => {
    expect(heroSchema.safeParse({ question: 'Why?', order: 1 }).success).toBe(false);
    expect(heroSchema.safeParse({ image: '/a.webp', order: 1 }).success).toBe(false);
  });
});

describe('researchSchema', () => {
  it('accepts a question plus its answer', () => {
    const r = researchSchema.safeParse({
      title: 'What happens when we lose attention?',
      body: 'We study stroke patients.',
      order: 1,
    });
    expect(r.success).toBe(true);
  });
});

describe('publicationSchema', () => {
  it('defaults featured to false', () => {
    const r = publicationSchema.parse({
      title: 'A paper', authors: 'Fiave, P.', year: 2026, journal: 'A journal',
    });
    expect(r.featured).toBe(false);
  });
});

describe('personSchema', () => {
  it('rejects an unknown role', () => {
    expect(personSchema.safeParse({ name: 'X', role: 'Wizard', order: 1 }).success).toBe(false);
  });
});

describe('newsSchema', () => {
  it('coerces a date string', () => {
    const r = newsSchema.parse({ title: 'T', date: '2026-06-12', body: 'B' });
    expect(r.date).toBeInstanceOf(Date);
  });
});

describe('homeSchema', () => {
  it('requires the welcome block and the video URL', () => {
    const ok = homeSchema.safeParse({
      welcomeTitle: 'Welcome',
      welcomeBody: ['One.'],
      researchTitle: 'Research',
      teamTitle: 'Our Team',
      teamBody: ['Two.'],
      teamImage: '/images/lab-team.webp',
      videoTitle: 'Our lab',
      videoId: '3j5pefRbTuE',
    });
    expect(ok.success).toBe(true);
    expect(homeSchema.safeParse({ welcomeTitle: 'Welcome' }).success).toBe(false);
  });
});
```

- [ ] **Step 2: Run it and watch it fail**

Run: `npx vitest run tests/schemas.test.ts` → FAIL, cannot resolve module.

- [ ] **Step 3: Implement `src/lib/schemas.ts`**

```ts
import { z } from 'astro/zod';

export const ROLES = [
  'Principal Investigator',
  'Postdoctoral Researcher',
  'PhD Student',
  'Master Student',
  'Research Assistant',
] as const;
export type Role = (typeof ROLES)[number];

export const heroSchema = z.object({
  question: z.string().min(1),
  image: z.string().min(1),
  credit: z.string().optional(),
  buttonLabel: z.string().optional(),
  buttonHref: z.string().optional(),
  order: z.number(),
});

export const researchSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
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
  featured: z.boolean().default(false),
});

export const newsSchema = z.object({
  title: z.string().min(1),
  date: z.coerce.date(),
  image: z.string().optional(),
  body: z.string().min(1),
  link: z.string().optional(),
});

export const homeSchema = z.object({
  welcomeTitle: z.string().min(1),
  welcomeBody: z.array(z.string()).min(1),
  researchTitle: z.string().min(1),
  researchCta: z.string().default('Explore our research'),
  teamTitle: z.string().min(1),
  teamBody: z.array(z.string()).min(1),
  teamImage: z.string().min(1),
  teamCta: z.string().default('Meet the lab'),
  videoTitle: z.string().min(1),
  videoId: z.string().min(1),
});

export type HeroSlide = z.infer<typeof heroSchema>;
export type ResearchTopic = z.infer<typeof researchSchema>;
export type Person = z.infer<typeof personSchema>;
export type Publication = z.infer<typeof publicationSchema>;
export type NewsItem = z.infer<typeof newsSchema>;
export type HomeCopy = z.infer<typeof homeSchema>;
```

- [ ] **Step 4: Verify** — `npx vitest run tests/schemas.test.ts` → PASS (8 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/schemas.ts tests/schemas.test.ts
git commit -m "feat: content schemas for real lab content"
```

---

### Task 4: Ordering and selection helpers

**Files:** Create `src/lib/collections.ts`, `tests/collections.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest';
import { byOrder, latestPublications, latestNews, groupPeople, alumniOf } from '../src/lib/collections';
import type { Publication, NewsItem, Person } from '../src/lib/schemas';

describe('byOrder', () => {
  it('sorts ascending by order without mutating the input', () => {
    const input = [{ order: 3, n: 'c' }, { order: 1, n: 'a' }, { order: 2, n: 'b' }];
    expect(byOrder(input).map((x) => x.n)).toEqual(['a', 'b', 'c']);
    expect(input[0].n).toBe('c');
  });
});

const pub = (title: string, year: number, featured = true): Publication =>
  ({ title, year, featured, authors: 'Fiave, P.', journal: 'J. Test' });

describe('latestPublications', () => {
  it('keeps only featured, newest first, title-tiebroken, limit 4', () => {
    const r = latestPublications([
      pub('B', 2026), pub('A', 2026), pub('old', 2020), pub('hidden', 2025, false),
      pub('x', 2024), pub('y', 2023),
    ]);
    expect(r.map((p) => p.title)).toEqual(['A', 'B', 'x', 'y']);
  });
});

const news = (title: string, date: string): NewsItem => ({ title, date: new Date(date), body: 'x' });

describe('latestNews', () => {
  it('sorts newest first, limit 3', () => {
    const r = latestNews([news('a', '2025-01-01'), news('c', '2026-08-01'), news('b', '2026-05-01')]);
    expect(r.map((n) => n.title)).toEqual(['c', 'b', 'a']);
  });
});

const person = (name: string, role: Person['role'], order: number, alumni = false): Person =>
  ({ name, role, order, alumni, links: [] });

describe('groupPeople', () => {
  it('orders groups by seniority, not alphabetically, and drops empty groups', () => {
    const r = groupPeople([
      person('M', 'Master Student', 1),
      person('I', 'Principal Investigator', 1),
      person('P', 'PhD Student', 1),
    ]);
    expect(r.map((g) => g.role)).toEqual(['Principal Investigator', 'PhD Student', 'Master Student']);
  });

  it('excludes alumni', () => {
    const r = groupPeople([person('here', 'PhD Student', 1), person('gone', 'PhD Student', 2, true)]);
    expect(r[0].members.map((p) => p.name)).toEqual(['here']);
  });
});

describe('alumniOf', () => {
  it('returns alumni sorted by name', () => {
    const r = alumniOf([person('Zoe', 'PhD Student', 1, true), person('Al', 'PhD Student', 2, true)]);
    expect(r.map((p) => p.name)).toEqual(['Al', 'Zoe']);
  });
});
```

- [ ] **Step 2: Run it and watch it fail.**

- [ ] **Step 3: Implement `src/lib/collections.ts`**

```ts
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
```

- [ ] **Step 4: Verify** — `npx vitest run` → PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/collections.ts tests/collections.test.ts
git commit -m "feat: collection ordering and selection helpers"
```

---

### Task 5: Collection config

**Files:** Create `src/content.config.ts`

- [ ] **Step 1: Write it**

```ts
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import {
  heroSchema, researchSchema, personSchema, publicationSchema, newsSchema, homeSchema,
} from './lib/schemas';

const md = (dir: string) => glob({ pattern: '**/*.md', base: `./src/content/${dir}` });

const hero = defineCollection({ loader: md('hero'), schema: heroSchema });
const research = defineCollection({ loader: md('research'), schema: researchSchema });
const people = defineCollection({ loader: md('people'), schema: personSchema });
const publications = defineCollection({ loader: md('publications'), schema: publicationSchema });
const news = defineCollection({ loader: md('news'), schema: newsSchema });
const pages = defineCollection({
  loader: glob({ pattern: '**/*.yaml', base: './src/content/pages' }),
  schema: homeSchema,
});

export const collections = { hero, research, people, publications, news, pages };
```

- [ ] **Step 2: Commit**

```bash
git add src/content.config.ts
git commit -m "feat: bind schemas to content collections"
```

---

### Task 6: Real content

Every string below is the user's own copy. **Do not paraphrase, "improve", or fix perceived typos.**

**Files:** content files across six collection folders.

- [ ] **Step 1: Hero — `src/content/hero/01-fiave-2026.md`**

```markdown
---
question: How does the brain direct attention to different parts of an object, such as its left or right side?
image: /images/hero-fiave-2026.webp
credit: Fiave et al., 2026
buttonLabel: View our publication
buttonHref: /papers/Fiave_et_al_2026.pdf
order: 1
---
```

- [ ] **Step 2: Research — four files in `src/content/research/`**

`01-neglect.md`:
```markdown
---
title: What happens in the brain when we lose the ability to pay attention to part of the world?
body: We study stroke patients to correlate deficient behaviors with brain damage.
order: 1
---
```

`02-objects.md`:
```markdown
---
title: We all live in a world that is more and more filled-up with objects.
body: We are looking at the brain networks allowing us to pay attention to relevant objects, but also to find those objects in space.
order: 2
---
```

`03-virtual-reality.md`:
```markdown
---
title: How do we pay attention in our everyday lives?
body: We are developing novel Virtual Reality tools to recreate and study attentional behavior in a real(istic) world.
order: 3
---
```

`04-single-neurons.md`:
```markdown
---
title: The brain works at different temporal and spatial scales.
body: We record single neuron activity of key attentional areas to understand the microcircuits of attention.
order: 4
---
```

- [ ] **Step 3: Homepage copy — `src/content/pages/home.yaml`**

```yaml
welcomeTitle: Welcome to the Attentive Brains & Behaviors Lab
welcomeBody:
  - >-
    We are intrigued by the human and animal capability of understanding and navigating
    extremely complex situations and by the devastating consequences that brain diseases
    bring. As a system and cognitive neuroscience Lab, we want to understand how the brain
    takes on this challenge, we want to study the behavior at its full capacity, and we want
    to commit our investigations to ultimately improve wellbeing. We believe that combining
    cutting-edge tools, multiple neuroscientific techniques, and different model systems is
    fundamental to meet the complexity of the brain and of behavior.
researchTitle: Our Research
researchCta: Explore our research
teamTitle: Our Team
teamBody:
  - >-
    We are a neuroscience lab at the University of Geneva studying how the brain selects,
    sustains and directs attention — in the laboratory, in the clinic, and in realistic
    everyday environments.
  - >-
    The lab is directed by Ilaria Sani and is composed of one post-doctoral researcher,
    PhD students and master students.
teamImage: /images/lab-team.webp
teamCta: Meet the lab members
videoTitle: Inside the lab
videoId: 3j5pefRbTuE
```

- [ ] **Step 4: Seed one person so the People page is not empty**

`src/content/people/01-ilaria-sani.md`:
```markdown
---
name: Ilaria Sani
role: Principal Investigator
email: ilaria.sani@unige.ch
order: 1
alumni: false
---

Director of the Attentive Brains & Behaviors Lab.
```

- [ ] **Step 5: Seed the publication already on the site**

`src/content/publications/2026-fiave.md`:
```markdown
---
title: How does the brain direct attention to different parts of an object?
authors: Fiave, P. A., et al.
year: 2026
journal: In press
pdf: /papers/Fiave_et_al_2026.pdf
featured: true
---
```

- [ ] **Step 6: Verify content validates**

Run: `npx astro sync`
Expected: no schema errors.

- [ ] **Step 7: Commit**

```bash
git add src/content
git commit -m "content: add real lab copy, research topics and hero"
```

---

### Task 7: Design tokens

Palette derived from the logo lavender `#d4b1fa`.

**Files:** Create `src/styles/tokens.css`, `src/styles/global.css`

- [ ] **Step 1: `src/styles/tokens.css`**

```css
:root {
  /* Brand — derived from the lab logo (#d4b1fa) */
  --brand: #d4b1fa;
  --brand-soft: #efe3fd;
  --brand-tint: #f8f3fe;
  --brand-mid: #9a6fd4;
  --brand-deep: #4a2d78;
  --brand-deeper: #2e1a4e;

  --ink: #17131c;
  --ink-soft: #524c5c;
  --ink-faint: #837c8f;
  --paper: #ffffff;
  --paper-tint: #f8f6fb;
  --rule: #e7e2ef;
  --on-dark: #ffffff;

  --font-display: 'Georgia', 'Iowan Old Style', 'Times New Roman', serif;
  --font-body: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;

  --text-sm: clamp(0.875rem, 0.85rem + 0.1vw, 0.9375rem);
  --text-base: clamp(1rem, 0.96rem + 0.2vw, 1.0625rem);
  --text-lg: clamp(1.125rem, 1.05rem + 0.35vw, 1.3125rem);
  --text-xl: clamp(1.5rem, 1.28rem + 0.95vw, 2.125rem);
  --text-2xl: clamp(1.875rem, 1.5rem + 1.6vw, 2.75rem);
  --text-hero: clamp(1.875rem, 1.35rem + 2.4vw, 3.25rem);

  --gutter: clamp(1.25rem, 4vw, 3rem);
  --section-y: clamp(3.5rem, 8vw, 7rem);
  --max-width: 1180px;
  --measure: 64ch;

  --radius: 10px;
  --radius-lg: 18px;
  --shadow: 0 1px 2px rgb(23 19 28 / 0.04), 0 8px 24px rgb(23 19 28 / 0.06);
  --shadow-lift: 0 2px 6px rgb(23 19 28 / 0.06), 0 18px 44px rgb(23 19 28 / 0.11);
  --ease: cubic-bezier(0.22, 0.61, 0.36, 1);
  --transition: 240ms var(--ease);
}
```

- [ ] **Step 2: `src/styles/global.css`**

```css
@import './tokens.css';

*, *::before, *::after { box-sizing: border-box; }
* { margin: 0; }

html { -webkit-text-size-adjust: 100%; scroll-behavior: smooth; }

body {
  font-family: var(--font-body);
  font-size: var(--text-base);
  line-height: 1.65;
  color: var(--ink);
  background: var(--paper);
  -webkit-font-smoothing: antialiased;
  overflow-x: hidden;
}

img, svg { display: block; max-width: 100%; }
img { height: auto; }

h1, h2, h3 {
  font-family: var(--font-display);
  font-weight: 600;
  line-height: 1.14;
  letter-spacing: -0.018em;
  text-wrap: balance;
}

a { color: inherit; }
p { text-wrap: pretty; }

:focus-visible { outline: 3px solid var(--brand-mid); outline-offset: 3px; border-radius: 2px; }

.wrap { max-width: var(--max-width); margin-inline: auto; padding-inline: var(--gutter); }
.section { padding-block: var(--section-y); }
.section--tint { background: var(--paper-tint); }
.section--brand { background: linear-gradient(160deg, var(--brand-tint) 0%, var(--brand-soft) 100%); }

.section-title { font-size: var(--text-2xl); margin-bottom: 1rem; }
.eyebrow {
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--brand-mid);
  margin-bottom: 0.85rem;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.85rem 1.6rem;
  font-family: var(--font-body);
  font-size: var(--text-sm);
  font-weight: 600;
  letter-spacing: 0.01em;
  text-decoration: none;
  border: 1px solid transparent;
  border-radius: 999px;
  cursor: pointer;
  transition: transform var(--transition), box-shadow var(--transition), background var(--transition);
}
.btn--primary { background: var(--brand-deep); color: var(--on-dark); }
.btn--primary:hover { background: var(--brand-deeper); transform: translateY(-2px); box-shadow: var(--shadow-lift); }
.btn--ghost { background: transparent; color: var(--brand-deep); border-color: var(--brand); }
.btn--ghost:hover { background: var(--brand-tint); transform: translateY(-2px); }

/* Scroll reveal */
.reveal { opacity: 0; transform: translateY(24px); }
.reveal.is-visible {
  opacity: 1;
  transform: none;
  transition: opacity 700ms var(--ease), transform 700ms var(--ease);
}

.skip-link { position: absolute; left: -9999px; top: 0; background: var(--brand-deep); color: #fff; padding: 0.75rem 1.25rem; z-index: 200; }
.skip-link:focus { left: 0; }

@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  .reveal { opacity: 1; transform: none; transition: none; }
  *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/styles
git commit -m "feat: brand design tokens derived from lab logo"
```

---

### Task 8: Nav, Footer, Reveal, Base layout

**Files:** Create `src/components/Nav.astro`, `Footer.astro`, `Reveal.astro`, `src/layouts/Base.astro`

- [ ] **Step 1: `src/components/Reveal.astro`**

```astro
---
interface Props { delay?: number }
const { delay = 0 } = Astro.props;
---
<div class="reveal" style={delay ? `transition-delay:${delay}ms` : undefined}><slot /></div>
```

- [ ] **Step 2: `src/components/Nav.astro`**

Logo left, six links right. Sticky, gains a shadow once scrolled.

```astro
---
const links = [
  { label: 'Research', href: '/research' },
  { label: 'Lab members', href: '/lab-members' },
  { label: 'Publications', href: '/publications' },
  { label: 'News', href: '/news' },
  { label: 'Collaborations', href: '/collaborations' },
  { label: 'Contact', href: '/contact' },
];
const path = Astro.url.pathname;
---

<header class="nav" id="site-nav">
  <div class="nav__inner wrap">
    <a class="nav__brand" href="/" aria-label="Attentive Brains &amp; Behaviors Lab — home">
      <img src="/images/logo.webp" alt="" width="320" height="283" />
      <span class="nav__brand-text">Attentive Brains<br /><span>&amp; Behaviors</span></span>
    </a>

    <input type="checkbox" id="nav-toggle" class="nav__checkbox" />
    <label for="nav-toggle" class="nav__burger" aria-label="Toggle navigation">
      <span></span><span></span><span></span>
    </label>

    <nav class="nav__links" aria-label="Main">
      {links.map((l) => (
        <a href={l.href} aria-current={path === l.href ? 'page' : undefined}>{l.label}</a>
      ))}
    </nav>
  </div>
</header>

<style>
  .nav {
    position: sticky; top: 0; z-index: 100;
    background: color-mix(in srgb, var(--paper) 86%, transparent);
    backdrop-filter: saturate(180%) blur(12px);
    border-bottom: 1px solid transparent;
    transition: box-shadow var(--transition), border-color var(--transition);
  }
  .nav.is-stuck { box-shadow: 0 1px 18px rgb(23 19 28 / 0.08); border-bottom-color: var(--rule); }
  .nav__inner { display: flex; align-items: center; justify-content: space-between; gap: 1rem; min-height: 76px; }
  .nav__brand { display: flex; align-items: center; gap: 0.7rem; text-decoration: none; }
  .nav__brand img { width: 48px; height: auto; }
  .nav__brand-text {
    font-family: var(--font-display); font-size: 0.95rem; font-weight: 600;
    line-height: 1.15; letter-spacing: -0.01em;
  }
  .nav__brand-text span { color: var(--brand-mid); }
  .nav__links { display: flex; gap: clamp(0.9rem, 1.9vw, 1.9rem); align-items: center; }
  .nav__links a {
    position: relative; font-size: var(--text-sm); font-weight: 500;
    text-decoration: none; color: var(--ink-soft); padding-block: 0.35rem;
    transition: color var(--transition);
  }
  .nav__links a::after {
    content: ''; position: absolute; left: 0; right: 0; bottom: 0; height: 2px;
    background: var(--brand); transform: scaleX(0); transform-origin: left;
    transition: transform var(--transition);
  }
  .nav__links a:hover { color: var(--brand-deep); }
  .nav__links a:hover::after, .nav__links a[aria-current='page']::after { transform: scaleX(1); }
  .nav__links a[aria-current='page'] { color: var(--brand-deep); }
  .nav__checkbox, .nav__burger { display: none; }

  @media (max-width: 940px) {
    .nav__burger {
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 5px; width: 44px; height: 44px; cursor: pointer;
    }
    .nav__burger span { width: 22px; height: 2px; background: var(--ink); border-radius: 2px; }
    .nav__links {
      display: none; position: absolute; inset-inline: 0; top: 100%;
      flex-direction: column; align-items: stretch; gap: 0;
      background: var(--paper); border-bottom: 1px solid var(--rule);
      padding: 0.25rem var(--gutter) 1.25rem; box-shadow: var(--shadow);
    }
    .nav__checkbox:checked ~ .nav__links { display: flex; }
    .nav__links a { padding-block: 0.9rem; font-size: var(--text-base); border-bottom: 1px solid var(--rule); }
    .nav__links a::after { display: none; }
  }
</style>

<script>
  const nav = document.getElementById('site-nav');
  if (nav) {
    const onScroll = () => nav.classList.toggle('is-stuck', window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }
</script>
```

- [ ] **Step 3: `src/components/Footer.astro`**

```astro
<footer class="foot">
  <div class="wrap foot__inner">
    <div class="foot__brand">
      <img src="/images/logo-unige.webp" alt="University of Geneva" width="500" height="145" loading="lazy" />
    </div>
    <div class="foot__contact">
      <h2 class="foot__title">Contact us</h2>
      <address>
        University of Geneva<br />
        Campus Biotech, Chemin des Mines 9, 1202 Genève<br />
        <a href="tel:+41223790383">+41 223 790 383</a><br />
        <a href="mailto:ilaria.sani@unige.ch">ilaria.sani@unige.ch</a>
      </address>
    </div>
  </div>
  <div class="wrap foot__legal">
    <small>&copy; {new Date().getFullYear()} Attentive Brains &amp; Behaviors Lab, University of Geneva.</small>
  </div>
</footer>

<style>
  .foot { background: var(--brand-deeper); color: var(--on-dark); padding-block: clamp(3rem, 7vw, 4.5rem) 1.5rem; }
  .foot__inner {
    display: grid; grid-template-columns: minmax(180px, 300px) 1fr;
    gap: clamp(2rem, 6vw, 4rem); align-items: start;
  }
  .foot__brand img { width: 100%; max-width: 260px; height: auto; background: #fff; padding: 0.9rem 1.1rem; border-radius: var(--radius); }
  .foot__title { font-size: var(--text-lg); margin-bottom: 0.85rem; }
  .foot address { font-style: normal; line-height: 1.9; color: color-mix(in srgb, var(--on-dark) 82%, transparent); }
  .foot address a { color: var(--brand); text-decoration: none; }
  .foot address a:hover { text-decoration: underline; text-underline-offset: 3px; }
  .foot__legal {
    margin-top: 2.75rem; padding-top: 1.25rem;
    border-top: 1px solid color-mix(in srgb, var(--on-dark) 18%, transparent);
    color: color-mix(in srgb, var(--on-dark) 55%, transparent);
  }
  @media (max-width: 780px) { .foot__inner { grid-template-columns: 1fr; } }
</style>
```

- [ ] **Step 4: `src/layouts/Base.astro`**

The scroll-reveal observer lives here so every page gets it.

```astro
---
import Nav from '../components/Nav.astro';
import Footer from '../components/Footer.astro';
import '../styles/global.css';

interface Props { title: string; description?: string }
const {
  title,
  description = 'The Attentive Brains & Behaviors Lab at the University of Geneva studies how the brain directs attention.',
} = Astro.props;
---

<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <meta name="description" content={description} />
    <link rel="icon" href="/images/logo.webp" type="image/webp" />
  </head>
  <body>
    <a class="skip-link" href="#main">Skip to content</a>
    <Nav />
    <main id="main"><slot /></main>
    <Footer />

    <script>
      const targets = document.querySelectorAll('.reveal');
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduced || !('IntersectionObserver' in window)) {
        targets.forEach((el) => el.classList.add('is-visible'));
      } else {
        const io = new IntersectionObserver(
          (entries) => {
            for (const entry of entries) {
              if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                io.unobserve(entry.target);
              }
            }
          },
          { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
        );
        targets.forEach((el) => io.observe(el));
      }
    </script>
  </body>
</html>
```

- [ ] **Step 5: Commit**

```bash
git add src/components src/layouts
git commit -m "feat: nav with logo, footer with UNIGE contact, scroll reveal"
```

---

### Task 9: Hero

Split layout — see "Deviations" above for why this is not a full-bleed overlay.

**Files:** Create `src/components/Hero.astro`

- [ ] **Step 1: Write it**

```astro
---
import type { HeroSlide } from '../lib/schemas';
interface Props { slides: HeroSlide[] }
const { slides } = Astro.props;
---

<section class="hero" aria-roledescription="carousel" aria-label="Featured research question">
  <div class="hero__grid wrap">
    {slides.map((slide, i) => {
      // Only the first slide carries the <h1> — one top-level heading per page.
      const Heading = i === 0 ? 'h1' : 'p';
      return (
        <article class="hero__slide" data-slide={i} aria-hidden={i === 0 ? 'false' : 'true'}>
          <div class="hero__text">
            {slide.credit && <p class="eyebrow">{slide.credit}</p>}
            <Heading class="hero__question">{slide.question}</Heading>
            {slide.buttonLabel && slide.buttonHref && (
              <a class="btn btn--primary hero__cta" href={slide.buttonHref} target="_blank" rel="noopener noreferrer">
                {slide.buttonLabel}
                <span aria-hidden="true">&rarr;</span>
              </a>
            )}
          </div>
          <figure class="hero__figure">
            <img src={slide.image} alt={slide.credit ?? 'Research figure'} width="1600" height="1200" fetchpriority="high" decoding="async" />
          </figure>
        </article>
      );
    })}
  </div>

  {slides.length > 1 && (
    <div class="hero__dots wrap" role="group" aria-label="Choose slide">
      {slides.map((_, i) => (
        <button class="hero__dot" data-dot={i} type="button"
          aria-label={`Show question ${i + 1} of ${slides.length}`}
          aria-current={i === 0 ? 'true' : 'false'}></button>
      ))}
    </div>
  )}
</section>

<style>
  .hero {
    position: relative;
    background: linear-gradient(165deg, var(--brand-tint) 0%, var(--brand-soft) 55%, #fff 100%);
    padding-block: clamp(2.5rem, 6vw, 5rem) clamp(3rem, 7vw, 5.5rem);
    overflow: hidden;
  }
  .hero::before {
    content: ''; position: absolute; top: -22%; right: -12%;
    width: 46vw; height: 46vw; border-radius: 50%;
    background: radial-gradient(circle, color-mix(in srgb, var(--brand) 42%, transparent) 0%, transparent 70%);
    pointer-events: none;
  }
  .hero__grid { position: relative; display: grid; }
  .hero__slide {
    grid-area: 1 / 1;
    display: grid; grid-template-columns: 1fr 1fr;
    gap: clamp(2rem, 5vw, 4rem); align-items: center;
    opacity: 0; visibility: hidden; transition: opacity 600ms var(--ease);
  }
  .hero__slide[aria-hidden='false'] { opacity: 1; visibility: visible; }
  .hero__question { font-size: var(--text-hero); max-width: 17ch; }
  .hero__cta { margin-top: clamp(1.5rem, 3vw, 2.25rem); }
  .hero__figure {
    margin: 0; padding: clamp(1rem, 2.5vw, 1.75rem);
    background: color-mix(in srgb, #fff 72%, transparent);
    border: 1px solid color-mix(in srgb, var(--brand) 38%, transparent);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow);
  }
  .hero__figure img { width: 100%; height: auto; }
  .hero__dots { display: flex; gap: 0.6rem; margin-top: 2rem; }
  .hero__dot { width: 38px; height: 4px; border: 0; padding: 0; cursor: pointer; border-radius: 2px; background: color-mix(in srgb, var(--brand-mid) 35%, transparent); transition: background var(--transition); }
  .hero__dot[aria-current='true'] { background: var(--brand-deep); }

  @media (max-width: 900px) {
    .hero__slide { grid-template-columns: 1fr; gap: 2rem; }
    .hero__question { max-width: 22ch; }
  }
</style>

<script>
  const root = document.querySelector('.hero');
  if (root) {
    const slides = [...root.querySelectorAll<HTMLElement>('[data-slide]')];
    const dots = [...root.querySelectorAll<HTMLButtonElement>('[data-dot]')];
    let index = 0;
    let timer: number | undefined;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const show = (next: number) => {
      index = (next + slides.length) % slides.length;
      slides.forEach((s, i) => s.setAttribute('aria-hidden', String(i !== index)));
      dots.forEach((d, i) => d.setAttribute('aria-current', String(i === index)));
    };
    const stop = () => { if (timer) window.clearInterval(timer); timer = undefined; };
    const start = () => {
      if (reduced || slides.length < 2) return;
      stop();
      timer = window.setInterval(() => show(index + 1), 8000);
    };

    dots.forEach((d, i) => d.addEventListener('click', () => { show(i); start(); }));
    root.addEventListener('keydown', (e) => {
      const k = (e as KeyboardEvent).key;
      if (k === 'ArrowRight') { show(index + 1); start(); }
      if (k === 'ArrowLeft') { show(index - 1); start(); }
    });
    root.addEventListener('mouseenter', stop);
    root.addEventListener('mouseleave', start);
    start();
  }
</script>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Hero.astro
git commit -m "feat: split hero with research question and publication button"
```

---

### Task 10: Research grid, split block, video embed

**Files:** Create `src/components/ResearchGrid.astro`, `SplitBlock.astro`, `VideoEmbed.astro`

- [ ] **Step 1: `src/components/ResearchGrid.astro`**

```astro
---
import type { ResearchTopic } from '../lib/schemas';
import Reveal from './Reveal.astro';
interface Props { topics: ResearchTopic[] }
const { topics } = Astro.props;
---

<div class="rgrid">
  {topics.map((t, i) => (
    <Reveal delay={i * 90}>
      <article class="rcard">
        <span class="rcard__num" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
        <h3 class="rcard__title">{t.title}</h3>
        <p class="rcard__body">{t.body}</p>
      </article>
    </Reveal>
  ))}
</div>

<style>
  .rgrid { display: grid; grid-template-columns: repeat(auto-fit, minmax(290px, 1fr)); gap: clamp(1.25rem, 2.5vw, 1.75rem); }
  .rcard {
    height: 100%; padding: clamp(1.5rem, 3vw, 2rem);
    background: var(--paper); border: 1px solid var(--rule); border-radius: var(--radius-lg);
    transition: transform var(--transition), box-shadow var(--transition), border-color var(--transition);
  }
  .rcard:hover { transform: translateY(-4px); box-shadow: var(--shadow-lift); border-color: color-mix(in srgb, var(--brand) 55%, transparent); }
  .rcard__num {
    display: inline-block; font-family: var(--font-body); font-size: var(--text-sm);
    font-weight: 700; letter-spacing: 0.1em; color: var(--brand-mid); margin-bottom: 0.85rem;
  }
  .rcard__title { font-size: var(--text-lg); margin-bottom: 0.7rem; }
  .rcard__body { color: var(--ink-soft); font-size: var(--text-sm); line-height: 1.7; }
</style>
```

- [ ] **Step 2: `src/components/SplitBlock.astro`**

```astro
---
interface Props {
  title: string; image?: string; imageAlt?: string;
  imageWidth?: number; imageHeight?: number;
  reverse?: boolean; ctaHref?: string; ctaLabel?: string; id?: string;
}
const {
  title, image, imageAlt = '', imageWidth = 1200, imageHeight = 1636,
  reverse = false, ctaHref, ctaLabel, id,
} = Astro.props;
---

<div class="split" data-reverse={reverse ? 'true' : 'false'} id={id}>
  <div class="split__media">
    {image && <img src={image} alt={imageAlt} width={imageWidth} height={imageHeight} loading="lazy" decoding="async" />}
  </div>
  <div class="split__text">
    <h2 class="split__title">{title}</h2>
    <div class="split__body"><slot /></div>
    {ctaHref && ctaLabel && <a class="btn btn--ghost split__cta" href={ctaHref}>{ctaLabel}<span aria-hidden="true">&rarr;</span></a>}
  </div>
</div>

<style>
  .split { display: grid; grid-template-columns: 0.9fr 1.1fr; gap: clamp(2rem, 5vw, 4rem); align-items: center; }
  .split[data-reverse='true'] .split__media { order: 2; }
  .split__media img { width: 100%; height: auto; border-radius: var(--radius-lg); box-shadow: var(--shadow); }
  .split__title { font-size: var(--text-xl); margin-bottom: 1.1rem; }
  .split__body { max-width: var(--measure); color: var(--ink-soft); }
  .split__body :global(p + p) { margin-top: 1rem; }
  .split__cta { margin-top: 1.75rem; }
  @media (max-width: 880px) {
    .split { grid-template-columns: 1fr; }
    .split[data-reverse='true'] .split__media { order: 0; }
    .split__media img { max-width: 460px; margin-inline: auto; }
  }
</style>
```

- [ ] **Step 3: `src/components/VideoEmbed.astro`**

Click-to-play facade: no YouTube code loads until the visitor clicks.

```astro
---
interface Props { videoId: string; title: string }
const { videoId, title } = Astro.props;
---

<div class="video" data-video-id={videoId}>
  <button class="video__play" type="button" aria-label={`Play video: ${title}`}>
    <img
      class="video__poster"
      src={`https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`}
      alt=""
      width="1280" height="720" loading="lazy" decoding="async"
    />
    <span class="video__btn" aria-hidden="true">
      <svg viewBox="0 0 68 48" width="68" height="48">
        <path d="M66.5 7.7a8 8 0 0 0-5.6-5.7C56 .7 34 .7 34 .7s-22 0-26.9 1.3A8 8 0 0 0 1.5 7.7 83 83 0 0 0 .2 24a83 83 0 0 0 1.3 16.3 8 8 0 0 0 5.6 5.7C12 47.3 34 47.3 34 47.3s22 0 26.9-1.3a8 8 0 0 0 5.6-5.7A83 83 0 0 0 67.8 24a83 83 0 0 0-1.3-16.3z" fill="#212121" fill-opacity="0.85"/>
        <path d="M27.2 34.2 45.5 24 27.2 13.8z" fill="#fff"/>
      </svg>
    </span>
  </button>
</div>

<style>
  .video { position: relative; aspect-ratio: 16 / 9; border-radius: var(--radius-lg); overflow: hidden; background: #000; box-shadow: var(--shadow-lift); }
  .video__play { position: absolute; inset: 0; width: 100%; height: 100%; padding: 0; border: 0; background: none; cursor: pointer; }
  .video__poster { width: 100%; height: 100%; object-fit: cover; transition: transform 600ms var(--ease), opacity var(--transition); }
  .video__play:hover .video__poster { transform: scale(1.03); opacity: 0.88; }
  .video__btn { position: absolute; inset: 0; display: grid; place-items: center; }
  .video__btn svg { transition: transform var(--transition); filter: drop-shadow(0 4px 12px rgb(0 0 0 / 0.35)); }
  .video__play:hover .video__btn svg { transform: scale(1.1); }
  .video :global(iframe) { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; }
</style>

<script>
  document.querySelectorAll<HTMLElement>('.video').forEach((box) => {
    const id = box.dataset.videoId;
    const btn = box.querySelector('.video__play');
    if (!id || !btn) return;
    btn.addEventListener('click', () => {
      const frame = document.createElement('iframe');
      // nocookie host: no YouTube tracking cookies are set until playback starts.
      frame.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`;
      frame.title = 'Lab video';
      frame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      frame.allowFullscreen = true;
      box.replaceChildren(frame);
    });
  });
</script>
```

- [ ] **Step 4: Commit**

```bash
git add src/components
git commit -m "feat: research grid, split block, click-to-play video embed"
```

---

### Task 11: Landing page

**Files:** Create `src/pages/index.astro`

- [ ] **Step 1: Write it**

```astro
---
import { getCollection, getEntry } from 'astro:content';
import Base from '../layouts/Base.astro';
import Hero from '../components/Hero.astro';
import ResearchGrid from '../components/ResearchGrid.astro';
import SplitBlock from '../components/SplitBlock.astro';
import VideoEmbed from '../components/VideoEmbed.astro';
import Reveal from '../components/Reveal.astro';
import { byOrder } from '../lib/collections';

const slides = byOrder((await getCollection('hero')).map((e) => e.data));
const topics = byOrder((await getCollection('research')).map((e) => e.data));
const home = (await getEntry('pages', 'home'))!.data;
---

<Base title="Attentive Brains &amp; Behaviors Lab — University of Geneva">
  <Hero slides={slides} />

  <section class="section welcome">
    <div class="wrap">
      <Reveal>
        <h2 class="welcome__title">{home.welcomeTitle}</h2>
        {home.welcomeBody.map((p) => <p class="welcome__body">{p}</p>)}
      </Reveal>
    </div>
  </section>

  <section class="section section--tint" id="research">
    <div class="wrap">
      <Reveal>
        <p class="eyebrow">What we study</p>
        <h2 class="section-title">{home.researchTitle}</h2>
      </Reveal>
      <div class="research-space">
        <ResearchGrid topics={topics} />
      </div>
      <Reveal>
        <p class="section-cta"><a class="btn btn--primary" href="/research">{home.researchCta}<span aria-hidden="true">&rarr;</span></a></p>
      </Reveal>
    </div>
  </section>

  <section class="section" id="team">
    <div class="wrap">
      <Reveal>
        <SplitBlock
          title={home.teamTitle}
          image={home.teamImage}
          imageAlt="The Attentive Brains &amp; Behaviors Lab team"
          imageWidth={1200}
          imageHeight={1636}
          ctaHref="/lab-members"
          ctaLabel={home.teamCta}
        >
          {home.teamBody.map((p) => <p>{p}</p>)}
        </SplitBlock>
      </Reveal>
    </div>
  </section>

  <section class="section section--brand" id="video">
    <div class="wrap">
      <Reveal>
        <p class="eyebrow">Watch</p>
        <h2 class="section-title">{home.videoTitle}</h2>
      </Reveal>
      <Reveal delay={80}>
        <VideoEmbed videoId={home.videoId} title={home.videoTitle} />
      </Reveal>
    </div>
  </section>
</Base>

<style>
  .welcome__title { font-size: var(--text-xl); margin-bottom: 1.5rem; max-width: 24ch; }
  .welcome__body { max-width: var(--measure); color: var(--ink-soft); font-size: var(--text-lg); line-height: 1.75; }
  .research-space { margin-top: 2.5rem; }
  .section-cta { margin-top: 2.75rem; }
</style>
```

- [ ] **Step 2: Build** — `npm run build` → `[build] Complete!`

- [ ] **Step 3: Commit**

```bash
git add src/pages/index.astro
git commit -m "feat: landing page with real lab content"
```

---

### Task 12: Stub pages so no nav link 404s

**Files:** Create six files in `src/pages/`

- [ ] **Step 1: Create a shared stub**

`src/pages/research.astro` — repeat this exact shape for each, changing only `title`, `heading` and the file name:

```astro
---
import Base from '../layouts/Base.astro';
const heading = 'Research';
---
<Base title={`${heading} — Attentive Brains & Behaviors Lab`}>
  <section class="section">
    <div class="wrap">
      <h1 class="section-title">{heading}</h1>
      <p style="color: var(--ink-soft); max-width: 60ch;">
        This page is coming soon. In the meantime, see the research questions on the
        <a href="/#research" style="color: var(--brand-deep); font-weight: 600;">home page</a>.
      </p>
    </div>
  </section>
</Base>
```

Create the remaining five with these values:

| File | `heading` |
|---|---|
| `src/pages/lab-members.astro` | `Lab members` |
| `src/pages/publications.astro` | `Publications` |
| `src/pages/news.astro` | `News` |
| `src/pages/collaborations.astro` | `Collaborations` |
| `src/pages/contact.astro` | `Contact` |

- [ ] **Step 2: Build and confirm every route exists**

```bash
npm run build
ls dist dist/research dist/lab-members dist/publications dist/news dist/collaborations dist/contact
```

- [ ] **Step 3: Commit**

```bash
git add src/pages
git commit -m "feat: stub pages for all nav destinations"
```

---

### Task 13: Build-output tests

**Files:** Create `tests/build.test.ts`

- [ ] **Step 1: Write the test**

```ts
import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';

let home = '';

beforeAll(() => {
  if (!existsSync('dist/index.html')) execSync('npm run build', { stdio: 'inherit' });
  home = readFileSync('dist/index.html', 'utf8');
}, 180_000);

describe('landing page', () => {
  it('shows the exact hero question', () => {
    expect(home).toContain(
      'How does the brain direct attention to different parts of an object, such as its left or right side?',
    );
  });

  it('links the hero button to the publication PDF in a new tab', () => {
    expect(home).toContain('/papers/Fiave_et_al_2026.pdf');
    expect(home).toMatch(/rel="noopener noreferrer"/);
  });

  it('shows the welcome heading and body', () => {
    expect(home).toContain('Welcome to the Attentive Brains &amp; Behaviors Lab');
    expect(home).toContain('devastating consequences that brain diseases');
  });

  it('renders all four research topics', () => {
    expect(home.match(/class="rcard"/g) ?? []).toHaveLength(4);
    expect(home).toContain('Virtual Reality');
    expect(home).toContain('single neuron activity');
  });

  it('renders the team block and the lab photo', () => {
    expect(home).toContain('Our Team');
    expect(home).toContain('/images/lab-team.webp');
    expect(home).toContain('Ilaria Sani');
  });

  it('embeds the video as a click-to-play facade, not an eager iframe', () => {
    expect(home).toContain('data-video-id="3j5pefRbTuE"');
    expect(home).not.toContain('<iframe');
  });

  it('shows the UNIGE footer contact details', () => {
    expect(home).toContain('/images/logo-unige.webp');
    expect(home).toContain('Campus Biotech, Chemin des Mines 9, 1202 Genève');
    expect(home).toContain('ilaria.sani@unige.ch');
    expect(home).toContain('+41223790383');
  });

  it('has exactly one h1', () => {
    expect(home.match(/<h1[\s>]/g) ?? []).toHaveLength(1);
  });

  it('gives every image alt, width and height', () => {
    for (const tag of home.match(/<img[^>]*>/g) ?? []) {
      expect(tag, tag).toMatch(/\salt=/);
      expect(tag, tag).toMatch(/\swidth=/);
      expect(tag, tag).toMatch(/\sheight=/);
    }
  });
});

describe('navigation', () => {
  it('links all six destinations and they all build', () => {
    for (const href of ['/research', '/lab-members', '/publications', '/news', '/collaborations', '/contact']) {
      expect(home, `nav missing ${href}`).toContain(`href="${href}"`);
      expect(existsSync(`dist${href}/index.html`), `page missing ${href}`).toBe(true);
    }
  });
});
```

- [ ] **Step 2: Run** — `npm test` → PASS.

- [ ] **Step 3: Commit**

```bash
git add tests/build.test.ts
git commit -m "test: verify landing page content, assets and nav routes"
```

---

### Task 14: Visual verification — the agent does this, not the user

- [ ] **Step 1: Start the dev server in the background**

```bash
npm run dev
```

- [ ] **Step 2: Open it and look at it**

Use the browser tool to load `http://localhost:4321` and screenshot at **1280×800**, **768×1024** and **375×812**.

- [ ] **Step 3: Check against this list and fix what fails**

- Logo legible top-left; six nav links top-right; nav gains a shadow after scrolling
- Hero question readable and not cramped; figure not distorted; button obviously clickable
- Welcome paragraph a comfortable measure, not edge-to-edge
- Four research cards on one row at 1280, two at 768, one at 375
- Lab photo not stretched (source is portrait, 1013×1381)
- Video poster loads; the play button is centred
- Footer: UNIGE logo readable on the dark background
- Nothing overflows horizontally at 375px
- Scroll reveal fires once, does not flicker, and content is never left invisible

- [ ] **Step 4: Re-screenshot after each fix and confirm.**

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "fix: visual corrections from browser verification"
```

---

## Definition of done

- `npm test` passes; `npm run build` clean.
- Landing page shows, in order: split hero → welcome → four research cards → team → video → footer.
- Every nav link resolves to a real page.
- No horizontal scrollbar at 375 px.
- Hero PDF button opens `Fiave_et_al_2026.pdf` in a new tab.
- Video loads no YouTube code until clicked.
- Verified by screenshot at three widths by the agent, not the user.

## Not in this plan

Real Research / Lab members / Publications / News / Collaborations / Contact pages; `.pages.yml` CMS config; GitHub push; Cloudflare deploy; ORCID sync.

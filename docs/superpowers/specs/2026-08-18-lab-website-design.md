# Lab Website Rebuild — Design Spec

**Date:** 2026-08-18
**Status:** Design agreed in principle. Visual-identity decisions still open (see §11).
**Owner:** Thibaud Delavy (PhD student)
**Editor after handover:** The PI (non-technical)

---

## 1. Goal

Replace the lab's existing website (`theattentivebrain.com`) with a modern, well-designed
static site that:

1. Looks and reads like a serious contemporary research-lab site.
2. Can be updated by a **non-technical supervisor** — new publications, new lab members,
   news items — through a **graphical web form**, never by touching code or Git.
3. Costs **£0/year** in perpetuity, excluding the domain the lab already owns.
   No trial tiers, no feature paywalls, no vendor that can start charging later.
4. Is owned by the *lab*, not by any individual, so it survives staff turnover.

---

## 2. Background — verified facts

These were checked directly, not assumed. A new agent should not re-litigate them.

### 2.1 The reference site: `https://preston.clm.utexas.edu/`

The user wants a landing page of this kind. Verified by fetching the HTML:

- **Built with Webflow.** Assets served from `cdn.prod.website-files.com`,
  stylesheet `preston-lab.webflow.shared.b0369c067.css`.
- Uses **GSAP 3.12.7** for hero animation and **Finsweet Attributes v2** for list filtering.
- Footer credits **MPC Studios, Inc.** — a paid design agency.
- Publications and News are Webflow **CMS collections**.

**Implication:** "build it the same way" is not available on a free budget. Webflow's free
tier is limited to 2 static pages, a `.webflow.io` subdomain, no custom domain, and
**no CMS collections**. The design itself was paid agency work on top of that.

Verified heading outline of the landing page, in document order:

```
nav                      Research · People · Publications · News · BrainWave · Participate
h1 (hero slide 1)        "What happens in the moment the brain decides to form a new
                          concept rather than update an existing one?"
h1 (hero slide 2)        "How do age and real-world independence shape how children
                          remember when events occurred?"
h1 (hero slide 3)        "How does remembering when events occurred become more flexible
                          with age?"
h2                       "The Preston Lab is a team of research scientists, postdoctoral
                          fellows, and students at The University of Texas…"
section.section_2-column-grid          h3  "Our Research"
section.section_2-column-grid          h3  "Kids, Teens & Parents"
section.section_blog34 gradient-bg     h2  "Latest Publications"
section.section_blog35                 h2  "News & Events"  (3 dated cards)
section.section_cta27 gradient-bg      h2  "Participate"
footer.footer2_component
```

The signature device is the **hero: a rotating full-bleed image slider where each slide's
headline is a research *question*,** credited to the paper it comes from. This is the single
most important element to reproduce.

### 2.2 The current site: `https://www.theattentivebrain.com/`

- Served by `openresty` with an `X-Webcom-Cache-Status` header → a **Web.com / Network
  Solutions proprietary site builder**.
- The HTML is an empty JavaScript shell. The only static text in the document is
  `<h4>Sani's Lab</h4>`. All content is client-rendered from a JS payload.
- **Content could not be extracted.** Direct fetch returns HTTP 403 to non-browser agents;
  headless browser navigation was denied in this environment. Existing content must be
  supplied by the user or re-entered through the new CMS.
- The domain is presumably registered through Network Solutions / Web.com.

### 2.3 Local machine state (verified 2026-08-18)

```
node        v23.6.0          ✅ installed
npm         11.5.2           ✅ installed
brew        /opt/homebrew    ✅ installed
git         2.50.1           ✅ installed
gh (CLI)    NOT INSTALLED    ❌
GitHub auth NONE             ❌  no token, no credential helper entries
ssh key     ~/.ssh/id_ed25519.pub, comment "kingsline-runpod"
            → `ssh -T git@github.com` returns "Permission denied (publickey)"
git config  user.name=tdelavy  user.email=thibaud.delavy@hotmail.ch
```

**The agent has no GitHub access of any kind.** The `tdelavy` name in git config is only a
commit label, not a credential. GitHub access must be established by the user before
Phase 4 (see §9).

---

## 3. Constraints

| # | Constraint | Consequence |
|---|---|---|
| C1 | Zero recurring cost, permanently | Rules out Webflow, Squarespace, paid WordPress hosting, CloudCannon |
| C2 | Non-technical editor | A GUI is mandatory. "Edit the Markdown on GitHub" is not acceptable as the primary workflow |
| C3 | Full design control | Rules out locked-down templates and free builder tiers |
| C4 | Must outlive the PhD student | All accounts owned by a shared lab identity, not a personal one |
| C5 | Must not break the live site during development | Deploy to a temporary URL first; repoint DNS only on final approval |

---

## 4. Chosen architecture

**Static site generator + Git-based CMS + free static hosting.**

Content lives as Markdown/YAML files inside the repository. The editor never sees them —
a hosted CMS renders those files as labelled web forms, writes changes back as Git commits,
and the host rebuilds automatically.

| Layer | Choice | Why | Cost |
|---|---|---|---|
| Generator | **Astro** | Outputs plain static HTML, ships zero JS by default, has typed content collections that fail the build on malformed content | free |
| Content | Markdown + YAML in-repo | No database, no backups needed, full version history for free | free |
| Editing GUI | **Pages CMS** (`app.pagescms.org`) | MIT-licensed, fully hosted — nothing to deploy or self-host, no OAuth server to run. Log in with the lab GitHub account | free |
| Hosting | **Cloudflare Pages** | Unlimited bandwidth, free SSL, free custom domains, auto-deploy on push | free |
| Repo / auth | GitHub account **`attentivelab`** | Single lab-owned identity for repo + CMS login | free |
| Pub sync (opt) | GitHub Actions → ORCID / PubMed | Unlimited free minutes on public repos | free |

### 4.1 Rejected alternatives

- **Webflow** — matches the reference exactly, but CMS + custom domain are paid. Violates C1.
- **Wix / Squarespace / WordPress.com free tiers** — ads, vendor branding, no custom domain,
  template-constrained. Violates C1 and C3. This is what the lab already has and dislikes.
- **al-folio / Hugo Blox academic templates** — free and quick, but reaching the reference
  design means fighting the theme; equal effort to building clean, worse result. Violates C3
  in practice.
- **Decap CMS + DecapBridge** — a valid fallback giving **email/password login** instead of
  GitHub login. Not needed: the shared `attentivelab` GitHub account solves the login problem.
  Keep in reserve if the PI refuses to use a GitHub login at all.
- **Netlify + Git Gateway** — the classic Decap setup, but **Git Gateway is deprecated as of
  2026**. Do not build on it.
- **GitHub Organization** — considered for continuity, dropped as redundant: the shared
  `attentivelab` account already achieves lab ownership with less complexity.

### 4.2 Accepted trade-off

The lab shares one GitHub login rather than having per-person accounts. This means no audit
trail of who changed what and a shared password. Accepted deliberately: for a two-person
editing setup the simplicity is worth more than the attribution.

---

## 5. Repository layout

Root: `/Users/thib/Desktop/lab_website`

```
lab_website/
├── astro.config.mjs
├── package.json
├── .pages.yml                  ← CMS form definitions (the editor's entire UI)
├── docs/superpowers/specs/     ← this document
├── public/
│   ├── images/                 ← CMS media uploads land here
│   └── pdfs/                   ← publication PDFs
└── src/
    ├── layouts/
    │   └── Base.astro
    ├── components/
    │   ├── Nav.astro
    │   ├── Hero.astro          ← rotating research-question slider
    │   ├── SplitBlock.astro    ← reusable two-column text/image block
    │   ├── PublicationList.astro
    │   ├── NewsCard.astro
    │   ├── PersonCard.astro
    │   ├── CtaBanner.astro
    │   └── Footer.astro
    ├── content/
    │   ├── config.ts           ← Zod schemas; build fails on invalid content
    │   ├── hero/               ← one file per rotating hero slide
    │   ├── people/             ← one file per lab member
    │   ├── publications/       ← one file per paper
    │   ├── news/               ← one file per news item
    │   └── pages/              ← editable body copy for static pages
    └── pages/
        ├── index.astro
        ├── research.astro
        ├── people.astro
        ├── publications.astro
        ├── news.astro
        └── participate.astro
```

---

## 6. Content model

These schemas define **exactly what the editor sees as form fields**. Astro validates against
them at build time; `.pages.yml` mirrors them to generate the UI.

### 6.1 `hero` — rotating landing-page slides

| Field | Type | Required | Notes |
|---|---|---|---|
| `question` | string | yes | The research question. Displayed as `<h1>`. Aim for 10–20 words |
| `image` | image | yes | Full-bleed background, landscape, ≥1920px wide |
| `credit` | string | no | e.g. "Mack, Love & Preston, PNAS" |
| `link` | string | no | URL to the paper or a project page |
| `order` | number | yes | Slide sequence |

### 6.2 `people`

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string | yes | |
| `role` | select | yes | PI / Postdoc / PhD Student / Research Assistant / Alumni |
| `photo` | image | no | Square, ≥600px. A neutral placeholder is used if absent |
| `bio` | markdown | no | 1–3 short paragraphs |
| `email` | string | no | |
| `links` | list of `{label, url}` | no | Scholar, ORCID, Bluesky, personal site |
| `order` | number | yes | Within their role group |
| `alumni` | boolean | yes | If true, moves to the Alumni section |

### 6.3 `publications`

| Field | Type | Required | Notes |
|---|---|---|---|
| `title` | string | yes | |
| `authors` | string | yes | Full author list as it should display |
| `year` | number | yes | Drives sorting and grouping |
| `journal` | string | yes | |
| `doi` | string | no | Rendered as a link |
| `pdf` | file | no | Upload; stored under `public/pdfs/` |
| `image` | image | no | Thumbnail for the homepage list |
| `featured` | boolean | yes | If true, eligible for the homepage "Latest Publications" block |

### 6.4 `news`

| Field | Type | Required | Notes |
|---|---|---|---|
| `title` | string | yes | |
| `date` | date | yes | Drives sorting |
| `image` | image | no | Card thumbnail |
| `body` | markdown | yes | |
| `link` | string | no | External coverage, press release, etc. |

### 6.5 `pages` — editable static copy

Body text for the homepage intro, Research page, and Participate page is stored as content
rather than hard-coded, so the PI can reword it without a developer.

---

## 7. Landing page specification

Section order, mirroring the reference architecture:

1. **Sticky nav** — Research · People · Publications · News · Participate.
   Optional social icons. Collapses to a hamburger below 768px.
2. **Hero** — full-bleed rotating slider driven by the `hero` collection. Each slide shows a
   research question as `<h1>` over a darkened image, with the paper credit beneath.
   Auto-advances; manual dots/arrows; pauses on hover.
   **Accessibility: must respect `prefers-reduced-motion` and stop auto-advancing.**
3. **Mission statement** — one large-type paragraph introducing the lab.
4. **"Our Research"** — two-column text + image, linking to the Research page.
5. **Recruitment block** — two-column, image/text order reversed from §4, aimed at
   participants. Equivalent to Preston's "Kids, Teens & Parents".
6. **Latest Publications** — tinted/gradient background; the 4 most recent `featured`
   publications with PDF/DOI links; "See all" → Publications page.
7. **News & Events** — 3 most recent news cards (thumbnail, date, title).
8. **Participate** — full-width CTA banner on a strong background.
9. **Footer** — contact details, institutional affiliations, socials, copyright.

### 7.1 Non-negotiables

- Fully responsive; verified at 375px, 768px and 1280px.
- Landing page ships **no JavaScript beyond the hero slider**.
- All images use Astro's image optimisation with explicit `width`/`height` to prevent layout shift.
- Semantic headings, alt text on every image, keyboard-navigable slider.

### 7.2 Originality boundary — important

Reproduce the reference's **structure and interaction patterns** (sticky nav, question-hero,
alternating two-column blocks, gradient CTA). These are generic layout conventions.

Do **not** copy its visual identity — palette, type choices, photographic treatment, or any
asset. Those are the paid output of a design studio. Same skeleton, different skin.

---

## 8. Update workflow after handover

**Routine editing (the PI, no code):**
1. Go to `app.pagescms.org`, log in with the `attentivelab` GitHub account.
2. Pick a collection — Publications, People, News, Hero.
3. Fill in the form; drag and drop images or a PDF.
4. Save. Pages CMS commits to the repo; Cloudflare Pages rebuilds; live in ~30 seconds.

**Optional automation (Phase 5):** a scheduled GitHub Action queries the PI's **ORCID** record
(and/or PubMed) monthly for new papers and adds them to `src/content/publications/`.
ORCID, PubMed and Crossref all offer free public APIs.

> **Do not attempt to scrape Google Scholar.** It has no official API, scraping breaches its
> terms, and the IP gets blocked. Use ORCID/PubMed/Crossref only.

---

## 9. Deployment plan

Ordered, with the safety property that the live site is never at risk until the final step.

1. **Build and iterate entirely locally** (`npm run dev` → `localhost:4321`). No accounts needed.
2. User installs and authenticates the GitHub CLI **themselves** (the agent must never handle
   credentials):
   ```
   brew install gh
   gh auth login --web --scopes repo,workflow
   ```
   Must be authenticated as **`attentivelab`**, not `tdelavy` — verify the logged-in browser
   account first. `gh auth switch` toggles between accounts later.
3. Create a **public** repo under `attentivelab` and push. Public is required for unlimited
   free GitHub Actions minutes, and the site's content is public anyway.
4. Connect Cloudflare Pages to the repo. Build command `npm run build`, output directory `dist`.
5. Install the Pages CMS GitHub App on the repo; verify `.pages.yml` renders the expected forms.
6. **Review on the temporary `*.pages.dev` URL.** The existing site remains live and untouched.
7. Only on final approval: repoint `theattentivebrain.com` DNS to Cloudflare Pages.

### 9.1 Account ownership

Register **every** account — GitHub, Cloudflare, and ideally the domain registrar — against the
shared lab Gmail, never a personal address. Otherwise the hosting stays tied to the PhD student
even after the repo is handed over.

### 9.2 Known transfer hazards

If a repo is ever moved between accounts, these do **not** survive and must be recreated:
GitHub Actions **secrets**, the **Cloudflare Pages ↔ GitHub App connection**, and the
**Cloudflare account** itself (entirely separate from GitHub). Building under `attentivelab`
from the start avoids all three.

---

## 10. Phases

| Phase | Deliverable | Needs GitHub? |
|---|---|---|
| 1 | Astro project + landing page, reviewed locally | no |
| 2 | Research, People, Publications, News, Participate pages | no |
| 3 | `.pages.yml` CMS config; PI test-drives the forms | yes |
| 4 | Deploy to Cloudflare Pages; DNS cutover | yes |
| 5 | *(optional)* ORCID/PubMed publication sync Action | yes |

---

## 11. Open decisions — MUST be resolved before Phase 1 styling

The architecture above is settled. The following are **not**, and a new agent must ask rather
than assume:

1. **Visual direction.** Which of these does the user want?
   (a) the reference's *structure* only, with an independent look;
   (b) close to the reference's calm restrained academic aesthetic;
   (c) something with more personality than either.
2. **Existing brand constraints.** University brand colours, an existing logo, a colour the PI
   prefers — or a blank slate?
3. **Real content.** Lab name, PI name, research themes, current members, publication list.
   None of this could be recovered from the existing site (§2.2); it must come from the user.
4. **Site structure.** Are the six sections above right, or does this lab need different ones?
   (The reference's "BrainWave" is a study-specific page — the equivalent here is unknown.)
5. **Publication auto-sync.** Wanted? If so, the PI's ORCID iD is required.
6. **Photography.** Does the lab have usable photos? The design leans heavily on full-bleed
   imagery, and its quality depends on them.

---

## 12. Non-goals

- No blog or comment system.
- No user accounts, login, or gated content on the public site.
- No analytics in the first release.
- No internal/intranet area.
- No redesign of any other lab asset.

---

## 13. Definition of done (Phase 1)

- `npm run dev` serves the landing page with no console errors.
- All nine sections render with placeholder content.
- Layout verified at 375px / 768px / 1280px.
- Hero rotates, is keyboard-navigable, and halts under `prefers-reduced-motion`.
- Deliberately invalid content causes a **build failure with a readable message**, not a
  silently broken page.
- The user has looked at it in a browser and approved the design direction.

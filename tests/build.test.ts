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
    expect(home).toContain('/pdfs/Fiave_et_al_2026.pdf');
    expect(home).toMatch(/rel="noopener noreferrer"/);
  });

  it('shows the welcome heading and body', () => {
    expect(home).toContain('Welcome to the Attentive Brains &amp; Behaviors Lab');
    expect(home).toContain('devastating consequences of brain diseases');
  });

  it('renders all four research area cards with images', () => {
    expect(home.match(/class="rcard"/g) ?? []).toHaveLength(4);
    expect(home).toContain('Brain Injury &amp; Attention');
    expect(home).toContain('Brain Networks of Attention');
    expect(home).toContain('Attention in Everyday Life');
    expect(home).toContain('Neuronal Mechanisms of Attention');
    for (const img of ['research-injury', 'research-networks', 'research-everyday', 'research-neurons']) {
      expect(home).toContain(`/images/${img}.webp`);
    }
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
    expect(home).toContain('Campus Biotech, Chemin des Mines 9, 1202 Gen');
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

describe('lab members page', () => {
  it('features the PI and groups members by role', () => {
    const page = readFileSync('dist/lab-members/index.html', 'utf8');
    expect(page).toContain('Ilaria Sani');
    expect(page).toContain('Postdoctoral Researchers');
    expect(page).toContain('PhD Students');
    expect(page).toContain('Master&#39;s Students');
    for (const name of ['Prosper Fiave', 'Krystina Wieczerzak', 'Simona Vaitekunaite', 'Thibaud Delavy', 'Tristan Nukman', 'Carling Massel']) {
      expect(page, `missing member: ${name}`).toContain(name);
    }
    expect(page.match(/class="person"/g) ?? []).toHaveLength(7);
    expect(page).not.toContain('Alumni');
  });
});

describe('publications page', () => {
  it('shows the featured publication and all ten entries', () => {
    const page = readFileSync('dist/publications/index.html', 'utf8');
    expect(page).toContain('Featured publication');
    expect(page).toContain('A ventro-temporal area supporting human allocentric representations');
    expect(page).toContain('/images/featured-publication.webp');
    expect(page.match(/class="entry"/g) ?? []).toHaveLength(10);
    expect((page.match(/View publication/g) ?? []).length).toBeGreaterThanOrEqual(11);
    expect(page).not.toMatch(/>PDF</);
    for (const pdf of ['Fiave_et_al_2026', 'Song_et_al_2025pdf', 'Sani_et_al_2021', 'Sani_et_al_2013']) {
      expect(page, `missing pdf link: ${pdf}`).toContain(`/pdfs/${pdf}.pdf`);
    }
  });
});

describe('participate page', () => {
  it('shows hero, three studies with criteria, and the contact form', () => {
    const page = readFileSync('dist/participate/index.html', 'utf8');
    expect(page).toContain('Help us understand');
    expect(page.match(/class="study"/g) ?? []).toHaveLength(3);
    expect(page).toContain('Attention and object perception');
    expect(page).toContain('Causal role of brain regions in attention');
    expect(page).toContain('Virtual Reality');
    expect((page.match(/Are you eligible\?/g) ?? [])).toHaveLength(3);
    expect((page.match(/No metallic implant/g) ?? [])).toHaveLength(3);
    expect((page.match(/href="#contact-form"/g) ?? [])).toHaveLength(3);
    expect(page).toContain('id="contact-form"');
    expect(page).toContain('name="email"');
    expect(page).toContain('name="age"');
    expect(page).toContain('name="study"');
    expect(page).not.toContain('Learn more');
  });
});

describe('research page', () => {
  it('shows four alternating topic rows without explore links', () => {
    const page = readFileSync('dist/research/index.html', 'utf8');
    expect(page).toContain('How does the brain pay attention?');
    expect(page.match(/class="rrow"/g) ?? []).toHaveLength(4);
    expect(page).toContain('01 &middot; Brain Injury &amp; Attention');
    expect(page).toContain('What happens when we lose the ability to pay attention to part of the world?');
    expect(page).toContain('How do individual neurons create attention?');
    for (const img of ['research-page-injury', 'research-page-networks', 'research-page-everyday', 'research-page-neurons']) {
      expect(page).toContain(`/images/${img}.webp`);
    }
    expect(page).not.toContain('Explore this research');
    expect(page).not.toContain('coming soon');
  });
});

describe('navigation', () => {
  it('links all six destinations and they all build', () => {
    for (const href of ['/research', '/lab-members', '/publications', '/news', '/collaborations', '/participate']) {
      expect(home, `nav missing ${href}`).toContain(`href="${href}"`);
      expect(existsSync(`dist${href}/index.html`), `page missing ${href}`).toBe(true);
    }
  });
});

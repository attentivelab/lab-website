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

describe('navigation', () => {
  it('links all six destinations and they all build', () => {
    for (const href of ['/research', '/lab-members', '/publications', '/news', '/collaborations', '/contact']) {
      expect(home, `nav missing ${href}`).toContain(`href="${href}"`);
      expect(existsSync(`dist${href}/index.html`), `page missing ${href}`).toBe(true);
    }
  });
});

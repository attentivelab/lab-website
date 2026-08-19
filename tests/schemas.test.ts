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
  it('accepts a research area with title, body and image', () => {
    const r = researchSchema.safeParse({
      title: 'Brain Injury & Attention',
      blurb: 'How brain damage leads to deficits in attention.',
      image: '/images/research-injury.webp',
      order: 1,
    });
    expect(r.success).toBe(true);
  });

  it('rejects a research area without an image', () => {
    const r = researchSchema.safeParse({ title: 'X', blurb: 'Y', order: 1 });
    expect(r.success).toBe(false);
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
      welcomeHeadline: 'A headline',
      welcomeBody: ['One.'],
      researchTitle: 'Research',
      teamTitle: 'Our Team',
      teamBody: ['Two.'],
      teamImage: '/images/lab-team.webp',
      videoTitle: 'Our lab',
      videoId: '3j5pefRbTuE',
      participateTitle: 'Take part in our studies',
      participateBody: 'Help us understand how attention works.',
    });
    expect(ok.success).toBe(true);
    expect(homeSchema.safeParse({ welcomeTitle: 'Welcome' }).success).toBe(false);
  });
});

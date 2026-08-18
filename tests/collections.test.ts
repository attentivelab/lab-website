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

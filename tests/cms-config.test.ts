import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { parse } from 'yaml';
import {
  heroSchema, researchSchema, personSchema, publicationSchema,
  newsSchema, homeSchema, studySchema, collaboratorSchema,
} from '../src/lib/schemas';

const config = parse(readFileSync('.pages.yml', 'utf8'));

// CMS collection name -> its Zod schema
const SCHEMAS: Record<string, { shape: Record<string, unknown> }> = {
  publications: publicationSchema,
  hero: heroSchema,
  people: personSchema,
  research: researchSchema,
  studies: studySchema,
  collaborators: collaboratorSchema,
  news: newsSchema,
  home: homeSchema,
};

// Fields the CMS may expose that are not frontmatter (markdown body)
const NON_FRONTMATTER = new Set(['body']);

describe('.pages.yml', () => {
  it('parses and declares both media folders', () => {
    const media = config.media.map((m: { name: string }) => m.name);
    expect(media).toEqual(['images', 'pdfs']);
  });

  it('covers every content collection', () => {
    const names = config.content.map((c: { name: string }) => c.name);
    expect(names.sort()).toEqual(Object.keys(SCHEMAS).sort());
  });

  for (const entry of config.content) {
    describe(`collection: ${entry.name}`, () => {
      const schema = SCHEMAS[entry.name];
      const schemaKeys = new Set(Object.keys(schema.shape));
      const isMarkdown = entry.type === 'collection' && entry.name !== 'home';

      it('exposes only fields that exist in the schema', () => {
        for (const field of entry.fields) {
          if (isMarkdown && NON_FRONTMATTER.has(field.name)) continue;
          expect(schemaKeys.has(field.name), `unknown field "${field.name}" in ${entry.name}`).toBe(true);
        }
      });

      it('exposes every schema field so nothing is uneditable', () => {
        const cmsFields = new Set(entry.fields.map((f: { name: string }) => f.name));
        for (const key of schemaKeys) {
          expect(cmsFields.has(key), `schema field "${key}" missing from CMS form ${entry.name}`).toBe(true);
        }
      });

      it('list view only references real fields', () => {
        for (const key of entry.view?.fields ?? []) {
          expect(schemaKeys.has(key), `view field "${key}" not in schema for ${entry.name}`).toBe(true);
        }
      });
    });
  }
});

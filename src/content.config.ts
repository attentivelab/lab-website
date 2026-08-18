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

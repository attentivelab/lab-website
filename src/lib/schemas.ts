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
  authors: z.string().optional(),
  buttonLabel: z.string().optional(),
  buttonHref: z.string().optional(),
  order: z.number(),
});

export const researchSchema = z.object({
  title: z.string().min(1),
  blurb: z.string().min(1),
  image: z.string().min(1),
  order: z.number(),
  // Research page (full-width alternating rows)
  label: z.string().optional(),
  question: z.string().optional(),
  detail: z.string().optional(),
  pageImage: z.string().optional(),
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
  tags: z.array(z.string()).default([]),
  featured: z.boolean().default(false),
});

export const newsSchema = z.object({
  title: z.string().min(1),
  date: z.coerce.date(),
  image: z.string().optional(),
  body: z.string().min(1),
  link: z.string().optional(),
});

export const collaboratorSchema = z.object({
  name: z.string().min(1),
  affiliation: z.string().min(1),
  photo: z.string().min(1),
  link: z.string().optional(),
  order: z.number(),
});

export type Collaborator = z.infer<typeof collaboratorSchema>;

export const studySchema = z.object({
  title: z.string().min(1),
  tag: z.string().min(1),
  description: z.string().min(1),
  image: z.string().min(1),
  age: z.string().min(1),
  duration: z.string().min(1),
  location: z.string().min(1),
  compensated: z.boolean().default(true),
  order: z.number(),
});

export type Study = z.infer<typeof studySchema>;

export const homeSchema = z.object({
  welcomeTitle: z.string().min(1),
  welcomeHeadline: z.string().min(1),
  welcomeBody: z.array(z.string()).min(1),
  researchTitle: z.string().min(1),
  researchCta: z.string().default('Explore our research'),
  teamTitle: z.string().min(1),
  teamBody: z.array(z.string()).min(1),
  teamImage: z.string().min(1),
  teamCta: z.string().default('Meet the lab'),
  videoTitle: z.string().min(1),
  videoId: z.string().min(1),
  participateTitle: z.string().min(1),
  participateBody: z.string().min(1),
  participateCta: z.string().default('Take part in a study'),
});

export type HeroSlide = z.infer<typeof heroSchema>;
export type ResearchTopic = z.infer<typeof researchSchema>;
export type Person = z.infer<typeof personSchema>;
export type Publication = z.infer<typeof publicationSchema>;
export type NewsItem = z.infer<typeof newsSchema>;
export type HomeCopy = z.infer<typeof homeSchema>;

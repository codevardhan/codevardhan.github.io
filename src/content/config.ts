import { defineCollection, z } from 'astro:content';

const posts = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    image: z.string().optional(),
    author: z.string().optional(),
    tags: z.array(z.string()).optional(),
    usemathjax: z.boolean().optional(),
    draft: z.boolean().optional(),
  }),
});

const projects = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    image: z.string().optional(),
    author: z.string().optional(),
    tags: z.array(z.string()).optional(),
    usemathjax: z.boolean().optional(),
  }),
});

export const collections = { posts, projects };

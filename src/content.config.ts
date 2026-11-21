import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// frontmatter は blogsync の出力形式（Title / Category / Date / URL / EditURL）に合わせている
const entries = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './content/entry' }),
  schema: z.object({
    Title: z.string(),
    Category: z.array(z.string()).default([]),
    Date: z.coerce.date(),
    URL: z.string().url(),
    EditURL: z.string().url().optional(),
    Draft: z.boolean().optional(),
  }),
});

export const collections = { entries };

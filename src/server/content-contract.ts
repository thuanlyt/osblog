import { z } from 'zod'

export const postStatusSchema = z.enum(['draft', 'published', 'archived'])

const postFields = {
  categoryId: z.string().uuid(),
  slug: z.string().trim().min(1).max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  titleVi: z.string().trim().min(1).max(240),
  titleEn: z.string().trim().min(1).max(240),
  excerptVi: z.string().trim().min(1).max(1000),
  excerptEn: z.string().trim().min(1).max(1000),
  bodyVi: z.string().trim().min(1),
  bodyEn: z.string().trim().min(1),
  coverImageUrl: z.string().url().max(2000).nullable().optional(),
  coverImageAltVi: z.string().trim().max(240).nullable().optional(),
  coverImageAltEn: z.string().trim().max(240).nullable().optional(),
  status: postStatusSchema.default('draft'),
  publishedAt: z.string().datetime({ offset: true }).nullable().optional(),
  seoTitleVi: z.string().trim().max(240).nullable().optional(),
  seoTitleEn: z.string().trim().max(240).nullable().optional(),
  seoDescriptionVi: z.string().trim().max(320).nullable().optional(),
  seoDescriptionEn: z.string().trim().max(320).nullable().optional(),
}

const postFieldsSchema = z.object(postFields)

export const createPostInput = postFieldsSchema.superRefine((value, context) => {
  if (value.status === 'published' && !value.publishedAt) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['publishedAt'], message: 'Published posts require publishedAt' })
  }
})

export const updatePostInput = postFieldsSchema.partial()
  .extend({ expectedUpdatedAt: z.string().datetime({ offset: true }) })
  .refine((value) => Object.keys(value).some((key) => key !== 'expectedUpdatedAt' && value[key as keyof typeof value] !== undefined), {
    message: 'At least one post field must be updated',
  })
  .superRefine((value, context) => {
    if (value.status === 'published' && !value.publishedAt) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ['publishedAt'], message: 'Published posts require publishedAt' })
    }
  })

export const deletePostInput = z.object({
  expectedUpdatedAt: z.string().datetime({ offset: true }),
})

export const listPostsQuery = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
})

export type CreatePostInput = z.infer<typeof createPostInput>
export type UpdatePostInput = z.infer<typeof updatePostInput>

export function toPostDate(value: string | null | undefined): Date | null {
  return value ? new Date(value) : null
}

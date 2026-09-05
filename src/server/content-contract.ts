import { z } from 'zod'

export const postStatusSchema = z.enum(['draft', 'published', 'archived'])

const postFields = {
  categoryId: z.string().uuid(),
  slug: z.string().trim().min(1).max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  titleVi: z.string().trim().min(1).max(240),
  titleEn: z.string().trim().min(1).max(240),
  excerptVi: z.string().trim().min(1).max(1000),
  excerptEn: z.string().trim().min(1).max(1000),
  bodyVi: z.string().trim().min(1).max(100000),
  bodyEn: z.string().trim().min(1).max(100000),
  coverImageUrl: z.string().max(2000).refine((value) => {
    if (/^\/assets\/[a-zA-Z0-9._/-]+$/.test(value)) return true
    if (!/^https?:\/\//i.test(value)) return false
    try { return Boolean(new URL(value).hostname) } catch { return false }
  }, 'Use a parseable HTTP(S) image URL or /assets/ path').nullable().optional(),
  coverImageAltVi: z.string().trim().max(240).nullable().optional(),
  coverImageAltEn: z.string().trim().max(240).nullable().optional(),
  status: postStatusSchema,
  publishedAt: z.string().datetime({ offset: true }).nullable().optional(),
  seoTitleVi: z.string().trim().max(240).nullable().optional(),
  seoTitleEn: z.string().trim().max(240).nullable().optional(),
  seoDescriptionVi: z.string().trim().max(320).nullable().optional(),
  seoDescriptionEn: z.string().trim().max(320).nullable().optional(),
}

const postFieldsSchema = z.object(postFields)

export const createPostInput = postFieldsSchema.extend({ status: postStatusSchema.default('draft') }).superRefine((value, context) => {
  if (value.coverImageUrl && (!value.coverImageAltVi?.trim() || !value.coverImageAltEn?.trim())) context.addIssue({ code: 'custom', path: ['coverImageAltEn'], message: 'Image alt text is required in both languages' })
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
  page: z.coerce.number().int().min(1).max(10000).default(1),
  q: z.string().trim().max(200).default(''),
  category: z.string().max(160).default(''),
  year: z.string().regex(/^$|^\d{4}$/).default(''),
  sort: z.enum(['latest', 'popular', 'random']).default('latest'),
})

export const categoryInput = z.object({
  slug: z.string().trim().min(1).max(160).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  nameVi: z.string().trim().min(1).max(160),
  nameEn: z.string().trim().min(1).max(160),
  descriptionVi: z.string().trim().max(2000).nullable().optional(),
  descriptionEn: z.string().trim().max(2000).nullable().optional(),
  isArchived: z.boolean().default(false),
})
export const categoryUpdateInput = categoryInput.extend({ expectedUpdatedAt: z.string().datetime({ offset: true }) })

export type CreatePostInput = z.infer<typeof createPostInput>
export type UpdatePostInput = z.infer<typeof updatePostInput>

export function toPostDate(value: string | null | undefined): Date | null {
  return value ? new Date(value) : null
}

import { z } from 'zod'

export const commentSubmissionInput = z.object({
  postId: z.string().uuid(),
  email: z.string().trim().email().max(320),
  body: z.string().trim().min(1).max(5000),
  formToken: z.string().min(1).max(500),
  honeypot: z.string().max(200).optional().default(''),
})

export const moderationInput = z.object({
  status: z.enum(['approved', 'rejected', 'spam']),
  reason: z.string().trim().max(500).nullable().optional(),
})

export type CommentSubmissionInput = z.infer<typeof commentSubmissionInput>
export type ModerationInput = z.infer<typeof moderationInput>

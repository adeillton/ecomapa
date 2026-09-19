import { z } from 'zod'

export const dateSchema = z.iso.date()
export const pointSourceSchema = z.object({
  id: z.string().min(1), name: z.string().min(2), url: z.url({ protocol: /^https?$/ }),
  kind: z.enum(['official_business', 'reverse_logistics_operator', 'government', 'manual_confirmation']),
  checkedAt: dateSchema,
})
export type PointSource = z.infer<typeof pointSourceSchema>
export type SourceKind = PointSource['kind']
export type VerificationStatus = 'verified' | 'needs_review' | 'temporarily_unavailable'

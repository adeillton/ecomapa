import { z } from 'zod'
import { wasteTypeIds } from './waste-type.ts'
import { dateSchema, pointSourceSchema, type PointSource } from './verification.ts'
import { disposalObjectIds } from './disposal-object.ts'

export const coordinatesSchema = z.object({
  latitude: z.number().min(-90).max(90), longitude: z.number().min(-180).max(180),
})
const addressSchema = z.object({
  street: z.string().min(2), number: z.string().optional(), district: z.string().optional(),
  city: z.string().min(2), state: z.literal('PE'), postalCode: z.string().optional(),
  formatted: z.string().min(5),
})

const attendanceSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('fixed_dropoff') }),
  z.object({
    type: z.literal('pickup_service'),
    serviceArea: z.object({ city: z.string().min(2), state: z.literal('PE'), description: z.string().min(5) }),
    actionUrl: z.url({ protocol: /^https?$/ }),
    channelInstructions: z.string().min(5),
  }),
  z.object({
    type: z.literal('temporary_campaign'),
    startsAt: dateSchema,
    endsAt: dateSchema,
  }),
])

const practicalInfoSchema = z.object({
  acceptedItemIds: z.array(z.enum(disposalObjectIds)).min(1).refine(items => new Set(items).size === items.length, 'Duplicate accepted item'),
  refusedItems: z.array(z.string().min(2)).min(1).optional(),
  sizeLimit: z.string().min(2).optional(),
  quantityLimit: z.string().min(2).optional(),
  accessInstructions: z.string().min(2).optional(),
  receivingHours: z.string().min(2).optional(),
  appointment: z.enum(['required', 'not_required']).optional(),
  cost: z.object({ kind: z.enum(['free', 'paid', 'conditional']), note: z.string().min(2).optional() }).optional(),
  officialContact: z.object({ phone: z.string().min(5).optional(), url: z.url({ protocol: /^https?$/ }).optional() }).refine(value => !!value.phone || !!value.url, 'Contact needs phone or URL').optional(),
  verificationMethod: z.enum(['official_online_registry', 'official_service_portal', 'documentary_cross_check', 'direct_confirmation']),
})

export const collectionPointSchema = z.object({
  id: z.string().min(1), slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/), name: z.string().min(2),
  address: addressSchema.optional(),
  coordinates: coordinatesSchema.optional(),
  attendance: attendanceSchema,
  accepts: z.array(z.enum(wasteTypeIds)).min(1).refine(items => new Set(items).size === items.length, 'Duplicate material'),
  practicalInfo: practicalInfoSchema,
  verification: z.object({
    status: z.enum(['verified', 'needs_review', 'temporarily_unavailable']),
    verifiedAt: dateSchema, sources: z.array(z.string().min(1)).min(1), notes: z.string().optional(),
  }),
  contact: z.object({ phone: z.string().optional(), website: z.url({ protocol: /^https?$/ }).optional() }).optional(),
  openingHoursNote: z.string().optional(),
  accessibility: z.object({ wheelchairAccess: z.union([z.boolean(), z.literal('unknown')]).optional() }).optional(),
}).superRefine((point, context) => {
  if (point.attendance.type !== 'pickup_service' && (!point.address || !point.coordinates)) {
    context.addIssue({ code: 'custom', message: 'Fixed points and campaigns need address and coordinates' })
  }
  if (point.attendance.type === 'pickup_service' && (point.address || point.coordinates)) {
    context.addIssue({ code: 'custom', message: 'Pickup services must not use an administrative address or artificial marker' })
  }
  if (point.attendance.type === 'temporary_campaign' && point.attendance.startsAt > point.attendance.endsAt) {
    context.addIssue({ code: 'custom', path: ['attendance', 'endsAt'], message: 'Campaign end must be on or after start' })
  }
})
export type CollectionPoint = z.infer<typeof collectionPointSchema>
export type AttendanceType = CollectionPoint['attendance']['type']
export type MappableCollectionPoint = CollectionPoint & { address: z.infer<typeof addressSchema>; coordinates: z.infer<typeof coordinatesSchema> }

export function isMappablePoint<T extends CollectionPoint>(point: T): point is T & MappableCollectionPoint {
  return !!point.address && !!point.coordinates
}

export function pointCity(point: CollectionPoint): string {
  return point.address?.city ?? (point.attendance.type === 'pickup_service' ? point.attendance.serviceArea.city : '')
}

export function validateDataset(points: CollectionPoint[], sources: PointSource[]) {
  const registry = z.array(pointSourceSchema).parse(sources)
  const parsed = z.array(collectionPointSchema).parse(points)
  for (const field of ['id', 'slug'] as const) {
    if (new Set(parsed.map(p => p[field])).size !== parsed.length) throw new Error(`Duplicate ${field}`)
  }
  if (new Set(registry.map(s => s.id)).size !== registry.length) throw new Error('Duplicate source')
  for (const point of parsed) {
    for (const id of point.verification.sources) {
      if (!registry.some(source => source.id === id)) throw new Error(`Unknown source: ${id}`)
    }
  }
  return parsed
}

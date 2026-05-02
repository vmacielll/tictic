import { z } from 'zod'

// Shared schemas reutilizáveis em todos os módulos

const emptyToUndefined = z.literal('').transform(() => undefined)

export const uuidSchema = z.string().uuid().optional().or(emptyToUndefined)

export const datetimeString = z.string().datetime().optional().or(emptyToUndefined)

export const dateIsoString = z.string().date().optional().or(emptyToUndefined)

export const timeString = z.string().regex(/^\d{2}:\d{2}$/).optional().or(emptyToUndefined)

export const timezoneSchema = z.string().min(1).optional().or(emptyToUndefined)

export const prioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH'])

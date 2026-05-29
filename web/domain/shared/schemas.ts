import { z } from 'zod'

// Shared schemas reutilizáveis em todos os módulos

const emptyToUndefined = z.literal('').transform(() => undefined)

export const uuidSchema = z.string().uuid().optional().or(emptyToUndefined)

// Date schemas that preserve type safety in transforms
export const datetimeString = z.string().datetime()

export const dateIsoString = z.string().date()

export const timeString = z.string().regex(/^\d{2}:\d{2}$/)

export const timezoneSchema = z.string().min(1)

export const prioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH'])

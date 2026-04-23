import { z } from 'zod'

// Shared schemas reutilizáveis em todos os módulos

export const uuidSchema = z.string().uuid()

export const datetimeString = z.string().datetime()

export const dateIsoString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)

export const timeString = z.string().regex(/^\d{2}:\d{2}$/)

export const prioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH'])

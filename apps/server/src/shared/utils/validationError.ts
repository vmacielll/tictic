import { FastifyReply } from 'fastify'
import { ZodError, type ZodIssue } from 'zod'

export interface ValidationErrorResponse {
  code: string
  message: string
  details: Record<string, string[]>
  statusCode: number
}

function formatZodIssues(issues: ZodIssue[]): Record<string, string[]> {
  const formatted: Record<string, string[]> = {}
  for (const issue of issues) {
    const path = issue.path.join('.') || 'root'
    if (!formatted[path]) {
      formatted[path] = []
    }
    formatted[path].push(issue.message)
  }
  return formatted
}

export function validationError(reply: FastifyReply, error: ZodError): FastifyReply {
  const details = formatZodIssues(error.issues)
  const response: ValidationErrorResponse = {
    code: 'VALIDATION_ERROR',
    message: 'Invalid request payload',
    details,
    statusCode: 400,
  }
  return reply.status(400).send(response)
}
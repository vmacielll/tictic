import { AppError } from '@shared/errors/AppError'

/**
 * Ensures the requesting user owns the entity.
 * Throws AppError with 403 FORBIDDEN if ownership check fails.
 */
export function ensureOwnership(
  entity: { userId: string },
  requestUserId: string,
  entityName: string = 'Resource',
): void {
  if (entity.userId !== requestUserId) {
    throw new AppError(
      `You do not have permission to access this ${entityName}`,
      403,
      'FORBIDDEN',
    )
  }
}

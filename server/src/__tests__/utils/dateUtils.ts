import { DateTime } from 'luxon'

/**
 * Helper para criar datas de teste consistentes
 * - Luxon usa month 1-12 (diferente de JS Date que usa 0-11)
 * - Usa 12:00 UTC para evitar problemas de transição de dia em timezones negativas
 *
 * Uso:
 *   import { testDate } from '@/__tests__/utils/dateUtils'
 *   testDate(2024, 3, 15) // Retorna new Date('2024-03-15T12:00:00.000Z')
 */
export const testDate = (year: number, month: number, day: number) =>
  DateTime.fromObject({ year, month, day, hour: 12 }, { zone: 'UTC' }).toJSDate()
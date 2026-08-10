export const TIME_UNITS = {
  s: 1,
  m: 60,
  h: 3600,
  d: 86400
} as const

/** Converts a duration string like "15m" or "14d" into seconds. */
export function convertToSeconds(timeString: string): number {
  const match = timeString.match(/^(\d+)([smhd])$/)

  if (!match)
    throw new Error(`Invalid time format: ${timeString}. Use format like "5m", "1h", "7d"`)

  const [, value, unit] = match

  return parseInt(value, 10) * TIME_UNITS[unit as keyof typeof TIME_UNITS]
}

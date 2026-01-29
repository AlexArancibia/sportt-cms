import { format } from "date-fns"

/**
 * Build query string params for statistics API: startDate, endDate, currencyId.
 * Dates are formatted as YYYY-MM-DD.
 */
export function buildDateParams(
  startDate?: Date,
  endDate?: Date,
  currencyId?: string
): string {
  const params = new URLSearchParams()
  if (startDate) params.append("startDate", format(startDate, "yyyy-MM-dd"))
  if (endDate) params.append("endDate", format(endDate, "yyyy-MM-dd"))
  if (currencyId) params.append("currencyId", currencyId)
  return params.toString()
}

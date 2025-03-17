import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatPrice = (price: number, currency: any) => {
  if (!currency) {
    return Number(price).toFixed(2) // Default to 2 decimal places if no currency is provided
  }

  const decimalPlaces = currency.decimalPlaces ?? 2 // Use 2 as default if decimalPlaces is not defined
  const formattedPrice = Number(price).toFixed(decimalPlaces)

  if (!currency.symbol || !currency.symbolPosition) {
    return formattedPrice // Return just the formatted price if symbol or position is missing
  }

  return currency.symbolPosition === "BEFORE"
    ? `${currency.symbol}${formattedPrice}`
    : `${formattedPrice}${currency.symbol}`
}

export function formatCurrency(amount: number, currencyCode?: string): string {
  // Remove or comment out the console.log to prevent excessive logging
  console.log("CURRENCY CODE")

  if (!currencyCode) {
    return amount.toString()
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
  }).format(amount)
}

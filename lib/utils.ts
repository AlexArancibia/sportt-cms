import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currencyCode?: string): string {
  console.log("CURENCY CODE")
  if (!currencyCode) {
    return amount.toString()
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
  }).format(amount)
}

export const formatPrice = (price: number, currency: any) => {
  const formattedPrice = price.toFixed(currency.decimalPlaces)
  return currency.symbolPosition === "BEFORE"
    ? `${currency.symbol}${formattedPrice}`
    : `${formattedPrice}${currency.symbol}`
}
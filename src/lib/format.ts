export function formatNumber(value: number, decimals: number = 2, locale: "en-US" | "id-ID" = "id-ID") {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatCurrency(value: number, currency: string = "IDR", locale: "en-US" | "id-ID" = "id-ID") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
  }).format(value);
}

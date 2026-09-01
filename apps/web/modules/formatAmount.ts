export function formatAmount(amount: number, maximumFractionDigits = 2) {
  return amount.toLocaleString('en', { maximumFractionDigits });
}

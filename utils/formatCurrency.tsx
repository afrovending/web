export const formatAmount = (
  value: string | number = 0,
  currency: string = "USD"
) => {
  const numericValue = Number(value);
  const amount = isNaN(numericValue) ? 0 : numericValue;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
    currencyDisplay: "symbol",
    minimumFractionDigits: 2,
  }).format(amount);
};

export const formatAmount = (
  value: string | number = 0,
  currency: string = "USD", 
  locale: string = "en-US" 
) => {
  const numericValue = Number(value);

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(isNaN(numericValue) ? 0 : numericValue);
};

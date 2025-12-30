export function getStockBadgeClass(
  quantity: number,
  max: number
): { class: string; level: string } {
  if (max === 0) return { class: "bg-gray-100 text-gray-600", level: "N/A" };

  const percentage = (quantity / max) * 100;

  if (percentage >= 66.67)
    return { class: "bg-green-100 text-green-700", level: "High" };
  if (percentage >= 33.34)
    return { class: "bg-green-100 text-green-700", level: "Medium" };
  return { class: "bg-red-100 text-red-700", level: "Low" };
}

export function optimizeImage(url?: string | null, width: number = 1200) {
  if (!url) return "/placeholder.png"; // fallback image
  return url.replace("/upload/", `/upload/f_auto,q_auto:good,w_${width}/`);
}

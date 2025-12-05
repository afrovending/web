export function countryCodeToFlag(code: string) {
  if (!code) return "";
  return code
    .toUpperCase()
    .replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)));
}

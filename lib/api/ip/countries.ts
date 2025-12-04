export async function getDialCode(countryCode: string): Promise<string> {
  try {
    const res = await fetch(
      `https://restcountries.com/v3.1/alpha/${countryCode}`
    );
    if (!res.ok) throw new Error("Failed to fetch dial code");
    const data = await res.json();
    const idd = data[0].idd;
    return `${idd.root}${idd.suffixes[0] ?? ""}`; // e.g. "+27"
  } catch (err) {
    console.error("getDialCode error:", err);
    return "";
  }
}

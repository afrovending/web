import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  let ip =
    req.headers.get("x-vercel-forwarded-for") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip");

  if (!ip && process.env.NODE_ENV === "development") {
    try {
      const res = await fetch("https://api.ipify.org?format=json");
      const data = await res.json();
      ip = data.ip;
    } catch {
      ip = "102.0.14.104";
    }
  }

  return NextResponse.json({ ip: ip || "Unknown IP" });
}

export async function numverifyValidatePhone({
  number,
  countryCode,
}: {
  number: string;
  countryCode: string;
}) {
  try {
    const apiKey = process.env.NEXT_PUBLIC_NUMVERIFY_API;

    const url = `https://apilayer.net/api/validate?access_key=${apiKey}&number=${number}&country_code=${countryCode}&format=1`;

    const res = await fetch(url);

    if (!res.ok) throw new Error("NumVerify request failed");

    return await res.json();
  } catch (err) {
    console.error("NumVerify API error:", err);
    return { valid: false };
  }
}

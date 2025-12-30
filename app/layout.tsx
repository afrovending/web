import "./globals.css";
import { Instrument_Sans } from "next/font/google";
import type { Metadata } from "next";
import Providers from "./providers";
import { CartProvider } from "@/context/CartContext";
import { Toaster } from "react-hot-toast";
import PublicLayoutElements from "./PublicLayoutElements";
import FooterWrapper from "./FooterWrapper";
import { WishlistProvider } from "@/context/WishlistContext";
import "react-loading-skeleton/dist/skeleton.css";
import { APP_NAME } from "@/setting";

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-instrument-sans",
});

export const metadata: Metadata = {
  title: APP_NAME,
  manifest: "/site.webmanifest",
  description:
    "Buy authentic African groceries, clothes, and the best African foods online. Afrovending Online Marketplace brings you fresh ingredients, fashion, and essentials from Africa — all in one trusted online marketplace.",
  keywords: [
    "African groceries",
    "African clothes",
    "African foods",
    "online African market",
    "buy African products",
    "African fashion",
    "African marketplace",
    "Afrovending",
  ],
  openGraph: {
    title: APP_NAME,
    description:
      "Buy authentic African groceries, clothes, and foods online. Afrovending Online Marketplace delivers Africa’s best — fresh ingredients, fashion & essentials — right to your door.",
    url: "https://afrovending.com",
    siteName: APP_NAME,
    images: [
      {
        url: "https://afrovending.com/OpenGraph.png",
        width: 1200,
        height: 630,
        alt: APP_NAME,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: APP_NAME,
    description:
      "Shop authentic African groceries, clothes & foods online. Afrovending Online Marketplace delivers Africa’s best directly to your home.",
    images: ["https://afrovending.com/Twitter.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${instrumentSans.variable}`}>
      <body className={`antialiased bg-gray-50 h-full flex flex-col`}>
        <Providers>
          <CartProvider>
            <WishlistProvider>
              <PublicLayoutElements />
              <main id="main-content" role="main" className="bg-gray-50 flex-1">
                {children}
              </main>
              <FooterWrapper />
            </WishlistProvider>
          </CartProvider>
        </Providers>

        <Toaster />
      </body>
    </html>
  );
}

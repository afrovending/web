"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";

import { listBanners } from "@/lib/api/banners";
import { listItems } from "@/lib/api/items";
import { Banner } from "@/interfaces/banners";
import Item from "@/interfaces/items";
import { optimizeImage } from "@/utils/optimizeImage";
import { APP_NAME, COMPANY_CONTACT_INFO } from "@/setting";
import { formatAmount } from "@/utils/formatCurrency";

const VISIBLE = 3;
const BANNER_INTERVAL = 5000;
const ITEM_INTERVAL = 4000;

export default function HeroBanner() {
  const [current, setCurrent] = useState(0);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [latestItems, setLatestItems] = useState<Item[]>([]);
  const [itemIndex, setItemIndex] = useState(VISIBLE);
  const [isAnimating, setIsAnimating] = useState(true);

  const bannerTimerRef = useRef<NodeJS.Timeout | null>(null);
  const itemTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    listBanners("carousel").then((res) => setBanners(res.data));
    listItems({ limit: 12, offset: 0 }).then((res) => setLatestItems(res.data));
  }, []);

  const nextBanner = useCallback(() => {
    setCurrent((prev) => (prev === banners.length - 1 ? 0 : prev + 1));
  }, [banners.length]);

  useEffect(() => {
    if (banners.length <= 1) return;

    bannerTimerRef.current = setTimeout(nextBanner, BANNER_INTERVAL);

    return () => {
      if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
    };
  }, [nextBanner, banners.length]);

  const extendedItems =
    latestItems.length > VISIBLE
      ? [
          ...latestItems.slice(-VISIBLE),
          ...latestItems,
          ...latestItems.slice(0, VISIBLE),
        ]
      : latestItems;

  const nextItem = useCallback(() => {
    setIsAnimating(true);
    setItemIndex((prev) => prev + 1);
  }, []);

  useEffect(() => {
    if (extendedItems.length <= VISIBLE) return;

    itemTimerRef.current = setTimeout(nextItem, ITEM_INTERVAL);

    return () => {
      if (itemTimerRef.current) clearTimeout(itemTimerRef.current);
    };
  }, [nextItem, extendedItems.length]);

  useEffect(() => {
    if (!isAnimating) return;

    if (itemIndex === latestItems.length + VISIBLE) {
      setTimeout(() => {
        setIsAnimating(false);
        setItemIndex(VISIBLE);
      }, 500);
    }

    if (itemIndex === 0) {
      setTimeout(() => {
        setIsAnimating(false);
        setItemIndex(latestItems.length);
      }, 500);
    }
  }, [itemIndex, isAnimating, latestItems.length]);

  const pauseItems = () => {
    if (itemTimerRef.current) clearTimeout(itemTimerRef.current);
  };

  const resumeItems = () => {
    if (extendedItems.length > VISIBLE) {
      itemTimerRef.current = setTimeout(nextItem, ITEM_INTERVAL);
    }
  };

  if (!banners.length) {
    return <div className="h-125 rounded-2xl bg-gray-200 animate-pulse" />;
  }

  return (
    <section className="w-full mx-auto px-4 bg-amber-50 pb-8">
      <div className="grid lg:grid-cols-3 gap-3 items-stretch">
        <div className="lg:col-span-2 relative overflow-hidden rounded-b-3xl h-125">
          <div
            className="flex h-full transition-transform duration-700 ease-in-out"
            style={{ transform: `translateX(-${current * 100}%)` }}
          >
            {banners.map((banner) => (
              <div key={banner.id} className="relative w-full shrink-0">
                <Image
                  src={optimizeImage(banner.banner)}
                  alt={banner.type}
                  fill
                  priority
                  className="object-cover"
                  placeholder="blur"
                  blurDataURL="/placeholder.png"
                />
              </div>
            ))}
          </div>

          {banners.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
              {banners.map((_, index) => (
                <button
                  key={index}
                  aria-label={`Go to slide ${index + 1}`}
                  onClick={() => setCurrent(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === current
                      ? "w-6 bg-hub-primary"
                      : "w-2 bg-white/70 hover:bg-white"
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col justify-between p-0">
          <div>
            <h1 className="sm:text-3xl text-xl font-bold text-gray-900 leading-tight mt-2">
              Welcome to {APP_NAME}.
            </h1>

            <p className="mt-3 text-gray-600 line-clamp-2">
              {COMPANY_CONTACT_INFO.companyDescription}
            </p>

            <div className="flex gap-4 mt-6  items-center">
              <Link
                href="/items"
                className="sm:px-6 sm:py-3 px-2.5 py-2 text-xs sm:text-sm rounded-full bg-hub-primary text-white font-medium hover:bg-hub-secondary active:scale-95 transition transform"
              >
                Explore marketplace
              </Link>

              <Link
                href="/register"
                className="sm:px-6 sm:py-3 px-2.5 py-2 text-xs sm:text-sm rounded-full border border-hub-primary text-gray-950 hover:text-white font-medium hover:bg-hub-secondary bg-white active:scale-95 transition transform"
              >
                Get started
              </Link>
            </div>
          </div>

          <div
            className="relative mt-6 overflow-hidden hidden lg:block"
            onMouseEnter={pauseItems}
            onMouseLeave={resumeItems}
          >
            <div
              className={`flex ${
                isAnimating
                  ? "transition-transform duration-500 ease-in-out"
                  : ""
              }`}
              style={{
                transform: `translateX(-${itemIndex * (100 / VISIBLE)}%)`,
              }}
            >
              {extendedItems.map((item, idx) => {
                const salesPrice = parseFloat(item.sales_price || "0");
                const regularPrice = parseFloat(item.regular_price || "0");
                const discount =
                  regularPrice > salesPrice
                    ? Math.round(
                        ((regularPrice - salesPrice) / regularPrice) * 100
                      )
                    : 0;

                return (
                  <Link
                    key={`${item.id}-${idx}`}
                    href={`/items/${item.slug}`}
                    className="w-1/3 shrink-0 px-0.5 relative"
                  >
                    <div className="bg-white rounded-xl shadow hover:scale-[1.02] transition">
                      <div className="relative h-34 rounded-t-lg overflow-hidden">
                        <Image
                          src={optimizeImage(item.images?.[0])}
                          alt={item.title}
                          fill
                          className="object-cover transition-transform duration-700 hover:scale-110"
                          placeholder="blur"
                          blurDataURL="/placeholder.png"
                        />
                        {/* Discount badge */}
                        {discount > 0 && (
                          <div className="absolute top-2 left-2 bg-red-600 text-white font-bold text-[9px] px-1.5 py-0.5 rounded shadow z-10">
                            Up to {discount}% discount
                          </div>
                        )}
                      </div>

                      <p className="mt-2 text-xs font-semibold ml-2 truncate">
                        {item.title}
                      </p>

                      <p className="text-[9px] text-gray-600! ml-2 font-bold pb-1 mb-0.5 flex items-center gap-1 truncate">
                        {formatAmount(salesPrice)}
                        {discount > 0 && (
                          <span className="text-[10px] line-through text-gray-400">
                            {formatAmount(regularPrice)}
                          </span>
                        )}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

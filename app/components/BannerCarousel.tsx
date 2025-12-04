"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { ChevronRightIcon, ChevronLeftIcon } from "@heroicons/react/24/solid";
import Image from "next/image";
import { listBanners } from "@/lib/api/banners";
import { Banner } from "@/interfaces/banners";

export default function BannerCarousel() {
  const [current, setCurrent] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [banners, setBanners] = useState<Banner[]>([]);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const response = await listBanners("carousel");
        setBanners(response.data);
      } catch (error) {
        console.error("Error fetching banners:", error);
      }
    };
    fetchBanners();
  }, []);

  const nextSlide = useCallback(() => {
    setCurrent((prev) => (prev === banners.length - 1 ? 0 : prev + 1));
  }, [banners.length]);

  const prevSlide = useCallback(() => {
    setCurrent((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
  }, [banners.length]);

  // Autoplay effect
  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(nextSlide, 4000);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [nextSlide]);

  if (banners.length === 0) {
    return (
      <div className="w-full h-[200px] sm:h-[300px] md:h-[400px] lg:h-[500px] bg-gray-200 animate-pulse" />
    );
  }

  return (
    <div className="relative w-full h-[200px] sm:h-[300px] md:h-[400px] lg:h-[500px] overflow-hidden">
      {/* Slides */}
      <div
        className="flex transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {banners.map((banner) => (
          <div
            key={banner.id}
            className="w-full shrink-0 relative h-[200px] sm:h-[300px] md:h-[400px] lg:h-[500px]"
          >
            <Image
              src={banner.banner}
              alt={banner.type}
              fill
              priority
              className="object-cover"
            />
            {/* Optional overlay */}
            <div className="absolute inset-0 bg-black/20" />
          </div>
        ))}
      </div>

      {/* Left button */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-white/70 hover:bg-white rounded-full shadow p-2"
      >
        <ChevronLeftIcon className="w-3 h-3 text-gray-700" />
      </button>

      {/* Right button */}
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-white/70 hover:bg-white rounded-full shadow p-2"
      >
        <ChevronRightIcon className="w-3 h-3 text-gray-700" />
      </button>

      {/* Indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {banners.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrent(index)}
            className={`w-2 h-2 rounded-full ${
              index === current ? "bg-[#1B412C]" : "bg-gray-300"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

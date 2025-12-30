"use client";

import { FC, useEffect, useState, useMemo, useCallback } from "react";
import { Banner } from "@/interfaces/banners";
import Category from "@/interfaces/category";
import { listBanners } from "@/lib/api/banners";
import { listCategories } from "@/lib/api/category";
import { ShoppingBagIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Skeleton from "react-loading-skeleton";
import { optimizeImage } from "@/utils/optimizeImage";
import { SlCalender } from "react-icons/sl";

interface CategorySectionProps {
  type: string;
}

const CategorySection: FC<CategorySectionProps> = ({ type }) => {
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [banner, setBanner] = useState<Banner | null>(null);
  const [loading, setLoading] = useState(true);

  const handleClick = useCallback(
    (slug: string) => {
      router.push(`/items?category=${slug}&type=${type}`);
    },
    [router, type]
  );

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const [{ categories: cats, banner: catBanner }, banners] =
          await Promise.all([
            listCategories(6, 0, "", type, "active"),
            listBanners(
              type === "products"
                ? "home_product_banner"
                : "home_service_banner"
            ),
          ]);

        setCategories(cats || []);
        setBanner(banners?.data?.[0] || catBanner || null);
      } catch (error) {
        console.error("Error fetching categories/banners:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [type]);

  const renderCategories = useMemo(
    () =>
      loading
        ? Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="rounded-xl overflow-hidden">
              <Skeleton height={224} />
            </div>
          ))
        : categories.slice(0, 6).map((cat) => (
            <div
              key={cat.id}
              onClick={() => handleClick(cat.slug)}
              className="relative rounded-xl overflow-hidden group cursor-pointer border border-green-100"
            >
              <Image
                src={optimizeImage(cat.image, 400)}
                alt={cat.name}
                width={400}
                height={400}
                placeholder="blur"
                blurDataURL="/placeholder.png"
                className="w-full h-56 object-cover group-hover:scale-105 transition transform"
              />
              <div className="absolute bottom-3 left-3 right-3">
                <div className="btn btn-primary text-center text-xs md:text-base truncate">
                  {cat.name}
                </div>
              </div>
            </div>
          )),
    [categories, loading, handleClick]
  );

  const renderBanner = useMemo(
    () =>
      loading ? (
        <Skeleton height={200} className="rounded-2xl w-full" />
      ) : banner ? (
        <div
          className="relative bg-white rounded-2xl overflow-hidden cursor-pointer h-40 sm:h-80 md:h-130"
          onClick={() => router.push(`/items?type=${type}`)}
        >
          <Image
            src={optimizeImage(banner.banner, 1600)}
            alt={banner.type}
            fill
            sizes="(max-width: 640px) 100vw,
                   (max-width: 1024px) 100vw,
                   (max-width: 1280px) 100vw,
                   100vw"
            priority
            className="w-full h-full object-cover"
            placeholder="blur"
            blurDataURL="/placeholder.png"
          />
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center">
            <p className="sm:text-2xl text-sm font-bold text-green-800 text-center">
              {type === "services"
                ? "Nearby Service Providers"
                : "Essential Daily Needs"}
            </p>

            <button
              aria-label={type === "services" ? "Book now" : "Shop now"}
              className="mt-4 bg-green-100 text-hub-secondary sm:px-6 sm:py-2 px-3 py-1 rounded-full text-xs sm:text-sm font-semibold flex items-center gap-2 hover:bg-green-200 transition cursor-pointer"
            >
              {type === "services" ? (
                <>
                  <SlCalender className="w-3 h-3 sm:w-5 sm:h-5" /> Book Now
                </>
              ) : (
                <>
                  <ShoppingBagIcon className="w-3 h-3 sm:w-5 sm:h-5" /> Shop Now
                </>
              )}
            </button>
          </div>
        </div>
      ) : null,
    [banner, loading, router, type]
  );

  return (
    <section className="py-6">
      <div className="w-full mx-auto px-3 sm:px-4">
        <h2 className="md:text-xl text-sm font-bold mb-2">
          Shop by <span className="capitalize">{type}</span> Categories
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {renderBanner}
          <div className="col-span-1 md:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-2">
            {renderCategories}

            {!loading && categories.length > 0 && (
              <div className="flex justify-center col-span-2 md:col-span-3 mt-4">
                <button
                  onClick={() => router.push("/categories?type=" + type)}
                  className="px-6 py-3 bg-hub-secondary text-white font-semibold rounded-lg shadow-lg hover:bg-hub-primary hover:shadow-xl transition-all flex items-center gap-2 cursor-pointer"
                >
                  View All <span className="capitalize">{type}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
export default CategorySection;

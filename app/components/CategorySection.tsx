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

const CategorySection: FC = () => {
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [banner, setBanner] = useState<Banner | null>(null);
  const [loading, setLoading] = useState(true);

  const handleClick = useCallback(
    (slug: string, type: string) => {
      router.push(`/items?category=${slug}&type=${type}`);
    },
    [router]
  );

  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true);
        const [{ categories: cats, banner: catBanner }, banners] =
          await Promise.all([
            listCategories(6, 0, "", "products", "active"),
            listBanners("home_product_banner"),
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
  }, []);

  const renderCategories = useMemo(
    () =>
      loading
        ? Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="rounded-xl overflow-hidden">
              <Skeleton height={224} />
            </div>
          ))
        : categories.map((cat) => (
            <div
              key={cat.id}
              onClick={() => handleClick(cat.slug, "products")}
              className="relative rounded-xl overflow-hidden group cursor-pointer border border-red-100"
            >
              <Image
                src={cat.image || "/placeholder.png"}
                alt={cat.name}
                width={400}
                height={400}
                loading="lazy"
                className="w-full h-56 object-cover group-hover:scale-105 transition"
              />
              <div className="absolute bottom-3 left-3 right-3">
                <div className="bg-red-800 text-white text-center py-2 rounded-lg font-semibold text-sm md:text-base">
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
        <Skeleton height={400} className="rounded-2xl" />
      ) : banner ? (
        <div
          className="relative bg-white rounded-2xl overflow-hidden cursor-pointer"
          onClick={() => router.push(`/items?type=products`)}
        >
          <Image
            src={banner.banner}
            alt={banner.type || "Banner"}
            width={600}
            height={800}
            priority
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center">
            <p className="text-3xl font-bold text-red-800 text-center">
              {banner.type === "home_service_banner"
                ? "Nearby Service Providers"
                : "Essential Daily Needs"}
            </p>
            <button className="mt-4 bg-red-100 text-red-800 px-6 py-2 rounded-full text-sm font-semibold flex items-center gap-2 hover:bg-red-200 transition cursor-pointer">
              <ShoppingBagIcon className="w-5 h-5" /> Shop Now
            </button>
          </div>
        </div>
      ) : null,
    [banner, loading, router]
  );

  return (
    <section className="py-6">
      <div className="max-w-full mx-auto px-4 md:px-6 lg:px-8">
        <h2 className="text-xl md:text-xl font-bold mb-4 ">Shop by Category</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {renderBanner}
          <div className="col-span-1 md:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-6">
            {renderCategories}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CategorySection;

"use client";

import { useState, type JSX } from "react";
import type Category from "@/interfaces/category";
import { listCategories } from "@/lib/api/category";
import { CubeIcon, SparklesIcon, TagIcon } from "@heroicons/react/24/outline";
import { ChevronRightIcon } from "@heroicons/react/24/solid";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import Link from "next/link";
import Skeleton from "react-loading-skeleton";

const typeMap = {
  products: {
    label: "Products",
    Icon: CubeIcon,
  },
  services: {
    label: "Services",
    Icon: SparklesIcon,
  },
} as const;

const iconMap: Record<string, JSX.Element> = {
  default: <TagIcon className="w-5 h-5 text-hub-secondary" />,
};

type CategoriesResponse = {
  categories: Category[];
  banner: any;
};

type Props = {
  onNavigate?: () => void;
};

export default function CategoryList({ onNavigate }: Props) {
  const [selectedType, setSelectedType] = useState<"products" | "services">(
    "products"
  );
  const [hoveredCategory, setHoveredCategory] = useState<Category | null>(null);

  const { data: mainData, isLoading } = useQuery<CategoriesResponse>({
    queryKey: ["categories", selectedType],
    queryFn: () => listCategories(50, 0, undefined, selectedType),
  });

  const subCategories = hoveredCategory?.children?.slice(0, 3) || [];
  const hasMoresubCategories = (hoveredCategory?.children?.length || 0) > 3;

  // Limit main categories to first 8
  const mainCategoriesToShow = mainData?.categories?.slice(0, 8) || [];
  const hasMoreCategories = (mainData?.categories?.length || 0) > 8;

  return (
    <div className="flex gap-4 p-4 w-full bg-white shadow-xl rounded-lg">
      {/* 1. Left Panel: Types */}
      <div className="flex flex-col w-40  pr-4">
        <h3 className="text-xs font-semibold uppercase text-gray-500 mb-2">
          Shopping For
        </h3>
        <div className="flex flex-col gap-2">
          {Object.keys(typeMap).map((type) => {
            const { Icon, label } = typeMap[type as "products" | "services"];
            const isActive = selectedType === type;

            return (
              <button
                key={type}
                onClick={() => {
                  setSelectedType(type as "products" | "services");
                  setHoveredCategory(null);
                }}
                className={`flex items-center justify-start gap-2 px-3 py-2 rounded-md transition cursor-pointer ${
                  isActive
                    ? "bg-hub-secondary text-white shadow-md"
                    : "text-gray-700 hover:bg-green-50"
                }`}
              >
                <Icon
                  className={`w-6 h-6 transition ${
                    isActive ? "text-white" : "text-hub-secondary"
                  }`}
                />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2 + 3. Middle + Right Panels */}
      <div
        className="flex flex-1"
        onMouseLeave={() => setHoveredCategory(null)}
      >
        {/* Middle Panel: Main Categories */}
        <div className="w-64 space-y-1 py-1">
          {mainCategoriesToShow.map((cat: Category) => {
            const icon = iconMap[cat.name.toLowerCase()] || iconMap.default;
            return (
              <div
                key={cat.id}
                onMouseEnter={() => setHoveredCategory(cat)}
                className={`relative cursor-pointer transition ${
                  hoveredCategory?.id === cat.id
                    ? "bg-green-50 shadow-sm rounded-md"
                    : ""
                }`}
              >
                <Link
                  href={`/items?category=${cat.slug}&type=${selectedType}`}
                  onClick={onNavigate}
                  className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:text-hub-primary transition"
                >
                  {/* Icon */}
                  {isLoading ? <Skeleton className="w-5 h-5 rounded" /> : icon}

                  {/* Category name */}
                  {isLoading ? (
                    <Skeleton className="h-4 w-full max-w-35" />
                  ) : (
                    <span className="truncate font-medium">{cat.name}</span>
                  )}

                  {/* Arrow */}
                  {isLoading ? (
                    <Skeleton className="w-4 h-4 ml-auto rounded" />
                  ) : (
                    cat.children &&
                    cat.children.length > 0 && (
                      <ChevronRightIcon className="w-4 h-4 ml-auto text-gray-400" />
                    )
                  )}
                </Link>
              </div>
            );
          })}

          {/* View All Link if more than 10 categories */}
          {hasMoreCategories && (
            <div className="mt-8">
              <Link
                onClick={onNavigate}
                href={`/categories?type=${selectedType}`}
                className="flex items-center justify-between px-4 py-2 text-sm font-medium text-hub-primary cursor-pointer bg-green-50 rounded-md"
              >
                View All {typeMap[selectedType].label} Categories
                <ChevronRightIcon className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>

        {/* Right Panel: Image, Description, Children */}
        {hoveredCategory && (
          <motion.div
            key={hoveredCategory.id}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
            className="hidden md:block w-80 shrink-0  border-hub-secondary pl-4 py-1 ml-2"
          >
            <h3 className="text-lg font-bold text-hub-primary mb-2 truncate">
              {hoveredCategory.name}
            </h3>

            {hoveredCategory.image && (
              <img
                src={hoveredCategory.image}
                alt={hoveredCategory.name}
                className="w-full h-32 object-cover rounded-md mb-3 shadow-md"
              />
            )}

            {hoveredCategory.description && (
              <p className="text-gray-600 mb-4 text-sm max-h-16 overflow-hidden">
                {hoveredCategory.description.substring(0, 150)}...
              </p>
            )}

            {subCategories.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-semibold text-gray-600 mb-2">
                  Popular Subcategories
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {subCategories.map((sub: Category) => (
                    <Link
                      key={sub.id}
                      onClick={onNavigate}
                      href={`/items?category=${sub.slug}&type=${selectedType}`}
                      className="bg-green-50 hover:bg-green-100 p-2 rounded-md text-xs text-gray-950 transition block truncate"
                    >
                      {sub.name}
                    </Link>
                  ))}
                </div>
                {hasMoresubCategories && (
                  <div className="mt-8">
                    <Link
                      onClick={onNavigate}
                      // href={`/categories?type=${selectedType}`}
                      href={`/categories/${hoveredCategory.slug}?type=${selectedType}`}
                      className="flex items-center justify-between px-4 py-2 text-sm font-medium text-hub-primary cursor-pointer bg-green-50 rounded-md"
                    >
                      <span className="truncate" title={hoveredCategory.name}>
                        View All Categories in {hoveredCategory.name}{" "}
                      </span>
                      <ChevronRightIcon className="w-4 h-4" />
                    </Link>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}

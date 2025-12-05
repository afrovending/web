"use client";

import { Fragment, JSX, useState } from "react";
import { Menu, MenuButton, MenuItems, Transition } from "@headlessui/react";
import {
  Bars3Icon,
  ChevronRightIcon,
  HomeModernIcon,
  SparklesIcon,
  TagIcon,
  CubeIcon,
  GiftIcon,
  PhoneIcon,
  Squares2X2Icon,
  HomeIcon,
  BuildingStorefrontIcon,
} from "@heroicons/react/24/outline";
import { listCategories } from "@/lib/api/category";
import { useQuery } from "@tanstack/react-query";
import Category from "@/interfaces/category";
import Skeleton from "react-loading-skeleton";
import Link from "next/link";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";

const iconMap: Record<string, JSX.Element> = {
  chair: <HomeModernIcon className="w-5 h-5 text-red-600" />,
  table: <CubeIcon className="w-5 h-5 text-red-600" />,
  decor: <SparklesIcon className="w-5 h-5 text-red-600" />,
  gift: <GiftIcon className="w-5 h-5 text-red-600" />,
  default: <TagIcon className="w-5 h-5 text-red-600" />,
};

export default function NavBar() {
  return (
    <nav className="bg-red-900 text-white">
      <div className="container mx-auto flex items-center justify-between px-2">
        <Menu as="div" className="relative">
          <MenuButton className="flex items-center gap-2 bg-red-700 text-white px-3 py-3 text-sm font-medium rounded-full hover:bg-red-600 active:scale-95 transition-all duration-200 shadow-md focus:outline-none cursor-pointer">
            <Bars3Icon className="w-5 h-5 block lg:hidden" />
            <div className="hidden lg:flex items-center gap-2">
              <Bars3Icon className="w-5 h-5" />
              <span>All Categories</span>
            </div>
          </MenuButton>

          <Transition
            as={Fragment}
            enter="transition ease-out duration-150"
            enterFrom="transform opacity-0 translate-y-2 scale-95"
            enterTo="transform opacity-100 translate-y-0 scale-100"
            leave="transition ease-in duration-100"
            leaveFrom="transform opacity-100 translate-y-0 scale-100"
            leaveTo="transform opacity-0 translate-y-1 scale-95"
          >
            <MenuItems className="absolute left-0 mt-2 w-56 origin-top-left border border-red-100 bg-white/95 backdrop-blur-md text-gray-700 shadow-xl rounded-xl focus:outline-none z-50 overflow-hidden">
              <div className="border-t border-gray-100 ">
                <CategoryList />
              </div>
            </MenuItems>
          </Transition>
        </Menu>

        <DesktopNavLinks />

        <MobileNavLinks />
      </div>
    </nav>
  );
}

function CategoryList() {
  const { data, isLoading } = useQuery({
    queryKey: ["categories", "products"],
    queryFn: () => listCategories(10, 0, undefined, "products"),
  });

  const [showAll, setShowAll] = useState(false);

  if (isLoading) {
    return (
      <div className="p-2 space-y-2">
        <Skeleton height={20} count={4} />
      </div>
    );
  }

  if (!data?.categories?.length) {
    return <p className="px-4 py-2 text-sm text-gray-500">No categories</p>;
  }

  const categoriesToShow = showAll
    ? data.categories
    : data.categories.slice(0, 15);

  return (
    <div className="py-2">
      {categoriesToShow.map((cat: Category) => {
        const key = cat.name.toLowerCase();
        const icon = iconMap[key] || iconMap.default;

        return (
          <motion.div
            key={cat.id}
            whileHover={{ x: 5, scale: 1.02 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
          >
            <Link
              href={`/items?category=${cat.slug}&type=products`}
              className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 rounded-md transition-all duration-200"
            >
              {icon}
              <span className="truncate">{cat.name}</span>
            </Link>
          </motion.div>
        );
      })}

      {/* View All button */}
      {data.categories.length > 15 && (
        <div className="flex justify-center mt-2">
          <Link
            href="/categories"
            className="text-sm text-red-700 hover:underline flex items-center bg-red-50 p-3 rounded-md gap-1"
          >
            View All Categories
            <ChevronRightIcon className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  );
}


function MobileNavLinks() {
  const { user } = useAuthStore();

  const links = [
    {
      label: "Products",
      href: "/items?type=products",
      icon: <CubeIcon className="w-4 h-4 text-red-500" />,
    },
    {
      label: "Order to Call",
      href: "/contact-us",
      icon: <PhoneIcon className="w-4 h-4 text-red-500" />,
    },
    ...(user?.role === "customer"
      ? [
          {
            label: "Become a Seller",
            href: "/seller-onboarding",
            icon: (
              <BuildingStorefrontIcon className="w-4 h-4 text-red-500" />
            ),
          },
        ]
      : []),
  ];

  return (
    <motion.div
      className="md:hidden flex items-center gap-4 text-sm font-medium"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {links.map((link, idx) => (
        <motion.div
          key={idx}
          whileHover={{ y: -2, scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
          <Link
            href={link.href}
            title={link.label}
            className="flex items-center gap-1.5 text-xs text-gray-100 hover:text-red-200 transition-all duration-200"
          >
            {link.icon}
            <span>{link.label}</span>
          </Link>
        </motion.div>
      ))}
    </motion.div>
  );
}
function DesktopNavLinks() {
  const pathname = usePathname();
  const { user } = useAuthStore();

  const links = [
    { label: "Home", href: "/", icon: <HomeIcon className="w-4 h-4" /> },
    {
      label: "Products",
      href: "/items?type=products",
      icon: <CubeIcon className="w-4 h-4" />,
    },
    {
      label: "Categories",
      href: "/categories",
      icon: <Squares2X2Icon className="w-4 h-4" />,
    },
    {
      label: "Shops",
      href: "/shops",
      icon: <GiftIcon className="w-4 h-4" />,
    }, 
    ...(user?.role === "customer"
      ? [
          {
            label: "Become a Seller",
            href: "/seller-onboarding",
            icon: <BuildingStorefrontIcon className="w-4 h-4" />,
          },
        ]
      : []),
  ];

  return (
    <ul className="hidden md:flex items-center gap-8 text-[15px] font-medium">
      {links.map((link, idx) => {
        const isActive = pathname === link.href;

        return (
          <motion.li
            key={idx}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
            className="relative group cursor-pointer"
          >
            <Link
              href={link.href}
              title={link.label}
              className={`flex items-center gap-1.5 transition-colors duration-200 ${
                isActive
                  ? "text-red-400"
                  : "text-gray-100 hover:text-red-200"
              }`}
            >
              <span className="text-red-300">{link.icon}</span>
              {link.label}
            </Link>

            {/* Animated underline */}
            <motion.span
              layoutId="underline"
              className={`absolute left-0 -bottom-1 h-0.5 rounded-full ${
                isActive ? "bg-red-400 w-full" : "bg-red-400 w-0"
              } group-hover:w-full transition-all duration-300`}
            />
          </motion.li>
        );
      })}
    </ul>
  );
}

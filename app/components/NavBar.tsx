"use client";

import { Fragment, JSX } from "react";
import { Menu, MenuButton, MenuItems, Transition } from "@headlessui/react";
import {
  Bars3Icon,
  CubeIcon,
  GiftIcon,
  PhoneIcon,
  Squares2X2Icon,
  HomeIcon,
  BuildingStorefrontIcon,
} from "@heroicons/react/24/outline";

import { IoIosArrowDown } from "react-icons/io";

import Link from "next/link";
import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { HiOutlineBriefcase } from "react-icons/hi";
import CategoryList from "./CategoryList";

export default function NavBar() {
  return (
    <nav className="bg-hub-primary text-white">
      <div className="mx-auto flex items-center justify-between px-2 sm:px-4">
        <Menu as="div" className="relative z-50">
          {({ close }) => (
            <>
              {" "}
              <MenuButton className="flex items-center gap-2 bg-hub-secondary text-white px-3 py-3 text-sm font-medium rounded-full sm:rounded hover:bg-hub-secondary/80 active:scale-95 transition-all duration-200 shadow-md focus:outline-none cursor-pointer">
                <Bars3Icon
                  aria-label="Browse Categories"
                  className="w-5 h-5 block lg:hidden"
                />
                <div className="hidden lg:flex items-center gap-2">
                  <Bars3Icon
                    aria-label="Browse categories"
                    className="w-5 h-5"
                  />
                  <span>Browse Categories</span>
                  <IoIosArrowDown
                    aria-label="Browse categories"
                    className="w-5 h-5"
                  />
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
                {/* 🎯 THE KEY CHANGE FOR RESPONSIVENESS */}
                <MenuItems
                  className="
                      absolute
                      top-full
                      left-0
                      mt-2

                      w-[calc(100vw-24px)]
                      max-w-none

                      border border-hub-primary/40
                      bg-white/95 backdrop-blur-md
                      text-gray-700 shadow-xl
                      rounded-xl
                      focus:outline-none
                      overflow-hidden

                      /* ---------- DESKTOP ---------- */
                      md:left-0
                      md:w-150
                      md:max-w-150

                      lg:w-225
                      lg:max-w-225

                      xl:w-275
                      xl:max-w-275
                    "
                >
                  <div className="border-t border-gray-100 ">
                    <CategoryList onNavigate={close} />
                  </div>
                </MenuItems>
              </Transition>
            </>
          )}
        </Menu>
        <DesktopNavLinks />
        <MobileNavLinks />
      </div>
    </nav>
  );
}

function MobileNavLinks() {
  const { user } = useAuthStore();

  const MOBILE_MENU_LINK = [
    {
      label: "Products",
      href: "/items?type=products",
      icon: <CubeIcon className="w-4 h-4" />,
    },
    {
      label: "Services",
      href: "/items?type=services",
      icon: <HiOutlineBriefcase className="w-4 h-4" />,
    },
    {
      label: "Need Help?",
      href: "/contact-us",
      icon: <PhoneIcon className="w-4 h-4" />,
    },
    ...(user?.role === "customer"
      ? [
          {
            label: "Start Selling",
            href: "/seller-onboarding",
            icon: <BuildingStorefrontIcon className="w-4 h-4 " />,
          },
        ]
      : []),
  ];

  return (
    <motion.div
      className="md:hidden flex items-center gap-3 text-sm font-medium"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {MOBILE_MENU_LINK.map((link, idx) => {
        const isCTA = link.label === "Start Selling";

        return (
          <motion.div
            key={idx}
            whileHover={{ y: -1, scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
          >
            <Link
              href={link.href}
              title={link.label}
              className={`
                flex items-center gap-1.5 text-[11px] transition-all duration-200
                ${
                  isCTA
                    ? "bg-white text-hub-primary px-3 py-1.5 rounded-full font-bold shadow-sm"
                    : "text-gray-100 hover:text-hub-light-primary"
                }
              `}
            >
              {isCTA && link.icon}
              <span>{link.label}</span>
            </Link>
          </motion.div>
        );
      })}
    </motion.div>
  );
}

function DesktopNavLinks() {
  const pathname = usePathname();
  const { user } = useAuthStore();

  const DESKTOP_MENU_LINK = [
    { label: "Home", href: "/", icon: <HomeIcon className="w-4 h-4" /> },
    {
      label: "Shop Products",
      href: "/items?type=products",
      icon: <CubeIcon className="w-4 h-4" />,
    },
    {
      label: "Book Services",
      href: "/items?type=services",
      icon: <GiftIcon className="w-4 h-4" />,
    },
    {
      label: "Our Story",
      href: "/about-us",
      icon: <Squares2X2Icon className="w-4 h-4" />,
    },
    {
      label: "Need Help?",
      href: "/contact-us",
      icon: <Squares2X2Icon className="w-4 h-4" />,
    },
    ...(user?.role === "customer"
      ? [
          {
            label: "Start Selling",
            href: "/seller-onboarding",
            icon: <BuildingStorefrontIcon className="w-4 h-4" />,
          },
        ]
      : []),
  ];

  return (
    <ul className="hidden md:flex items-center gap-8 text-[15px] font-medium">
      {DESKTOP_MENU_LINK.map((link, idx) => {
        const isActive = pathname === link.href;
        const isCTA = link.label === "Start Selling";

        return (
          <motion.li
            key={idx}
            whileHover={isCTA ? { scale: 1.05 } : { y: -2 }}
            whileTap={{ scale: 0.97 }}
            className="relative group cursor-pointer"
          >
            <Link
              href={link.href}
              title={link.label}
              className={`flex items-center gap-2 transition-all duration-200 ${
                isCTA
                  ? "bg-white text-hub-primary px-4 py-1.5 rounded-full font-bold shadow-md hover:shadow-lg hover:bg-gray-50"
                  : isActive
                  ? "text-hub-primary"
                  : "text-gray-100 hover:text-hub-light-primary"
              }`}
            >
              {isCTA && link.icon}
              <span>{link.label}</span>
            </Link>

            {/* Animated underline - Disabled for CTA */}
            {!isCTA && (
              <motion.span
                layoutId="underline"
                className={`absolute left-0 -bottom-1 h-0.5 rounded-full ${
                  isActive ? "bg-hub-primary w-full" : "bg-hub-primary w-0"
                } group-hover:w-full transition-all duration-300`}
              />
            )}
          </motion.li>
        );
      })}
    </ul>
  );
}
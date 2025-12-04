"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { useState, useMemo } from "react";
import { ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/20/solid";
import { User } from "@/interfaces/user";
import { NAVIGATION } from "@/setting";

const NavMenu = ({ user }: { user: User | null }) => {
  const pathname = usePathname();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const filteredNavigation = useMemo(() => {
    if (!user) return [];

    if (user.role === "staff") {
      // Only allow these sections for staff
      const allowed = [
        "Customer Management",
        "Items Management",
        "Vendor Management",
        "Support Tickets",
        "Reviews Management",
        "Category Management",
        "Variation Management",
        "Banner Management",
        "Shop Management",
        "FAQs Management",
      ];
      return NAVIGATION.filter((nav) => allowed.includes(nav.label));
    }
    return NAVIGATION;
  }, [user]);

  const toggleSection = (name: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  return (
    <ul className="space-y-2">
      {filteredNavigation.map((item) => {
        const isActiveParent = pathname.startsWith(item.href);
        const isOpen = openSections[item.label] || isActiveParent;

        return (
          <li key={item.label}>
            <button
              onClick={() => toggleSection(item.label)}
              className={clsx(
                "w-full flex items-center justify-between px-3 py-1.5 rounded-md text-xs font-semibold overflow-y-auto scrollbar-thin scrollbar-thumb-gray-50 hover:scrollbar-thumb-gray-100 scrollbar-track-transparent",
                isActiveParent
                  ? "text-red-500"
                  : "text-gray-700 hover:text-red-500"
              )}
            >
              <span className="flex items-center gap-x-3">
                <item.icon className="h-5 w-5" />
                {item.label}
              </span>
              {item.children &&
                (isOpen ? (
                  <ChevronDownIcon className="h-4 w-4" />
                ) : (
                  <ChevronRightIcon className="h-4 w-4" />
                ))}
            </button>

            {item.children && isOpen && (
              <ul className="ml-8 mt-1 space-y-2">
                {item.children.map((subItem) => {
                  const isActiveSub = pathname === subItem.href;
                  return (
                    <li key={subItem.label}>
                      <Link
                        href={subItem.href}
                        className={clsx(
                          "block px-3 py-1.5 text-xs rounded-md",
                          isActiveSub
                            ? "bg-red-50 text-red-600"
                            : "text-gray-500 hover:text-red-500 hover:bg-red-50"
                        )}
                      >
                        {subItem.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </li>
        );
      })}
    </ul>
  );
};

export default NavMenu;

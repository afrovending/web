"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { useState } from "react";
import { ChevronDownIcon, ChevronRightIcon } from "@heroicons/react/20/solid";
import { VENDOR_MENU } from "@/setting";

const NavMenu = () => {
  const pathname = usePathname();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const toggleSection = (name: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [name]: !prev[name],
    }));
  };

  return (
    <ul className="space-y-2">
      {VENDOR_MENU.map((item) => {
        const isActiveParent = pathname.startsWith(item.href);
        const isOpen = openSections[item.label] || isActiveParent;

        return (
          <li key={item.label}>
            <button
              onClick={() => toggleSection(item.label)}
              className={clsx(
                "w-full flex items-center justify-between px-3 py-1.5 rounded-md text-xs font-semibold overflow-y-auto scrollbar-thin scrollbar-thumb-gray-50 hover:scrollbar-thumb-gray-100 scrollbar-track-transparent",
                isActiveParent
                  ? "text-green-500"
                  : "text-gray-700 hover:text-green-500"
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
                            ? "bg-green-50 text-green-600"
                            : "text-gray-500 hover:text-green-500 hover:bg-green-50"
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

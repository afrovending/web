"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LuLogOut, LuChevronDown } from "react-icons/lu";
import { useAuthStore } from "@/store/useAuthStore";
import { VENDOR_MENU } from "@/setting";
import Image from "next/image";
import { getMyShop } from "@/lib/api/seller/shop";

export function Sidebar({
  isOpen,
  toggleSidebar,
}: {
  isOpen: boolean;
  toggleSidebar: () => void;
}) {
  const router = useRouter();
  const currentPath = usePathname();
  const { clearAuth } = useAuthStore();

  const [expandedItem, setExpandedItem] = useState<number | null>(null);
  const [shopType, setShopType] = useState<string | null>(null);

  const handleLogout = () => {
    clearAuth();
    router.replace("/");
  };

  const toggleExpand = (id: number) => {
    setExpandedItem(expandedItem === id ? null : id);
  };

  useEffect(() => {
    async function fetchShopData() {
      try {
        const res = await getMyShop();
        setShopType(res.data.type);
      } catch (error) {
        console.error("Failed to fetch shop type", error);
      }
    }
    fetchShopData();
  }, []);

  const filteredMenu = useMemo(() => {
    return VENDOR_MENU.filter((item) => {
      // Logic: If Service shop, hide these IDs. If Product shop, hide these IDs.
      const hiddenForServices = [5];
      const hiddenForProducts = [6];

      if (shopType === "services" && hiddenForServices.includes(item.id))
        return false;
      if (shopType === "products" && hiddenForProducts.includes(item.id))
        return false;

      return true;
    }).map((item) => {
      if (item.id === 2 && item.children) {
        return {
          ...item,
          children: item.children.filter(
            (child) => !(shopType === "services" && child.id === 22)
          ),
        };
      }
      return item;
    });
  }, [shopType]);

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/10 blur-2xl md:hidden"
          onClick={toggleSidebar}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-100 flex flex-col transform transition-transform duration-300 md:translate-x-0 md:static md:h-screen ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center px-6 h-20 border-b border-gray-50">
          <Image
            width={120}
            height={40}
            src="/logo.svg"
            alt="logo"
            className="h-8 w-auto"
          />
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
          {filteredMenu.map((item) => {
            const hasChildren = item.children && item.children.length > 0;
            const isActive =
              currentPath === item.href ||
              (hasChildren && currentPath.startsWith(item.href));
            const isExpanded =
              expandedItem === item.id || (isActive && expandedItem === null);

            return (
              <div key={item.id} className="space-y-1">
                {hasChildren ? (
                  <button
                    onClick={() => toggleExpand(item.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                      isActive
                        ? "bg-green-50 text-green-800"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center">
                      <item.icon
                        className={`w-5 h-5 mr-3 ${
                          isActive ? "text-green-800" : "text-gray-400"
                        }`}
                      />
                      {item.label}
                    </div>
                    <LuChevronDown
                      className={`w-4 h-4 transition-transform duration-200 ${
                        isExpanded ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                ) : (
                  // STANDARD LINK
                  <Link
                    href={item.href}
                    onClick={() => window.innerWidth < 768 && toggleSidebar()}
                    className={`flex items-center px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                      currentPath === item.href
                        ? "bg-green-50 text-green-800 shadow-sm"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    <item.icon
                      className={`w-5 h-5 mr-3 ${
                        currentPath === item.href
                          ? "text-green-800"
                          : "text-gray-400"
                      }`}
                    />
                    {item.label}
                  </Link>
                )}

                {/* CHILDREN LIST */}
                {hasChildren && isExpanded && (
                  <div className="ml-9 space-y-1 mt-1 border-l-2 border-gray-50 pl-2">
                    {item.children?.map((child) => {
                      const isChildActive = currentPath === child.href;
                      return (
                        <Link
                          key={child.id}
                          href={child.href}
                          onClick={() =>
                            window.innerWidth < 768 && toggleSidebar()
                          }
                          className={`flex items-center px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                            isChildActive
                              ? "text-green-700 bg-green-50/50"
                              : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                          }`}
                        >
                          {child.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="p-4 bg-gray-50/50 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
          >
            <LuLogOut className="w-5 h-5 mr-3" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}

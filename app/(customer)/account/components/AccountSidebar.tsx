"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { CUSTOMER_MENU } from "@/setting";
import { FiLogOut } from "react-icons/fi";

export default function AccountSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const clearAuth = useAuthStore((state) => state.clearAuth);

  const handleLogout = () => {
    clearAuth();
    router.push("/login");
  };
  return (
    <aside className="md:sticky md:top-28 bg-white rounded-xl shadow-sm p-4 overflow-x-auto md:overflow-visible">
      <nav className="flex md:block gap-3 md:space-y-1 min-w-max md:min-w-0">
        {CUSTOMER_MENU.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              href={item.href}
              key={item.name}
              prefetch={true}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg whitespace-nowrap transition-all duration-200
                ${
                  isActive
                    ? "bg-red-100 text-red-800 font-medium"
                    : "hover:bg-gray-100 text-gray-700"
                }
              `}
            >
              <Icon
                size={18}
                className={isActive ? "text-red-800" : "text-gray-500"}
              />
              <span>{item.name}</span>
            </Link>
          );
        })}

        <button
          onClick={handleLogout}
          className="mt-8 flex items-center justify-center gap-2 text-red-600 font-medium bg-red-50 px-3 py-2 rounded-lg
          hover:bg-red-100 transition-all duration-200 w-full cursor-pointer"
        >
          Log out
          <FiLogOut size={18} />
        </button>
      </nav>
    </aside>
  );
}

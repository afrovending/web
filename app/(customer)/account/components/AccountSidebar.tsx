"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { CUSTOMER_MENU } from "@/setting";
import { FiLogOut } from "react-icons/fi";
import { logoutProfile } from "@/lib/api/auth/profile";
import { toast } from "react-hot-toast";

export default function AccountSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const clearAuth = useAuthStore((state) => state.clearAuth);

  const handleLogout = async () => {
    try {
      await logoutProfile();
    } catch (error) {
      console.error(
        "Backend logout failed, but clearing local session anyway."
      );
    } finally {
      clearAuth();
      router.replace("/login");
      toast.success("Logged out successfully");
    }
  };
  return (
    <aside className="sticky top-0 md:top-28 bg-white rounded-xl shadow-sm p-4 overflow-x-auto md:overflow-visible">
      <nav className="flex md:block items-center gap-3 md:space-y-1 min-w-max md:min-w-0">
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
                  ? "bg-green-100 text-green-800 font-medium"
                  : "hover:bg-gray-100 text-gray-700"
              }
            `}
            >
              <Icon
                size={18}
                className={isActive ? "text-green-800" : "text-gray-500"}
              />
              <span className="text-sm md:text-base">{item.name}</span>
            </Link>
          );
        })}

        {/* Logout Button: Adjusted for Mobile-First */}
        <button
          onClick={handleLogout}
          className="
          flex items-center gap-2 px-3 py-2 rounded-lg whitespace-nowrap
          text-red-600 font-medium bg-red-50 cursor-pointer
          md:mt-8 md:w-full md:justify-center 
          hover:bg-red-100 transition-all duration-200
        "
        >
          <span className="text-sm md:text-base">Log out</span>
          <FiLogOut size={18} />
        </button>
      </nav>
    </aside>
  );
}

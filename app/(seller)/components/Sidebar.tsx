"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LuLogOut } from "react-icons/lu";
import { useAuthStore } from "@/store/useAuthStore";
import { NAVIGATION } from "@/setting";
import Image from "next/image";

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

  const handleLogout = () => {
    clearAuth();
    router.push("/login");
  };

  return (
    <aside
      className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform 
        transition-transform duration-300 ease-in-out 
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        md:translate-x-0 md:static
      `}
    >
      {/* Logo */}
      <div className="flex items-center justify-center h-16 border-b p-4">
        <Image
          width={100}
          height={40}
          src="/logo.svg"
          alt="logo"
          className="h-10 w-auto"
        />
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-2">
        {NAVIGATION.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            prefetch={true}
            className={`block p-3 rounded-lg text-sm font-medium ${
              currentPath.startsWith(item.href)
                ? "bg-red-100 text-red-700"
                : "text-gray-700 hover:bg-gray-100"
            }`}
            onClick={toggleSidebar}
          >
            <item.icon className="inline-block w-5 h-5 mr-3" />
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Logout */}
      <div className="border-t p-4">
        <button
          onClick={handleLogout}
          className="flex items-center w-full p-3 text-red-600 hover:bg-red-50 rounded-lg"
        >
          <LuLogOut className="w-5 h-5 mr-3" />
          Logout
        </button>
      </div>
    </aside>
  );
}

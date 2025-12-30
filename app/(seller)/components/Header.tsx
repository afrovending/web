"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  Transition,
} from "@headlessui/react";
import { Fragment } from "react";
import { LuLogOut, LuMenu, LuSettings } from "react-icons/lu";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStore";
import { NotificationMenu } from "./NotificationMenu";

export function Header({ toggleSidebar }: { toggleSidebar: () => void }) {
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();

  if (!user) return null;

  const handleLogout = () => {
    clearAuth();
    router.replace("/");
  };

  const userName = user?.name || user?.email || "Seller";

  return (
    <header className="sticky top-0 z-30 flex items-center h-16 bg-white border-b border-gray-200 px-3">
      <button
        onClick={toggleSidebar}
        className="md:hidden text-gray-700 mr-3 focus:outline-none"
      >
        <LuMenu className="h-6 w-6" />
      </button>

      <div className="hidden md:block flex-1"></div>

      <div className="flex-1 flex justify-center md:hidden">
        <Link href="/dashboard">
          <Image
            src="/logo.svg"
            alt="Afrovending Online Marketplace"
            className="cursor-pointer"
            width={140}
            height={30}
            priority
            unoptimized
          />
        </Link>
      </div>

      <div className="flex items-center space-x-4">
        <NotificationMenu />

        <Menu as="div" className="relative">
          <MenuButton className="flex items-center space-x-2 transition-colors duration-150 rounded-xl cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-50">
            <span className="hidden sm:block text-gray-700">{userName}</span>
            <Image
              src={user.profile_photo || "/default-avatar.png"}
              alt="User Avatar"
              width={36}
              height={36}
              className="rounded-full"
            />
          </MenuButton>

          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="opacity-0 scale-95"
            enterTo="opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="opacity-100 scale-100"
            leaveTo="opacity-0 scale-95"
          >
            <MenuItems className="absolute right-0 mt-2 w-56 rounded-xl bg-white shadow-2xl ring-1 ring-red-50 ring-opacity-5 focus:outline-none">
              <div className="px-4 py-3">
                <p className="text-sm font-semibold text-gray-900">
                  {userName}
                </p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>

              <div className="py-1">
                <MenuItem>
                  {({ active }) => (
                    <Link
                      href="/dashboard/account-settings"
                      className={`flex items-center px-4 py-2 text-sm ${
                        active ? "bg-gray-100 text-gray-900" : "text-gray-700"
                      }`}
                    >
                      <LuSettings className="w-4 h-4 mr-2" /> Profile Settings
                    </Link>
                  )}
                </MenuItem>
              </div>

              <div className="py-1 border-t border-red-50">
                <MenuItem>
                  {({ active }) => (
                    <button
                      onClick={handleLogout}
                      className={`flex items-center w-full text-left px-4 py-2 text-sm  cursor-pointer ${
                        active ? "bg-gray-100 text-red-600" : "text-red-500"
                      }`}
                    >
                      <LuLogOut className="w-4 h-4 mr-3" /> Log out
                    </button>
                  )}
                </MenuItem>
              </div>
            </MenuItems>
          </Transition>
        </Menu>
      </div>
    </header>
  );
}

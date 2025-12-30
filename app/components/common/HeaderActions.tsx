"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { MapPinIcon, UserIcon } from "@heroicons/react/24/outline";
import { useAuthStore } from "@/store/useAuthStore";
import { RiUser3Line } from "react-icons/ri";

export default function HeaderActions() {
  const router = useRouter();
  const { user } = useAuthStore();
  const firstName = user?.name;

  return (
    <div className="flex items-center gap-3 sm:gap-4">
      <motion.button
        aria-label={
          firstName ? `Go to account dashboard for ${firstName}` : "Sign In"
        }
        onClick={() => {
          if (!user) return router.push("/login");
          if (user.role === "customer") router.push("/account");
          if (user.role === "seller") router.push("/dashboard");
        }}
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: 1.05 }}
        transition={{ type: "spring", stiffness: 300, damping: 15 }}
        className="px-2 sm:px-4 py-2 flex items-center justify-center bg-hub-primary rounded-full cursor-pointer
             text-white hover:bg-hub-secondary hover:text-white transition-all duration-300 
             focus:outline-none focus:ring-2 focus:ring-green-400"
      >
        <RiUser3Line className="w-4 h-4 lg:w-5 lg:h-5" />
        <span className="hidden sm:inline ml-1">
          {firstName ? `Hi, ${firstName}` : "Sign In"}
        </span>
      </motion.button>{" "}
      <motion.button
        aria-label="Track Order"
        onClick={() => router.push("/tracking")}
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: 1.05 }}
        transition={{ type: "spring", stiffness: 300, damping: 15 }}
        className="px-2 sm:px-4 py-2 flex items-center justify-center bg-hub-primary rounded-full cursor-pointer
             text-white hover:bg-hub-secondary hover:text-white transition-all duration-300 
             focus:outline-none focus:ring-2 focus:ring-green-400"
      >
        <MapPinIcon className="w-4 h-4 lg:w-5 lg:h-5" />
        <span className="hidden sm:inline ml-1">Track Order</span>
      </motion.button>
    </div>
  );
}

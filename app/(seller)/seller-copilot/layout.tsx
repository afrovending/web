"use client";

import { useState } from "react";
import clsx from "clsx";
import { HiOutlineMenuAlt2, HiOutlineArrowLeft } from "react-icons/hi";
import SellerCopilotSidebar from "./components/SellerCopilotSidebar";
import SellerCopilot from "./page";

export default function SellerCopilotLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<
    number | null
  >(null);

  return (
    <div className="flex h-full w-full overflow-hidden rounded-2xl border border-red-100 bg-white shadow-sm ">
      <SellerCopilotSidebar
        open={sidebarOpen}
        activeConversationId={activeConversationId}
        onSelectConversation={setActiveConversationId}
        onClose={() => setSidebarOpen(false)}
        className={clsx(
          "border-r border-red-100 bg-red-50 transition-transform duration-300 ease-in-out",
          "md:relative md:flex md:flex-col md:translate-x-0",
          sidebarOpen
            ? "fixed inset-0 z-50 w-64 shadow-lg translate-x-0"
            : "-translate-x-full md:translate-x-0 hidden md:flex"
        )}
      />

      {/* Main content */}
      <div className="flex flex-1 flex-col relative transition-all duration-300 ease-in-out">
        {/* Mobile top bar */}
        <div className="flex items-center gap-2 border-b border-red-100 bg-white px-3 py-2 md:hidden">
          <button
            onClick={() => setSidebarOpen((prev) => !prev)}
            className="rounded-lg p-2 hover:bg-red-50"
          >
            {sidebarOpen ? (
              <HiOutlineArrowLeft className="text-red-950 text-lg" />
            ) : (
              <HiOutlineMenuAlt2 className="text-red-950 text-lg" />
            )}
          </button>
          <span className="text-sm font-semibold text-red-950">
            Seller Copilot
          </span>
        </div>

        {/* Desktop floating toggle */}
        <button
          onClick={() => setSidebarOpen((prev) => !prev)}
          className="absolute left-0 top-4 z-10 hidden h-8 w-8 items-center justify-center rounded-full bg-red-50 text-red-950 shadow-md md:flex hover:bg-red-100 cursor-pointer"
        >
          {sidebarOpen ? <HiOutlineArrowLeft /> : <HiOutlineMenuAlt2 />}
        </button>
 
        <SellerCopilot
          conversationId={activeConversationId}
          onConversationCreated={(id) => setActiveConversationId(id)}
        />
      </div>
    </div>
  );
}

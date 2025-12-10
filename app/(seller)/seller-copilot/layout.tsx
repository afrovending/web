"use client";

import { useState } from "react";
import { HiOutlineMenuAlt2, HiOutlineArrowLeft } from "react-icons/hi";
import SellerCopilotSidebar from "./components/SellerCopilotSidebar";
import SellerCopilot from "./page";

export default function SellerCopilotLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeConversationId, setActiveConversationId] = useState<
    number | null
  >(null);

  return (
    <div className="flex h-full w-full overflow-hidden rounded-2xl border border-red-100 bg-white shadow-sm">
      {/* Sidebar */}
      <SellerCopilotSidebar
        open={sidebarOpen}
        activeConversationId={activeConversationId}
        onSelectConversation={(id) => setActiveConversationId(id)}
        onClose={() => setSidebarOpen(false)}
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
          className="absolute left-0 top-4 z-10 hidden h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-950 shadow-md md:flex hover:bg-red-100"
        >
          {sidebarOpen ? <HiOutlineArrowLeft /> : <HiOutlineMenuAlt2 />}
        </button>

        {/* Chat main content */}
        <SellerCopilot conversationId={activeConversationId} />
      </div>
    </div>
  );
}

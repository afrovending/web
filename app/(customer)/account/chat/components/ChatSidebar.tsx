"use client";

import { useState } from "react";
import { LuSearch } from "react-icons/lu";
import Image from "next/image";
import { Ticket } from "@/interfaces/ticket";
import { formatHumanReadableDate } from "@/utils/formatDate";

interface ChatSidebarProps {
  chats: Ticket[];
  activeChatId: string | undefined;
  onSelectChat: (chat: Ticket) => void;
}

export default function ChatSidebar({
  chats,
  activeChatId,
  onSelectChat,
}: ChatSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");

  // Filter chats based on vendor name or last message
  // Inside ChatSidebar.tsx
  const filteredChats = chats
    .filter(
      (chat, index, self) =>
        index === self.findIndex((t) => t.ticket_id === chat.ticket_id)
    )
    .filter(
      (chat) =>
        chat.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chat.last_message?.toLowerCase().includes(searchQuery.toLowerCase())
    );

  return (
    <aside className="w-full md:w-80 bg-white border-r border-gray-200 flex flex-col h-full overflow-hidden">
      {/* Search Header */}
      <div className="p-6 pb-4">
        <h1 className="text-2xl font-bold mb-4 text-gray-900">Chats</h1>
        <div className="relative">
          <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 size={18}" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-100 border-none rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-green-500 placeholder:text-gray-400 transition-all"
          />
        </div>
      </div>

      {/* Conversations List */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
        {filteredChats.length > 0 ? (
          filteredChats.map((chat: Ticket) => {
            const isActive = activeChatId === chat.ticket_id;

            return (
              <div
                key={chat.ticket_id}
                onClick={() => onSelectChat(chat)}
                className={`flex items-center gap-3 p-4 cursor-pointer border-l-4 transition-all ${
                  isActive
                    ? "bg-green-50 border-green-500 shadow-sm"
                    : "hover:bg-gray-50 border-transparent"
                }`}
              >
                {/* Avatar Section */}
                <div className="relative shrink-0">
                  <div className="h-12 w-12 rounded-full overflow-hidden border bg-gray-50 flex items-center justify-center">
                    <Image
                      src={chat.profile_photo || "/placeholder.png"}
                      alt={chat.full_name || "User"}
                      width={48}
                      height={48}
                      unoptimized // Important: since your SVGs are Base64 strings
                      className="h-full w-full object-cover"
                    />
                  </div>
                  {chat.online_status === "online" && (
                    <span className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full shadow-sm" />
                  )}
                </div>

                {/* Content Section */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline mb-0.5">
                    <span
                      className={`text-sm truncate pr-2 ${
                        isActive
                          ? "font-bold text-green-900"
                          : "font-semibold text-gray-900"
                      }`}
                    >
                      {chat.full_name}
                    </span>
                    <span className="text-[10px] text-gray-400 shrink-0 font-medium">
                      {chat.last_message_time
                        ? formatHumanReadableDate(chat.last_message_time)
                        : ""}
                    </span>
                  </div>
                  <p
                    className={`text-xs truncate ${
                      isActive ? "text-green-700/80" : "text-gray-500"
                    }`}
                  >
                    {chat.last_message || "No messages yet"}
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center p-10 text-center">
            <div className="bg-gray-100 p-3 rounded-full mb-3">
              <LuSearch size={24} className="text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-500">
              No conversations
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Try a different search term
            </p>
          </div>
        )}
      </nav>
    </aside>
  );
}

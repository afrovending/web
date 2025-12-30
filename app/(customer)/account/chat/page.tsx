"use client";

import { useState, useEffect, use, useRef } from "react";
import { useSearchParams } from "next/navigation";
import {
  listServiceChats,
  getServiceChat,
  replyServiceChat,
} from "@/lib/api/customer/services";
import ChatClientWrapper from "./components/ChatClientWrapper";

interface ServiceChatPageProps {
  searchParams: Promise<{ item?: string }>;
}

export default function ServiceChatPage({
  searchParams,
}: ServiceChatPageProps) {
  const resolvedParams = use(searchParams);
  const nextSearchParams = useSearchParams();

  const itemId = resolvedParams?.item || nextSearchParams.get("item");

  const isInitializing = useRef(false);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (isInitializing.current) return;

    const initFetch = async () => {
      isInitializing.current = true;
      try {
        const res = await listServiceChats();
        let chats = Array.isArray(res.data) ? res.data : res.data?.data || [];

        const targetId = itemId ? String(itemId).trim() : null;

        let activeTicket = targetId
          ? chats.find((t: any) => String(t.service_id) === targetId)
          : null;

        if (targetId && !activeTicket) {
          const formData = new FormData();
          formData.append("service_id", targetId);
          formData.append("description", "");

          const createRes = await replyServiceChat(formData);

          if (
            createRes.status === "success" ||
            createRes.data?.status === "success"
          ) {
            const refresh = await listServiceChats();
            chats = Array.isArray(refresh.data)
              ? refresh.data
              : refresh.data?.data || [];
            activeTicket = chats.find(
              (t: any) => String(t.service_id) === targetId
            );
          }
        }

        if (!activeTicket && chats.length > 0) {
          activeTicket = chats[0];
        }

        let initialMessages = [];
        let initialParticipant = null;

        if (activeTicket) {
          try {
            const detail = await getServiceChat(activeTicket.ticket_id);
            const payload = detail.data?.data || detail.data;
            if (
              detail.status === "success" ||
              detail.data?.status === "success"
            ) {
              initialMessages = payload?.messages || [];
              initialParticipant = payload?.participant || null;
            }
          } catch (err) {
            console.error("Detail fetch failed", err);
          }

          if (!initialParticipant) {
            initialParticipant = {
              full_name: activeTicket.full_name,
              profile_photo: activeTicket.profile_photo,
              is_online: activeTicket.online_status === "online",
            };
          }
        }

        setData({
          chats,
          activeChat: activeTicket,
          messages: initialMessages,
          participant: initialParticipant,
        });
      } catch (err) {
        console.error("Main Fetch Error:", err);
      } finally {
        isInitializing.current = false;
      }
    };

    initFetch();
  }, [itemId]);

  if (!data) {
    return (
      <div className="h-[80vh] w-full flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border-4 border-green-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-500 font-medium animate-pulse">
          Loading conversations...
        </p>
      </div>
    );
  }
  return (
    <ChatClientWrapper
      initialChats={data.chats}
      initialActiveChat={data.activeChat}
      initialMessages={data.messages}
      initialParticipant={data.participant}
    />
  );
}

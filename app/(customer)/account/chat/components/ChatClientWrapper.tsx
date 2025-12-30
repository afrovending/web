"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { getServiceChat, replyServiceChat } from "@/lib/api/customer/services";
import { Ticket, Message, Participant } from "@/interfaces/ticket";
import { LuSend } from "react-icons/lu";
import ChatMessages from "./ChatMessage";
import ChatHeader from "./ChatHeader";
import ChatInput from "./ChatInput";
import ChatSidebar from "./ChatSidebar";

interface ChatClientWrapperProps {
  initialChats: Ticket[];
  initialActiveChat: Ticket | null;
  initialMessages: Message[];
  initialParticipant: Participant | null;
}

export default function ChatClientWrapper({
  initialChats,
  initialActiveChat,
  initialMessages,
  initialParticipant,
}: ChatClientWrapperProps) {
  const [chats, setChats] = useState<Ticket[]>(initialChats);
  const [activeChat, setActiveChat] = useState<Ticket | null>(
    initialActiveChat
  );
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [participant, setParticipant] = useState<Participant | null>(
    initialParticipant
  );
  const [loading, setLoading] = useState(false);
  const [isloadingChatMessage, setIsLoadingChatMessage] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(!!initialActiveChat);

  // Sync state with props
  useEffect(() => {
    setChats(initialChats);
    setActiveChat(initialActiveChat);
    setMessages(initialMessages);
    setParticipant(initialParticipant);
  }, [initialChats, initialActiveChat, initialMessages, initialParticipant]);

  // Polling Logic
  useEffect(() => {
    if (!activeChat) return;
    const interval = setInterval(async () => {
      try {
        const res = await getServiceChat(activeChat.ticket_id);
        const serverData = res.data?.data || res.data;
        const newMessages = serverData.messages || [];

        if (newMessages.length !== messages.length) {
          setMessages(newMessages);
        }
      } catch (err) {
        console.error("Polling failed", err);
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [activeChat, messages.length]);

  const handleUpsertMessage = async (text: string, file?: File) => {
    if (!activeChat) return;

    // 1. OPTIMISTIC UPDATE
    const tempId = Date.now().toString();
    const optimisticMessage: any = {
      id: tempId,
      text: text,
      is_me: true,
      timestamp: new Date().toISOString(),
      is_read: false,
      file: file ? URL.createObjectURL(file) : null,
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setLoading(true);

    const formData = new FormData();
    formData.append("service_id", activeChat.service_id.toString());
    formData.append("description", text.trim());
    if (file) {
      formData.append("file", file);
    }
    try {
      setIsLoadingChatMessage(true);
      const res = await replyServiceChat(formData);
      if (res.status === "success") {
        const serverData = res.data?.data || res.data;
        const serverMessages = serverData.messages;

        if (serverMessages && Array.isArray(serverMessages)) {
          setMessages(serverMessages);
        }

        // Update sidebar sorting and preview
        setChats((prev) =>
          prev
            .map((c) =>
              c.ticket_id === activeChat.ticket_id
                ? {
                    ...c,
                    last_message: text || "📎 Attachment",
                    last_message_time: new Date().toISOString(),
                  }
                : c
            )
            .sort(
              (a, b) =>
                new Date(b.last_message_time || 0).getTime() -
                new Date(a.last_message_time || 0).getTime()
            )
        );
      }
    } catch (err: any) {
      toast.error("Failed to send");
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      setLoading(false);
      setIsLoadingChatMessage(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-80px)] md:h-[calc(100vh-100px)] bg-white overflow-hidden md:rounded-2xl md:m-4 shadow-sm border border-gray-100">
      <div
        className={`${
          showMobileChat ? "hidden" : "block"
        } w-full md:block md:w-80 border-r border-gray-100`}
      >
        <ChatSidebar
          chats={chats}
          activeChatId={activeChat?.ticket_id}
          onSelectChat={(chat) => {
            setActiveChat(chat);
            setShowMobileChat(true);
          }}
        />
      </div>

      <main
        className={`${
          showMobileChat ? "flex" : "hidden"
        } flex-1 flex-col bg-white w-full`}
      >
        {activeChat ? (
          <>
            <ChatHeader
              participant={participant}
              onBack={() => setShowMobileChat(false)}
              ticketId={activeChat?.ticket_id}
              isLoading={isloadingChatMessage}
            />
            <ChatMessages
              messages={messages}
              isloadingChatMessage={isloadingChatMessage}
            />
            <ChatInput
              onSendMessage={handleUpsertMessage}
              loading={loading || isloadingChatMessage}
            />
          </>
        ) : (
          <div className="flex-1 hidden md:flex flex-col items-center justify-center text-gray-400 gap-4 bg-gray-50/30">
            <div className="p-6 bg-white rounded-full shadow-sm">
              <LuSend size={48} className="text-green-200" />
            </div>
            <p className="font-medium text-gray-500">
              Select a conversation to start messaging
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

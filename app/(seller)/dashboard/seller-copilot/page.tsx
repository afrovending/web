"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { AiOutlineWechatWork, AiOutlineSend } from "react-icons/ai"; 
import Markdown from "react-markdown";
import { getConversationHistory, AskSellerCopilotResponse, askSellerCopilot } from "@/lib/api/seller/gemini/sellerCopilot";

interface Props {
  conversationId: number | null;
  onConversationCreated: (id: number) => void;
}

export default function SellerCopilot({
  conversationId,
  onConversationCreated,
}: Props) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: "assistant",
      content: "Hi 👋 I'm your Afrovending Copilot. How can I help?",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // Load or reset conversation
  useEffect(() => {
    if (conversationId === null) {
      setMessages([
        {
          id: 1,
          role: "assistant",
          content: "Hi 👋 I'm your Afrovending Copilot. How can I help?",
        },
      ]);
      return;
    }

    setLoading(true);
    getConversationHistory(conversationId)
      .then((history) => {
        setMessages(
          history.map((m) => ({
            id: m.id,
            role: m.role,
            content: m.content,
          }))
        );
      })
      .finally(() => setLoading(false));
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { id: Date.now(), role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response: AskSellerCopilotResponse = await askSellerCopilot({
        message: input,
        conversation_id: conversationId,
      });

      const { reply, conversation_id } = response;

      if (conversationId === null && conversation_id) {
        onConversationCreated(conversation_id);
      }

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          content: reply,
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          content: "❌ Something went wrong. Please try again.",
        },
      ]);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col rounded-2xl border border-red-100 bg-white shadow-sm ">
      {/* Header */}
      <div className="flex items-center gap-2 rounded-t-2xl bg-linear-to-r from-red-950 to-red-600 px-4 py-3 text-white">
        <AiOutlineWechatWork className="ml-4 text-xl" />
        <div>
          <h2 className="text-sm font-semibold text-white!">Seller Copilot</h2>
          <p className="text-xs text-red-100!">
            AI-powered insights to optimise your shop.
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-4 overflow-y-auto bg-red-50/50 p-4">
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className={clsx(
              "max-w-[75%] rounded-t-2xl px-4 py-2 text-sm shadow-sm",
              msg.role === "user"
                ? "ml-auto rounded-l-2xl border bg-linear-to-r from-red-50 to-red-100"
                : "rounded-r-2xl border border-red-100 bg-white text-gray-800"
            )}
          >
            {msg.role === "assistant" && (
              <div className="mb-1 flex items-center gap-1 text-xs text-red-500">
                <AiOutlineWechatWork />
                AI Support
              </div>
            )}

            <Markdown>{msg.content}</Markdown>
          </motion.div>
        ))}

        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-[75%] rounded-r-2xl rounded-t-2xl border border-red-100 bg-white px-4 py-2 text-sm shadow-sm"
          >
            <TypingIndicator />
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="bg-white p-3">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type your message…"
            className="flex-1 input"
          />
          <button
            onClick={sendMessage}
            disabled={loading}
            className="btn btn-primary flex items-center justify-center"
          >
            <AiOutlineSend className="text-lg" />
          </button>
        </div>
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 text-xs text-red-500">
      <AiOutlineWechatWork />
      <span>Typing</span>
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-red-500"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </div>
    </div>
  );
}

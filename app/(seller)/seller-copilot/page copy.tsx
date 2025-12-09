"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import clsx from "clsx";
import {
  AiOutlineWechatWork,
  AiOutlineSend,
  AiFillRobot,
} from "react-icons/ai";
import {
  askSellerCopilot,
  AskSellerCopilotResponse,
} from "@/lib/api/seller/gemini/sellerCopilot";
import Markdown from "react-markdown";

export default function SellerCopilot() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: "assistant",
      content: "Hi 👋 I’m your AI Support Assistant. How can I help today?",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const [conversationId, setConversationId] = useState<number | null>(null);

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
        ...(conversationId ? { conversation_id: conversationId } : {}),
      });

      const { reply, conversation_id } = response;

      // persist session
      if (!conversationId && conversation_id) {
        setConversationId(conversation_id);
        localStorage.setItem("seller_copilot_session", String(conversation_id));
      }

      await new Promise((r) => setTimeout(r, 400));

      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, role: "assistant", content: reply },
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
    <div className="flex h-full flex-col rounded-2xl border border-red-100 bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2 rounded-t-2xl bg-linear-to-r from-red-950 to-red-600 px-4 py-3 text-white">
        <AiOutlineWechatWork className="text-xl" />
        <div>
          <h2 className="text-sm font-semibold text-white">Seller Copilot</h2>
          <p className="text-xs text-red-100">
            AI-powered insights to optimise your shop, improve listings, and
            increase sales to your buyers.
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
              "max-w-[75%] rounded-2xl px-4 py-2 text-sm shadow-sm",
              msg.role === "user"
                ? "ml-auto bg-red-950 text-white"
                : "bg-white text-gray-800 border border-red-100"
            )}
          >
            {msg.role === "assistant" && (
              <div className="mb-1 flex items-center gap-1 text-xs text-red-500">
                <AiFillRobot />
                AI Support
              </div>
            )}

            <Markdown>
              {typeof msg.content === "string"
                ? msg.content
                : "```json\n" + JSON.stringify(msg.content, null, 2) + "\n```"}
            </Markdown>
          </motion.div>
        ))}

        {/* ✅ Typing indicator goes AFTER messages */}
        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-[75%] rounded-2xl border border-red-100 bg-white px-4 py-2 text-sm text-gray-800 shadow-sm"
          >
            <TypingIndicator />
          </motion.div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-red-100 bg-white p-3">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type your message…"
            autoFocus
            className="flex-1 rounded-xl border border-red-200 px-4 py-2 text-sm text-red-950 focus:outline-none focus:ring-1 focus:ring-red-500"
          />
          <button
            onClick={sendMessage}
            disabled={loading}
            className="flex items-center justify-center rounded-xl bg-red-950 p-2 text-white transition hover:bg-red-700 active:scale-95 disabled:opacity-50"
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
      <AiFillRobot />
      <span>Typing</span>
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="h-1.5 w-1.5 rounded-full bg-red-500"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{
              duration: 1,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </div>
    </div>
  );
}

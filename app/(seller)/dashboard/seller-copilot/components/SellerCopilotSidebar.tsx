"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import clsx from "clsx";
import {
  listConversations,
  AiConversationSummary,
  AiConversationHistoryResponse,
} from "@/lib/api/seller/gemini/sellerCopilot";
import { FiX, FiMessageSquare, FiPlus } from "react-icons/fi";
import Skeleton from "react-loading-skeleton";

interface Props {
  open: boolean;
  activeConversationId: number | null;
  onSelectConversation: (id: number | null) => void;
  onClose: () => void;
  className?: string;
}

export default function SellerCopilotSidebar({
  open,
  activeConversationId,
  onSelectConversation,
  onClose,
}: Props) {
  const [histories, setHistories] = useState<AiConversationSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);

  // ✅ prevents refetch on every toggle
  const hasFetchedRef = useRef(false);

  const fetchHistories = async (reset = false) => {
    setLoading(true);
    try {
      const response: AiConversationHistoryResponse = await listConversations(
        reset ? 0 : offset,
        limit
      );

      setHistories((prev) =>
        reset ? response.data : [...prev, ...response.data]
      );
      setTotal(response.total);
      setOffset(reset ? response.limit : offset + response.data.length);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;

    // ✅ fetch only ONCE
    if (hasFetchedRef.current) return;

    hasFetchedRef.current = true;
    fetchHistories(true);
  }, [open]);

  const hasMore = histories.length < total;

  return (
    <motion.aside
      animate={{ width: open ? 280 : 0 }}
      className={clsx(
        "relative overflow-hidden border-r border-red-100 bg-red-50",
        "hidden md:block"
      )}
    >
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-red-100 px-3 py-2">
          <span className="text-sm font-semibold text-red-950">
            Conversations
          </span>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-red-100">
            <FiX />
          </button>
        </div>

        {/* New Chat */}
        <div className="p-2">
          <button
            onClick={() => onSelectConversation(null)}
            className="flex w-full items-center gap-2 rounded-xl bg-red-100 px-3 py-2 text-sm font-medium text-red-950 hover:bg-red-200 cursor-pointer"
          >
            <FiPlus />
            New Chat
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto space-y-1 p-2">
          {loading && histories.length === 0 && (
            <Skeleton width={240} height={30} count={3} />
          )}

          {histories.map((item) => (
            <button
              key={item.id}
              onClick={() => onSelectConversation(item.id)}
              className={clsx(
                "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm cursor-pointer",
                activeConversationId === item.id
                  ? "bg-red-600 text-white"
                  : "hover:bg-red-100 text-red-900"
              )}
            >
              <FiMessageSquare className="shrink-0" />
              <span className="truncate">
                {item.title ?? "New conversation"}
              </span>
            </button>
          ))}

          {hasMore && !loading && (
            <button
              onClick={() => fetchHistories()}
              className="w-full rounded-xl bg-red-100 py-1 text-sm text-red-950 hover:bg-red-200"
            >
              Load more
            </button>
          )}
        </div>
      </div>
    </motion.aside>
  );
}

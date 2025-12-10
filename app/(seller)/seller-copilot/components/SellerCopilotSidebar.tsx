"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import clsx from "clsx";
import {
  listConversations,
  AiConversationSummary,
  AiConversationHistoryResponse,
} from "@/lib/api/seller/gemini/sellerCopilot";
import { FiX, FiMessageSquare } from "react-icons/fi";
import Skeleton from "react-loading-skeleton";

interface Props {
  open: boolean;
  activeConversationId: number | null;
  onSelectConversation: (id: number) => void;
  onClose: () => void;
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
      setOffset((prev) =>
        reset ? response.limit : prev + response.data.length
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    fetchHistories(true); // reset when opening
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
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {loading && <Skeleton width={240} height={30} />}

          {histories.map((item) => (
            <button
              key={item.id}
              onClick={() => onSelectConversation(item.id)}
              className={clsx(
                "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm",
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

          {/* Load more button */}
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

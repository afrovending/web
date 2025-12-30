"use client";

import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";

export default function ChatMessagesSkeleton() {
  const skeletonMessages = [
    { type: "incoming", width: "w-3/5" },
    { type: "outgoing", width: "w-2/5" },
    { type: "incoming", width: "w-4/5" },
    { type: "outgoing", width: "w-3/4" },
    { type: "incoming", width: "w-1/2" },
    { type: "outgoing", width: "w-2/3" },
    { type: "incoming", width: "w-4/5" },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-white custom-scrollbar">
      <Skeleton height={200} className="mb-8" />
      {skeletonMessages.map((msg, index) => (
        <div
          key={index}
          className={`flex w-full ${
            msg.type === "outgoing" ? "justify-end" : "justify-start"
          }`}
        >
          <div
            className={`rounded-2xl px-4 py-2 shadow-sm ${msg.width} max-w-[85%] md:max-w-[70%]`}
          >
            {/* Adjust Skeleton component's base color and highlight based on your design */}
            <Skeleton
              count={1}
              height={16}
              className="mt-1"
              baseColor={msg.type === "outgoing" ? "#e0f2f1" : "#f0f0f0"} // Light green/gray base
              highlightColor={msg.type === "outgoing" ? "#b2dfdb" : "#e5e5e5"} // Slightly darker highlight
            />
            <Skeleton
              count={1}
              height={16}
              width={msg.type === "outgoing" ? "70%" : "90%"}
              className="mt-1"
              baseColor={msg.type === "outgoing" ? "#e0f2f1" : "#f0f0f0"}
              highlightColor={msg.type === "outgoing" ? "#b2dfdb" : "#e5e5e5"}
            />
            {/* Metadata skeleton */}
            <div className="flex justify-end mt-1">
              <Skeleton
                count={1}
                width={40}
                height={10}
                baseColor={msg.type === "outgoing" ? "#e0f2f1" : "#f0f0f0"}
                highlightColor={msg.type === "outgoing" ? "#b2dfdb" : "#e5e5e5"}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

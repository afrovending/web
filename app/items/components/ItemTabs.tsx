"use client";

import { useState } from "react";
import { StarIcon } from "@heroicons/react/24/solid";
import Image from "next/image";
import parse from "html-react-parser"; // new

interface Review {
  id: number;
  name: string;
  avatar: string;
  rating: number;
  comment: string;
  date: string;
}

export default function ItemTabs({
  description,
  reviews,
}: {
  description: string;
  reviews: Review[];
}) {
  const [activeTab, setActiveTab] = useState<"description" | "reviews">(
    "description"
  );

  return (
    <div className="bg-white pb-8">
      {/* Tabs */}
      <div className="flex justify-center border-b border-gray-700">
        <button
          onClick={() => setActiveTab("description")}
          className={`px-4 py-2 text-sm font-medium cursor-pointer ${
            activeTab === "description"
              ? "border-b-2 border-red-800 text-red-800"
              : "text-gray-400 hover:text-gray-200"
          }`}
        >
          Description
        </button>
        <button
          onClick={() => setActiveTab("reviews")}
          className={`px-4 py-2 text-sm font-medium cursor-pointer ${
            activeTab === "reviews"
              ? "border-b-2 border-red-800 text-red-800"
              : "text-gray-400 hover:text-gray-200"
          }`}
        >
          Reviews
        </button>
      </div>

      {/* Content */}
      <div className="mt-4 p-4 text-gray-400">
        {activeTab === "description" && (
          <div className="prose prose-invert max-w-none">
            {parse(description)}
          </div>
        )}

        {activeTab === "reviews" && (
          <div className="space-y-6">
            {reviews.length === 0 ? (
              <p>No reviews yet.</p>
            ) : (
              reviews.map((review) => (
                <div key={review.id} className="border-b border-gray-700 pb-4">
                  <div className="flex items-center gap-3">
                    <Image
                      src={review.avatar}
                      alt={review.name}
                      className="w-10 h-10 rounded-full"
                      width={40}
                      height={40}
                    />
                    <div>
                      <p className="text-sm font-semibold text-gray-100">
                        {review.name}
                      </p>
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <StarIcon
                            key={i}
                            className={`w-4 h-4 ${
                              i < review.rating
                                ? "text-yellow-500"
                                : "text-gray-600"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <span className="ml-auto text-xs text-gray-400">
                      {review.date}
                    </span>
                  </div>
                  <p className="mt-2 text-gray-300 text-sm">{review.comment}</p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

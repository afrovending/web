"use client";

import React, { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { listTutorials } from "@/lib/api/contact";
import { motion } from "framer-motion";

interface Tutorial {
  id: number;
  title: string;
  slug: string;
  description: string;
  image_url: string;
  status: string;
  type: string;
}

export default function TutorialsPage() {
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);

  const LIMIT = 10;

  const hasMore = tutorials.length < totalRecords;

  const fetchTutorials = useCallback(async (currentOffset: number) => {
    try {
      if (currentOffset === 0) setLoading(true);
      else setFetchingMore(true);

      const response = await listTutorials(currentOffset, LIMIT);
      setTotalRecords(response.total || 0);
      const newBatch = response.data || [];

      setTutorials((prev) =>
        currentOffset === 0 ? newBatch : [...prev, ...newBatch]
      );
    } catch (error) {
      console.error("Failed to load tutorials:", error);
    } finally {
      setLoading(false);
      setFetchingMore(false);
    }
  }, []);

  useEffect(() => {
    fetchTutorials(0);
  }, [fetchTutorials]);

  const handleLoadMore = () => {
    if (hasMore && !fetchingMore) {
      const nextOffset = offset + LIMIT;
      setOffset(nextOffset);
      fetchTutorials(nextOffset);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-96 bg-gray-100 animate-pulse rounded-3xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen p-6 sm:p-12">
      <div className="mx-auto max-w-7xl">
        {tutorials.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-6">
              <svg
                className="w-12 h-12 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              No Tutorials Found
            </h2>
            <p className="text-gray-500 max-w-sm">
              We couldn't find any tutorials at the moment. Please check back
              later or explore other categories.
            </p>
          </motion.div>
        ) : (
          <>
            <motion.div
              layout
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12"
            >
              {tutorials.map((tutorial, index) => (
                <motion.div
                  key={tutorial.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  whileHover={{ y: -10 }}
                  className="group flex flex-col bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300"
                >
                  <div className="relative h-64 w-full overflow-hidden">
                    <Image
                      src={tutorial.image_url}
                      alt={tutorial.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                  </div>

                  <div className="p-6 flex flex-col grow">
                    <h3 className="text-xl font-bold text-gray-900 line-clamp-2 mb-3 group-hover:text-green-600 transition-colors">
                      {tutorial.title}
                    </h3>

                    <div
                      className="text-gray-500 text-sm line-clamp-2 mb-6 grow prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: tutorial.description }}
                    />

                    <motion.div whileTap={{ scale: 0.95 }}>
                      <Link
                        href={`/blogs/${tutorial.slug}`}
                        className="block w-full py-3 bg-green-500 hover:bg-green-600 text-white text-center font-bold rounded-xl transition-all shadow-md hover:shadow-green-200"
                      >
                        Read More
                      </Link>
                    </motion.div>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            {hasMore && (
              <div className="flex justify-center mt-12">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleLoadMore}
                  disabled={fetchingMore}
                  className="px-10 py-3 border-2 border-green-500 text-green-500 font-bold rounded-xl hover:bg-green-500 hover:text-white disabled:opacity-50 transition-all duration-300 shadow-sm"
                >
                  {fetchingMore ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Loading...
                    </span>
                  ) : (
                    "Load More"
                  )}
                </motion.button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

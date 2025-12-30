"use client";

import { useState } from "react";
import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";
import { useSearch } from "@/hooks/useSearch";
import SearchResultsList from "./SearchResultsList";

export default function MobileSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const {
    searchTerm,
    results,
    loading,
    isTouched,
    handleSearchChange,
    clearSearch,
  } = useSearch();

  const openModal = () => setIsOpen(true);
  const closeModal = () => {
    setIsOpen(false);
    clearSearch();
  };

  return (
    <>
      {/* Search Icon Button */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={openModal}
        className="md:hidden p-2 flex items-center justify-center rounded-full bg-hub-primary text-white"
        aria-label="Open search"
      >
        <MagnifyingGlassIcon
          aria-label="Open search icon"
          className="w-4 h-4 transition"
        />
      </motion.button>

      {/* Full-Screen Search Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: "-100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "-100%" }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed inset-0 z-50 backdrop-blur-md bg-white/60"
          >
            {/* SEARCH CONTAINER (shared border look) */}
            <div className="p-4">
              <div className="relative">
                <div className="bg-white border border-hub-primary rounded-xl shadow-sm overflow-hidden">
                  {/* Input */}
                  <div className="flex items-center px-4 py-3">
                    <MagnifyingGlassIcon className="w-5 h-5 text-hub-primary" />
                    <input
                      type="text"
                      placeholder="Search items..."
                      className="flex-1 ml-3 bg-transparent outline-none text-sm text-gray-900 placeholder-gray-400"
                      value={searchTerm}
                      onChange={handleSearchChange}
                      autoFocus
                    />
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={closeModal}
                      className="ml-2 p-1"
                      aria-label="Close search"
                    >
                      <XMarkIcon
                        aria-label="Close search"
                        className="w-5 h-5 text-gray-400"
                      />
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>

            {/* RESULTS */}
            <div className="px-4">
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <SearchResultsList
                  loading={loading}
                  results={results}
                  isTouched={isTouched}
                  onItemClick={closeModal}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

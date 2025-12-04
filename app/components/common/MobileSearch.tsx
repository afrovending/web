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
    clearSearch(); // Clear search state when closing modal
  };

  return (
    <>
      {/* Search Icon Button */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={openModal}
        className="md:hidden px-2 py-2 flex items-center justify-center bg-red-200 rounded-full text-red-900"
        aria-label="Open search"
      >
        <MagnifyingGlassIcon className="w-5 h-5" />
      </motion.button>

      {/* Full-Screen Search Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: "-100%" }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: "-100%" }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="fixed inset-0 z-50 bg-white"
          >
            {/* Modal Header */}
            <div className="flex items-center w-full p-4 border-b">
              <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search for products..."
                className="flex-1 px-3 py-1 bg-transparent outline-none text-gray-900"
                value={searchTerm}
                onChange={handleSearchChange}
                autoFocus // Automatically focus input on modal open
              />
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={closeModal}
                className="p-1"
                aria-label="Close search"
              >
                <XMarkIcon className="w-6 h-6 text-gray-500" />
              </motion.button>
            </div>

            {/* Modal Body (Results) */}
            <div className="overflow-y-auto h-[calc(100vh-65px)]">
              <SearchResultsList
                loading={loading}
                results={results}
                isTouched={isTouched}
                onItemClick={closeModal}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

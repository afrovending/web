"use client";

import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { useSearch } from "@/hooks/useSearch";
import SearchResultsList from "./SearchResultsList";
import { useState } from "react";

export default function DesktopSearch() {
  const { searchTerm, results, loading, isTouched, handleSearchChange } =
    useSearch();
  const [isFocused, setIsFocused] = useState(false);

  // Show results if the input is focused and there's a search term
  const showResults = isFocused && (searchTerm.length > 0 || loading);

  return (
    <div className="hidden md:flex flex-1 mx-6 relative">
      <div
        className="flex items-center w-full max-w-xl border border-red-50 rounded-full px-4 py-2 bg-red-200 shadow-sm"
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)} // This is simple; a more robust solution might use focus-within
      >
        <MagnifyingGlassIcon className="w-5 h-5 text-red-400" />
        <input
          type="text"
          placeholder="Search for products..."
          className="flex-1 px-3 py-1 bg-transparent outline-none text-gray-900 placeholder-gray-500"
          value={searchTerm}
          onChange={handleSearchChange}
        />
      </div>

      {/* Search Results Dropdown */}
      {showResults && (
        <div className="absolute top-full left-0 w-full max-w-xl mt-2 bg-white shadow-lg rounded-lg z-50 max-h-64 overflow-y-auto border">
          <SearchResultsList
            loading={loading}
            results={results}
            isTouched={isTouched}
            onItemClick={() => setIsFocused(false)} // Close dropdown on click
          />
        </div>
      )}
    </div>
  );
}

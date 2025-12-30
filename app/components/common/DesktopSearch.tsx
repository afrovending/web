"use client";

import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { useSearch } from "@/hooks/useSearch";
import SearchResultsList from "./SearchResultsList";
import { useState, useRef, useEffect } from "react";

export default function DesktopSearch() {
  const { searchTerm, results, loading, isTouched, handleSearchChange } =
    useSearch();
  const [isFocused, setIsFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const showResults = isFocused && (searchTerm.length > 0 || loading);

  // return (
  //   <div className="hidden md:flex flex-1 mx-6 relative " ref={searchRef}>
  //     <div className="flex items-center w-full max-w-xl  border border-hub-primary rounded-md px-4 py-2">
  //       <MagnifyingGlassIcon className="w-5 h-5 text-hub-primary" />
  //       <input
  //         type="text"
  //         placeholder="Search for items..."
  //         className="flex-1 px-3 py-1 bg-transparent outline-none text-gray-900 placeholder-gray-500"
  //         value={searchTerm}
  //         onChange={handleSearchChange}
  //         onFocus={() => setIsFocused(true)}
  //       />
  //     </div>

  //     {showResults && (
  //       <div className="absolute top-full left-0 w-full max-w-xl mt-0.5 bg-white shadow-lg rounded-lg z-50 max-h-64 overflow-y-auto border-b border-hub-primary">
  //         <SearchResultsList
  //           loading={loading}
  //           results={results}
  //           isTouched={isTouched}
  //           onItemClick={() => setIsFocused(false)}
  //         />
  //       </div>
  //     )}
  //   </div>
  // );
 return (
   <div className="hidden md:flex flex-1 mx-6 relative" ref={searchRef}>
     <div className="relative w-full max-w-xl z-9999">
       {/* SHARED BORDER CONTAINER */}
       <div
         className={`
          w-full bg-white overflow-hidden transition-all duration-200
          border rounded-t-xl
          ${
            showResults
              ? "border-hub-primary shadow-lg"
              : "border-gray-200 focus-within:border-hub-primary focus-within:ring-1 focus-within:ring-hub-primary"
          }
        `}
       >
         {/* SEARCH INPUT */}
         <div className="flex items-center px-4 py-3">
           <MagnifyingGlassIcon
             className={`
              w-5 h-5 transition
              ${showResults ? "text-hub-primary" : "text-gray-400"}
            `}
           />
           <input
             type="text"
             placeholder="Search items..."
             className="flex-1 ml-3 bg-transparent outline-none text-sm text-gray-900 placeholder-gray-400"
             value={searchTerm}
             onChange={handleSearchChange}
             onFocus={() => setIsFocused(true)}
           />
         </div>

         {/* FLOATING RESULTS */}
         {showResults && (
           <div className="absolute left-0 right-0 top-full -mt-px bg-white border-b border-l border-r border-hub-primary  rounded-b-xl shadow-lg">
             <SearchResultsList
               loading={loading}
               results={results}
               isTouched={isTouched}
               onItemClick={() => setIsFocused(false)}
             />
           </div>
         )}
       </div>
     </div>
   </div>
 );

}

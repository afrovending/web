"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import debounce from "lodash/debounce";
import { listItems } from "@/lib/api/items";
import Item from "@/interfaces/items";

const DEBOUNCE_TIME = 300;

export function useSearch() {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [isTouched, setIsTouched] = useState(false);

  const limit = 10;
  const offset = 0;

  // Debounced fetch using new API signature
  const debouncedFetchItems = useMemo(() => {
    return debounce(async (query: string) => {
      if (!query.trim()) {
        setResults([]);
        setLoading(false);
        return;
      }

      try {
        const response = await listItems({
          limit,
          offset,
          search: query,
          status: "active",
          type: "products",
        });

        setResults(response?.data || []);
      } catch (error) {
        console.error("Error fetching items:", error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_TIME);
  }, []);

  useEffect(() => {
    return () => {
      debouncedFetchItems.cancel();
    };
  }, [debouncedFetchItems]);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setSearchTerm(value);
      setLoading(true);
      setIsTouched(true);
      debouncedFetchItems(value);
    },
    [debouncedFetchItems]
  );

  const clearSearch = useCallback(() => {
    setSearchTerm("");
    setResults([]);
    setLoading(false);
    setIsTouched(false);
  }, []);

  return {
    searchTerm,
    results,
    loading,
    isTouched,
    handleSearchChange,
    clearSearch,
  };
}

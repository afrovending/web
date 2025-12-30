"use client";

import Link from "next/link";
import { ClipLoader } from "react-spinners";
import Item from "@/interfaces/items";

interface SearchResultsListProps {
  loading: boolean;
  results: Item[];
  isTouched: boolean;
  onItemClick?: () => void;
}

export default function SearchResultsList({
  loading,
  results,
  isTouched,
  onItemClick,
}: SearchResultsListProps) {
  if (loading) {
    return (
      <div className="p-4 flex justify-center items-center">
        <ClipLoader size={24} color="#F97316" />
      </div>
    );
  }

  if (results.length > 0) {
    return (
      <ul className="divide-y divide-gray-100">
        {results.map((item) => (
          <li key={item.id}>
            <Link
              href={`/items/${item.slug}`}
              onClick={onItemClick}
              className="block p-3 hover:bg-hub-primary/10 text-gray-700 transition"
            >
              {item.title}
            </Link>
          </li>
        ))}
      </ul>
    );
  }

  if (isTouched && results.length === 0) {
    return (
      <div className="p-4 text-center text-gray-400">No such item found</div>
    );
  }

  return null;
}

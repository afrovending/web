"use client";

import SelectField, {
  DefaultOption,
} from "@/app/components/common/SelectField";
import React from "react";
import Skeleton from "react-loading-skeleton";

export interface Option extends DefaultOption {}

interface Props {
  types: Option[];
  selectedType: Option;
  onTypeChange: (o: Option) => void;
  categories: Option[];
  categoriesLoading: boolean;
  selectedCategory?: Option | null;
  onCategoryChange: (o: Option) => void;
  categoriesError?: string;
  isTypeDisabled?: boolean; // 1. Add this prop
}

export default function CategorySelector({
  types,
  selectedType,
  onTypeChange,
  categories,
  categoriesLoading,
  selectedCategory,
  onCategoryChange,
  categoriesError,
  isTypeDisabled, // 2. Destructure it
}: Props) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-gray-900">
      {/* Type Selector */}
      <div>
        <SelectField
          label="Type"
          value={selectedType}
          onChange={onTypeChange}
          options={types}
          disabled={isTypeDisabled} // 3. Pass it to your SelectField
        />
        {/* Optional: Add a small hint */}
        {isTypeDisabled && (
          <p className="text-[10px] text-gray-400 mt-1">
            Business type cannot be changed.
          </p>
        )}
      </div>

      {/* Category Selector */}
      <div>
        {categoriesLoading ? (
          <Skeleton height={45} className="mt-6" />
        ) : categoriesError ? (
          <div className="text-sm text-red-500">{categoriesError}</div>
        ) : (
          <SelectField
            label="Category"
            value={selectedCategory ?? categories[0]} // fallback to first category if null
            onChange={onCategoryChange}
            options={categories}
            
          />
        )}
      </div>
    </div>
  );
}

// components/TextareaField.tsx
"use client";

import React from "react";

interface Props {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  limit?: number;
}

export default function TextareaField({
  label,
  value,
  onChange,
  rows = 4,
  limit = 5000,
}: Props) {
  return (
    <div>
      {label && (
        <label className="text-sm font-medium text-gray-700 block mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        <textarea
          rows={rows}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="input"
          maxLength={limit}
        />
        <div className="absolute right-3 bottom-2 text-xs text-gray-400">
          {value.length} / {limit}
        </div>
      </div>
    </div>
  );
}

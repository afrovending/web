// components/TextInput.tsx
"use client";

import React from "react";

interface Props {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  maxLength?: number;
  className?: string;
  disabled?: boolean;

}

export default function TextInput({
  label,
  value,
  onChange,
  placeholder,
  required = false,
  maxLength,
  className = "",
  disabled = false,
}: Props) {
  return (
    <div className={className}>
      {label && (
        <label className="text-sm font-medium text-gray-700 block mb-1">
          {label}
        </label>
      )}
      <input
        className="input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        maxLength={maxLength}
        disabled={disabled}
      />
    </div>
  );
}

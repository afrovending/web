// components/commons/Fields/Textarea.tsx
import React from "react";

interface TextareaProps {
  label: string;
  id: string;
  rows?: number;
  maxLength?: number;
  placeholder?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  value?: string;
}

const Textarea: React.FC<TextareaProps> = ({
  label,
  id,
  rows = 3,
  maxLength = 150,
  placeholder,
  value,
  onChange, // <-- receive
}) => {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="mt-1">
        <textarea
          id={id}
          name={id}
          rows={rows}
          maxLength={maxLength}
          value={value} // <-- bind
          onChange={onChange} // <-- bind
          className="block w-full rounded-md bg-white px-3 py-3 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-green-600 sm:text-sm/6"
          placeholder={placeholder}
        />
      </div>
    </div>
  );
};

export default Textarea;

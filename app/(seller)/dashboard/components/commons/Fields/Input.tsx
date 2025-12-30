// components/commons/Fields/Input.tsx
import React from "react";

interface InputProps {
  label: string;
  id: string;
  type?: string;
  placeholder?: string;
  helpText?: string;
  showHelpText?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  value?: string;
}

const Input: React.FC<InputProps> = ({
  label,
  id,
  type = "text",
  placeholder,
  helpText,
  showHelpText,
  value,
  onChange, // <-- receive
}) => {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-200">
        {label}
      </label>
      <div className="mt-1 w-full">
        <input
          type={type}
          name={id}
          id={id}
          value={value} // <-- bind
          onChange={onChange} // <-- bind
          className="block w-full rounded-md bg-white px-3 py-3 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-green-600 sm:text-sm/6"
          placeholder={placeholder}
        />
      </div>
      {showHelpText && helpText && (
        <p className="mt-2 text-sm text-gray-500">{helpText}</p>
      )}
    </div>
  );
};

export default Input;

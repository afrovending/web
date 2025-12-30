"use client";

import { Fragment } from "react";
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
  Transition,
} from "@headlessui/react";
import { ChevronUpDownIcon, CheckIcon } from "@heroicons/react/20/solid";

type Option = { label: string; value: string; children?: Option[] };

type SelectDropdownProps = {
  options: Option[];
  value: Option;
  onChange: (value: Option) => void;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
};

export default function SelectDropdown({
  options,
  value,
  onChange,
  className = "w-40",
  placeholder = "Select an item",
}: SelectDropdownProps) {
  const displayLabel = value.value === "" ? placeholder : value.label;
  return (
    <Listbox value={value} onChange={onChange}>
      <div className="relative">
        <ListboxButton
          className={`relative w-full cursor-default rounded-lg border border-gray-300 bg-white py-3 pl-3 pr-10 text-left focus:outline-none focus:ring-1 focus:ring-green-800 focus:border-green-800 text-sm transition duration-150 ${className} ${
            value.value === "" ? "text-gray-500" : "text-gray-900"
          }`}
        >
          <span className="block truncate">{displayLabel}</span>

          {/* Chevron Icon */}
          <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center pr-2">
            <ChevronUpDownIcon
              className="h-4 w-4 text-gray-400"
              aria-hidden="true"
            />
          </span>
        </ListboxButton>

        <Transition
          as={Fragment}
          leave="transition ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <ListboxOptions className="absolute z-10 mt-1 max-h-72 w-full overflow-auto rounded-xl bg-white border border-gray-200 py-1 text-sm shadow-lg focus:outline-none">
            {options.map((option) => (
              <ListboxOption
                key={option.value}
                value={option}
                className={({ active }) =>
                  `relative cursor-pointer select-none py-2 pl-10 pr-4 ${
                    active ? "bg-green-50 text-green-700" : "text-gray-700"
                  }`
                }
              >
                {({ selected }) => (
                  <>
                    <span
                      className={`block truncate ${
                        selected ? "font-medium" : "font-normal"
                      }`}
                    >
                      {option.label}
                    </span>
                    {selected && (
                      <span className="absolute inset-y-0 left-2 flex items-center text-hub-secondary">
                        <CheckIcon className="h-4 w-4" aria-hidden="true" />
                      </span>
                    )}
                  </>
                )}
              </ListboxOption>
            ))}
          </ListboxOptions>
        </Transition>
      </div>
    </Listbox>
  );
}

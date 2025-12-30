"use client";

import { Fragment } from "react";
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
  Transition,
} from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/24/outline";

export type DefaultOption = { id: number; name: string };

type SelectFieldProps<T extends DefaultOption> = {
  label?: string;
  value: T;
  onChange: (value: T) => void;
  options: T[];
  disabled?: boolean;
};

// export default function SelectField<T extends DefaultOption>({
//   label,
//   value,
//   onChange,
//   options,
//   disabled,
// }: SelectFieldProps<T>) {
//   return (
//     <div>
//       {label && (
//         <label className="block text-sm font-medium text-gray-700 mb-1">
//           {label}
//         </label>
//       )}
//       <Listbox value={value} onChange={onChange}>
//         <div className="relative mt-1">
//           <ListboxButton className="w-full cursor-default rounded-lg border border-gray-300 bg-white py-3 pl-4 pr-10 text-left shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400">
//             <span className="block truncate">{value?.name ?? label}</span>
//             <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
//               <ChevronUpDownIcon className="h-5 w-5 text-gray-400" />
//             </span>
//           </ListboxButton>

//           <Transition
//             as={Fragment}
//             leave="transition ease-in duration-75"
//             leaveFrom="opacity-100"
//             leaveTo="opacity-0"
//           >
//             <ListboxOptions className="absolute mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white py-2 text-sm shadow-lg ring-1  ring-black/5 focus:outline-none z-40">
//               {options.map((option) => (
//                 <ListboxOption
//                   key={option.id}
//                   value={option}
//                   className={({ active }) =>
//                     `relative cursor-default select-none py-2 pl-10 pr-4 ${
//                       active ? "bg-green-100 text-green-600" : "text-gray-900"
//                     }`
//                   }
//                 >
//                   {({ selected }) => (
//                     <>
//                       <span
//                         className={`block truncate  ${
//                           selected ? "font-medium" : "font-normal"
//                         }`}
//                       >
//                         {option.name}
//                       </span>

//                       {selected ? (
//                         <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-green-600">
//                           <CheckIcon className="h-5 w-5" />
//                         </span>
//                       ) : null}
//                     </>
//                   )}
//                 </ListboxOption>
//               ))}
//             </ListboxOptions>
//           </Transition>
//         </div>
//       </Listbox>
//     </div>
//   );
// }

export default function SelectField<T extends DefaultOption>({
  label,
  value,
  onChange,
  options,
  disabled,
}: SelectFieldProps<T>) {
  return (
    <div>
      {label && (
        <label
          className={`block text-sm font-medium mb-1 ${
            disabled ? "text-gray-400" : "text-gray-700"
          }`}
        >
          {label}
        </label>
      )}

      {/* 1. Pass 'disabled' to the Listbox wrapper */}
      <Listbox value={value} onChange={onChange} disabled={disabled}>
        <div className="relative mt-1">
          {/* 2. Add conditional styles to the ListboxButton */}
          <ListboxButton
            className={`w-full rounded-lg border py-3 pl-4 pr-10 text-left shadow-sm focus:outline-none 
              ${
                disabled
                  ? "bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed shadow-none"
                  : "bg-white border-gray-300 text-gray-900 cursor-default focus:ring-2 focus:ring-green-400"
              }`}
          >
            <span className="block truncate">{value?.name ?? label}</span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <ChevronUpDownIcon
                className={`h-5 w-5 ${
                  disabled ? "text-gray-300" : "text-gray-400"
                }`}
              />
            </span>
          </ListboxButton>

          <Transition
            as={Fragment}
            leave="transition ease-in duration-75"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <ListboxOptions className="absolute mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white py-2 text-sm shadow-lg ring-1 ring-black/5 focus:outline-none z-40">
              {options.map((option) => (
                <ListboxOption
                  key={option.id}
                  value={option}
                  className={({ active }) =>
                    `relative cursor-default select-none py-2 pl-10 pr-4 ${
                      active ? "bg-green-100 text-green-600" : "text-gray-900"
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
                        {option.name}
                      </span>
                      {selected ? (
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-green-600">
                          <CheckIcon className="h-5 w-5" />
                        </span>
                      ) : null}
                    </>
                  )}
                </ListboxOption>
              ))}
            </ListboxOptions>
          </Transition>
        </div>
      </Listbox>
    </div>
  );
}

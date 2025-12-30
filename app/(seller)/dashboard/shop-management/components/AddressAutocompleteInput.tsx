"use client";

interface Props {
  value: string;
  ready: boolean;
  status: string;
  suggestions: any[];
  onChange: (v: string) => void;
  onSelect: (desc: string) => void;
}

export default function AddressAutocompleteInput({
  value,
  ready,
  status,
  suggestions,
  onChange,
  onSelect,
}: Props) {
  return (
    <div className="relative">
      <input
        value={value}
        disabled={!ready}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter your address"
        className="input w-full border p-2 rounded"
      />

      {status === "OK" && (
        <ul className="absolute w-full bg-white border rounded shadow mt-1 max-h-60 overflow-y-auto z-20">
          {suggestions.map(({ place_id, description }) => (
            <li
              key={place_id}
              className="p-2 hover:bg-gray-100 cursor-pointer"
              onClick={() => onSelect(description)}
            >
              {description}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

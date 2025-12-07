"use client";

import GoogleAddress from "@/interfaces/googleAddress";
import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
} from "use-places-autocomplete";

type Props = {
  onSelectAddress: (address: {
    street_address: string;
    city: string;
    state: string;
    zip_code: string;
    country: string;
    lat?: number;
    lng?: number;
  }) => void;
};

export default function AddressAutocomplete({ onSelectAddress }: Props) {
  const {
    ready,
    value,
    setValue,
    suggestions: { status, data },
    clearSuggestions,
  } = usePlacesAutocomplete({
    debounce: 300,
  });

  const handleSelect = async (description: string) => {
    setValue(description, false);
    clearSuggestions();

    try {
      const results = await getGeocode({ address: description });
      const { lat, lng } = await getLatLng(results[0]);

      const components: Record<string, string> = {};

      results[0].address_components.forEach((comp: GoogleAddress) => {
        if (comp.types.includes("street_number"))
          components.street = comp.long_name;

        if (comp.types.includes("route"))
          components.street = (components.street || "") + " " + comp.long_name;

        if (comp.types.includes("locality")) components.city = comp.long_name;

        if (comp.types.includes("administrative_area_level_1"))
          components.state = comp.short_name;

        if (comp.types.includes("postal_code")) components.zip = comp.long_name;

        if (comp.types.includes("country")) {
          components.country = comp.short_name;
        }
      });

      onSelectAddress({
        street_address: components.street || "",
        city: components.city || "",
        state: components.state || "",
        zip_code: components.zip || "",
        country: components.country || "",
        lat,
        lng,
      });
    } catch (error) {
      console.error("Error fetching geocode:", error);
    }
  };

  return (
    <div className="relative">
      <input
        value={value}
        disabled={!ready}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Start typing your address to autofill"
        className="input"
      />

      {status === "OK" && (
        <ul className="absolute bg-white border mt-1 rounded shadow w-full z-10 max-h-60 overflow-y-auto">
          {data.map(({ place_id, description }) => (
            <li
              key={place_id}
              className="p-2 hover:bg-gray-100 cursor-pointer"
              onClick={() => handleSelect(description)}
            >
              {description}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

"use client";

import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
} from "use-places-autocomplete";
import GoogleAddress from "@/interfaces/googleAddress";
import { ALLOWED_COUNTRIES } from "@/setting";
import { getDialCode } from "@/lib/api/ip/countries";

type Address = {
  street_address: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  lat?: number;
  lng?: number;
  dialCode?:string;
};

type Props = {
  onSelect: (addr: Address) => void;
  placeholder?: string;
  countryRestrictions?: string[]; 
};

export default function GoogleAddressAutocomplete({
  onSelect,
  placeholder = "Start typing shop address...",
  countryRestrictions = ALLOWED_COUNTRIES.map((c) => c.toLowerCase()),
}: Props) {
  const {
    ready,
    value,
    setValue,
    suggestions: { status, data },
    clearSuggestions,
  } = usePlacesAutocomplete({
    debounce: 300,
    requestOptions: {
      componentRestrictions: { country: countryRestrictions },
    },
  });

  const handleSelect = async (desc: string) => {
    setValue(desc, false);
    clearSuggestions();

    try {
      const results = await getGeocode({ address: desc });
      if (!results || results.length === 0) return;

      const { lat, lng } = await getLatLng(results[0]);
      const components: Record<string, string> = {};

      results[0].address_components.forEach((comp: GoogleAddress) => {
        if (comp.types.includes("street_number"))
          components.street = comp.long_name;
        if (comp.types.includes("route"))
          components.street = `${components.street ?? ""} ${
            comp.long_name
          }`.trim();
        if (
          comp.types.includes("locality") ||
          comp.types.includes("postal_town")
        )
          components.city = comp.long_name;
        if (comp.types.includes("administrative_area_level_1"))
          components.state = comp.short_name ?? comp.long_name;
        if (comp.types.includes("postal_code")) components.zip = comp.long_name;
        if (comp.types.includes("country"))
          components.country = comp.short_name ?? comp.long_name;
      });

      console.log(results);

       const dialCode = components.country
         ? await getDialCode(components.country)
         : "";

      onSelect({
        street_address: components.street ?? desc,
        city: components.city ?? "",
        state: components.state ?? "",
        zip_code: components.zip ?? "",
        country: components.country ?? "",
        lat,
        lng,
        dialCode,
      });
    } catch (err) {
      console.error("Geocode error:", err);
    }
  };

  return (
    <div className="relative">
      <input
        className="input w-full"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={!ready}
        placeholder={placeholder}
      />

      {status === "OK" && data.length > 0 && (
        <ul className="absolute z-30 w-full bg-white border rounded mt-1 max-h-56 overflow-y-auto shadow">
          {data.map((d) => (
            <li
              key={d.place_id}
              className="p-2 hover:bg-gray-100 cursor-pointer text-sm text-gray-500!"
              onClick={() => handleSelect(d.description)}
            >
              {d.description}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

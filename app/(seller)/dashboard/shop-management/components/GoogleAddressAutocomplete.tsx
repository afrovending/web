"use client";

import { useEffect, useRef, useState } from "react";
import { getDialCode, listAllowedCountries } from "@/lib/api/ip/countries";
import toast from "react-hot-toast";

type Address = {
  street_address: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
  lat?: number;
  lng?: number;
  dialCode?: string;
};

type Props = {
  onSelect: (addr: Address) => void;
  placeholder?: string;
  countryRestrictions?: string[];
};

export default function GoogleAddressAutocomplete({
  onSelect,
  placeholder = "Start typing address...",
  countryRestrictions: initialRestrictions,
}: Props) {
  const [restrictedCountryCodes, setRestrictedCountryCodes] = useState<
    string[]
  >(initialRestrictions || []);
  const [loadingCodes, setLoadingCodes] = useState(!initialRestrictions);

  const [value, setValue] = useState("");
  const [suggestions, setSuggestions] = useState<
    google.maps.places.AutocompleteSuggestion[]
  >([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [sessionToken, setSessionToken] =
    useState<google.maps.places.AutocompleteSessionToken | null>(null);

  const placesLib = useRef<google.maps.PlacesLibrary | null>(null);

  useEffect(() => {
    if (initialRestrictions) return; // Skip if passed via props

    const fetchAllowed = async () => {
      try {
        const response = await listAllowedCountries();
        const codes =
          response.data?.map((c: any) => c.code.toLowerCase()) || [];
        setRestrictedCountryCodes(codes);
      } catch (error) {
        console.error("Failed to fetch country restrictions:", error);
      } finally {
        setLoadingCodes(false);
      }
    };
    fetchAllowed();
  }, [initialRestrictions]);

  useEffect(() => {
    const init = async () => {
      if (typeof window === "undefined") return;
      try {
        const lib = (await google.maps.importLibrary(
          "places"
        )) as google.maps.PlacesLibrary;
        placesLib.current = lib;
        setSessionToken(new lib.AutocompleteSessionToken());
      } catch (error) {
        console.error("Failed to load Google Places library:", error);
      }
    };
    init();
  }, []);

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setValue(val);

    // Added check for loadingCodes to ensure we don't fetch before restrictions are set
    if (val.length > 2 && placesLib.current && sessionToken && !loadingCodes) {
      const { AutocompleteSuggestion } = placesLib.current;

      const request: Parameters<
        typeof AutocompleteSuggestion.fetchAutocompleteSuggestions
      >[0] = {
        input: val,
        includedRegionCodes: restrictedCountryCodes,
        sessionToken: sessionToken,
      };

      try {
        const response =
          await AutocompleteSuggestion.fetchAutocompleteSuggestions(request);
        setSuggestions(response.suggestions || []);
        setActiveIndex(-1);
      } catch (err) {
        console.error("Autocomplete error:", err);
      }
    } else {
      setSuggestions([]);
    }
  };

  const handleSelect = async (
    suggestion: google.maps.places.AutocompleteSuggestion
  ) => {
    const predictionText = suggestion.placePrediction?.text?.text;
    if (!predictionText) return;

    setValue(predictionText);
    setSuggestions([]);

    if (!placesLib.current) return;

    const place = suggestion.placePrediction?.toPlace();
    if (!place) return;

    await place.fetchFields({
      fields: ["addressComponents", "location", "formattedAddress"],
    });

    const lat = place.location?.lat();
    const lng = place.location?.lng();
    const components: Record<string, string> = {
      street: "",
      city: "",
      state: "",
      zip: "",
      country: "",
    };

    place.addressComponents?.forEach((comp) => {
      const types = comp.types;
      if (types.includes("street_number"))
        components.street = comp.longText ?? "";
      if (types.includes("route"))
        components.street = `${components.street} ${
          comp.longText ?? ""
        }`.trim();
      if (types.includes("locality")) components.city = comp.longText ?? "";
      if (types.includes("administrative_area_level_1"))
        components.state = comp.shortText ?? comp.longText ?? "";

      if (types.includes("postal_code")) {
        const code = comp.longText ?? "";
        components.zip = code;
        if (code.replace(/\s/g, "").length < 6) {
          toast.error(
            "Please complete your postal code for accurate shipping rates."
          );
        }
      }
      if (types.includes("country"))
        components.country = comp.shortText ?? comp.longText ?? "";
    });

    const dialCode = components.country
      ? await getDialCode(components.country)
      : "";

    onSelect({
      street_address: components.street || place.formattedAddress || "",
      city: components.city || "",
      state: components.state || "",
      zip_code: components.zip || "",
      country: components.country || "",
      lat,
      lng,
      dialCode,
    });

    setSessionToken(new placesLib.current.AutocompleteSessionToken());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      setActiveIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(suggestions[activeIndex]);
    } else if (e.key === "Escape") {
      setSuggestions([]);
    }
  };

  return (
    <div className="relative w-full">
      <input
        className="input w-full"
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoComplete="off"
      />

      {suggestions.length > 0 && (
        <ul className="absolute z-30 w-full bg-white border rounded mt-1 max-h-56 overflow-y-auto shadow-lg">
          {suggestions.map((s, idx) => {
            // Fix: Guard against null prediction in map
            const text = s.placePrediction?.text?.text;
            if (!text) return null;

            return (
              <li
                key={s.placePrediction?.placeId || idx}
                className={`p-2 cursor-pointer text-sm transition-colors ${
                  activeIndex === idx
                    ? "bg-blue-50 text-blue-700"
                    : "hover:bg-gray-100 text-gray-700"
                }`}
                onClick={() => handleSelect(s)}
              >
                {text}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

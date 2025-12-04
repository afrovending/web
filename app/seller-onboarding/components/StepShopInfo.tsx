"use client";

import SelectField from "@/app/components/common/SelectField";
import { useState, useEffect, useCallback, useMemo } from "react";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { BeatLoader } from "react-spinners";
import { motion, AnimatePresence } from "framer-motion";
import { listCategories } from "@/lib/api/category";
import { saveShop } from "@/lib/api/seller/shop";
import { FaShoppingBag } from "react-icons/fa";
import toast from "react-hot-toast";
import { StepProps } from "@/interfaces/StepProps";
import { locationData } from "@/data/locations";
import { numverifyValidatePhone } from "@/lib/api/ip/route";

interface SelectOption {
  id: number;
  name: string;
  code?: string;
  flag?: string;
  dial_code?: string;
}

interface FadeSlideProps {
  children: React.ReactNode;
  keyId: string | number;
}

const FadeSlide = ({ children, keyId }: FadeSlideProps) => (
  <AnimatePresence mode="wait">
    <motion.div
      key={keyId}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.25 }}
    >
      {children}
    </motion.div>
  </AnimatePresence>
);

export default function StepShopInfo({ onNext }: StepProps) {
  // --- Form State ---
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [description, setDescription] = useState("");

  const [isValidatingPhone, setIsValidatingPhone] = useState(false);
  const [isPhoneValid, setIsPhoneValid] = useState<null | boolean>(null);

  // --- Type & Category State ---
  const types: SelectOption[] = [
    { id: 2, name: "Products" },
    { id: 1, name: "Services" },
  ];
  const [selectedType, setSelectedType] = useState<SelectOption>(types[0]);

  const [categories, setCategories] = useState<SelectOption[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<SelectOption | null>(
    null
  );

  // --- Location State ---
  // Convert locationData to SelectOptions
  const countryOptions: SelectOption[] = useMemo(
    () =>
      locationData.map((c) => ({
        id: c.id,
        name: c.name,
        code: c.code,
        flag: c.flag,
        dial_code: c.dial_code,
      })),
    []
  );

  const [selectedCountry, setSelectedCountry] = useState<SelectOption>(
    countryOptions[0]
  ); // Default to UK (Index 0) or Kenya

  const [stateOptions, setStateOptions] = useState<SelectOption[]>([]);
  const [selectedState, setSelectedState] = useState<SelectOption | null>(null);

  const [cityOptions, setCityOptions] = useState<SelectOption[]>([]);
  const [selectedCity, setSelectedCity] = useState<SelectOption | null>(null);
  const [isCityLoading, setIsCityLoading] = useState(false);

  // --- Submission State ---
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const LIMIT = 5000;

  // 1. Handle Country Change -> Load States
  useEffect(() => {
    const countryData = locationData.find((c) => c.id === selectedCountry.id);
    if (countryData) {
      const states = countryData.states.map((s) => ({
        id: s.id,
        name: s.name,
      }));
      setStateOptions(states);
      // Reset child selections
      setSelectedState(states.length > 0 ? states[0] : null);
      setCityOptions([]);
      setSelectedCity(null);
    }
  }, [selectedCountry]);

  // 2. Handle State Change -> Load Cities
  useEffect(() => {
    if (!selectedState) return;

    setIsCityLoading(true);
    // Simulate small network/processing delay for UX
    const timer = setTimeout(() => {
      const countryData = locationData.find((c) => c.id === selectedCountry.id);
      const stateData = countryData?.states.find(
        (s) => s.id === selectedState.id
      );

      if (stateData) {
        const cities = stateData.cities.map((c) => ({
          id: c.id,
          name: c.name,
        }));
        setCityOptions(cities);
        setSelectedCity(cities.length > 0 ? cities[0] : null);
      } else {
        setCityOptions([]);
        setSelectedCity(null);
      }
      setIsCityLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [selectedState, selectedCountry]);

  // 3. Handle Category Loading
  useEffect(() => {
    const fetchCategories = async () => {
      setCategoriesLoading(true);
      setCategoriesError("");
      setCategories([]);
      setSelectedCategory(null);

      const typeString = selectedType.name.toLowerCase();

      try {
        const response = await listCategories(50, 0, undefined, typeString);

        const formatted: SelectOption[] =
          response?.categories?.map((cat: any) => ({
            id: cat.id,
            name: cat.name,
          })) ?? [];

        setCategories(formatted);
        setSelectedCategory(formatted[0] ?? null);
      } catch (err: any) {
        console.error("Failed to load categories:", err);
        setCategoriesError("Failed to load categories. Please try again.");
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, [selectedType]);

  const validatePhoneNumber = useCallback(async () => {
    if (!phoneNumber || phoneNumber.length < 7) {
      setIsPhoneValid(null);
      return;
    }

    setIsValidatingPhone(true);

    try {
      const fullNumber = `${selectedCountry.dial_code?.replace(
        "+",
        ""
      )}${phoneNumber}`;

      const data = await numverifyValidatePhone({
        number: fullNumber,
        countryCode: selectedCountry.code ?? "",
      });

      setIsPhoneValid(data.valid === true);
    } catch (err) {
      console.error("Phone validation failed:", err);
      setIsPhoneValid(false);
    }

    setIsValidatingPhone(false);
  }, [phoneNumber, selectedCountry]);

  useEffect(() => {
    const timer = setTimeout(() => {
      validatePhoneNumber();
    }, 600); // wait 0.6 sec after typing stops

    return () => clearTimeout(timer);
  }, [phoneNumber, validatePhoneNumber]);

  const handleDescriptionChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const currentLength = e.target.value.length;
      setDescription(e.target.value);

      const counter = e.target.nextElementSibling as HTMLElement | null;
      if (!counter) return;

      counter.textContent = `${currentLength} / ${LIMIT}`;
      if (currentLength > LIMIT * 0.9) {
        counter.classList.replace("text-gray-400", "text-red-500");
      } else {
        counter.classList.replace("text-red-500", "text-gray-400");
      }
    },
    [LIMIT]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCategory || categories.length === 0) {
      setErrorMsg("Please select a valid category.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const formData = new FormData();

      // Form Data
      formData.append("name", name);
      formData.append("address", address);
      formData.append("description", description);

      formData.append("phone", phoneNumber);

      formData.append("type", selectedType.name.toLowerCase());

      // Location details
      formData.append("country", selectedCountry.name); // Now dynamic
      formData.append("state", selectedState?.name || "");
      formData.append("city", selectedCity?.name || "");

      formData.append("category_id", String(selectedCategory.id));

      formData.append("logo", "");
      formData.append("banner", "");

      const response = await saveShop(formData);

      if (response.status === "success") {
        toast.success("Shop Info saved successfully!");
        onNext({ shopId: response.data.id });
      } else {
        setErrorMsg(
          response.message || "Shop could not be created. Try again."
        );
        toast.error(
          response.message || "Shop could not be created. Try again."
        );
      }
    } catch (error: any) {
      setErrorMsg(
        error?.response?.data?.message ?? "An unknown error occurred."
      );
      toast.error(
        error?.response?.data?.message ?? "An unknown error occurred."
      );
    } finally {
      setLoading(false);
    }
  };

  const isFormDisabled =
    loading ||
    categoriesLoading ||
    !selectedCategory ||
    !selectedCountry ||
    !selectedState ||
    isPhoneValid !== true;
  !selectedCity;

  return (
    <div className="h-full">
      <div className="border border-red-100 p-4 rounded-md mb-6">
        <h2 className="text-lg font-semibold flex items-center">
          <FaShoppingBag className="text-red-800 text-xl mr-2" size={24} />
          Shop or Business Information
        </h2>
        <p className="text-sm mt-1 text-gray-600">
          Please provide your shop or business details to get started.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 text-gray-900">
        {/* ERROR MESSAGE */}
        {errorMsg && (
          <div className="p-3 text-red-700 bg-red-100 rounded-md text-sm">
            {errorMsg}
          </div>
        )}

        <FadeSlide keyId="country-select">
          <SelectField
            label="Country"
            value={selectedCountry}
            onChange={setSelectedCountry}
            options={countryOptions}
          />
        </FadeSlide>

        {/* <div>
          <label className="text-sm font-medium mb-1 block">
            Shop/Business phone number
          </label>
          <div className="flex items-center">
            <div className="flex items-center justify-center h-[45px] px-3 border border-gray-300 border-r-0 rounded-l-lg bg-gray-50 text-gray-600 text-sm min-w-[90px]">
              <span className="mr-2 text-lg">{selectedCountry.flag}</span>
              <span>{selectedCountry.dial_code}</span>
            </div>

            <input
              className="flex-1 h-[45px] border border-gray-300 rounded-r-lg px-3 focus:ring-2 focus:ring-red-500 outline-none"
              type="tel"
              placeholder="712 345 678"
              maxLength={15}
              minLength={9}
              value={phoneNumber}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "");
                setPhoneNumber(val);
              }}
              required
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Enter number without the country code.
          </p>
        </div> */}
        <div>
          <label className="text-sm font-medium mb-1 block">
            Shop/Business phone number
          </label>

          <div className="flex items-center">
            {/* Country */}
            <div className="flex items-center justify-center h-[45px] px-3 border border-gray-300 border-r-0 rounded-l-lg bg-gray-50 text-gray-600 text-sm min-w-[90px]">
              <span className="mr-2 text-lg">{selectedCountry.flag}</span>
              <span>{selectedCountry.dial_code}</span>
            </div>

            {/* Input */}
            <input
              className="flex-1 h-[45px] border border-gray-300 rounded-r-lg px-3 focus:ring-2 focus:ring-red-500 outline-none"
              type="tel"
              placeholder="712 345 678"
              value={phoneNumber}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "");
                setPhoneNumber(val);
              }}
              required
            />

            {/* Validation Icon */}
            <div className="ml-2 w-6">
              {isValidatingPhone && <BeatLoader size={6} />}

              {!isValidatingPhone && isPhoneValid === true && (
                <span className="text-green-600 text-xl">👍</span>
              )}

              {!isValidatingPhone && isPhoneValid === false && (
                <span className="text-red-600 text-xl">👎</span>
              )}
            </div>
          </div>

          {isPhoneValid === false && (
            <h2 className="text-xs text-red-500! mt-1">
              Invalid phone number. Please enter a valid number.
            </h2>
          )}
        </div>

        {/* Shop Name */}
        <div>
          <label className="text-sm font-medium mb-1 block">
            Shop/Business name
          </label>
          <input
            className="input"
            placeholder="Shop Name"
            maxLength={50}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        {/* Type */}
        <FadeSlide keyId={selectedType.id}>
          <SelectField
            label="Shop/Business type"
            value={selectedType}
            onChange={setSelectedType}
            options={types}
          />
        </FadeSlide>

        {/* Category */}
        <div>
          <label className="text-sm font-medium mb-1 block">
            Shop/Business category
          </label>

          {categoriesLoading ? (
            <Skeleton height={45} borderRadius={10} />
          ) : categoriesError ? (
            <div className="text-red-500 text-sm">{categoriesError}</div>
          ) : (
            <FadeSlide
              keyId={selectedType.id + "-" + (selectedCategory?.id ?? "none")}
            >
              {categories.length > 0 && selectedCategory ? (
                <SelectField
                  label=""
                  value={selectedCategory}
                  onChange={setSelectedCategory}
                  options={categories}
                />
              ) : (
                <div className="h-[45px] flex items-center justify-center rounded-lg border bg-gray-50 text-gray-500 text-sm">
                  No categories available for {selectedType.name}
                </div>
              )}
            </FadeSlide>
          )}
        </div>

        {/* Address */}
        <div>
          <label className="text-sm font-medium mb-1 block">
            Shop/Business address
          </label>
          <input
            className="input"
            placeholder="Shop Address (Street, Building, etc)"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
          />
        </div>

        {/* State / Province / County */}
        <div>
          <label className="text-sm font-medium mb-1 block">
            State / Province / County
          </label>
          <FadeSlide keyId={"state-" + selectedCountry.id}>
            {stateOptions.length > 0 && selectedState ? (
              <SelectField
                label=""
                value={selectedState}
                onChange={setSelectedState}
                options={stateOptions}
              />
            ) : (
              <div className="h-[45px] flex items-center justify-center rounded-lg border bg-gray-50 text-gray-500 text-sm">
                No states available
              </div>
            )}
          </FadeSlide>
        </div>

        {/* City */}
        <div>
          <label className="text-sm font-medium mb-1 flex items-center gap-2">
            City
            {isCityLoading && <BeatLoader size={6} />}
          </label>

          <FadeSlide
            keyId={isCityLoading ? "loading" : selectedCity?.id || "empty"}
          >
            {isCityLoading ? (
              <Skeleton height={45} borderRadius={10} />
            ) : cityOptions.length === 0 ? (
              <div className="h-[45px] flex items-center justify-center rounded-lg border bg-gray-50 text-gray-500 text-sm">
                No cities available for this region
              </div>
            ) : (
              <SelectField
                label=""
                value={selectedCity!}
                onChange={setSelectedCity}
                options={cityOptions}
              />
            )}
          </FadeSlide>
        </div>

        {/* Description */}
        <div>
          <label className="text-sm font-medium mb-1 block">
            Shop/Business description
          </label>

          <div className="relative">
            <textarea
              className="input pr-16"
              placeholder="Tell us about your shop/business..."
              rows={5}
              maxLength={LIMIT}
              minLength={500}
              value={description}
              onChange={handleDescriptionChange}
              required
            />

            <span className="absolute bottom-2 right-3 text-xs text-gray-400">
              {description.length} / {LIMIT}
            </span>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="btn-primary w-full"
          disabled={isFormDisabled}
        >
          {loading ? (
            <>
              <BeatLoader size={8} color="white" /> Creating Shop...
            </>
          ) : (
            "Continue"
          )}
        </button>
      </form>
    </div>
  );
}

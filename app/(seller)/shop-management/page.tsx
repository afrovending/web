"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { listCategories } from "@/lib/api/category";
import {
  getMyShop,
  saveShop,
  updateShopLogo,
  updateShopBanner,
} from "@/lib/api/seller/shop";
import { numverifyValidatePhone } from "@/lib/api/ip/route";
import toast from "react-hot-toast";
import { BeatLoader } from "react-spinners";
import { StepProps } from "@/interfaces/StepProps";
import ShopHeaderCard from "./components/ShopHeaderCard";
import TextInput from "./components/TextInput";
import CategorySelector from "./components/CategorySelector";
import FadeSlide from "./components/FadeSlide";
import GoogleAddressAutocomplete from "./components/GoogleAddressAutocomplete";
import PhoneInput from "./components/PhoneInput";
import TextareaField from "./components/TextareaField";
import ImageUploader from "./components/ImageUploader";
import { Option } from "./components/CategorySelector";
import { FaPencil } from "react-icons/fa6";

interface SelectOption {
  id: number;
  name: string;
  code?: string;
  flag?: string;
  dial_code?: string;
}

export default function StepShopInfo({ onNext }: StepProps) {
  // form state
  const [name, setName] = useState<string>("");
  const [shopId, setShopId] = useState<number | null>(null);

  const [addressLine, setAddressLine] = useState("");
  const [city, setCity] = useState("");
  const [stateCode, setStateCode] = useState("");
  const [zip, setZip] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [lat, setLat] = useState<number | undefined>(undefined);
  const [lng, setLng] = useState<number | undefined>(undefined);

  const [phoneNumber, setPhoneNumber] = useState("");
  const [description, setDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  // types + categories
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

  // phone validation
  const [isValidatingPhone, setIsValidatingPhone] = useState(false);
  const [isPhoneValid, setIsPhoneValid] = useState<boolean | null>(null);

  const LIMIT = 5000;

  // load shop
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setInitialLoading(true);
      try {
        const res = await getMyShop();
        if (cancelled) return;
        if (res?.status === "success") {
          const shop = res.data;
          setName(shop.name);
          setShopId(shop.id ?? null);
          setAddressLine(shop.address || "");
          setDescription(shop.description || "");
          setPhoneNumber(shop.phone || "");
          setLogoUrl(shop.logo ?? null);
          setBannerUrl(shop.banner ?? null);
          if (shop.category)
            setSelectedCategory({
              id: shop.category.id,
              name: shop.category.name,
            });

          if (shop.city) setCity(shop.city);
          if (shop.zip) setZip(shop.zip);
          if (shop.country) setCountryCode(shop.country);
          if (shop.state) setStateCode(shop.state);
        }
      } catch (err) {
        console.error("load shop failed", err);
      } finally {
        setInitialLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // load categories on type change
  useEffect(() => {
    let cancelled = false;
    const loadCats = async () => {
      setCategoriesLoading(true);
      setCategoriesError("");
      try {
        const r = await listCategories(
          50,
          0,
          undefined,
          selectedType.name.toLowerCase()
        );
        if (cancelled) return;
        const formatted = (r?.categories ?? []).map((c: any) => ({
          id: c.id,
          name: c.name,
        }));
        setCategories(formatted);
        setSelectedCategory((prev) => {
          if (!prev) return formatted[0] ?? null;
          const keep = formatted.find((f: Option) => f.id === prev.id);
          return keep ?? formatted[0] ?? null;
        });
      } catch (err) {
        console.error(err);
        setCategoriesError("Failed to load categories.");
      } finally {
        setCategoriesLoading(false);
      }
    };
    loadCats();
    return () => {
      cancelled = true;
    };
  }, [selectedType]);

  // phone validation
  const validatePhoneNumber = useCallback(async () => {
    if (!phoneNumber || phoneNumber.length < 7) {
      setIsPhoneValid(null);
      return;
    }
    setIsValidatingPhone(true);
    try {
      const fullNumber = `${phoneNumber}`;
      const data = await numverifyValidatePhone({
        number: fullNumber,
        countryCode: countryCode ?? "",
      });
      setIsPhoneValid(data.valid === true);
    } catch (err) {
      setIsPhoneValid(false);
    } finally {
      setIsValidatingPhone(false);
    }
  }, [phoneNumber, countryCode]);

  useEffect(() => {
    const timer = setTimeout(() => validatePhoneNumber(), 600);
    return () => clearTimeout(timer);
  }, [phoneNumber, validatePhoneNumber]);

  // Google address selection handler
  const handleAddressSelect = (addr: {
    street_address: string;
    city: string;
    state: string;
    zip_code: string;
    country: string;
    lat?: number;
    lng?: number;
  }) => {
    setAddressLine(addr.street_address);
    setCity(addr.city);
    setStateCode(addr.state);
    setZip(addr.zip_code);
    setCountryCode(addr.country);
    setLat(addr.lat);
    setLng(addr.lng);
  };
 

  const handleBannerFile = async (file?: File) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large. Max 5 MB.");
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setBannerUrl(previewUrl); // instant preview

    try {
      const resp = await(
        shopId
          ? updateShopBanner(shopId, file)
          : Promise.reject("Shop ID is missing")
      );
      // Show toast based on API response message
      if (resp?.status === "success") {
        toast.success(resp?.message ?? "Banner uploaded successfully");
      } else {
        toast.error(resp?.message ?? "Banner upload failed");
      }
    } catch (err) {
      console.error("Banner upload failed", err);
      toast.error("Banner upload failed. Try again.");
      setBannerUrl(null);
    }
  };

  const handleLogoFile = async (file?: File) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large. Max 5 MB.");
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setLogoUrl(previewUrl); // instant preview

    try {
      const resp = await(
        shopId
          ? updateShopLogo(shopId, file)
          : Promise.reject("Shop ID is missing")
      );
      // Show toast based on API response message
      if (resp?.status === "success") {
        toast.success(resp?.message ?? "Logo uploaded successfully");
      } else {
        toast.error(resp?.message ?? "Logo upload failed");
      }
    } catch (err) {
      console.error("Logo upload failed", err);
      toast.error("Logo upload failed. Try again.");
      setLogoUrl(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCategory) return setErrorMsg("Please pick a category.");
    setLoading(true);
    setErrorMsg("");
    try {
      const form = new FormData();
      form.append("name", name || "");
      form.append("address", addressLine || "");
      form.append("description", description || "");
      form.append("phone", phoneNumber || "");
      form.append("type", selectedType.name.toLowerCase());
      form.append("country", countryCode || "");
      form.append("state", stateCode || "");
      form.append("city", city || "");
      form.append("zip", zip || "");
      form.append("category_id", String(selectedCategory.id));

      // If your backend expects logo/banner URLs, send them
      if (logoUrl) form.append("logo_url", logoUrl);
      if (bannerUrl) form.append("banner_url", bannerUrl);

      const response = await saveShop(form);

      if (response.status === "success") {
        toast.success("Shop updated successfully");
        onNext?.({ shopId: response.data.id });
      } else {
        setErrorMsg(response.message || "Could not save shop.");
        toast.error(response.message || "Could not save shop.");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err?.response?.data?.message || "Unknown error");
      toast.error(err?.response?.data?.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const isFormDisabled =
    loading || categoriesLoading || !selectedCategory || isPhoneValid === false;

  return (
    <div className="mx-auto">
      <ShopHeaderCard subtitle="Update your shop details — use autocomplete for fast address entry." />
      <div className="relative w-full">
        {/* Banner */}
        <div className="w-full h-40 sm:h-56 bg-gray-100 overflow-hidden relative">
          {bannerUrl ? (
            <img
              src={bannerUrl}
              alt="Banner"
              className="w-full h-full object-cover rounded-t-xl"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              No banner
            </div>
          )}

          {/* Pencil Icon for Banner */}
          <label className="absolute top-2 right-2 p-2 bg-white rounded-full cursor-pointer shadow hover:bg-gray-100">
            <FaPencil className="text-orange-700" />
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) =>
                e.target.files && handleBannerFile(e.target.files[0])
              }
            />
          </label>
        </div>

        {/* Logo - overlaps banner */}
        <div className="absolute left-4 -translate-y-1/2 top-full w-24 h-24 sm:w-32 sm:h-32 border-2 border-orange-900 rounded-full overflow-hidden bg-gray-50 shadow-xl">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="Logo"
              className="w-full h-full object-cover rounded-full"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              No logo
            </div>
          )}

          {/* Pencil Icon for Logo */}
          <label className="absolute bottom-1 right-1 p-2 bg-white rounded-full cursor-pointer shadow hover:bg-gray-100">
            <FaPencil className="text-orange-700 text-sm sm:text-base" />
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) =>
                e.target.files && handleLogoFile(e.target.files[0])
              }
            />
          </label>
        </div>
      </div>

      {/* Spacer so content below doesn't overlap logo */}
      <div className="h-16 sm:h-20" />

      {initialLoading ? (
        <div className="space-y-4">
          <div className="h-12 bg-gray-100 rounded w-1/3 animate-pulse" />
          <div className="h-40 bg-gray-100 rounded animate-pulse" />
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="space-y-6 bg-white border rounded p-6 shadow-sm"
        >
          {errorMsg && (
            <div className="p-3 text-red-700 bg-red-100 rounded text-sm">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4">
            <TextInput
              label="Shop name"
              value={name}
              onChange={setName}
              placeholder="Shop name"
              required
              maxLength={50}
            />

            <CategorySelector
              types={types}
              selectedType={selectedType}
              onTypeChange={setSelectedType}
              categories={categories}
              categoriesLoading={categoriesLoading}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              categoriesError={categoriesError}
            />

            <FadeSlide keyId="address">
              <GoogleAddressAutocomplete onSelect={handleAddressSelect} />
            </FadeSlide>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <TextInput label="City" value={city} onChange={setCity} />
              </div>
              <div>
                <TextInput label="ZIP" value={zip} onChange={setZip} />
              </div>
              <div>
                <TextInput
                  label="State"
                  value={stateCode}
                  onChange={setStateCode}
                />
              </div>
            </div>

            <PhoneInput
              countryFlag={countryCode ?? ""}
              dialCode={""}
              value={phoneNumber}
              onChange={setPhoneNumber}
              validating={isValidatingPhone}
              valid={isPhoneValid}
            />

            <TextInput
              label="Address (street / building)"
              value={addressLine}
              onChange={setAddressLine}
              placeholder="Street address"
              required
            />

            <TextareaField
              label="Description"
              value={description}
              onChange={setDescription}
              rows={5}
              limit={LIMIT}
            /> 
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isFormDisabled}
              className={`w-full h-11 rounded bg-orange-600 text-white font-semibold ${
                isFormDisabled
                  ? "opacity-60 cursor-not-allowed"
                  : "hover:bg-orange-700"
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <BeatLoader size={6} color="white" /> Saving...
                </span>
              ) : (
                "Update Shop"
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

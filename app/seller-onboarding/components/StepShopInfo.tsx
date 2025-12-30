"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import toast from "react-hot-toast";
import { BeatLoader } from "react-spinners";
import { FaPencil } from "react-icons/fa6";

import { listCategories } from "@/lib/api/category";
import {
  getMyShop,
  saveShop,
  updateShopLogo,
  updateShopBanner,
} from "@/lib/api/seller/shop";
import { numverifyValidatePhone } from "@/lib/api/ip/route";
import { StepProps } from "@/interfaces/StepProps";

import { countryCodeToFlag } from "@/utils/countryFlag";
import CategorySelector from "@/app/(seller)/dashboard/shop-management/components/CategorySelector";
import GoogleAddressAutocomplete from "@/app/(seller)/dashboard/shop-management/components/GoogleAddressAutocomplete";
import PhoneInput from "@/app/(seller)/dashboard/shop-management/components/PhoneInput";
import ShopHeaderCard from "@/app/(seller)/dashboard/shop-management/components/ShopHeaderCard";
import TextareaField from "@/app/(seller)/dashboard/shop-management/components/TextareaField";
import TextInput from "@/app/(seller)/dashboard/shop-management/components/TextInput";
import { getAddress } from "@/lib/api/auth/shipping";
import { DefaultOption } from "@/app/components/common/SelectField";
import FadeSlide from "@/app/(seller)/dashboard/shop-management/components/FadeSlide";

export interface Option extends DefaultOption {}

interface SelectOption {
  id: number;
  name: string;
  code?: string;
  flag?: string;
  dial_code?: string;
}

const TYPES: SelectOption[] = [
  { id: 2, name: "Products" },
  { id: 1, name: "Services" },
];

export default function StepShopInfo({ onNext }: StepProps) {
  // --- Internal Persistence Flag ---
  const [hasExistingShop, setHasExistingShop] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // --- Form States ---
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [description, setDescription] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [addressLine, setAddressLine] = useState("");
  const [city, setCity] = useState("");
  const [stateCode, setStateCode] = useState("");
  const [zip, setZip] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [lat, setLat] = useState<number | undefined>(undefined);
  const [lng, setLng] = useState<number | undefined>(undefined);

  // --- Media & UI States ---
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [bannerUrl, setBannerUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const [selectedType, setSelectedType] = useState(TYPES[0]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<any | null>(null);
  const [isPhoneValid, setIsPhoneValid] = useState<boolean | null>(null);
  const [isValidatingPhone, setIsValidatingPhone] = useState(false);
  const [dialCode, setDialCode] = useState("");

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

  useEffect(() => {
    let isMounted = true;
    const loadAccountData = async () => {
      try {
        const [shopRes, addrRes] = await Promise.all([
          getMyShop().catch(() => null),
          getAddress().catch(() => null),
        ]);

        if (!isMounted) return;

        if (shopRes?.status === "success" && shopRes.data) {
          const s = shopRes.data;
          setHasExistingShop(true);
          setName(s.name || "");
          if (s.type) {
            const foundType = TYPES.find(
              (t) => t.name.toLowerCase() === s.type.toLowerCase()
            );
            if (foundType) setSelectedType(foundType);
          }
          setDescription(s.description || "");
          setLogoUrl(s.logo);
          setBannerUrl(s.banner);
          if (s.category) setSelectedCategory(s.category);
        }

        if (addrRes) {
          setAddressLine(addrRes.street_address || "");
          setCity(addrRes.city || "");
          setPhoneNumber(addrRes.phone || "");
          setZip(addrRes.zip_code || "");
          setCountryCode(addrRes.country || "");
          setStateCode(addrRes.state || "");
          setLat(addrRes.lat);
          setLng(addrRes.lng);
        }
      } finally {
        if (isMounted) setInitialLoading(false);
      }
    };
    loadAccountData();
    return () => {
      isMounted = false;
    };
  }, []);

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
        setSelectedCategory((prev: any) => {
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

  const handleMediaChange = async (file: File, mode: "logo" | "banner") => {
    const localPreview = URL.createObjectURL(file);
    mode === "logo" ? setLogoUrl(localPreview) : setBannerUrl(localPreview);

    if (hasExistingShop) {
      const uploadPromise =
        mode === "logo" ? updateShopLogo(file) : updateShopBanner(file);

      toast.promise(uploadPromise, {
        loading: `Uploading your ${mode}...`,
        success: (res) => {
          if (res.status !== "success") throw new Error(res.message);
          return `${mode} updated!`;
        },
        error: (err) => `Upload failed: ${err.message || "Unknown error"}`,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      const form = new FormData();
      // Required Fields
      form.append("name", name);
      form.append("description", description);
      form.append("phone", phoneNumber);
      form.append("category_id", String(selectedCategory?.id));
      form.append("type", selectedType.name.toLowerCase());

      // Address Data
      form.append("address", addressLine);
      form.append("city", city);
      form.append("state", stateCode);
      form.append("zip", zip);
      form.append("country", countryCode);

      if (lat !== undefined) form.append("lat", String(lat));
      if (lng !== undefined) form.append("lng", String(lng));

      const res = await saveShop(form);

      if (res.status === "success") {
        toast.success(hasExistingShop ? "Shop updated!" : "Shop created!");
        onNext?.();
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || "Something went wrong";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const [googleLoaded, setGoogleLoaded] = useState(false);

  useEffect(() => {
    if ((window.google as any)?.maps?.places) {
      setGoogleLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
    script.async = true;
    script.onload = () => setGoogleLoaded(true);
    document.head.appendChild(script);

    return () => {
      script.remove();
    };
  }, []);

  const handleAddressSelect = (addr: {
    street_address: string;
    city: string;
    state: string;
    zip_code: string;
    country: string;
    lat?: number;
    lng?: number;
    dialCode?: string;
  }) => {
    setAddressLine(addr.street_address);
    setCity(addr.city);
    setStateCode(addr.state);
    setZip(addr.zip_code);
    setCountryCode(addr.country);
    setLat(addr.lat);
    setLng(addr.lng);
    setDialCode(addr.dialCode ?? "");
  };

  if (initialLoading)
    return (
      <div className="flex flex-col items-center justify-center min-h-100">
        <BeatLoader color="#ea580c" />
        <p className="text-sm text-gray-500 mt-4">Syncing vendor profile...</p>
      </div>
    );

  return (
    <div className=" mx-auto pb-20">
      <ShopHeaderCard subtitle="Your identity on the platform. Keep your info up to date." />

      {/* Visual Identity Section */}
      <div className="relative mb-24">
        <div className="w-full h-52 bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 group relative">
          {bannerUrl ? (
            <img
              src={bannerUrl}
              className="w-full h-full object-cover"
              alt="Banner"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400">
              No Banner Uploaded
            </div>
          )}
          <label className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer flex items-center justify-center">
            <div className="bg-white p-3 rounded-full shadow-lg">
              <FaPencil className="text-green-600" />
            </div>
            <input
              type="file"
              className="hidden"
              onChange={(e) =>
                e.target.files?.[0] &&
                handleMediaChange(e.target.files[0], "banner")
              }
            />
          </label>
        </div>

        <div className="absolute -bottom-16 left-10 group/logo">
          <div className="w-32 h-32 rounded-full border-4 border-white bg-white shadow-xl overflow-hidden relative">
            {logoUrl ? (
              <img
                src={logoUrl}
                className="w-full h-full object-cover"
                alt="Logo"
              />
            ) : (
              <div className="h-full bg-slate-50" />
            )}
            <label className="absolute inset-0 bg-black/40 opacity-0 group-hover/logo:opacity-100 transition-opacity cursor-pointer flex items-center justify-center">
              <FaPencil className="text-white" />
              <input
                type="file"
                className="hidden"
                onChange={(e) =>
                  e.target.files?.[0] &&
                  handleMediaChange(e.target.files[0], "logo")
                }
              />
            </label>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-10">
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
          <TextInput
            label="Official Shop Name"
            value={name}
            onChange={setName}
            required
          />
          <CategorySelector
            types={TYPES}
            selectedType={selectedType}
            onTypeChange={setSelectedType}
            categories={categories}
            categoriesLoading={categoriesLoading}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            categoriesError={categoriesError}
            isTypeDisabled={hasExistingShop} // 4. Pass the flag here
          />
        </section>

        <section className="space-y-6 bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800">
            Operational Address
          </h3>
          <FadeSlide keyId="address">
            {googleLoaded && (
              <GoogleAddressAutocomplete onSelect={handleAddressSelect} />
            )}
          </FadeSlide>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-80">
            <TextInput label="City" value={city} onChange={setCity} disabled />

            <TextInput
              label="Postal Code"
              value={zip}
              onChange={setZip}
              disabled
            />
            <TextInput
              label="Province"
              value={stateCode}
              onChange={setStateCode}
              disabled
            />
            <TextInput
              label="Street Address"
              value={addressLine}
              onChange={setAddressLine}
              placeholder="street / building no"
              required
            />
          </div>

          <PhoneInput
            countryFlag={countryCodeToFlag(countryCode)}
            dialCode={dialCode ?? ""}
            value={phoneNumber}
            onChange={setPhoneNumber}
            validating={isValidatingPhone}
            valid={isPhoneValid}
          />
        </section>

        <TextareaField
          label="About the Shop"
          value={description}
          onChange={setDescription}
          rows={4}
        />

        <button
          type="submit"
          disabled={loading}
          className="btn btn-primary gap-3 w-full"
        >
          {loading ? (
            <BeatLoader size={8} color="white" />
          ) : hasExistingShop ? (
            "Update Shop Profile"
          ) : (
            "Create & Continue"
          )}
        </button>
      </form>
    </div>
  );
}

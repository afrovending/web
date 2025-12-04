"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import Image from "next/image";
import { updateShopLogo, updateShopBanner } from "@/lib/api/seller/shop";
import { FaFlagCheckered } from "react-icons/fa";

type StepImagesProps = { shopId: number; onNext?: (data?: any) => void };

export default function StepImages({ shopId, onNext }: StepImagesProps) {
  const [logo, setLogo] = useState<File | null>(null);
  const [banner, setBanner] = useState<File | null>(null);

  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);

  // VALIDATION LIMITS
  const LOGO_MAX_MB = 2;
  const BANNER_MAX_MB = 3;

  const validateFile = (file: File, maxMb: number, type: "logo" | "banner") => {
    if (!file) return false;

    const fileMb = file.size / (1024 * 1024);

    if (fileMb > maxMb) {
      toast.error(
        `${type.toUpperCase()} size must not exceed ${maxMb}MB. Selected file is ${fileMb.toFixed(
          1
        )}MB`
      );
      return false;
    }

    return true;
  };

  // Handle Logo Upload Preview
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!validateFile(file, LOGO_MAX_MB, "logo")) return;

    setLogo(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  // Handle Banner Upload Preview
  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!validateFile(file, BANNER_MAX_MB, "banner")) return;

    setBanner(file);
    setBannerPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!logo && !banner) {
      toast.error("Please upload at least one image.");
      return;
    }

    setLoading(true);

    try {
      // Upload Logo
      if (logo) {
        await updateShopLogo(shopId, logo);
      }

      // Upload Banner
      if (banner) {
        await updateShopBanner(shopId, banner);
      }
      onNext && onNext();
      toast.success("Images uploaded successfully!");
    } catch (error: any) {
      console.error(error);
      toast.error("Upload failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="border border-red-100 p-4 rounded-md mb-6">
        <h2 className="text-lg font-semibold flex items-center">
          <FaFlagCheckered className="text-red-800 text-xl mr-2" size={24} />
          Shop or Business Images
        </h2>
        <p className="text-sm mt-1 text-gray-600">
          Please provide your shop or business images to get attracted to
          customers.
        </p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-6 text-gray-700">
        <h2 className="text-xl font-semibold mb-3">Business Images</h2>

        {/* LOGO UPLOAD */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Shop Logo (max 1 MB)</label>

          <div
            onClick={() => document.getElementById("logoUploader")?.click()}
            className="border-2 border-dashed border-gray-300 rounded-md h-40 w-full flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition"
          >
            {logoPreview ? (
              <div className="relative w-full h-full">
                <Image
                  src={logoPreview}
                  alt="Logo Preview"
                  layout="fill"
                  className="rounded object-contain p-2"
                />
              </div>
            ) : (
              <div className="flex flex-col items-center text-gray-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-10 w-10 mb-2 opacity-70"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M3 15a4 4 0 014-4h10a4 4 0 110 8H7a4 4 0 01-4-4zm3-4a4 4 0 114 4 4 4 0 01-4-4zm10 0a4 4 0 114 4 4 4 0 01-4-4z"
                  />
                </svg>
                <span className="text-sm">Click to upload logo</span>
              </div>
            )}
          </div>

          <input
            id="logoUploader"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleLogoChange}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Shop Banner (max 3 MB)</label>

          <div
            onClick={() => document.getElementById("bannerUploader")?.click()}
            className="border-2 border-dashed border-gray-300 rounded-md h-40 w-full flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition"
          >
            {bannerPreview ? (
              <div className="relative w-full h-full">
                <Image
                  src={bannerPreview}
                  alt="Banner Preview"
                  layout="fill"
                  className="rounded object-cover"
                />
              </div>
            ) : (
              <div className="flex flex-col items-center text-gray-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-10 w-10 mb-2 opacity-70"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M3 15a4 4 0 014-4h10a4 4 0 110 8H7a4 4 0 01-4-4zm3-4a4 4 0 114 4 4 4 0 01-4-4zm10 0a4 4 0 114 4 4 4 0 01-4-4z"
                  />
                </svg>
                <span className="text-sm">Click to upload banner</span>
              </div>
            )}
          </div>

          <input
            id="bannerUploader"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleBannerChange}
          />
        </div>

        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? "Uploading..." : "Submit for Approval"}
        </button>
      </form>
    </>
  );
}

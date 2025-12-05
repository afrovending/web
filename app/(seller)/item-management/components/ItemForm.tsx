"use client";

import React, { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import toast from "react-hot-toast";
import { HiOutlineUpload, HiOutlineXCircle } from "react-icons/hi";
import { SubmitButton as OriginalSubmitButton } from "../../dashboard/components/commons/SubmitButton";
import { listCategories } from "@/lib/api/category";
import { addItem, updateItem } from "@/lib/api/items";
import { getMyShop } from "@/lib/api/seller/shop";
import Category from "@/interfaces/category";
import SelectDropdown from "../../dashboard/components/commons/Fields/SelectDropdown";
import {
  DIMENSION_OPTIONS,
  PRICING_MODEL_OPTIONS,
  DELIVERY_METHOD_OPTIONS,
  SIZE_UNIT_OPTIONS,
  MAX_IMAGES,
  MAX_IMAGE_SIZE,
  VALID_IMAGE_TYPES,
} from "@/setting";
import { Editor as TinyMCEEditor } from "@tinymce/tinymce-react";
import { capitalizeWords } from "@/utils/formatWord";
import axios, { AxiosError } from "axios";

function FallbackSubmitButton({
  loading,
  label,
}: {
  loading?: boolean;
  label?: string;
}) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-red-500 text-white font-medium hover:opacity-95 disabled:opacity-60"
    >
      {loading ? "Saving..." : label || "Save"}
    </button>
  );
}

type DropdownOption = {
  label: string;
  value: string;
  children?: DropdownOption[];
};

const EMPTY_DROPDOWN_OPTION: DropdownOption = { label: "", value: "" };

interface ItemFormProps {
  onClose: () => void;
  item?: any;
}

export default function ItemForm({ onClose, item }: ItemFormProps) {
  const [loading, setLoading] = useState(false);
  const [shopType, setShopType] = useState<string | null>(null);
  const [categories, setCategories] = useState<DropdownOption[]>([]);

  // form state
  const [title, setTitle] = useState(item?.title ?? "");
  const [description, setDescription] = useState(item?.description ?? "");

  const [salesPrice, setSalesPrice] = useState<string>(
    item?.sales_price ? String(item.sales_price) : ""
  );
  const [regularPrice, setRegularPrice] = useState<string>(
    item?.regular_price ? String(item.regular_price) : ""
  );
  const [quantity, setQuantity] = useState<string>(
    item?.quantity ? String(item.quantity) : "0"
  );

  const [weight, setWeight] = useState<string>(
    item?.weight ? String(item.weight) : ""
  );
  const [weightUnit, setWeightUnit] = useState<DropdownOption>(
    DIMENSION_OPTIONS.find(
      (d: DropdownOption) => d.value === item?.weight_unit
    ) ?? EMPTY_DROPDOWN_OPTION
  );
  const [lengthVal, setLengthVal] = useState<string>(
    item?.length ? String(item.length) : ""
  );
  const [widthVal, setWidthVal] = useState<string>(
    item?.width ? String(item.width) : ""
  );
  const [heightVal, setHeightVal] = useState<string>(
    item?.height ? String(item.height) : ""
  );
  const [sizeUnit, setSizeUnit] = useState<DropdownOption>(
    SIZE_UNIT_OPTIONS.find(
      (s: DropdownOption) => s.value === item?.size_unit
    ) ?? EMPTY_DROPDOWN_OPTION
  );

  const [selectedCategory, setSelectedCategory] = useState<DropdownOption>(
    EMPTY_DROPDOWN_OPTION
  );
  const [selectedChildCategory, setSelectedChildCategory] =
    useState<DropdownOption>(EMPTY_DROPDOWN_OPTION);

  // images (multiple)
  const [imagePreviews, setImagePreviews] = useState<string[]>(
    item?.images ?? []
  );
  const [imageFiles, setImageFiles] = useState<File[]>([]);

  // service-only fields
  const findOption = (options: any[], value: string) =>
    options.find((opt) => opt.value === value) ?? { label: "", value: "" };

  const [pricingModel, setPricingModel] = useState(
    findOption(PRICING_MODEL_OPTIONS, item?.pricing_model ?? "fixed")
  );

  const [deliveryMethod, setDeliveryMethod] = useState(
    findOption(DELIVERY_METHOD_OPTIONS, item?.delivery_method ?? "online")
  );
  const [estimatedDeliveryTime, setEstimatedDeliveryTime] = useState<string>(
    item?.estimated_delivery_time ?? ""
  );
  const [availableDays, setAvailableDays] = useState<string[]>(
    item?.available_days ?? []
  );
  const [availableFrom, setAvailableFrom] = useState<string>(
    item?.available_from ?? ""
  );
  const [availableTo, setAvailableTo] = useState<string>(
    item?.available_to ?? ""
  );

  // fetch shop type and categories on mount
  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        const shopRes = await getMyShop();
        if (!mounted) return;

        // const shopType = "services";
        const shopType = shopRes?.data?.type ?? "services";
        setShopType(shopType);

        // Fetch categories
        const { categories }: { categories: Category[] } = await listCategories(
          100,
          0,
          "",
          shopType
        );
        if (!mounted) return;

        // Format categories for select/cascader using DropdownOption type
        const formatted: DropdownOption[] = categories.map((cat: Category) => ({
          label: cat.name,
          value: String(cat.id),
          children: (cat.children ?? []).map((child: Category) => ({
            label: child.name,
            value: String(child.id),
          })),
        }));

        setCategories(formatted);

        // If editing existing item, auto-select category
        if (item?.category_id) {
          const found = formatted.find(
            (c) => c.value === String(item.category_id)
          );

          if (found) {
            setSelectedCategory(found);
            const foundChild = found.children?.find(
              (c) => c.value === String(item.child_category_id)
            );
            if (foundChild) {
              setSelectedChildCategory(foundChild);
            }
          }
        }
      } catch (err) {
        console.error("Failed to initialize item form:", err);
      }
    }

    init();
    return () => {
      mounted = false;
    };
  }, [item]);

  const handleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const combined = [...imageFiles, ...files];
    if (combined.length > MAX_IMAGES) {
      toast.error(`Maximum ${MAX_IMAGES} images allowed`);
      return;
    }

    for (const file of files) {
      if (!VALID_IMAGE_TYPES.includes(file.type)) {
        toast.error("Only JPG, PNG, WebP, GIF or SVG images are allowed");
        return;
      }
      if (file.size > MAX_IMAGE_SIZE) {
        toast.error("Each image must be smaller than 2MB");
        return;
      }
    }

    const newPreviews = files.map((f) => URL.createObjectURL(f));
    setImageFiles((prev) => [...prev, ...files]);
    setImagePreviews((prev) => [...prev, ...newPreviews]);

    // reset input
    e.currentTarget.value = "";
  };

  const removeImageAt = (idx: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== idx));
    setImagePreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  function validateForm(): string | null {
    // title
    if (!title || title.trim().length < 5)
      return "Title is required and must be at least 5 characters";
    if (title.length > 100) return "Title must be at most 100 characters";

    if (!description || description.trim().length < 100)
      return "Description is required and must be at least 100 characters";

    // images
    const totalImages = imagePreviews.length;
    if (totalImages < 2) return "Please upload at least 2 images";
    if (totalImages > 7) return "Maximum 7 images allowed";

    if (selectedCategory.value === "") return "Please select a category";

    if (selectedCategory.children && selectedCategory.children.length > 0) {
      if (selectedChildCategory.value === "")
        return "Please select a subcategory";
    }

    // physical measurements
    const floatOK = (v: string) =>
      v === "" || (!isNaN(Number(v)) && Number(v) >= 0.1 && Number(v) <= 10000);
    if (!floatOK(weight))
      return "Weight must be a number between 0.1 and 10000 or left empty";
    if (!floatOK(lengthVal))
      return "Length must be a number between 0.1 and 10000 or left empty";
    if (!floatOK(widthVal))
      return "Width must be a number between 0.1 and 10000 or left empty";
    if (!floatOK(heightVal))
      return "Height must be a number between 0.1 and 10000 or left empty";

    if (shopType === "services") {
      if (!pricingModel) return "Pricing model is required for services";
      if (!deliveryMethod) return "Delivery method is required for services";
      if (!estimatedDeliveryTime || estimatedDeliveryTime.length > 255)
        return "Estimated delivery time is required (max 255 chars)";
      if (!availableDays || availableDays.length === 0)
        return "Please choose at least one available day for services";
      if (!availableFrom || !availableTo)
        return "Available from/to are required for services";
      try {
        const parse = (t: string) => t.replace(/\s+/g, "");
        if (parse(availableFrom) >= parse(availableTo))
          return "Available 'to' must be after 'from'";
      } catch (e) {
        // ignore
      }
    }

    // prices
    if (
      salesPrice === "" ||
      isNaN(Number(salesPrice)) ||
      Number(salesPrice) < 0
    ) {
      return "Sales price is required and must be a non-negative number";
    }

    if (
      regularPrice === "" ||
      isNaN(Number(regularPrice)) ||
      Number(regularPrice) < 0
    ) {
      return "Regular price is required and must be a non-negative number";
    }

    // sales price must be lower than regular price
    if (Number(salesPrice) >= Number(regularPrice)) {
      return "Sales price must be lower than the regular price";
    }

    if (
      quantity === "" ||
      isNaN(Number(quantity)) ||
      !Number.isInteger(Number(quantity)) ||
      Number(quantity) < 0
    ) {
      return "Quantity is required and must be a non-negative integer";
    }

    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const err = validateForm();
      if (err) {
        toast.error(err);
        setLoading(false);
        return;
      }

      const fd = new FormData();
      fd.append("title", capitalizeWords(title));
      fd.append("description", description);

      const categoryId = selectedChildCategory.value || selectedCategory.value;

      if (categoryId) {
        fd.append("category_id", categoryId);
      } else {
        toast.error("Category ID is missing");
        throw new Error("Category ID is missing");
      }

      if (weight) fd.append("weight", weight);
      if (weightUnit.value) fd.append("weight_unit", weightUnit.value);
      if (lengthVal) fd.append("length", lengthVal);
      if (widthVal) fd.append("width", widthVal);
      if (heightVal) fd.append("height", heightVal);
      if (sizeUnit.value) fd.append("size_unit", sizeUnit.value);

      if (shopType === "services") {
        fd.append("pricing_model", pricingModel);
        fd.append("delivery_method", deliveryMethod);
        fd.append("estimated_delivery_time", estimatedDeliveryTime);
        fd.append("available_days", JSON.stringify(availableDays));
        fd.append("available_from", availableFrom);
        fd.append("available_to", availableTo);
      }

      fd.append("sales_price", salesPrice);
      fd.append("regular_price", regularPrice);
      fd.append("quantity", quantity);

      imageFiles.forEach((f) => fd.append("images[]", f));

      if (item?.id) {
        await updateItem(item.id, fd);
        toast.success("Item updated successfully");
      } else {
        await addItem(fd);
        toast.success("Item added successfully");
      }

      onClose();
      window.location.reload();
    } catch (err) {
      let message = "An error occurred while saving the item";
      if (axios.isAxiosError(err)) {
        const axiosErr = err as AxiosError<{ message: string }>;
        message = axiosErr.response?.data?.message ?? axiosErr.message;
      }
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const dayOptions = useMemo(
    () => [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ],
    []
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-gray-800">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="input"
          placeholder="Enter item title"
          maxLength={50}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description <span className="text-red-500">*</span>
        </label>
        <TinyMCEEditor
          apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
          value={description}
          init={{
            height: 200,
            menubar: false,
            plugins: "link lists",
            toolbar:
              "undo redo | formatselect | bold italic underline | bullist numlist | link",
            content_style:
              "body { font-family:Inter,Arial,sans-serif; font-size:14px; color:#374151 }",
            max_chars: 5000,
          }}
          onEditorChange={(content) => setDescription(content)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Category <span className="text-yellow-500">(required)</span>
        </label>

        <SelectDropdown
          options={categories}
          value={selectedCategory}
          onChange={(v) => setSelectedCategory(v)}
          placeholder="Select category"
        />
      </div>

      {/* Accessing children is now safe because selectedCategory is typed as DropdownOption */}
      {selectedCategory.children && selectedCategory.children.length > 0 && (
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Subcategory <span className="text-yellow-500">(required)</span>
          </label>

          <SelectDropdown
            options={selectedCategory.children}
            value={selectedChildCategory}
            onChange={(v) => setSelectedChildCategory(v)}
            placeholder="Select subcategory"
          />
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Sales Price <span className="text-red-500">*</span>
          </label>
          <input
            value={salesPrice}
            onChange={(e) => setSalesPrice(e.target.value)}
            className="input"
            placeholder="0.00"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Regular Price <span className="text-red-500">*</span>
          </label>
          <input
            value={regularPrice}
            onChange={(e) => setRegularPrice(e.target.value)}
            className="input"
            placeholder="0.00"
          />
        </div>
        {shopType === "products" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantity <span className="text-red-500">*</span>
            </label>
            <input
              value={quantity || 1}
              onChange={(e) => setQuantity(e.target.value)}
              className="input"
              placeholder="0"
            />
          </div>
        )}
      </div>
      {shopType === "products" && (
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Weight
            </label>
            <input
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              className="input"
              placeholder="e.g. 0.5"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Weight Unit
            </label>
            <SelectDropdown
              options={DIMENSION_OPTIONS as DropdownOption[]}
              value={weightUnit}
              onChange={(v) => setWeightUnit(v)}
              placeholder="Unit"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Size Unit
            </label>
            <SelectDropdown
              options={SIZE_UNIT_OPTIONS as DropdownOption[]}
              value={sizeUnit}
              onChange={(v) => setSizeUnit(v)}
              placeholder="Unit"
            />
          </div>
        </div>
      )}
      {shopType === "products" && (
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Length
            </label>
            <input
              value={lengthVal}
              onChange={(e) => setLengthVal(e.target.value)}
              className="input"
              placeholder="Length"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Width
            </label>
            <input
              value={widthVal}
              onChange={(e) => setWidthVal(e.target.value)}
              className="input"
              placeholder="Width"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Height
            </label>
            <input
              value={heightVal}
              onChange={(e) => setHeightVal(e.target.value)}
              className="input"
              placeholder="Height"
            />
          </div>
        </div>
      )}
      {shopType === "services" && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pricing Model
              </label>

              <SelectDropdown
                options={PRICING_MODEL_OPTIONS}
                value={pricingModel}
                onChange={(value) => setPricingModel(value)}
                placeholder="Select Pricing Model"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Delivery Method
              </label>
              <SelectDropdown
                options={DELIVERY_METHOD_OPTIONS}
                value={deliveryMethod}
                onChange={(option) => setDeliveryMethod(option)}
                placeholder="Select Delivery Method"
              />
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estimated Delivery Time
              </label>
              <input
                value={estimatedDeliveryTime}
                onChange={(e) => setEstimatedDeliveryTime(e.target.value)}
                className="input"
                placeholder="e.g. 2 hours"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Available Days
              </label>
              <div className="flex flex-wrap gap-2">
                {dayOptions.map((d) => (
                  <label key={d} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={availableDays.includes(d)}
                      onChange={(e) => {
                        if (e.target.checked)
                          setAvailableDays((s) => [...s, d]);
                        else setAvailableDays((s) => s.filter((x) => x !== d));
                      }}
                    />
                    <span className="capitalize text-sm">{d}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Available From (e.g. 08:30am)
              </label>
              <input
                value={availableFrom}
                onChange={(e) => setAvailableFrom(e.target.value)}
                className="input"
                placeholder="08:30am"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Available To (e.g. 05:00pm)
              </label>
              <input
                value={availableTo}
                onChange={(e) => setAvailableTo(e.target.value)}
                className="input"
                placeholder="05:00pm"
              />
            </div>
          </div>
        </>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Item Images (min 2, max 7, 2MB each){" "}
          <span className="text-red-500">*</span>
        </label>

        {imagePreviews.length < 7 && (
          <label className="relative w-full aspect-square border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-red-500 hover:bg-red-50 transition-colors overflow-hidden flex items-center justify-center p-4">
            <div className="flex flex-col items-center justify-center text-center text-gray-500">
              <HiOutlineUpload className="text-3xl" />
              <span className="mt-2 text-sm">
                Click to upload or drag and drop
              </span>
              <span className="text-xs mt-1 text-gray-400">
                You can add more images later
              </span>
            </div>
            <input
              id="itemImages"
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImagesChange}
            />
          </label>
        )}

        <div className="mt-3 grid grid-cols-3 gap-2">
          {imagePreviews.map((src, idx) => (
            <div
              key={idx}
              className="relative rounded-lg overflow-hidden h-28  border border-red-950"
            >
              <Image
                src={src}
                alt={`preview-${idx}`}
                fill
                className="object-cover"
              />
              <button
                type="button"
                onClick={() => removeImageAt(idx)}
                className="absolute top-1 right-1 bg-red-200 rounded-full p-1 shadow-md cursor-pointer hover:bg-red-400 "
              >
                <HiOutlineXCircle />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        {typeof OriginalSubmitButton !== "undefined" ? (
          <OriginalSubmitButton
            loading={loading}
            label={item?.id ? "Update item" : "Save changes"}
          />
        ) : (
          <FallbackSubmitButton
            loading={loading}
            label={item?.id ? "Update item" : "Save changes"}
          />
        )}
      </div>
    </form>
  );
}

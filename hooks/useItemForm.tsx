"use client";

import { useState, useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import axios, { AxiosError } from "axios";
import { listCategories } from "@/lib/api/category";
import { getMyShop } from "@/lib/api/seller/shop";
import { addItem, updateItem, deleteItemPhoto } from "@/lib/api/items";
import {
  DIMENSION_OPTIONS,
  PRICING_MODEL_OPTIONS,
  DELIVERY_METHOD_OPTIONS,
  SIZE_UNIT_OPTIONS,
  MAX_IMAGES,
  MAX_IMAGE_SIZE,
  VALID_IMAGE_TYPES,
} from "@/setting";

type DropdownOption = {
  label: string;
  value: string;
  children?: DropdownOption[];
};
const EMPTY: DropdownOption = { label: "", value: "" };

export function useItemForm(item: any) {
  const [loading, setLoading] = useState(false);
  const [shopType, setShopType] = useState<string | null>(null);
  const [categories, setCategories] = useState<DropdownOption[]>([]);

  // basic
  const [title, setTitle] = useState(item?.title ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [keywords, setKeywords] = useState<string[]>(() => {
    if (!item?.keywords) return [];
    if (typeof item.keywords === "string") {
      try {
        return JSON.parse(item.keywords);
      } catch (e) {
        return item.keywords.split(",").map((k: string) => k.trim());
      }
    }
    return Array.isArray(item.keywords) ? item.keywords : [];
  });
  // pricing
  const [salesPrice, setSalesPrice] = useState<string>(
    item?.sales_price ? String(item.sales_price) : ""
  );
  const [regularPrice, setRegularPrice] = useState<string>(
    item?.regular_price ? String(item.regular_price) : ""
  );
  const [quantity, setQuantity] = useState<string>(
    item?.quantity ? String(item.quantity) : "0"
  );

  // dimensions
  const [weight, setWeight] = useState<string>(
    item?.weight ? String(item.weight) : ""
  );
  const findOption = (options: any[], value: string) =>
    options.find((o) => o.value === value) ?? EMPTY;
  const [weightUnit, setWeightUnit] = useState<DropdownOption>(
    findOption(DIMENSION_OPTIONS, item?.weight_unit)
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
    findOption(SIZE_UNIT_OPTIONS, item?.size_unit)
  );

  // categories
  const [selectedCategory, setSelectedCategory] =
    useState<DropdownOption>(EMPTY);
  const [selectedChildCategory, setSelectedChildCategory] =
    useState<DropdownOption>(EMPTY);

  // images
  const [existingImages, setExistingImages] = useState<{
    urls: string[];
    publicIds: string[];
  }>({ urls: item?.images ?? [], publicIds: item?.image_public_ids ?? [] });
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newPreviews, setNewPreviews] = useState<string[]>([]);

  // services
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

  function findCategory(
    categories: DropdownOption[],
    id: string
  ): DropdownOption | undefined {
    for (const cat of categories) {
      if (cat.value === id) return cat;
      const child = cat.children?.find((ch) => ch.value === id);
      if (child) return cat;
    }
    return undefined;
  }

  useEffect(() => {
    let mounted = true;
    async function init() {
      try {
        const shopRes = await getMyShop();
        if (!mounted) return;
        const st = shopRes?.data?.type ?? "services";
        setShopType(st);

        const { categories: cats } = await listCategories(100, 0, "", st);
        if (!mounted) return;

        const formatted = (cats ?? []).map((c: any) => ({
          label: c.name,
          value: String(c.id),
          children: (c.children ?? []).map((ch: any) => ({
            label: ch.name,
            value: String(ch.id),
          })),
        }));
        setCategories(formatted);

        const parentCategory = findCategory(
          formatted,
          String(item.category_id)
        );
        if (parentCategory) {
          setSelectedCategory(parentCategory);
          const child = parentCategory.children?.find(
            (ch) =>
              ch.value === String(item.child_category_id ?? item.category_id)
          );
          if (child) setSelectedChildCategory(child);
        }
      } catch (e) {
        console.error(e);
      }
    }
    init();
    return () => {
      mounted = false;
      newPreviews.forEach((u) => URL.revokeObjectURL(u));
    };
  }, []);

  const handleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const combinedCount =
      existingImages.urls.length + newImages.length + files.length;
    if (combinedCount > MAX_IMAGES) {
      toast.error(`Maximum ${MAX_IMAGES} images allowed`);
      return;
    }

    for (const file of files) {
      if (!VALID_IMAGE_TYPES.includes(file.type)) {
        toast.error("Only JPG, PNG, WebP, or JPEG images are allowed");
        return;
      }
      if (file.size > MAX_IMAGE_SIZE) {
        toast.error("Each image must be smaller than 2MB");
        return;
      }
    }

    setNewImages((prev) => [...prev, ...files]);
    const previews = files.map((f) => URL.createObjectURL(f));
    setNewPreviews((prev) => [...prev, ...previews]);
    e.currentTarget.value = "";
  };

  const removeNewImage = (idx: number) => {
    setNewImages((prev) => prev.filter((_, i) => i !== idx));
    setNewPreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const removeExistingImage = async (idx: number) => {
    const publicId = existingImages.publicIds[idx];

    if (!publicId) {
      toast.error("Image identifier not found");
      return;
    }

    const previousState = { ...existingImages };

    try {
      if (!item?.id) throw new Error("Product ID missing");

      const payload = new FormData();
      payload.append("delete_public_ids[]", publicId);

      await deleteItemPhoto(item.id, publicId);

      setExistingImages((prev) => ({
        urls: prev.urls.filter((_, i) => i !== idx),
        publicIds: prev.publicIds.filter((_, i) => i !== idx),
      }));

      toast.success("Image removed successfully");
    } catch (e) {
      console.error("Deletion Error:", e);
      setExistingImages(previousState);
      toast.error("Failed to delete image. Please try again.");
    }
  };

  function validateForm(): string | null {
    if (!title || title.trim().length < 5)
      return "Title is required and must be at least 5 characters";
    if (title.length > 250) return "Title must be at most 250 characters";
    if (!description || description.trim().length < 100)
      return "Description is required and must be at least 100 characters";

    const totalImages = existingImages.urls.length + newPreviews.length;
    if (totalImages < 2) return "Please upload at least 2 images";
    if (totalImages > 7) return "Maximum 7 images allowed";

    if (selectedCategory.value === "") return "Please select a category";
    if (
      selectedCategory.children &&
      selectedCategory.children.length > 0 &&
      selectedChildCategory.value === ""
    )
      return "Please select a subcategory";

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
    if (!weightUnit) return "Weight unit is required for dimension";
    if (!sizeUnit) return "Size unit is required for dimension";

    if (shopType === "services") {
      if (!pricingModel) return "Pricing model is required for services";
      if (!deliveryMethod) return "Delivery method is required for services";
      const deliveryRegex =
        /^(?:[1-9][0-9]?\s*(?:second|minute|hour)s?\s*){1,2}$/i;

      if (!estimatedDeliveryTime) {
        return "Estimated delivery time is required";
      }

      if (!deliveryRegex.test(estimatedDeliveryTime.trim())) {
        return "Format must be like '2 hours', '30 minutes', or '1 hour 15 minutes' (1-99)";
      }
      // ------------------------------------------------------
      if (!availableDays || availableDays.length === 0)
        return "Please choose at least one available day for services";
      if (!availableFrom || !availableTo)
        return "Available from/to are required for services";
      try {
        const parse = (t: string) => t.replace(/\s+/g, "");
        if (parse(availableFrom) >= parse(availableTo))
          return "Available 'to' must be after 'from'";
      } catch (e) {}
    }

    if (
      salesPrice === "" ||
      isNaN(Number(salesPrice)) ||
      Number(salesPrice) < 0
    )
      return "Sales price is required and must be a non-negative number";
    if (
      regularPrice === "" ||
      isNaN(Number(regularPrice)) ||
      Number(regularPrice) < 0
    )
      return "Regular price is required and must be a non-negative number";
    if (Number(salesPrice) >= Number(regularPrice))
      return "Sales price must be lower than the regular price";
    if (
      quantity === "" ||
      isNaN(Number(quantity)) ||
      !Number.isInteger(Number(quantity)) ||
      Number(quantity) < 0
    )
      return "Quantity is required and must be a non-negative integer";

    return null;
  }

  const handleSubmit = async (onClose: () => void) => {
    const err = validateForm();
    if (err) return toast.error(err);

    const fd = new FormData();
    fd.append("title", title);
    fd.append("description", description);
    fd.append("keywords", JSON.stringify(keywords));
    const categoryId = selectedChildCategory.value || selectedCategory.value;
    if (categoryId) fd.append("category_id", categoryId);

    if (weight) fd.append("weight", weight);
    if (weightUnit.value) fd.append("weight_unit", weightUnit.value);
    if (lengthVal) fd.append("length", lengthVal);
    if (widthVal) fd.append("width", widthVal);
    if (heightVal) fd.append("height", heightVal);
    if (sizeUnit.value) fd.append("size_unit", sizeUnit.value);

    if (shopType === "services") {
      fd.append("pricing_model", pricingModel.value);
      fd.append("delivery_method", deliveryMethod.value);
      fd.append("estimated_delivery_time", estimatedDeliveryTime);
      fd.append("available_days", JSON.stringify(availableDays));
      fd.append("available_from", availableFrom);
      fd.append("available_to", availableTo);
    }

    fd.append("sales_price", salesPrice);
    fd.append("regular_price", regularPrice);
    fd.append("quantity", quantity.toString());

    newImages.forEach((f) => fd.append("images[]", f));

    setLoading(true);
    try {
      if (item?.id) {
        await updateItem(item.id, fd);
        toast.success("Item updated successfully");
      } else {
        await addItem(fd);
        toast.success("Item added successfully");
      }
      onClose();
      window.location.reload();
    } catch (e) {
      let message = "An error occurred while saving the item";
      if (axios.isAxiosError(e)) {
        const axiosErr = e as AxiosError<{ message?: string }>;
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

  return {
    loading,
    shopType,
    categories,
    title,
    setTitle,
    description,
    setDescription,
    keywords,
    setKeywords,
    salesPrice,
    setSalesPrice,
    regularPrice,
    setRegularPrice,
    quantity,
    setQuantity,
    weight,
    setWeight,
    weightUnit,
    setWeightUnit,
    lengthVal,
    setLengthVal,
    widthVal,
    setWidthVal,
    heightVal,
    setHeightVal,
    sizeUnit,
    setSizeUnit,
    selectedCategory,
    setSelectedCategory,
    selectedChildCategory,
    setSelectedChildCategory,

    existingImages,
    setExistingImages,
    newImages,
    newPreviews,
    setNewPreviews,
    setNewImages,
    handleImagesChange,
    removeNewImage,
    removeExistingImage,

    pricingModel,
    setPricingModel,
    deliveryMethod,
    setDeliveryMethod,
    estimatedDeliveryTime,
    setEstimatedDeliveryTime,
    availableDays,
    setAvailableDays,
    availableFrom,
    setAvailableFrom,
    availableTo,
    setAvailableTo,

    handleSubmit,
    dayOptions,
    itemId: item?.id,
  } as const;
}

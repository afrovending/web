"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import * as z from "zod";
import { toast } from "react-hot-toast";
import { listSellerItems } from "@/lib/api/items";
import { upsertCoupon } from "@/lib/api/seller/coupons";
import SelectDropdown from "../../../components/commons/Fields/SelectDropdown";
import { Switch } from "@headlessui/react";

const couponSchema = z
  .object({
    id: z.number().optional(),
    product_id: z.string().min(1, "Please select a product"),
    discount_code: z
      .string()
      .min(3, "Code must be at least 3 characters")
      .toUpperCase(),
    discount_rate: z.coerce
      .number()
      .nonnegative("Value cannot be negative") // Extra safety
      .min(0.01, "Rate must be greater than 0"),
    discount_type: z.enum(["percentage", "fixed"]),
    start_time: z.string().min(1, "Start time is required"),
    end_time: z.string().min(1, "End time is required"),
    status: z.enum(["active", "inactive"]),
    notify_users: z.boolean(),
  }) // <--- Added this closing parenthesis for z.object
  .refine(
    (data) => {
      const start = new Date(data.start_time).getTime();
      const end = new Date(data.end_time).getTime();
      return end >= start;
    },
    {
      message: "End time must be after or equal to start time",
      path: ["end_time"],
    }
  );

interface CouponFormProps {
  coupon?: any;
  onClose: () => void;
}

const CouponForm: React.FC<CouponFormProps> = ({ coupon, onClose }) => {
  const [products, setProducts] = useState<any[]>([]);

  // Define static options for types and status
  const typeOptions = [
    { label: "Percentage (%)", value: "percentage" },
    { label: "Fixed Amount ($)", value: "fixed" },
  ];

  const statusOptions = [
    { label: "Active", value: "active" },
    { label: "Inactive", value: "inactive" },
  ];

  // Map products to dropdown options
  const productOptions = useMemo(() => {
    return products.map((p) => ({ label: p.title, value: p.id.toString() }));
  }, [products]);

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { isSubmitting },
  } = useForm({
    values: {
      id: coupon?.id ? Number(coupon.id) : undefined,
      discount_code: coupon?.discount_code || "",
      discount_rate: coupon?.discount_rate || 0,
      discount_type: coupon?.discount_type || "percentage",
      status: coupon?.status || "active",
      notify_users: !!coupon?.notify_users,
      product_id: coupon?.product_id?.toString() || "",
      start_time: coupon?.start_time
        ? new Date(coupon.start_time).toISOString().slice(0, 16)
        : "",
      end_time: coupon?.end_time
        ? new Date(coupon.end_time).toISOString().slice(0, 16)
        : "",
    },
  });

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await listSellerItems();
        setProducts(res.data || []);
      } catch (err) {
        toast.error("Failed to load products");
      }
    };
    fetchProducts();
  }, []);

  const onSubmit = async (formData: any) => {
    const validation = couponSchema.safeParse(formData);
    if (!validation.success) {
      toast.error(
        `${validation.error.issues[0].path.join(" ")}: ${
          validation.error.issues[0].message
        }`
      );
      return;
    }
    try {
      await upsertCoupon(validation.data);
      toast.success(coupon ? "Coupon updated!" : "Coupon created!");
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "An error occurred");
    }
  };

  // Get current date-time in the format required by datetime-local (YYYY-MM-DDTHH:MM)
  const minDateTime = new Date().toISOString().slice(0, 16);
  const selectedStartTime = watch("start_time");

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col space-y-5 p-2 pb-10"
    >
      {/* Product Selection - Custom Dropdown */}
      <div className="space-y-1">
        <label className="text-sm font-semibold text-gray-700">
          Apply to Product
        </label>
        <Controller
          name="product_id"
          control={control}
          render={({ field }) => (
            <SelectDropdown
              className="w-full"
              options={productOptions}
              placeholder="Search or select product"
              value={
                productOptions.find((opt) => opt.value === field.value) || {
                  label: "",
                  value: "",
                }
              }
              onChange={(opt) => field.onChange(opt.value)}
            />
          )}
        />
      </div>

      {/* Discount Code */}
      <div className="space-y-1">
        <label className="text-sm font-semibold text-gray-700">
          Coupon Code
        </label>
        <input
          {...register("discount_code")}
          placeholder="e.g. SUMMER20"
          className="input w-full py-3" // Using your global input class
        />
      </div>

      {/* Rate and Type - Stack on mobile, side-by-side on tablet+ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-sm font-semibold text-gray-700">
            Discount Value
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            onKeyDown={(e) => {
              if (["-", "+", "e", "E"].includes(e.key)) {
                e.preventDefault();
              }
            }}
            {...register("discount_rate")}
            placeholder="0.00"
            className="input w-full py-3"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-semibold text-gray-700">Type</label>
          <Controller
            name="discount_type"
            control={control}
            render={({ field }) => (
              <SelectDropdown
                className="w-full"
                options={typeOptions}
                value={
                  typeOptions.find((opt) => opt.value === field.value) ||
                  typeOptions[0]
                }
                onChange={(opt) => field.onChange(opt.value)}
              />
            )}
          />
        </div>
      </div>

      {/* Dates - Stack on mobile */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-sm font-semibold text-gray-700">
            Start Time
          </label>
          <input
            type="datetime-local"
            min={minDateTime} // Disables selection of dates before "now"
            {...register("start_time")}
            className="input w-full py-3"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-semibold text-gray-700">
            End Time
          </label>
          <input
            type="datetime-local"
            // Disables selection of dates before the chosen Start Time
            min={selectedStartTime || minDateTime}
            {...register("end_time")}
            className="input w-full py-3"
          />
        </div>
      </div>

      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex flex-col">
          <span className="text-sm font-bold text-hub-secondary">
            Notify Users
          </span>
          <span className="text-xs text-gray-500 italic">
            Send emails to all subscribers
          </span>
        </div>

        <Controller
          name="notify_users"
          control={control}
          render={({ field }) => (
            <Switch
              checked={field.value}
              onChange={field.onChange}
              className={`${
                field.value ? "bg-green-800" : "bg-gray-300"
              } relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75`}
            >
              <span className="sr-only">Notify users</span>
              <span
                aria-hidden="true"
                className={`${
                  field.value ? "translate-x-5" : "translate-x-0"
                } pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out`}
              />
            </Switch>
          )}
        />
      </div>

      {/* Status Selection */}
      <div className="space-y-1">
        <label className="text-sm font-semibold text-gray-700">Status</label>
        <Controller
          name="status"
          control={control}
          render={({ field }) => (
            <SelectDropdown
              className="w-full"
              options={statusOptions}
              value={
                statusOptions.find((opt) => opt.value === field.value) ||
                statusOptions[0]
              }
              onChange={(opt) => field.onChange(opt.value)}
            />
          )}
        />
      </div>

      {/* Action Buttons - Sticky/Full width on mobile */}
      <div className="flex flex-col-reverse md:flex-row gap-3 pt-6">
        <button
          type="button"
          onClick={onClose}
          className="btn btn-gray w-full md:flex-1 py-4"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn btn-primary w-full md:flex-1 py-4"
        >
          {isSubmitting
            ? "Processing..."
            : coupon
            ? "Update Coupon"
            : "Create Coupon"}
        </button>
      </div>
    </form>
  );
};

export default CouponForm;

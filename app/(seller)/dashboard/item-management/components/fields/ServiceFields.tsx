"use client";
import SelectDropdown from "@/app/(seller)/dashboard/components/commons/Fields/SelectDropdown";
import { PRICING_MODEL_OPTIONS, DELIVERY_METHOD_OPTIONS } from "@/setting";
import { timeOptions } from "@/utils/generateTimeSlot";
import { useEffect, useState } from "react";

export default function ServiceFields(props: any) {
  const {
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
    dayOptions,
  } = props;
  const [deliveryHours, setDeliveryHours] = useState("");
  const [deliveryMinutes, setDeliveryMinutes] = useState("");

  // Update the parent state whenever local inputs change
  useEffect(() => {
    const parts = [];
    if (deliveryHours && parseInt(deliveryHours) > 0) {
      parts.push(
        `${deliveryHours} ${parseInt(deliveryHours) === 1 ? "hour" : "hours"}`
      );
    }
    if (deliveryMinutes && parseInt(deliveryMinutes) > 0) {
      parts.push(
        `${deliveryMinutes} ${
          parseInt(deliveryMinutes) === 1 ? "minute" : "minutes"
        }`
      );
    }

    const combined = parts.join(" ");
    setEstimatedDeliveryTime(combined);
  }, [deliveryHours, deliveryMinutes, setEstimatedDeliveryTime]);

  useEffect(() => {
    if (estimatedDeliveryTime && !deliveryHours && !deliveryMinutes) {
      const hourMatch = estimatedDeliveryTime.match(/(\d+)\s*hour/);
      const minuteMatch = estimatedDeliveryTime.match(/(\d+)\s*minute/);

      if (hourMatch) setDeliveryHours(hourMatch[1]);
      if (minuteMatch) setDeliveryMinutes(minuteMatch[1]);
    }
  }, []);
  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Pricing Model
          </label>
          <SelectDropdown
            options={PRICING_MODEL_OPTIONS}
            value={pricingModel}
            onChange={(v: any) => setPricingModel(v)}
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
            onChange={(v: any) => setDeliveryMethod(v)}
            placeholder="Select Delivery Method"
          />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Estimated Delivery Time
          </label>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="99"
                value={deliveryHours}
                onChange={(e) => setDeliveryHours(e.target.value)}
                className="input w-full"
                placeholder="0"
              />
              <span className="text-sm text-gray-500">Hrs</span>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="59"
                value={deliveryMinutes}
                onChange={(e) => setDeliveryMinutes(e.target.value)}
                className="input w-full"
                placeholder="0"
              />
              <span className="text-sm text-gray-500">Mins</span>
            </div>
          </div>
          {/* Hidden preview to help the user see what's happening */}
          {(deliveryHours || deliveryMinutes) && (
            <p className="mt-2 text-xs text-green-700 font-medium bg-green-50 p-2 rounded border border-green-100">
              Will be saved as: {deliveryHours || 0}{" "}
              {parseInt(deliveryHours) === 1 ? "hour" : "hours"}{" "}
              {deliveryMinutes || 0}{" "}
              {parseInt(deliveryMinutes) === 1 ? "minute" : "minutes"}
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Available Days
          </label>
          <div className="flex flex-wrap gap-2">
            {dayOptions.map((day: string) => {
              const isSelected = availableDays.includes(day);
              return (
                <button
                  key={day}
                  type="button" // Important: prevents form submission
                  onClick={() => {
                    if (isSelected) {
                      setAvailableDays(
                        availableDays.filter((d: any) => d !== day)
                      );
                    } else {
                      setAvailableDays([...availableDays, day]);
                    }
                  }}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border cursor-pointer ${
                    isSelected
                      ? "bg-green-800 border-green-800 text-white shadow-sm"
                      : "bg-white border-gray-300 text-gray-700 hover:border-green-800"
                  }`}
                >
                  <span className="capitalize">{day}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        {/* Available From */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Available From
          </label>
          <SelectDropdown
            options={timeOptions}
            value={
              timeOptions.find((opt) => opt.value === availableFrom) || {
                label: "",
                value: "",
              }
            }
            onChange={(selected) => setAvailableFrom(selected.value)}
            className="w-full"
            placeholder="Select Start Time"
          />
        </div>

        {/* Available To */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Available To
          </label>
          <SelectDropdown
            options={timeOptions.filter(
              (opt) => !availableFrom || opt.value > availableFrom
            )}
            value={
              timeOptions.find((opt) => opt.value === availableTo) || {
                label: "",
                value: "",
              }
            }
            onChange={(selected) => setAvailableTo(selected.value)}
            className="w-full"
            placeholder="Select End Time"
          />
        </div>
      </div>
    </>
  );
}

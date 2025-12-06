"use client"; 
import SelectDropdown from "@/app/(seller)/dashboard/components/commons/Fields/SelectDropdown";
import { PRICING_MODEL_OPTIONS, DELIVERY_METHOD_OPTIONS } from "@/setting";

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
            {dayOptions.map((d: string) => (
              <label key={d} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={availableDays.includes(d)}
                  onChange={(e) => {
                    if (e.target.checked)
                      setAvailableDays((s: string[]) => [...s, d]);
                    else
                      setAvailableDays((s: string[]) =>
                        s.filter((x) => x !== d)
                      );
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
  );
}

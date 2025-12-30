"use client";
import SelectDropdown from "@/app/(seller)/dashboard/components/commons/Fields/SelectDropdown";
import { DIMENSION_OPTIONS, SIZE_UNIT_OPTIONS } from "@/setting";
import { handleNumericChange } from "@/utils/inputMode";

export default function ProductDimensionFields(props: any) {
  const {
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
  } = props;

  return (
    <>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Weight <span className="text-red-500">*</span>
          </label>
          <input
            value={weight}
            inputMode="decimal"
            onChange={(e) => handleNumericChange(e.target.value, setWeight)}
            className="input"
            placeholder="e.g. 0.5"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Weight Unit <span className="text-red-500">*</span>
          </label>
          <SelectDropdown
            options={DIMENSION_OPTIONS as any}
            value={weightUnit}
            onChange={(v: any) => setWeightUnit(v)}
            placeholder="Unit"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Size Unit <span className="text-red-500">*</span>
          </label>
          <SelectDropdown
            options={SIZE_UNIT_OPTIONS as any}
            value={sizeUnit}
            onChange={(v: any) => setSizeUnit(v)}
            placeholder="Unit"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Length <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            inputMode="decimal"
            value={lengthVal}
            onChange={(e) => handleNumericChange(e.target.value, setLengthVal)}
            className="input"
            placeholder="Length"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Width <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            inputMode="decimal"
            value={widthVal}
            onChange={(e) => handleNumericChange(e.target.value, setWidthVal)}
            className="input"
            placeholder="Width"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Height <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            inputMode="decimal"
            value={heightVal}
            onChange={(e) => handleNumericChange(e.target.value, setHeightVal)}
            className="input"
            placeholder="Height"
          />
        </div>
      </div>
    </>
  );
}

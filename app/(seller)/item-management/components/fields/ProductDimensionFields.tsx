"use client";
import SelectDropdown from "@/app/(seller)/dashboard/components/commons/Fields/SelectDropdown";
import { DIMENSION_OPTIONS, SIZE_UNIT_OPTIONS } from "@/setting";

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
            options={DIMENSION_OPTIONS as any}
            value={weightUnit}
            onChange={(v: any) => setWeightUnit(v)}
            placeholder="Unit"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Size Unit
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
    </>
  );
}

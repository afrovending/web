"use client";
import SelectDropdown from "@/app/(seller)/dashboard/components/commons/Fields/SelectDropdown";

export default function CategoryFields(props: any) {
  const {
    categories,
    selectedCategory,
    setSelectedCategory,
    selectedChildCategory,
    setSelectedChildCategory,
  } = props;
  return (
    <>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Category <span className="text-red-500">*</span>
        </label>
        <SelectDropdown
          options={categories}
          value={selectedCategory}
          onChange={(v: any) => setSelectedCategory(v)}
          placeholder="Select category"
        />
      </div>

      {categories &&
        (selectedCategory.children?.length > 0 ? (
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subcategory <span className="text-green-500">(required)</span>
            </label>
            <SelectDropdown
              options={selectedCategory.children}
              value={selectedChildCategory}
              onChange={(v: any) => setSelectedChildCategory(v)}
              placeholder="Select subcategory"
            />
          </div>
        ) : (
          <p className="mt-2 text-xs text-gray-500 italic">
            No subcategories available
          </p>
        ))}
    </>
  );
}

import React, { useState, useEffect } from "react";
import {
  PlusIcon,
  TrashIcon,
  PlusCircleIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";
import ConfirmationModal from "../../components/commons/ConfirmationModal";
import {
  listColors,
  listSizes,
  upsertProductVariations,
} from "@/lib/api/items";
import SelectDropdown from "../../components/commons/Fields/SelectDropdown";

export function ProductVariation({ product }: { product: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [colors, setColors] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [variations, setVariations] = useState(product?.variations || []);
  const [loading, setLoading] = useState(false);

  // Load attributes only when modal opens
  useEffect(() => {
    if (isOpen) {
      const loadAttributes = async () => {
        try {
          const [c, s] = await Promise.all([listColors(), listSizes()]);
          setColors(c);
          setSizes(s);
        } catch (err) {
          toast.error("Failed to load size/color options");
        }
      };
      loadAttributes();
      setVariations(product?.variations || []); // Sync variations
    }
  }, [isOpen, product]);

  const addRow = () => {
    setVariations([
      ...variations,
      { color_id: "", size_id: "", price: product.regular_price, quantity: 1 },
    ]);
  };

  const updateRow = (index: number, field: string, value: any) => {
    const updated = [...variations];
    updated[index] = { ...updated[index], [field]: value };
    setVariations(updated);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      await upsertProductVariations(product.id, variations);
      toast.success("Variations saved!");
      setIsOpen(false);
      // Optional: window.location.reload() or a prop callback to refresh list
    } catch (err) {
      toast.error("Error saving variations");
    } finally {
      setLoading(false);
    }
  };

  // Helper to transform raw API data into Dropdown Options
  const colorOptions = [
    { label: "None", value: "" },
    ...colors.map((c: any) => ({ label: c.name, value: c.id.toString() })),
  ];

  const sizeOptions = [
    { label: "None", value: "" },
    ...sizes.map((s: any) => ({ label: s.name, value: s.id.toString() })),
  ];
 return (
   <>
     <button
       className="btn btn-primary flex items-center gap-1"
       onClick={() => setIsOpen(true)}
     >
       <PlusIcon className="w-4 h-4 font-semibold" /> Variations
     </button>

     <ConfirmationModal
       isOpen={isOpen}
       onClose={() => setIsOpen(false)}
       title={`Variations: ${product.title}`}
     >
       <div className="space-y-4 max-h-[60vh] overflow-y-auto p-1 custom-scrollbar">
         {variations.map((v: any, index: number) => (
           <div
             key={index}
             className="relative flex flex-col gap-3 p-3 rounded-lg border border-gray-100 bg-gray-50/50 md:bg-transparent md:border-0 md:border-b md:grid md:grid-cols-4 md:items-end md:gap-2 md:pb-4"
           >
             {/* Mobile Delete Button - Top Right */}
             <button
               onClick={() =>
                 setVariations(
                   variations.filter((_: any, i: any) => i !== index)
                 )
               }
               className="absolute top-2 right-2 p-1 text-red-400 hover:text-red-600 md:hidden cursor-pointer"
               aria-label="Delete variation"
             >
               <TrashIcon className="w-5 h-5" />
             </button>

             {/* Color Dropdown */}
             <div className="flex flex-col gap-1">
               <label className="text-[10px] text-gray-400 uppercase font-bold">
                 Color
               </label>
               <SelectDropdown
                 className="w-full"
                 options={colorOptions}
                 placeholder="Color"
                 value={
                   colorOptions.find(
                     (opt) => opt.value === v.color_id?.toString()
                   ) || colorOptions[0]
                 }
                 onChange={(selected) =>
                   updateRow(index, "color_id", selected.value)
                 }
               />
             </div>

             {/* Size Dropdown */}
             <div className="flex flex-col gap-1">
               <label className="text-[10px] text-gray-400 uppercase font-bold">
                 Size
               </label>
               <SelectDropdown
                 className="w-full"
                 options={sizeOptions}
                 placeholder="Size"
                 value={
                   sizeOptions.find(
                     (opt) => opt.value === v.size_id?.toString()
                   ) || sizeOptions[0]
                 }
                 onChange={(selected) =>
                   updateRow(index, "size_id", selected.value)
                 }
               />
             </div>

             {/* Price & Qty Wrapper for Mobile (2 cols) */}
             <div className="grid grid-cols-2 gap-2 md:contents">
               <div className="flex flex-col gap-1">
                 <label className="text-[10px] text-gray-400 uppercase font-bold">
                   Price
                 </label>
                 <input
                   type="number"
                   className="input w-full"
                   placeholder="0.00"
                   value={v.price}
                   onChange={(e) => updateRow(index, "price", e.target.value)}
                 />
               </div>

               <div className="flex flex-col gap-1">
                 <label className="text-[10px] text-gray-400 uppercase font-bold">
                   Qty
                 </label>
                 <div className="flex items-center gap-1">
                   <input
                     type="number"
                     className="input w-full"
                     placeholder="0"
                     value={v.quantity}
                     onChange={(e) =>
                       updateRow(index, "quantity", e.target.value)
                     }
                   />
                   {/* Desktop Delete Button */}
                   <button
                     onClick={() =>
                       setVariations(
                         variations.filter((_: any, i: any) => i !== index)
                       )
                     }
                     className="hidden md:flex p-2 text-red-400 hover:text-red-600 cursor-pointer"
                     aria-label="Delete variation"
                   >
                     <TrashIcon className="w-4 h-4" />
                   </button>
                 </div>
               </div>
             </div>
           </div>
         ))}

         <button
           onClick={addRow}
           className="w-full py-4 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:bg-gray-50 flex justify-center items-center gap-2 text-sm font-medium transition-all cursor-pointer"
         >
           <PlusCircleIcon className="w-5 h-5" /> Add New Variation
         </button>
       </div>

       <div className="mt-6 flex flex-col-reverse sm:flex-row justify-end gap-3 border-t pt-4">
         <button
           onClick={() => setIsOpen(false)}
           className="btn btn-gray w-full sm:w-auto"
         >
           Cancel
         </button>
         <button
           onClick={handleSave}
           className="btn btn-primary w-full sm:w-auto"
         >
           {loading ? "Saving..." : "Save All Changes"}
         </button>
       </div>
     </ConfirmationModal>
   </>
 );
}

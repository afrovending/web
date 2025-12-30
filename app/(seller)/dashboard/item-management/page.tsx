"use client";

import { useState } from "react";
import { LuPackage, LuPlus } from "react-icons/lu";
import ItemOverview from "./components/ItemOverview";
import ItemsTable from "./components/ItemsTable";
import ItemForm from "./components/ItemForm";
import { Product } from "@/interfaces/products";
import Drawer from "../components/commons/Drawer";

export default function ProductManagementPage() {
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  return (
    <>
      <div className="card mb-6 hover:shadow-lg transition-all duration-300 rounded-xl bg-white cursor-default">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold flex items-center gap-2 text-green-800!">
            <LuPackage />
            Items Managements
          </h2>

          {/* Add Item → open drawer */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="
              btn btn-primary 
              flex items-center 
              p-2 lg:py-2 lg:px-4 lg:gap-1 
              sm:rounded-xl
            "
          >
            <LuPlus className="text-xl lg:text-lg" />
            <span className="hidden lg:inline">Add Item</span>
          </button>
        </div>

        <p className="text-sm mt-1 text-gray-600">
          From your Items management dashboard, you can easily check, modify and
          add new <span className="text-green-800"> Items</span>
        </p>
      </div>

      <ItemOverview />

      <ItemsTable limit={10} offset={0} status={"active"} />

      {/* Drawer with Item Form */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Add item"
      >
        {editingProduct && (
          <ItemForm
            {...({
              product: editingProduct,
              onClose: () => setDrawerOpen(false),
            } as any)}
          />
        )}
        {/* Render ItemForm for both Add (no item) and Edit (with item) */}
        <ItemForm
          item={editingProduct ?? undefined}
          onClose={() => setDrawerOpen(false)}
        />
      </Drawer>
    </>
  );
}

"use client";

import Image from "next/image";
import { TrashIcon } from "@heroicons/react/24/outline";
import { CartItem } from "@/context/CartContext";
import { getStockStatus } from "@/utils/ItemUtils";
import { formatAmount } from "@/utils/formatCurrency";
import WishlistButton from "@/app/(customer)/account/wishlists/components/WishlistButton";
import Link from "next/link";
import QuantityControl from "@/app/items/components/QuantityControl";

type Props = {
  item: CartItem;
  updateQty: (id: number, qty: number, variation_id?: number | null) => void;
  openRemoveModal: (item: CartItem) => void;
};

export default function CartItemRow({
  item,
  updateQty,
  openRemoveModal,
}: Props) {
  return (
    <div className="bg-white rounded-lg shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 gap-4">
      <div className="flex items-center gap-4 w-full">
        <Link href={`/items/${item.slug}`} prefetch>
          <div className="relative shrink-0">
            <Image
              src={item.image}
              alt={item.title}
              width={100}
              height={100}
              className="rounded-md object-cover w-20 h-20 sm:w-24 sm:h-24"
            />
          </div>
        </Link>

        <div className="flex-1 min-w-0">
          <Link href={`/items/${item.slug}`} prefetch>
            {" "}
            <h3
              title={item.title}
              className="text-sm sm:text-lg font-medium text-gray-800 line-clamp-1 sm:line-clamp-2"
            >
              {item.title}
            </h3>
          </Link>
          {/* VARIATION DISPLAY */}
          {(item.color || item.size) && (
            <div className="flex flex-wrap gap-2 mt-1">
              {item.color && (
                <span className="text-[10px] sm:text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md border border-gray-200">
                  Color:{" "}
                  <span className="font-bold text-gray-900">{item.color}</span>
                </span>
              )}
              {item.size && (
                <span className="text-[10px] sm:text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md border border-gray-200">
                  Size:{" "}
                  <span className="font-bold text-gray-900">{item.size}</span>
                </span>
              )}
            </div>
          )}

          <div className="mt-2 flex items-center gap-3">
            <span
              className={`text-white text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full ${
                getStockStatus(item.stockQty ?? 0).bgClass
              }`}
            >
              {getStockStatus(item.stockQty ?? 0).text}
            </span>
          </div>

          {/* MOBILE ONLY QUANTITY (Hidden on Desktop) */}
          <div className="flex sm:hidden items-center gap-3 mt-3">
            <QuantityControl
              quantity={item.qty}
              stockQty={item.stockQty ?? 99} // Use actual stock if available
              onIncrease={() =>
                updateQty(item.id, item.qty + 1, item.variation_id)
              }
              onDecrease={() =>
                updateQty(item.id, item.qty - 1, item.variation_id)
              }
            />
          </div>
        </div>
      </div>

      <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto sm:h-full gap-2">
        <div className="hidden sm:flex items-center gap-3">
          <QuantityControl
            quantity={item.qty}
            stockQty={item.stockQty ?? 99} // Use actual stock if available
            onIncrease={() =>
              updateQty(item.id, item.qty + 1, item.variation_id)
            }
            onDecrease={() =>
              updateQty(item.id, item.qty - 1, item.variation_id)
            }
          />{" "}
        </div>

        <div className="flex flex-col items-end">
          <span className="text-sm sm:text-xl font-bold text-hub-primary">
            {formatAmount(Number(item.price) * Number(item.qty))}
          </span>
          {item.qty > 1 && (
            <span className="text-[10px] text-gray-400">
              {formatAmount(Number(item.price))} each
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => openRemoveModal(item)}
            className="p-2 hover:text-red-800 flex items-center gap-1 bg-red-50 text-red-700 rounded-full text-xs font-medium transition cursor-pointer"
          >
            <TrashIcon className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="hidden lg:inline">Remove</span>
          </button>
          <WishlistButton product={item} />
        </div>
      </div>
    </div>
  );
}
 
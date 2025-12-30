"use client";

import Image from "next/image";
import { TrashIcon } from "@heroicons/react/24/outline";
import { useWishlist } from "@/context/WishlistContext";
import { useCart } from "@/context/CartContext";
import { useRouter } from "next/navigation";
import { formatAmount } from "@/utils/formatCurrency";
import toast from "react-hot-toast";
import { FiHeart, FiLifeBuoy } from "react-icons/fi";

export default function WishlistPage() {
  const { wishlist, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();
  const router = useRouter();

  return (
    <>
      <div className="card mb-6">
        <h2 className="text-lg font-semibold flex items-center">
          <FiHeart className="text-green-800 text-xl mr-2" size={24} />
          Wishlist ({wishlist.length})
        </h2>
        <p className="text-sm mt-1 text-gray-600">
          From your account dashboard, you can easily add your wishlist to your
          <span className="text-green-800"> Cart </span>
        </p>
      </div>
      {!wishlist || wishlist.length === 0 ? (
        // EMPTY STATE
        <div className="card">
          <div className="text-center">
            <h2 className="text-2xl font-semibold mb-2">
              Your Wishlist is Empty
            </h2>
            <p className="text-gray-600 mb-6">
              Items you save will appear here.
            </p>
            <button
              onClick={() => router.push("/items")}
              className="btn btn-primary"
            >
              Browse Items
            </button>
          </div>
        </div>
      ) : (
        // WISHLIST ITEMS
        <div className="bg-white rounded-xl shadow p-4 md:p-6">
          <div className="space-y-4">
            {wishlist.map((item) => (
              <div
                key={item.id}
                className="
            flex flex-col md:flex-row 
            md:items-center justify-between 
            gap-4 p-4 border border-green-200 rounded-lg 
            hover:shadow-sm transition
          "
              >
                {/* LEFT */}
                <div className="flex items-center gap-3 md:gap-4">
                  <Image
                    src={item.image}
                    alt={item.title}
                    width={70}
                    height={70}
                    className="rounded-md object-cover"
                  />

                  <div>
                    <div className="font-medium text-gray-800 text-sm md:text-base">
                      {item.title}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">
                        {item.stock ?? "In stock"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* RIGHT */}
                <div
                  className="
              flex flex-row md:flex-row 
              items-center md:justify-end 
              gap-3 md:gap-6
            "
                >
                  <div className="text-base md:text-lg font-semibold text-gray-800">
                    {formatAmount(item.price)}
                  </div>

                  <button
                    onClick={() => {
                      addToCart({ ...item, qty: 1 });
                      removeFromWishlist(item.id);
                      toast.success(`${item.title} added to cart!`);
                    }}
                    className="btn btn-primary text-xs md:text-sm"
                  >
                    Add to Cart
                  </button>

                  <button
                    onClick={() => removeFromWishlist(item.id)}
                    className="btn btn-gray hover:text-red-600"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

"use client";

import { useAuthStore } from "@/store/useAuthStore";
import { useWishlist } from "@/context/WishlistContext";
import { useRouter } from "next/navigation";
import { HeartIcon as HeartOutline } from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolid } from "@heroicons/react/24/solid";
import { toast } from "react-hot-toast";
import clsx from "clsx";

type Props = {
  product: {
    id: number;
    title: string;
    sales_price?: string;
    images?: string | string[];
    stock?: boolean | number;
    slug?: string;
  };
};

export default function WishlistButton({ product }: Props) {
  const router = useRouter();
  const { user, token } = useAuthStore();
  const { isWishlisted, addToWishlist, removeFromWishlist } = useWishlist();

  const wishlisted = isWishlisted(product.id);

  const handleToggle = () => {
    if (!token && !user) {
      toast("Please log in to save items.", { icon: "🔒" });
      router.push("/login");
      return;
    }

    if (wishlisted) {
      router.push("/account/wishlists");
      return;
    }

    addToWishlist({
      id: product.id,
      title: product.title,
      price: parseFloat(product.sales_price || "0") || 0,
      image: Array.isArray(product.images)
        ? product.images[0]
        : product.images ?? "/placeholder.png",
    });
  };

  return (
    <button
      onClick={handleToggle}
      className={clsx(
        // Default (mobile) padding is p-2 for icon only. Sm screens use px-3 py-1.5 for text+icon
        "inline-flex items-center gap-2 p-2 sm:px-3 sm:py-1.5 rounded-full text-sm font-medium transition cursor-pointer",
        wishlisted
          ? "bg-amber-50 text-amber-700 border border-amber-200"
          : "bg-amber-100 text-amber-700"
      )}
      aria-pressed={wishlisted}
      aria-label="wishlist"
      title="Wishlist"
    >
      {wishlisted ? (
        <>
          <HeartSolid className="w-4 h-4 text-amber-600" />
          {/* Added hidden class for mobile, sm:inline for desktop visibility */}
          <span className="hidden sm:inline">Saved</span>
        </>
      ) : (
        <>
          <HeartOutline className="w-4 h-4" />
          {/* Added hidden class for mobile, sm:inline for desktop visibility */}
          <span className="hidden sm:inline">Wishlist</span>
        </>
      )}
    </button>
  );
}

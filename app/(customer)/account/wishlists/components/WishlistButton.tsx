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
    sales_price?: number;
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
      price: product.sales_price || 0,
      image: Array.isArray(product.images)
        ? product.images[0]
        : product.images ?? "/placeholder.png",
    });
  };

  return (
    <button
      onClick={handleToggle}
      className={clsx(
        "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition cursor-pointer",
        wishlisted
          ? "bg-red-50 text-red-700 border border-red-200"
          : "bg-gray-100 text-gray-700"
      )}
      aria-pressed={wishlisted}
    >
      {wishlisted ? (
        <>
          <HeartSolid className="w-4 h-4 text-red-600" />
          Saved
        </>
      ) : (
        <>
          <HeartOutline className="w-4 h-4" />
          Wishlist
        </>
      )}
    </button>
  );
}

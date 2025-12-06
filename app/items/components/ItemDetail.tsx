"use client";
import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import { MinusIcon, PlusIcon, CheckIcon } from "@heroicons/react/24/outline";
import Item from "@/interfaces/items";
import ItemTabs from "./ItemTabs";
import { useCart } from "@/context/CartContext";
import { formatAmount } from "@/utils/formatCurrency";
import truncate from "html-truncate";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Link from "next/link";
import WishlistButton from "@/app/(customer)/account/wishlists/components/WishlistButton";
import parse from "html-react-parser";

const reviews = [
  {
    id: 1,
    name: "Kristin Watson",
    avatar: "/images/icon.png",
    rating: 5,
    comment: "Duis at ullamcorper nulla, eu dictum eros.",
    date: "2 min ago",
  },
  {
    id: 2,
    name: "Jane Cooper",
    avatar: "/images/icon.png",
    rating: 4,
    comment:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt.",
    date: "30 Apr, 2024",
  },
];

export default function ItemDetail({ product }: { product: Item }) {
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(
    product.images?.[0] || "/placeholder.png"
  );

  const { addToCart, cart } = useCart();

  const isInCart = useMemo(
    () => cart?.some((item) => item.id === product.id),
    [cart, product.id]
  );

  const increaseQty = () => setQuantity((q) => q + 1);
  const decreaseQty = () => setQuantity((q) => (q > 1 ? q - 1 : 1));
  const salesPrice = parseFloat(product.sales_price);
  const regularPrice = parseFloat(product.regular_price);
 
  const discount =
    regularPrice > salesPrice
      ? Math.round(((regularPrice - salesPrice) / regularPrice) * 100)
      : 0;

  const router = useRouter();

  const [added, setAdded] = useState(false);

  const handleAddToCart = () => {
    if (!isInCart) {
      addToCart({
        id: product.id,
        title: product.title,
        slug: product.slug,
        type: product.type,
        price: salesPrice,
        image: selectedImage,
        qty: quantity,
        stock: true,
      });

      toast.success("Item added to cart!");
      setAdded(true);
      setTimeout(() => {
        setAdded(false);
      }, 1000);
    } else {
      router.push("/carts");
    }
  };

  return (
    <>
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left: Image */}
          <div className="flex gap-4 lg:col-span-1">
            <div className="flex flex-col gap-3">
              {product.images?.map((img, i) => (
                <Image
                  key={i}
                  src={img}
                  alt={`${product.title} ${i}`}
                  width={80}
                  height={80}
                  className={`rounded-md cursor-pointer border ${
                    selectedImage === img ? "border-red-800" : "border-gray-200"
                  }`}
                  onClick={() => setSelectedImage(img)}
                />
              ))}
            </div>

            <div className="">
              <Image
                src={selectedImage}
                alt={product.title}
                width={700}
                height={700}
                className="rounded-lg shadow-md w-full object-cover"
              />
            </div>
          </div>

          <div className="flex flex-col space-y-4">
            <h1 className="text-2xl font-semibold">{product.title}</h1>

            <div hidden className="flex items-center">
              <div className="flex items-center gap-1 text-yellow-400 mb-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i}>{i < product.average_rating ? "★" : "☆"}</span>
                ))}
              </div>
              <span className="ml-2 text-gray-500">
                {product.average_rating.toFixed(1)} •{" "}
                {product.reviews?.length || 0} reviews
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-gray-900">
                {formatAmount(salesPrice)}
              </span>
              {regularPrice > salesPrice && (
                <>
                  <span className="line-through text-gray-400">
                    {formatAmount(regularPrice)}
                  </span>
                  <span className="text-red-800 font-semibold">
                    -{discount}%
                  </span>
                </>
              )}
            </div> 
            
            <div className="text-gray-500 line-clamp-2">
              {parse(product.description)}
            </div>

            <div className="flex items-center gap-2 mt-5">
              <div className="flex items-center rounded-md">
                <button
                  onClick={decreaseQty}
                  className="btn btn-gray rounded-full!"
                >
                  <MinusIcon className="h-4 w-4" />
                </button>
                <span className="px-4 text-gray-500 font-semibold">
                  {quantity}
                </span>
                <button
                  onClick={increaseQty}
                  className="btn btn-gray rounded-full!"
                >
                  <PlusIcon className="h-4 w-4" />
                </button>
              </div>
              {product.type === "services" ? (
                <button
                  onClick={() => {
                    if (!isInCart) {
                      handleAddToCart();
                    } else {
                      router.push("/checkout");
                    }
                  }}
                  className={`btn btn-primary rounded-full! text-xs! ${
                    added
                      ? "bg-red-800 text-white scale-105"
                      : isInCart
                      ? "bg-red-800 text-white hover:bg-red-700"
                      : "bg-red-400 text-white hover:bg-red-800"
                  }`}
                >
                  {added ? (
                    <>
                      <CheckIcon className="h-5 w-5 text-white animate-bounce" />
                      Booked!
                    </>
                  ) : isInCart ? (
                    "Proceed to Booking"
                  ) : (
                    "Book Now"
                  )}
                </button>
              ) : (
                <button
                  onClick={handleAddToCart}
                  className={`btn btn-primary rounded-full! text-xs! ${
                    added
                      ? "bg-red-800 text-white scale-105"
                      : isInCart
                      ? "bg-red-800 text-white hover:bg-red-700"
                      : "bg-red-400 text-white hover:bg-red-800"
                  }`}
                >
                  {added ? (
                    <>
                      <CheckIcon className="h-5 w-5 text-white animate-bounce" />
                      Added!
                    </>
                  ) : isInCart ? (
                    "View Cart"
                  ) : (
                    "Add to Cart"
                  )}
                </button>
              )}
              {/* @ts-ignore */}
              <WishlistButton product={product} />
            </div>

            <div className="text-sm text-gray-500 space-y-1">
              <p>
                Category:{" "}
                <Link
                  target="_blank"
                  title="relative items"
                  className="text-red-800"
                  href={`/items?category=${product.category?.slug}&type=${product.type}`}
                >
                  {product.category?.name}
                </Link>
              </p>

              <p>{product?.sku}</p>

              <p>
                Seller:{" "}
                <Link
                  target="_blank"
                  title="Seller shop"
                  className="text-red-800"
                  href={`/shops/${product?.shop?.slug}`}
                >
                  {product?.shop?.name}{" "}
                  <span className="text-gray-500">from</span>{" "}
                  {product?.shop?.country}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
      <ItemTabs description={product.description} reviews={reviews} />
    </>
  );
}

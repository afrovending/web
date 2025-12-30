"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import ItemTabs, { StarRating } from "./ItemTabs";
import { formatAmount } from "@/utils/formatCurrency";
import Link from "next/link";
import WishlistButton from "@/app/(customer)/account/wishlists/components/WishlistButton";
import parse from "html-react-parser";
import Item from "@/interfaces/items";
import Zoom from "react-medium-image-zoom";
import "react-medium-image-zoom/dist/styles.css";
import { FaFacebook, FaWhatsapp } from "react-icons/fa6";
import { FaShareAlt } from "react-icons/fa";
import { getStockStatus, StarFilled, StarEmpty } from "@/utils/ItemUtils";
import AddToCartButton from "./AddToCartButton";
import QuantityControl from "./QuantityControl";

interface ItemDetailProps {
  product: Item;
  reviews: any[];
  star_rating: StarRating;
  recommended: Item[];
  frequentlyBoughtTogether: Item[];
  otherViews: Item[];
  customerAlsoViewed: Item[];
}

export default function ItemDetail({
  product,
  reviews,
  star_rating,
  recommended,
  frequentlyBoughtTogether,
  otherViews,
}: ItemDetailProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(
    product.images?.[0] || "/placeholder.png"
  );

  const salesPrice = parseFloat(product.sales_price);
  const regularPrice = parseFloat(product.regular_price);
  const [selectedVariation, setSelectedVariation] = useState<any | null>(null);
  const discount =
    regularPrice > salesPrice
      ? Math.round(((regularPrice - salesPrice) / regularPrice) * 100)
      : 0;

  const productUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/items/${product.slug}`
      : "";

  const shareText = `${product.title} - Check this out`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.title,
          text: shareText,
          url: productUrl,
        });
      } catch (err) {
        // user cancelled — silently ignore
      }
    }
  };

  const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
    productUrl
  )}`;

  const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(
    `${shareText} ${productUrl}`
  )}`;

  return (
    <>
      <div className="bg-white">
        <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* LEFT IMAGE SECTION */}
          <div className="flex gap-4 lg:col-span-1">
            {/* SMALLER THUMBNAILS */}
            <div className="flex flex-col gap-3">
              {product.images?.map((img, i) => (
                <Image
                  key={i}
                  src={img}
                  alt={`${product.title} ${i}`}
                  width={30}
                  height={30}
                  className={`rounded-md cursor-pointer border ${
                    selectedImage === img ? "border-red-800" : "border-gray-200"
                  }`}
                  onClick={() => setSelectedImage(img)}
                />
              ))}
            </div>

            {/* BIGGER MAIN IMAGE */}
            <div className="flex-1">
              <Zoom>
                <img
                  src={selectedImage}
                  alt={product.title}
                  className="rounded-lg shadow-md w-full object-cover max-h-137.5 cursor-zoom-in"
                />
              </Zoom>
            </div>
          </div>

          {/* PRODUCT INFO */}
          <div className="flex flex-col space-y-4">
            <div className="flex items-center gap-4">
              <h1 className="sm:text-2xl text-sm text-gray-800 font-semibold m-0">
                {product.title}
              </h1>

            </div>

            <div className="flex items-center text-xs gap-1 -mt-2">
              {" "}
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i}>
                  {i < product.average_rating ? <StarFilled /> : <StarEmpty />}
                </span>
              ))}
              
              {product.type === "products" && (
                <span
                  className={`text-white text-[8px] font-semibold px-2 py-1 rounded-full ${
                    getStockStatus(product.quantity).bgClass
                  }`}
                >
                  {getStockStatus(product.quantity).text}
                </span>
              )}
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
                  <span className="flex items-center justify-center text-white bg-red-600 rounded-full w-8 h-8 text-xs font-normal">
                    -{discount}%
                  </span>
                </>
              )}
            </div>

            <h2 className="text-gray-500 line-clamp-2">
              {parse(product.description)}
            </h2>

            {/* QUANTITY + ADD TO CART */}
            <div className="flex items-center gap-2 mt-5">
              {product.type === "products" && (
                <QuantityControl
                  quantity={quantity}
                  stockQty={product.quantity}
                  onIncrease={() => setQuantity((q) => q + 1)}
                  onDecrease={() => setQuantity((q) => Math.max(q - 1, 1))}
                />
              )}

              <AddToCartButton
                product={product}
                selectedImage={selectedImage}
                quantity={quantity}
                stockQty={product.quantity}
                selectedVariation={selectedVariation}
              />

              <WishlistButton product={product} />
            </div>

            {/* Variations Section */}
            {product.variations && product.variations.length > 0 && (
              <div
                id="variations-section"
                className="text-sm text-gray-700 space-y-2 pt-2"
              >
                <p className="font-semibold">Available Variations:</p>
                <div className="flex flex-wrap gap-3">
                  {product.variations.map((variant) => {
                    const isSelected = selectedVariation?.id === variant.id;

                    return (
                      <button
                        key={variant.id}
                        onClick={() => setSelectedVariation(variant)}
                        className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium transition-all border cursor-pointer ${
                          isSelected
                            ? "border-hub-primary bg-hub-primary/10 text-hub-primary ring-2 ring-hub-primary/20"
                            : "border-gray-200 bg-gray-50 text-gray-800 hover:border-gray-400"
                        }`}
                      >
                        {variant.color?.name && (
                          <span className="flex items-center gap-1">
                            <span
                              className="w-3 h-3 rounded-full border border-gray-300"
                              style={{
                                backgroundColor:
                                  variant.color.hexcode || "#ffffff",
                              }}
                            />
                            {variant.color.name}
                          </span>
                        )}
                        {variant.size?.name && (
                          <span>Size: {variant.size.name}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="text-sm text-gray-500 space-y-1">
              <p>
                Category:{" "}
                <Link
                  href={`/items?category=${product.category?.slug}&type=${product.type}`}
                  className="text-red-800"
                >
                  {product.category?.name}
                </Link>
              </p>

              <p>{product?.sku}</p>

              <p>
                Seller:{" "}
                <Link className="" href={`/shops/${product?.shop?.slug}`}>
                  <span className="text-red-800 text-xs truncate">
                    Similar listing from {product?.shop?.name}
                  </span>
                </Link>
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <span className="text-xs text-gray-500">Share:</span>

              {/* Native share (mobile-first) */}
              <button
                onClick={handleShare}
                aria-label="Share product"
                className="p-2 rounded-full hover:bg-gray-100 transition"
              >
                <FaShareAlt className="w-4.5 h-4.5 text-hub-primary" />
              </button>

              {/* Facebook */}
              <Link
                href={facebookShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Share on Facebook"
                className="p-2 rounded-full hover:bg-blue-50 transition"
              >
                <FaFacebook className="w-5 h-5 fill-blue-600" />
              </Link>

              {/* WhatsApp */}
              <Link
                href={whatsappShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Share on WhatsApp"
                className="p-2 rounded-full hover:bg-green-50 transition"
              >
                <FaWhatsapp className="w-5 h-5 fill-green-600" />
              </Link>
            </div>
          </div>

          {/* RIGHT-SIDE DESKTOP SECTION */}
          <div className="hidden lg:flex flex-col gap-4 lg:col-span-1">
            {otherViews && otherViews.length > 0 && (
              <div className="bg-white p-4 rounded-lg shadow-sm border">
                <h4 className="text-lg font-semibold text-gray-500 mb-3">
                  Customers Also Viewed
                </h4>

                <div className="flex flex-col gap-4">
                  {otherViews.slice(0, 2).map((item) => (
                    <Link
                      key={item.id}
                      href={`/items/${item.slug}`}
                      className="flex items-start gap-3 hover:bg-gray-50 p-2 rounded-md transition"
                    >
                      <Image
                        width={80}
                        height={80}
                        src={item.images?.[1] || "/placeholder.png"}
                        alt={item.title}
                        className="w-20 h-20 object-cover rounded-md border"
                      />

                      <div className="flex flex-col min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate line-clamp-1">
                          {item.title}
                        </p>

                        <p className="text-xs text-red-700 font-semibold mt-1">
                          {formatAmount(item.sales_price ?? item.regular_price)}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* TABS SECTION — NOW USING REAL BACKEND REVIEWS */}
      <ItemTabs
        product={product}
        description={product.description}
        reviews={reviews}
        star_rating={star_rating}
        recommended={recommended}
        frequentlyBoughtTogether={frequentlyBoughtTogether}
      />
    </>
  );
}

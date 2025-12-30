"use client";

import { useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShoppingCartIcon,
  MinusIcon,
  PlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { useCart } from "@/context/CartContext";
import Dropdown from "../common/Dropdown";
import { ClipLoader } from "react-spinners";
import { motion } from "framer-motion";
import { formatAmount } from "@/utils/formatCurrency";
import type { CartItem as CartItemType } from "@/context/CartContext";

type CartButtonProps = {
  onClick: () => void;
  disabled: boolean;
  isLoading: boolean;
  variant: "primary" | "secondary";
  children: React.ReactNode;
};

export default function CartDropdown() {
  const { cart, updateQty, removeFromCart } = useCart();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Use startTransition for non-blocking navigation
  const handleNavigate = (path: string) => {
    startTransition(() => {
      router.push(path);
    });
  };

  const totalItems = cart.length;
  const subtotal = cart.reduce(
    (acc, item) => acc + Number(item.price) * Number(item.qty),
    0
  );

  return (
    <Dropdown
      align="right"
      width="w-[21rem]"
      button={
        <motion.div
          whileTap={{ scale: 0.95 }}
          aria-label="Cart Items"
          className="relative flex items-center gap-2 bg-hub-primary text-white px-2 sm:px-4 py-2 rounded-full hover:bg-hub-secondary transition cursor-pointer"
        >
          <div className="relative">
            <ShoppingCartIcon aria-label="Cart items" className="w-4 h-4 lg:w-5 lg:h-5 transition" />
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-3 bg-white text-hub-secondary text-[9px] border font-extrabold rounded-full w-4 h-4 flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </div>
          <span className="hidden sm:inline font-heading">Cart</span>
        </motion.div>
      }
    >
      <div className="max-h-96 overflow-y-auto space-y-4 p-2">
        {cart.length === 0 ? (
          <p className="text-center text-gray-500 py-5">Your cart is empty</p>
        ) : (
          cart.map((item) => (
            <CartItem
              key={item.id}
              item={item}
              updateQty={updateQty}
              removeFromCart={removeFromCart}
            />
          ))
        )}
      </div>

      {cart.length > 0 && (
        <div className="p-3 border-t border-hub-primary">
          <div className="flex justify-between items-center mb-4">
            <span className="text-gray-600 font-medium">Subtotal:</span>
            <span className="text-gray-900 font-bold text-lg">
              {formatAmount(subtotal)}
            </span>
          </div>
          <div className="flex justify-between gap-3 text-sm">
            <CartButton
              onClick={() => handleNavigate("/carts")}
              disabled={isPending}
              isLoading={isPending}
              variant="secondary"
            >
              View Cart
            </CartButton>
            <CartButton
              onClick={() => handleNavigate("/checkout")}
              disabled={isPending}
              isLoading={isPending}
              variant="primary"
            >
              Checkout
            </CartButton>
          </div>
        </div>
      )}
    </Dropdown>
  );
}

type CartItemProps = {
  item: CartItemType;
  updateQty: (id: number, qty: number) => void;
  removeFromCart: (id: number) => void;
};

// Sub-component for the Cart Item
function CartItem({ item, updateQty, removeFromCart }: CartItemProps) {
  return (
    <div className="flex gap-3 border-b border-gray-200 pb-4 last:border-b-0">
      <Image
        src={item.image}
        alt={item.title}
        width={80}
        height={80}
        className="rounded-md object-cover"
      />
      <div className="flex-1 flex flex-col justify-between">
        <Link href={`/items/${item.slug}`}>
          <h4 className="text-sm font-medium line-clamp-1 hover:text-hub-primary">
            {item.title}
          </h4>
        </Link>
        <div className="flex items-center gap-3 mt-2 text-gray-500">
          <button
            onClick={() => updateQty(item.id, item.qty - 1)}
            className="w-5 h-5 flex items-center justify-center rounded-full cursor-pointer bg-gray-200 hover:bg-gray-300"
          >
            <MinusIcon className="w-3 h-3" />
          </button>
          <span className="text-sm font-medium w-4 text-center">
            {item.qty}
          </span>
          <button
            onClick={() => updateQty(item.id, item.qty + 1)}
            className="w-5 h-5 flex items-center justify-center rounded-full cursor-pointer bg-gray-200 hover:bg-gray-300"
          >
            <PlusIcon className="w-3 h-3" />
          </button>
        </div>
      </div>
      <div className="flex flex-col items-end justify-between text-gray-500">
        <span className="text-sm text-gray-700 font-semibold">
          {formatAmount(Number(item.price) * Number(item.qty))}
        </span>
        <button onClick={() => removeFromCart(item.id)}>
          <TrashIcon
            className="w-5 h-5 hover:text-hub-secondary text-red-500 cursor-pointer"
            title="Remove"
            aria-label="Trash icon"
          />
        </button>
      </div>
    </div>
  );
}

// Sub-component for the Cart Button
function CartButton({
  onClick,
  disabled,
  isLoading,
  variant,
  children,
}: CartButtonProps) {
  const baseClasses =
    "w-full py-2.5 rounded-full font-medium transition disabled:bg-gray-400 disabled:cursor-not-allowed";

  const variants = {
    primary: "btn btn-primary rounded-full! text-xs!",
    secondary: "btn btn-gray rounded-full! text-xs!",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variants[variant]}`}
    >
      {isLoading ? (
        <div className="flex justify-center items-center gap-2">
          <ClipLoader size={18} color="#fff" />
          <span>Processing...</span>
        </div>
      ) : (
        children
      )}
    </button>
  );
}

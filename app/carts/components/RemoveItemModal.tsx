"use client";

import WishlistButton from "@/app/(customer)/account/wishlists/components/WishlistButton";
import Modal from "@/app/components/common/Modal";
import { CartItem } from "@/context/CartContext";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  item: CartItem | null;
};

export default function RemoveItemModal({
  isOpen,
  onClose,
  onConfirm,
  item,
}: Props) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Remove from cart"
      description="Do you really want to remove this item from your cart or add to wishlist?"
    >
      
      <div className="flex justify-end gap-2 mt-6">
        {/* Move to Wishlist */}
        {item && (
          <WishlistButton product={item} /> 
        )}

        {/* Remove */}
        <button
          onClick={onConfirm}
          className="btn btn-primary"
        >
          Remove item
        </button>
      </div>
    </Modal>
  );
}

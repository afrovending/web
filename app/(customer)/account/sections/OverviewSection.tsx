"use client";

import { useEffect, useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import Image from "next/image";
import { updateUserProfile, deleteUserAccount } from "@/lib/api/auth/profile";
import toast from "react-hot-toast";
import ShippingSection from "./ShippingSection";
import useCanadaGreeting from "@/hooks/useCanadaGreeting";
import { useRouter } from "next/navigation";
import Modal from "@/app/components/common/Modal";
import {
  IoLocationOutline,
  IoPencilSharp,
  IoPersonCircleOutline,
} from "react-icons/io5";
import { PencilSquareIcon } from "@heroicons/react/24/outline";
import { UserCircleIcon } from "@heroicons/react/20/solid";

interface UpdateProfilePayload {
  name: string;
  last_name: string;
  phone: string;
}

export default function OverviewSection() {
  const router = useRouter();
  const greeting = useCanadaGreeting();

  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [payload, setPayload] = useState<UpdateProfilePayload>({
    name: user?.name || "",
    last_name: user?.last_name || "",
    phone: user?.phone || "",
  });

  useEffect(() => {
    if (user) {
      setPayload({
        name: user.name || "",
        last_name: user.last_name || "",
        phone: user.phone || "",
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPayload((prev) => ({ ...prev, [name]: value }));
  };

  const handleCancel = () => {
    if (user) {
      setPayload({
        name: user.name || "",
        last_name: user.last_name || "",
        phone: user.phone || "",
      });
    }
    setIsEditing(false);
  };

  /**
   * Sends the updated payload to the server
   */
  const handleSave = async () => {
    if (!user?.id) return;

    if (!payload.name.trim()) {
      return toast.error("First name is required");
    }

    if (!payload.last_name.trim()) {
      return toast.error("Last name is required");
    }

    if (!payload.phone.trim()) {
      return toast.error("Phone number is required");
    }

    setLoading(true);
    try {
      const updatedUser = await updateUserProfile(payload);
      updateUser(updatedUser);
      setIsEditing(false);
      toast.success("Profile updated successfully");
    } catch (err: any) {
      const message = err.response?.data?.message || "Failed to update profile";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles account deletion and cleanup
   */
  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await deleteUserAccount();
      toast.success("Account deleted. We're sorry to see you go.");
      clearAuth();
      router.replace("/");
    } catch (err: any) {
      const message =
        err.response?.data?.message || "Delete failed. Please contact support.";
      toast.error(message);
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };
  return (
    <div className="mx-auto space-y-6">
      <WelcomeBox greeting={greeting} name={user?.name} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ProfileCard
          user={user}
          isEditing={isEditing}
          payload={payload}
          loading={loading}
          onEdit={() => setIsEditing(true)}
          onCancel={handleCancel}
          onSave={handleSave}
          onChange={handleChange}
        />
        <ShippingSection user={user} />
      </div>

      <DangerZone onDeleteClick={() => setIsDeleteModalOpen(true)} />

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Account"
        description="Are you sure you want to delete your account? All your data, including order history and saved addresses, will be permanently removed."
      >
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-8">
          <button
            onClick={() => setIsDeleteModalOpen(false)}
            className="btn btn-gray"
            disabled={isDeleting}
          >
            Cancel
          </button>

          <button
            onClick={handleDeleteAccount}
            className="btn btn-primary"
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span>
                Deleting...
              </>
            ) : (
              "Permanently Delete"
            )}
          </button>
        </div>
      </Modal>
    </div>
  );
}

function WelcomeBox({ greeting, name }: { greeting: string; name?: string }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 overflow-hidden relative">
      <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-full -mr-16 -mt-16 opacity-50" />
      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 relative">
        {greeting}, <span className="text-green-800">{name ?? "Guest"}</span>
      </h2>
      <p className="text-sm mt-2 text-gray-600 leading-relaxed max-w-xl relative">
        From your dashboard, you can track{" "}
        <span className="font-medium text-gray-900 underline decoration-green-200 underline-offset-4">
          Recent Orders
        </span>
        , manage your addresses, and keep your profile details up to date.
      </p>
    </div>
  );
}

interface ProfileCardProps {
  user: any;
  isEditing: boolean;
  payload: any;
  loading: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

function ProfileCard({
  user,
  isEditing,
  payload,
  loading,
  onEdit,
  onCancel,
  onSave,
  onChange,
}: ProfileCardProps) {
  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col items-center">
      <div className="relative group">
        <Image
          src={user?.profile_photo || "/default-avatar.png"}
          width={100}
          height={100}
          alt="Profile"
          className="rounded-full border-4 border-gray-50 shadow-sm"
        />
        {!isEditing && (
          <button
            onClick={onEdit}
            className="absolute bottom-0 right-0 bg-white p-1.5 rounded-full shadow-md border border-gray-100 text-green-800 hover:scale-110 transition-transform"
          >
            <EditIcon />
          </button>
        )}
      </div>

      {isEditing ? (
        <div className="mt-6 w-full space-y-4">
          <div className="grid grid-cols-1 gap-3">
            <input
              className="input"
              name="name"
              value={payload.name}
              onChange={onChange}
              placeholder="First Name"
              disabled={loading}
            />
            <input
              className="input"
              name="last_name"
              value={payload.last_name}
              onChange={onChange}
              placeholder="Last Name"
              disabled={loading}
            />
            <input
              className="input"
              name="phone"
              value={payload.phone}
              onChange={onChange}
              placeholder="Phone Number"
              disabled={loading}
              maxLength={10}
            />
          </div>
          <div className="flex flex-col gap-2 mt-2">
            <button
              className="btn btn-primary"
              onClick={onSave}
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
            <button className="btn btn-gray" onClick={onCancel}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center mt-4">
          <h3 className="font-bold text-lg text-gray-900">
            {user?.name} {user?.last_name}
          </h3>
          <p className="text-gray-500 text-sm uppercase tracking-wider font-medium">
            {user?.role || "Customer"}
          </p>
          <p className="text-gray-400 text-xs mt-1">{user?.email}</p>
        </div>
      )}
    </div>
  );
}

const EditIcon = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
    />
  </svg>
);

function DangerZone({ onDeleteClick }: { onDeleteClick: () => void }) {
  return (
    <div className="bg-red-50/50 rounded-2xl p-5 border border-red-100 flex flex-col md:flex-row items-center justify-between gap-4">
      <div className="text-center md:text-left">
        <h3 className="text-sm font-bold text-red-800 uppercase tracking-tight">
          Delete Account
        </h3>
        <p className="text-xs text-red-700/70 mt-1 max-w-xs">
          Deleting your account is permanent. All orders and saved data will be
          lost forever.
        </p>
      </div>
      <button
        onClick={onDeleteClick}
        className="w-full cursor-pointer md:w-auto px-6 py-2.5 text-xs font-bold text-red-600 border-2 border-red-200 rounded-xl hover:bg-red-600 hover:text-white hover:border-red-600 transition-all active:scale-95"
      >
        Delete Account
      </button>
    </div>
  );
}

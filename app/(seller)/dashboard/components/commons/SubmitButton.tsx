import React from "react";
import { ClipLoader } from "react-spinners";

type SubmitButtonProps = {
  label?: string;
  loading?: boolean;
};

export function SubmitButton({
  label = "Save changes",
  loading = false,
}: SubmitButtonProps) {
  return (
    <button
      type="submit"
      disabled={loading}
      className={`w-full inline-flex items-center justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-bold rounded-md text-white  ${
        loading
          ? "bg-red-400 cursor-not-allowed"
          : "bg-red-400 hover:bg-red-600 cursor-pointer"
      }`}
    >
      {loading ? (
        <>
          <ClipLoader size={16} color="#fff" className="mr-2" />
          Processing...
        </>
      ) : (
        label
      )}
    </button>
  );
}

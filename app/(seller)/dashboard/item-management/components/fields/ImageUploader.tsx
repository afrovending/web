"use client";
import Image from "next/image";
import { HiOutlineUpload, HiOutlineXCircle } from "react-icons/hi";

export default function ImageUploader(props: any) {
  const {
    existingImages,
    newPreviews,
    handleImagesChange,
    removeExistingImage,
    removeNewImage,
    itemId,
  } = props;

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Item Images (min 2, max 7, 2MB each){" "}
        <span className="text-red-500">*</span>
      </label>

      {existingImages.urls.length + newPreviews.length < 7 && (
        <label className="relative w-full aspect-square border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-red-500 hover:bg-red-50 transition-colors overflow-hidden flex items-center justify-center p-4">
          <div className="flex flex-col items-center justify-center text-center text-gray-500">
            <HiOutlineUpload className="text-3xl" />
            <span className="mt-2 text-sm">
              Click to upload or drag and drop
            </span>
            <span className="text-xs mt-1 text-gray-400">
              You can add more images later
            </span>
          </div>
          <input
            id="itemImages"
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleImagesChange}
          />
        </label>
      )}

      <div className="mt-3 grid grid-cols-3 gap-2">
        {existingImages.urls.map((src: string, idx: number) => (
          <div
            key={"old-" + idx}
            className="relative rounded-lg overflow-hidden h-28 border border-red-950"
          >
            <Image src={src} alt={"img-" + idx} fill className="object-cover" />
            <button
              type="button"
              onClick={() => removeExistingImage(idx)}
              className="absolute top-1 right-1 bg-red-200 rounded-full p-1 shadow-md cursor-pointer hover:bg-red-400 "
            >
              <HiOutlineXCircle />
            </button>
          </div>
        ))}

        {newPreviews.map((src: string, idx: number) => (
          <div
            key={"new-" + idx}
            className="relative rounded-lg overflow-hidden h-28 border"
          >
            <Image src={src} alt={"new-" + idx} fill className="object-cover" />
            <button
              type="button"
              onClick={() => removeNewImage(idx)}
              className="absolute top-1 right-1 bg-red-200 p-1 rounded-full hover:bg-red-400"
            >
              <HiOutlineXCircle />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

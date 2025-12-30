"use client";

import React, { useState, useRef } from "react";
import toast from "react-hot-toast";
import { BeatLoader } from "react-spinners";

type Props = {
  label: string;
  uploadFn: (file: File) => Promise<any>; // << here
  currentUrl?: string | null;
  onUploadSuccess?: (url: string) => void;
  accept?: string;
  maxSizeMB?: number;
};

export default function ImageUploader({
  label,
  uploadFn,
  currentUrl = null,
  onUploadSuccess,
  accept = "image/*",
  maxSizeMB = 5,
}: Props) {
  const [preview, setPreview] = useState<string | null>(currentUrl);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleFile = (f?: File) => {
    const picked = f;
    if (!picked) return;

    if (picked.size > maxSizeMB * 1024 * 1024) {
      toast.error(`File too large. Max ${maxSizeMB} MB.`);
      return;
    }

    setFile(picked);
    setPreview(URL.createObjectURL(picked));
    uploadFile(picked);
  };

  const uploadFile = async (f: File) => {
    setUploading(true);
    setProgress(30); // small fake progress animation

    try {
      const resp = await uploadFn(f); // << use parent function here

      const url = resp?.data?.url ?? resp?.data ?? resp?.url ?? null;

      if (url) {
        onUploadSuccess?.(url);
        toast.success("Image uploaded successfully");
      } else {
        console.warn("Upload response missing url:", resp);
      }
    } catch (err) {
      console.error("Upload failed", err);
      toast.error("Upload failed. Try again.");
      setPreview(currentUrl);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const handleRemove = () => {
    setFile(null);
    setPreview(null);
    onUploadSuccess?.("");
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div>
      <label className="text-sm font-medium text-gray-700 block mb-1">
        {label}
      </label>

      <div className="flex items-center gap-4">
        <div className="w-28 h-28 border rounded overflow-hidden bg-gray-50 flex items-center justify-center">
          {preview ? (
            <img
              src={preview}
              alt="preview"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-xs text-gray-400 px-2 text-center">
              No image
            </div>
          )}
        </div>

        <div className="flex-1 space-y-2">
          <div className="flex gap-2">
            <label className="btn btn-sm btn-outline cursor-pointer">
              {uploading ? (
                <span className="flex items-center gap-2">
                  <BeatLoader size={6} /> Uploading
                </span>
              ) : (
                "Choose file"
              )}

              <input
                ref={inputRef}
                type="file"
                accept={accept}
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
            </label>

            {preview && (
              <button
                type="button"
                onClick={handleRemove}
                className="btn btn-sm btn-gray"
              >
                Remove
              </button>
            )}
          </div>

          <div className="text-xs text-gray-500">
            Max {maxSizeMB}MB. {uploading && <span>{progress}%</span>}
          </div>

          {uploading && (
            <div className="w-full bg-gray-100 h-2 rounded overflow-hidden">
              <div
                className="h-full bg-green-600 transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

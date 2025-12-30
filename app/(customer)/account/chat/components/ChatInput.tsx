"use client";

import { LuPaperclip, LuSmile, LuSend, LuX } from "react-icons/lu";
import { useState, useRef, FormEvent, ChangeEvent } from "react";
import toast from "react-hot-toast";

interface ChatInputProps {
  onSendMessage: (text: string, file?: File) => void;
  loading: boolean;
}

export default function ChatInput({ onSendMessage, loading }: ChatInputProps) {
  const [text, setText] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e?: FormEvent) => {
    e?.preventDefault();

    // Check if we have anything to send
    if (!text.trim() && !selectedFile) return;

    // Send the current state values
    onSendMessage(text, selectedFile || undefined);

    // Reset everything
    setText("");
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  return (
    <footer className="p-4 border-t border-hub-secondary bg-white">
      {/* File Preview Bubble */}
      {selectedFile && (
        <div className="mb-3 relative group w-fit animate-in fade-in slide-in-from-bottom-2">
          <div className="rounded-xl overflow-hidden border-2 border-green-100 shadow-sm bg-gray-50">
            {selectedFile.type.startsWith("image/") ? (
              <img
                src={URL.createObjectURL(selectedFile)}
                alt="Preview"
                className="h-20 w-20 object-cover"
                onLoad={(e) => URL.revokeObjectURL(e.currentTarget.src)}
              />
            ) : (
              <div className="h-20 w-20 flex flex-col items-center justify-center bg-green-50 text-green-600">
                <LuPaperclip size={24} />
                <span className="text-[10px] font-bold mt-1 uppercase">
                  {selectedFile.name.split(".").pop()}
                </span>
              </div>
            )}
          </div>

          {/* Remove Button */}
          <button
            type="button"
            onClick={() => {
              setSelectedFile(null);
              if (fileInputRef.current) fileInputRef.current.value = "";
            }}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors border-2 border-white"
          >
            <LuX size={12} />
          </button>

          {/* Filename tooltip on hover */}
          <div className="absolute top-full left-0 mt-1 hidden group-hover:block bg-gray-800 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-20">
            {selectedFile.name}
          </div>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-3 bg-gray-100 rounded-2xl px-4 py-2 transition-all focus-within:bg-gray-200/50"
      >
        <input
          type="file"
          name="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*,.pdf,.doc,.docx"
          onChange={handleFileChange}
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="text-gray-400 hover:text-green-500 transition-colors p-1"
        >
          <LuPaperclip size={20} />
        </button>

        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={loading ? "Sending..." : "Type a message..."}
          className="flex-1 bg-transparent border-none outline-none focus:outline-none focus:ring-0 focus:border-none text-sm text-gray-900 shadow-none"
          disabled={loading}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              toast("Use your keyboard emojis for now! 😉", {
                icon: "⌨️",
                style: {
                  borderRadius: "12px",
                  background: "#000",
                  color: "#fff",
                  fontSize: "14px",
                  fontWeight: "bold",
                },
                duration: 3000,
              });
            }}
            className="text-gray-400 hover:text-green-500 transition-colors p-1 hidden sm:block active:scale-90"
          >
            <LuSmile size={20} />
          </button>

          <button
            type="submit"
            disabled={loading || (!text.trim() && !selectedFile)}
            className="text-green-500 hover:text-green-600 disabled:text-gray-300 transition-all p-1"
          >
            <LuSend size={20} className={loading ? "animate-pulse" : ""} />
          </button>
        </div>
      </form>
    </footer>
  );
}

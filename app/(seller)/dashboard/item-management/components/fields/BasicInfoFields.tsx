"use client";
import { Editor as TinyMCEEditor } from "@tinymce/tinymce-react";
import { useState, KeyboardEvent } from "react";
import { FaTimes } from "react-icons/fa";

interface BasicInfoProps {
  title: string;
  setTitle: (value: string) => void;
  description: string;
  setDescription: (value: string) => void;
  keywords: string[];
  setKeywords: (value: string[]) => void;
}

export default function BasicInfoFields({
  title,
  setTitle,
  description,
  setDescription,
  keywords = [],
  setKeywords,
}: BasicInfoProps) {
  const [inputValue, setInputValue] = useState("");

  // Logic to add keyword
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const trimmed = inputValue.trim();

      // Add only if not empty and not duplicate
      if (trimmed && !keywords.includes(trimmed)) {
        setKeywords([...keywords, trimmed]);
        setInputValue("");
      }
    }
  };

  // Logic to remove keyword
  const removeKeyword = (indexToRemove: number) => {
    setKeywords(keywords.filter((_, index) => index !== indexToRemove));
  };

  return (
    <>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="input w-full"
          placeholder="Enter item title"
          maxLength={250}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">
          Description <span className="text-red-500">*</span>
          <span
            className={`ml-2 text-xs ${
              description.length > 4000
                ? "text-red-500 font-bold"
                : "text-gray-400"
            }`}
          >
            ({description.length}/4000)
          </span>
        </label>
        <TinyMCEEditor
          apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
          value={description}
          init={{
            height: 200,
            menubar: false,
            branding: false,
            elementpath: false,
            plugins: "link lists wordcount",
            toolbar:
              "undo redo | formatselect | bold italic underline | bullist numlist | link",
            content_style:
              "body { font-family:Inter,Arial,sans-serif; font-size:14px; color:#374151 }",

            wordcount_cleanregex: /[0-9.(),;:!?%#$'"_+=\-\[\]\/\\{}|~@<>*&^`]/g,
            setup: (editor: any) => {
              editor.on("KeyDown", (e: any) => {
                const content = editor.getContent({ format: "text" });
                if (
                  content.length >= 1900 &&
                  e.keyCode !== 8 &&
                  e.keyCode !== 46
                ) {
                  e.preventDefault();
                }
              });
            },
          }}
          onEditorChange={(content) => {
            if (content.length <= 4000) {
              setDescription(content);
            }
          }}
        />
      </div>

      {/* Keywords Field */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          SEO Keywords <span className="text-red-500">*</span>
          <span className="text-gray-400 text-xs">
            (Press Enter or Comma to add)
          </span>
        </label>

        <div className="flex flex-wrap items-center gap-2 input">
          {/* Render Chips */}
          {keywords.map((keyword: string, index: number) => (
            <span
              key={index}
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-green-100 text-green-800"
            >
              {keyword}
              <button
                type="button"
                aria-label="remove"
                onClick={() => removeKeyword(index)}
                className="ml-1.5 cursor-pointer inline-flex items-center justify-center text-green-400 hover:text-green-600 focus:outline-none"
              >
                <FaTimes size={12} />
              </button>
            </span>
          ))}

          {/* Input for typing new keywords */}
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 outline-none bg-transparent min-w-35 text-sm text-gray-700 placeholder-gray-400"
            placeholder={
              keywords.length === 0 ? "e.g., Authentic, Organic, Food" : ""
            }
          />
        </div>
      </div>
    </>
  );
}

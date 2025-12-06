"use client";
import { Editor as TinyMCEEditor } from "@tinymce/tinymce-react";

export default function BasicInfoFields(props: any) {
  const { title, setTitle, description, setDescription } = props;
  return (
    <>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="input"
          placeholder="Enter item title"
          maxLength={50}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description <span className="text-red-500">*</span>
        </label>
        <TinyMCEEditor
          apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY}
          value={description}
          init={{
            height: 200,
            menubar: false,
            plugins: "link lists",
            toolbar:
              "undo redo | formatselect | bold italic underline | bullist numlist | link",
            content_style:
              "body { font-family:Inter,Arial,sans-serif; font-size:14px; color:#374151 }",
          }}
          onEditorChange={(c) => setDescription(c)}
        />
      </div>
    </>
  );
}

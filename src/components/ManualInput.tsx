"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, X, ArrowRight, FileImage } from "lucide-react";

export default function ManualInput({
  onSubmit,
  onBack,
  disabled,
}: {
  onSubmit: (caption: string, images: File[]) => void;
  onBack: () => void;
  disabled?: boolean;
}) {
  const [caption, setCaption] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const files = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith("image/")
    );
    setImages((prev) => [...prev, ...files]);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files).filter((f) =>
        f.type.startsWith("image/")
      );
      setImages((prev) => [...prev, ...files]);
    }
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (caption.trim() && !disabled) {
      onSubmit(caption, images);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      <button
        onClick={onBack}
        className="text-sm text-gray-500 hover:text-brand-700 transition-colors"
        disabled={disabled}
      >
        &larr; Back to URL input
      </button>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Post Caption / Text
          </label>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Paste the event post caption or description here..."
            rows={6}
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 outline-none focus:border-brand-700 transition-colors resize-y text-gray-900 placeholder:text-gray-400"
            disabled={disabled}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Images (optional)
          </label>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
              dragActive
                ? "border-brand-700 bg-brand-50"
                : "border-gray-300 hover:border-gray-400"
            }`}
          >
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">
              Drag & drop images here, or click to browse
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>

        {images.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {images.map((file, i) => (
              <div key={i} className="relative group">
                <div className="w-20 h-20 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
                  <FileImage className="w-8 h-8 text-gray-400" />
                </div>
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-3 h-3" />
                </button>
                <p className="text-[10px] text-gray-400 truncate max-w-[80px] mt-1">
                  {file.name}
                </p>
              </div>
            ))}
          </div>
        )}

        <button
          type="submit"
          disabled={!caption.trim() || disabled}
          className="flex items-center gap-2 bg-brand-700 text-white px-6 py-3 rounded-xl font-medium hover:bg-brand-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors mx-auto"
        >
          Process Content
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}

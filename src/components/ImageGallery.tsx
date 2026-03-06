"use client";

import { Download, ImageIcon } from "lucide-react";

interface CompressedImageData {
  name: string;
  originalSize: number;
  compressedSize: number;
  thumbnailSize: number;
  mainBase64: string;
  thumbnailBase64: string;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function downloadBase64(base64: string, filename: string) {
  const link = document.createElement("a");
  link.href = `data:image/webp;base64,${base64}`;
  link.download = filename;
  link.click();
}

export default function ImageGallery({
  images,
}: {
  images: CompressedImageData[];
}) {
  if (images.length === 0) return null;

  const downloadAll = () => {
    images.forEach((img, i) => {
      setTimeout(() => {
        downloadBase64(img.mainBase64, `event_${i}_main.webp`);
        downloadBase64(img.thumbnailBase64, `event_${i}_thumb.webp`);
      }, i * 200);
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-brand-700" />
          Compressed Images
        </h3>
        <button
          onClick={downloadAll}
          className="flex items-center gap-2 text-sm text-brand-700 hover:text-brand-800 font-medium"
        >
          <Download className="w-4 h-4" />
          Download All
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {images.map((img, i) => {
          const savings = Math.round(
            ((img.originalSize - img.compressedSize) / img.originalSize) * 100
          );
          return (
            <div
              key={i}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden"
            >
              {/* Image preview */}
              <div className="aspect-video bg-gray-100 relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`data:image/webp;base64,${img.mainBase64}`}
                  alt={img.name}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="p-3 space-y-2">
                <p className="text-sm font-medium text-gray-800">{img.name}</p>

                {/* Size comparison */}
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <span>Original: {formatSize(img.originalSize)}</span>
                  <span>&rarr;</span>
                  <span className="text-green-600 font-medium">
                    Main: {formatSize(img.compressedSize)}
                  </span>
                  <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded text-[10px] font-bold">
                    -{savings}%
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  Thumbnail: {formatSize(img.thumbnailSize)}
                </div>

                {/* Download buttons */}
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() =>
                      downloadBase64(img.mainBase64, `event_${i}_main.webp`)
                    }
                    className="flex-1 flex items-center justify-center gap-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 py-1.5 rounded-lg transition-colors"
                  >
                    <Download className="w-3 h-3" />
                    Main
                  </button>
                  <button
                    onClick={() =>
                      downloadBase64(
                        img.thumbnailBase64,
                        `event_${i}_thumb.webp`
                      )
                    }
                    className="flex-1 flex items-center justify-center gap-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 py-1.5 rounded-lg transition-colors"
                  >
                    <Download className="w-3 h-3" />
                    Thumbnail
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

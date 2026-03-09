"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  Copy,
  Check,
  RotateCcw,
  Upload,
  AlertTriangle,
  ExternalLink,
  Search,
  ChevronDown,
  ChevronRight,
  Star,
  Phone,
  Globe,
  MapPin,
  X,
} from "lucide-react";
import ContentInput from "@/components/ContentInput";
import StatusIndicator from "@/components/StatusIndicator";
import EventPreview from "@/components/EventPreview";
import CopyField from "@/components/CopyField";
import ImageGallery from "@/components/ImageGallery";
import type { EventContent, ProcessingStep, DjangoListing } from "@/types";
import { generateFillScript, ADMIN_ADD_URL } from "@/lib/admin-script";
import { fetchAllListings } from "@/lib/django/services";

interface CompressedImageData {
  name: string;
  originalSize: number;
  compressedSize: number;
  thumbnailSize: number;
  mainBase64: string;
  thumbnailBase64: string;
}

const ADMIN_LISTING_URL =
  "https://admin.gogevgelija.com/admin/core/listing/";

// ─── Listings Sidebar ────────────────────────────────────────────

function ListingsSidebar({
  selectedId,
  onSelect,
}: {
  selectedId: number | null;
  onSelect: (listing: DjangoListing) => void;
}) {
  const [listings, setListings] = useState<DjangoListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    fetchAllListings()
      .then(setListings)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = search
    ? listings.filter((l) =>
        l.title.toLowerCase().includes(search.toLowerCase())
      )
    : listings;

  return (
    <div className="border border-gray-200 rounded-xl bg-white flex flex-col h-[calc(100vh-10rem)] sticky top-24">
      <div className="p-3 border-b border-gray-100 space-y-2">
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
          Listings Reference
        </h3>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search listings..."
            className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-700/30 focus:border-brand-700"
          />
        </div>
        <p className="text-xs text-gray-400">
          {loading
            ? "Loading..."
            : `${filtered.length} listings`}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
        {filtered.map((listing) => {
          const expanded = expandedId === listing.id;
          const selected = selectedId === listing.id;
          const hasDetails =
            listing.phone_number ||
            listing.facebook_url ||
            listing.instagram_url ||
            listing.website_url ||
            listing.google_maps_url;

          return (
            <div
              key={listing.id}
              className={`px-3 py-2 transition-colors ${selected ? "bg-brand-50 border-l-2 border-l-brand-700" : ""}`}
            >
              <div className="flex items-start gap-2">
                <button
                  onClick={() =>
                    setExpandedId(expanded ? null : listing.id)
                  }
                  className="mt-0.5 flex-shrink-0"
                >
                  {expanded ? (
                    <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                  )}
                </button>
                <button
                  onClick={() => onSelect(listing)}
                  className="flex-1 min-w-0 text-left"
                >
                  <p
                    className={`text-sm font-medium truncate ${selected ? "text-brand-700" : "text-gray-900"}`}
                  >
                    {selected && "✓ "}
                    {listing.title}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {listing.category && (
                      <span className="text-xs text-gray-500">
                        {listing.category.name}
                      </span>
                    )}
                    {listing.featured && (
                      <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                    )}
                    {!listing.is_active && (
                      <span className="text-xs text-red-500 font-medium">
                        Inactive
                      </span>
                    )}
                  </div>
                </button>
              </div>

              {expanded && (
                <div className="ml-5.5 mt-2 space-y-1.5 text-xs">
                  {listing.phone_number && (
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <Phone className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{listing.phone_number}</span>
                    </div>
                  )}
                  {listing.website_url && (
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <Globe className="w-3 h-3 flex-shrink-0" />
                      <a
                        href={listing.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="truncate hover:text-brand-700"
                      >
                        {listing.website_url}
                      </a>
                    </div>
                  )}
                  {listing.facebook_url && (
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <span className="w-3 h-3 flex-shrink-0 text-[10px] font-bold leading-3 text-center">
                        f
                      </span>
                      <a
                        href={listing.facebook_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="truncate hover:text-brand-700"
                      >
                        {listing.facebook_url}
                      </a>
                    </div>
                  )}
                  {listing.instagram_url && (
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <span className="w-3 h-3 flex-shrink-0 text-[10px] font-bold leading-3 text-center">
                        ig
                      </span>
                      <a
                        href={listing.instagram_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="truncate hover:text-brand-700"
                      >
                        {listing.instagram_url}
                      </a>
                    </div>
                  )}
                  {listing.google_maps_url && (
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      <a
                        href={listing.google_maps_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="truncate hover:text-brand-700"
                      >
                        Google Maps
                      </a>
                    </div>
                  )}
                  {!hasDetails && (
                    <p className="text-gray-400 italic">No contact details</p>
                  )}
                  <a
                    href={`${ADMIN_LISTING_URL}${listing.id}/change/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-brand-700 hover:text-brand-800 font-medium mt-1"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Django Admin
                  </a>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────

export default function AddContentPage() {
  const [step, setStep] = useState<ProcessingStep>("idle");
  const [error, setError] = useState<string>();
  const [eventContent, setEventContent] = useState<EventContent | null>(null);
  const [compressedImages, setCompressedImages] = useState<
    CompressedImageData[]
  >([]);
  const [allCopied, setAllCopied] = useState(false);
  const [scriptCopied, setScriptCopied] = useState(false);
  const [imageNote, setImageNote] = useState<string>();
  const [isCompressing, setIsCompressing] = useState(false);
  const [selectedListing, setSelectedListing] = useState<DjangoListing | null>(null);
  const uploadRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setStep("idle");
    setError(undefined);
    setEventContent(null);
    setCompressedImages([]);
    setImageNote(undefined);
    setIsCompressing(false);
    setScriptCopied(false);
    setSelectedListing(null);
  };

  const updateField = useCallback(
    (field: keyof EventContent, value: string) => {
      setEventContent((prev) => (prev ? { ...prev, [field]: value } : prev));
    },
    []
  );

  const selectListing = useCallback((listing: DjangoListing) => {
    setSelectedListing((prev) => {
      if (prev?.id === listing.id) return null; // deselect
      // Auto-fill contact fields from the selected listing
      setEventContent((ec) => {
        if (!ec) return ec;
        return {
          ...ec,
          phone_number: listing.phone_number || "",
          website_url: listing.website_url || "",
          facebook_url: listing.facebook_url || "",
          instagram_url: listing.instagram_url || "",
          google_maps_url: listing.google_maps_url || "",
        };
      });
      return listing;
    });
  }, []);

  const processFromUrl = useCallback(async (url: string) => {
    setStep("scraping");
    setError(undefined);

    try {
      const scrapeRes = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const scrapeData = await scrapeRes.json();

      if (!scrapeRes.ok) {
        throw new Error(scrapeData.error || "Scraping failed");
      }

      setStep("processing");
      const processRes = await fetch("/api/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caption: scrapeData.caption,
          images: scrapeData.images,
          platform: scrapeData.platform,
          sourceUrl: url,
        }),
      });

      if (!processRes.ok) {
        const processData = await processRes.json();
        throw new Error(processData.error);
      }

      const content: EventContent = await processRes.json();
      setEventContent(content);

      if (scrapeData.imagesNote) {
        setImageNote(scrapeData.imagesNote);
      }

      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setStep("error");
    }
  }, []);

  const processFromManual = useCallback(async (text: string, images: File[]) => {
    setStep("processing");
    setError(undefined);

    try {
      const processRes = await fetch("/api/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caption: text,
          images: [],
          platform: "manual",
          sourceUrl: "",
        }),
      });

      if (!processRes.ok) {
        const processData = await processRes.json();
        throw new Error(processData.error);
      }

      const content: EventContent = await processRes.json();
      setEventContent(content);

      // If user attached images, compress them
      if (images.length > 0) {
        setIsCompressing(true);
        try {
          const formData = new FormData();
          images.forEach((f) => formData.append("images", f));
          const res = await fetch("/api/compress", {
            method: "POST",
            body: formData,
          });
          if (res.ok) {
            const data = await res.json();
            setCompressedImages(data.images || []);
          }
        } catch {
          // silent fail for compression
        } finally {
          setIsCompressing(false);
        }
      } else {
        setImageNote("No images provided. Please upload images manually.");
      }

      setStep("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setStep("error");
    }
  }, []);

  const copyAllFields = async () => {
    if (!eventContent) return;

    const text = [
      `=== ENGLISH ===`,
      `Title: ${eventContent.title}`,
      `Description: ${eventContent.description}`,
      `Date/Time: ${eventContent.date_time}`,
      `Location: ${eventContent.location}`,
      `Entry Price: ${eventContent.entry_price}`,
      `Age Limit: ${eventContent.age_limit}`,
      `Expectations: ${JSON.stringify(eventContent.expectations, null, 2)}`,
      ``,
      `=== MACEDONIAN ===`,
      `Title (MK): ${eventContent.title_mk}`,
      `Description (MK): ${eventContent.description_mk}`,
      `Location (MK): ${eventContent.location_mk}`,
      `Entry Price (MK): ${eventContent.entry_price_mk}`,
      `Age Limit (MK): ${eventContent.age_limit_mk}`,
      `Expectations (MK): ${JSON.stringify(eventContent.expectations_mk, null, 2)}`,
      ``,
      `=== CONTACT ===`,
      eventContent.phone_number ? `Phone: ${eventContent.phone_number}` : null,
      eventContent.website_url ? `Website: ${eventContent.website_url}` : null,
      eventContent.facebook_url ? `Facebook: ${eventContent.facebook_url}` : null,
      eventContent.instagram_url ? `Instagram: ${eventContent.instagram_url}` : null,
      eventContent.google_maps_url ? `Google Maps: ${eventContent.google_maps_url}` : null,
      selectedListing
        ? `\n=== LISTING ===\n${selectedListing.title} (ID: ${selectedListing.id})`
        : null,
    ]
      .filter(Boolean)
      .join("\n");

    await navigator.clipboard.writeText(text);
    setAllCopied(true);
    setTimeout(() => setAllCopied(false), 2000);
  };

  const fillDjangoAdmin = async () => {
    if (!eventContent) return;
    const listingIds = selectedListing ? [selectedListing.id] : [];
    const categoryId = selectedListing?.category?.id ?? null;
    const script = generateFillScript(eventContent, listingIds, categoryId);
    await navigator.clipboard.writeText(script);
    setScriptCopied(true);
    window.open(ADMIN_ADD_URL, "_blank");
  };

  const uploadAndCompress = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsCompressing(true);
    try {
      const formData = new FormData();
      Array.from(files).forEach((f) => formData.append("images", f));
      const res = await fetch("/api/compress", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setCompressedImages(data.images || []);
        setImageNote(undefined);
      }
    } catch {
      // silent fail for image compression
    } finally {
      setIsCompressing(false);
    }
  }, []);

  const isProcessing = step !== "idle" && step !== "done" && step !== "error";
  const selectedId = selectedListing?.id ?? null;

  return (
    <div className="flex gap-6">
      {/* Main Content Area */}
      <div className="flex-1 min-w-0 space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Add Event</h1>
          {step !== "idle" && (
            <button
              onClick={reset}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-brand-700 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Start Over
            </button>
          )}
        </div>

        {/* Selected Listing Chip */}
        {selectedListing && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Linked Listing:
            </span>
            <span className="inline-flex items-center gap-1 bg-brand-50 text-brand-700 text-xs font-medium px-2.5 py-1 rounded-full border border-brand-200">
              {selectedListing.title}
              <button
                onClick={() => setSelectedListing(null)}
                className="hover:text-brand-900"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          </div>
        )}

        {/* Input Section */}
        {step === "idle" && (
          <div className="text-center space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Extract Event Content
              </h2>
              <p className="text-gray-500">
                Paste a social media URL or manually enter post text to
                automatically translate and optimize event content.
              </p>
            </div>

            <ContentInput
              onSubmitUrl={processFromUrl}
              onSubmitManual={processFromManual}
              disabled={isProcessing}
            />
          </div>
        )}

        {/* Status */}
        {step !== "idle" && (
          <StatusIndicator currentStep={step} error={error} />
        )}

        {/* Results */}
        {eventContent && step === "done" && (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                Extracted Content
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={fillDjangoAdmin}
                  className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                >
                  {scriptCopied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Script Copied
                    </>
                  ) : (
                    <>
                      <ExternalLink className="w-4 h-4" />
                      Fill Django Admin
                    </>
                  )}
                </button>
                <button
                  onClick={copyAllFields}
                  className="flex items-center gap-2 bg-brand-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-800 transition-colors"
                >
                  {allCopied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied All
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy All Fields
                    </>
                  )}
                </button>
              </div>
            </div>
            {scriptCopied && (
              <div className="bg-gray-900 text-gray-100 rounded-lg px-4 py-3 text-sm">
                <p className="font-medium">
                  Script copied! Admin page opened in new tab.
                </p>
                <p className="text-gray-400 mt-1">
                  Press{" "}
                  <kbd className="bg-gray-700 px-1.5 py-0.5 rounded text-xs">
                    Cmd+Option+J
                  </kbd>{" "}
                  to open console, then{" "}
                  <kbd className="bg-gray-700 px-1.5 py-0.5 rounded text-xs">
                    Cmd+V
                  </kbd>{" "}
                  to paste and{" "}
                  <kbd className="bg-gray-700 px-1.5 py-0.5 rounded text-xs">
                    Enter
                  </kbd>{" "}
                  to run.
                </p>
                {selectedListing && (
                  <p className="text-gray-400 mt-1">
                    Listing &ldquo;{selectedListing.title}&rdquo; will be linked.
                  </p>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1">
                <EventPreview event={eventContent} />
              </div>

              <div className="lg:col-span-2 space-y-8">
                {/* English Fields */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded text-xs flex items-center justify-center font-bold">
                      EN
                    </span>
                    English
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2">
                      <CopyField
                        label="Title"
                        value={eventContent.title}
                        onChange={(v) => updateField("title", v)}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <CopyField
                        label="Description"
                        value={eventContent.description}
                        multiline
                        onChange={(v) => updateField("description", v)}
                      />
                    </div>
                    <CopyField
                      label="Date / Time"
                      value={eventContent.date_time}
                      onChange={(v) => updateField("date_time", v)}
                    />
                    <CopyField
                      label="Location"
                      value={eventContent.location}
                      onChange={(v) => updateField("location", v)}
                    />
                    <CopyField
                      label="Entry Price"
                      value={eventContent.entry_price}
                      onChange={(v) => updateField("entry_price", v)}
                    />
                    <CopyField
                      label="Age Limit"
                      value={eventContent.age_limit}
                      onChange={(v) => updateField("age_limit", v)}
                    />
                    <div className="sm:col-span-2">
                      <CopyField
                        label="Expectations (JSON)"
                        value={JSON.stringify(
                          eventContent.expectations,
                          null,
                          2
                        )}
                        multiline
                      />
                    </div>
                  </div>
                </div>

                {/* Macedonian Fields */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 bg-red-100 text-red-700 rounded text-xs flex items-center justify-center font-bold">
                      МК
                    </span>
                    Macedonian
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2">
                      <CopyField
                        label="Title (MK)"
                        value={eventContent.title_mk}
                        onChange={(v) => updateField("title_mk", v)}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <CopyField
                        label="Description (MK)"
                        value={eventContent.description_mk}
                        multiline
                        onChange={(v) => updateField("description_mk", v)}
                      />
                    </div>
                    <CopyField
                      label="Location (MK)"
                      value={eventContent.location_mk}
                      onChange={(v) => updateField("location_mk", v)}
                    />
                    <CopyField
                      label="Entry Price (MK)"
                      value={eventContent.entry_price_mk}
                      onChange={(v) => updateField("entry_price_mk", v)}
                    />
                    <CopyField
                      label="Age Limit (MK)"
                      value={eventContent.age_limit_mk}
                      onChange={(v) => updateField("age_limit_mk", v)}
                    />
                    <div className="sm:col-span-2">
                      <CopyField
                        label="Expectations MK (JSON)"
                        value={JSON.stringify(
                          eventContent.expectations_mk,
                          null,
                          2
                        )}
                        multiline
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4 flex items-center gap-2">
                    <span className="w-6 h-6 bg-gray-100 text-gray-700 rounded text-xs flex items-center justify-center">
                      <Phone className="w-3.5 h-3.5" />
                    </span>
                    Contact Information
                  </h3>
                  {!selectedListing && (
                    <p className="text-xs text-gray-400 mb-3">
                      Select a listing from the sidebar to auto-fill contact details.
                    </p>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <CopyField
                      label="Phone Number"
                      value={eventContent.phone_number || ""}
                      onChange={(v) => updateField("phone_number", v)}
                    />
                    <CopyField
                      label="Website URL"
                      value={eventContent.website_url || ""}
                      onChange={(v) => updateField("website_url", v)}
                    />
                    <CopyField
                      label="Facebook URL"
                      value={eventContent.facebook_url || ""}
                      onChange={(v) => updateField("facebook_url", v)}
                    />
                    <CopyField
                      label="Instagram URL"
                      value={eventContent.instagram_url || ""}
                      onChange={(v) => updateField("instagram_url", v)}
                    />
                    <div className="sm:col-span-2">
                      <CopyField
                        label="Google Maps URL"
                        value={eventContent.google_maps_url || ""}
                        onChange={(v) => updateField("google_maps_url", v)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Image Upload + Compressed Images */}
            <div className="pt-4 border-t border-gray-200 space-y-4">
              {imageNote && compressedImages.length === 0 && (
                <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-amber-800">
                    <p className="font-medium">Images need manual upload</p>
                    <p className="mt-1">{imageNote}</p>
                  </div>
                </div>
              )}

              {compressedImages.length === 0 && (
                <div
                  onClick={() => uploadRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 hover:border-brand-700 rounded-xl p-8 text-center cursor-pointer transition-colors"
                >
                  {isCompressing ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-8 h-8 border-2 border-brand-700 border-t-transparent rounded-full animate-spin" />
                      <p className="text-sm text-gray-500">
                        Compressing images...
                      </p>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm font-medium text-gray-700">
                        Upload event images to compress
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Images will be converted to WEBP with main (1200px) +
                        thumbnail (430x430) variants
                      </p>
                    </>
                  )}
                  <input
                    ref={uploadRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => uploadAndCompress(e.target.files)}
                    className="hidden"
                  />
                </div>
              )}

              {compressedImages.length > 0 && (
                <ImageGallery images={compressedImages} />
              )}
            </div>
          </div>
        )}

        {/* Error state with retry */}
        {step === "error" && !eventContent && (
          <div className="text-center py-8">
            <button
              onClick={reset}
              className="inline-flex items-center gap-2 bg-brand-700 text-white px-6 py-3 rounded-xl font-medium hover:bg-brand-800 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Try Again
            </button>
          </div>
        )}
      </div>

      {/* Listings Sidebar */}
      <div className="hidden xl:block w-80 flex-shrink-0">
        <ListingsSidebar
          selectedId={selectedId}
          onSelect={selectListing}
        />
      </div>
    </div>
  );
}

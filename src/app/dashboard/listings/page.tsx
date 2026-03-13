"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchAllListings } from "@/lib/django/services";
import type { DjangoListing } from "@/types";

export default function ListingsPage() {
  const { data: listings, isLoading } = useQuery<DjangoListing[]>({
    queryKey: ["django-all-listings"],
    queryFn: fetchAllListings,
  });

  if (isLoading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">All Listings</h1>
        <p className="text-muted-foreground">Loading listings...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-1">All Listings</h1>
      <p className="text-sm text-muted-foreground mb-6">
        {listings?.length ?? 0} listings — English titles and descriptions
      </p>

      <div className="space-y-4">
        {listings?.map((listing, index) => (
          <div
            key={listing.id}
            className="border rounded-lg p-4 bg-white"
          >
            <div className="flex items-start gap-3">
              <span className="text-xs font-mono text-muted-foreground mt-1 shrink-0">
                {index + 1}.
              </span>
              <div className="min-w-0">
                <h2 className="font-semibold text-base">{listing.title}</h2>
                {listing.category && (
                  <span className="text-xs text-muted-foreground">
                    {listing.category.name}
                  </span>
                )}
                <p className="text-sm text-gray-700 mt-2 whitespace-pre-line">
                  {listing.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  fetchEvents,
  fetchListings,
  fetchPromotions,
} from "@/lib/django/services";
import { ContentCard } from "@/components/content-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function ContentPage() {
  const [search, setSearch] = useState("");

  const { data: events } = useQuery({
    queryKey: ["django-events"],
    queryFn: fetchEvents,
  });

  const { data: listings } = useQuery({
    queryKey: ["django-listings"],
    queryFn: fetchListings,
  });

  const { data: promotions } = useQuery({
    queryKey: ["django-promotions"],
    queryFn: fetchPromotions,
  });

  const filterByTitle = <T extends { title: string }>(items: T[]) =>
    items.filter((item) =>
      item.title.toLowerCase().includes(search.toLowerCase())
    );

  const adminBase = "https://admin.gogevgelija.com/admin/core";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Content</h1>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Tabs defaultValue="events">
        <TabsList>
          <TabsTrigger value="events">
            Events{events ? ` (${events.count})` : ""}
          </TabsTrigger>
          <TabsTrigger value="listings">
            Listings{listings ? ` (${listings.count})` : ""}
          </TabsTrigger>
          <TabsTrigger value="promotions">
            Promotions{promotions ? ` (${promotions.count})` : ""}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {events &&
              filterByTitle(events.results).map((event) => (
                <ContentCard
                  key={event.id}
                  title={event.title}
                  subtitle={`${event.date_time} \u00B7 ${event.location}`}
                  image={event.image_thumbnail || event.image}
                  featured={event.featured}
                  active={event.is_active}
                  meta={`${event.join_count} joined`}
                  adminUrl={`${adminBase}/event/${event.id}/change/`}
                />
              ))}
          </div>
          {events?.results.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              No events found.
            </p>
          )}
        </TabsContent>

        <TabsContent value="listings" className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {listings &&
              filterByTitle(listings.results).map((listing) => (
                <ContentCard
                  key={listing.id}
                  title={listing.title}
                  subtitle={listing.address}
                  image={listing.image_thumbnail || listing.image}
                  featured={listing.featured}
                  active={listing.is_active}
                  adminUrl={`${adminBase}/listing/${listing.id}/change/`}
                />
              ))}
          </div>
          {listings?.results.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              No listings found.
            </p>
          )}
        </TabsContent>

        <TabsContent value="promotions" className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {promotions &&
              filterByTitle(promotions.results).map((promo) => (
                <ContentCard
                  key={promo.id}
                  title={promo.title}
                  subtitle={promo.description}
                  image={promo.image_thumbnail || promo.image}
                  featured={promo.featured}
                  active={promo.is_active}
                  meta={
                    promo.valid_until
                      ? `Expires: ${promo.valid_until}`
                      : undefined
                  }
                  adminUrl={`${adminBase}/promotion/${promo.id}/change/`}
                />
              ))}
          </div>
          {promotions?.results.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              No promotions found.
            </p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

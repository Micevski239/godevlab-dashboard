import djangoClient from "./client";
import type {
  DjangoListing,
  DjangoEvent,
  DjangoPromotion,
  PaginatedResponse,
} from "@/types";

export async function fetchEvents(): Promise<
  PaginatedResponse<DjangoEvent>
> {
  const { data } = await djangoClient.get("/api/events/");
  return data;
}

export async function fetchListings(): Promise<
  PaginatedResponse<DjangoListing>
> {
  const { data } = await djangoClient.get("/api/listings/");
  return data;
}

export async function fetchAllListings(): Promise<DjangoListing[]> {
  const all: DjangoListing[] = [];
  let nextUrl: string | null = "/api/listings/?page_size=100";
  while (nextUrl) {
    const res = await djangoClient.get<PaginatedResponse<DjangoListing>>(
      nextUrl
    );
    const page: PaginatedResponse<DjangoListing> = res.data;
    all.push(...page.results);
    if (page.next) {
      const parsed = new URL(page.next);
      nextUrl = parsed.pathname + parsed.search;
    } else {
      nextUrl = null;
    }
  }
  return all;
}

export async function fetchPromotions(): Promise<
  PaginatedResponse<DjangoPromotion>
> {
  const { data } = await djangoClient.get("/api/promotions/");
  return data;
}

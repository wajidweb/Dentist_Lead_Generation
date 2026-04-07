import { GoogleAuth } from "google-auth-library";
import path from "path";
import Lead from "../models/Lead";
import SearchHistory from "../models/SearchHistory";

const PLACES_BASE = "https://places.googleapis.com/v1";

// Service account auth — gets OAuth2 access token
const auth = new GoogleAuth({
  keyFile: path.resolve(
    process.env.GOOGLE_APPLICATION_CREDENTIALS || "./google-credentials.json"
  ),
  scopes: ["https://www.googleapis.com/auth/cloud-platform"],
});

async function getAccessToken(): Promise<string> {
  const client = await auth.getClient();
  const tokenResponse = await client.getAccessToken();
  if (!tokenResponse.token) {
    throw new Error("Failed to obtain Google access token");
  }
  return tokenResponse.token;
}

interface PlaceResult {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  rating?: number;
  userRatingCount?: number;
  websiteUri?: string;
  nationalPhoneNumber?: string;
  googleMapsUri?: string;
  businessStatus?: string;
  reviews?: Array<{
    rating: number;
    text?: { text: string };
    authorAttribution?: { displayName: string };
    publishTime?: string;
    relativePublishTimeDescription?: string;
  }>;
}

interface TextSearchResponse {
  places?: PlaceResult[];
  nextPageToken?: string;
}

function parseLocation(location: string): { city: string; state: string } {
  const parts = location.split(",").map((p) => p.trim());
  return {
    city: parts[0] || location,
    state: parts[1] || "",
  };
}

async function textSearch(
  query: string,
  pageToken?: string
): Promise<TextSearchResponse> {
  const accessToken = await getAccessToken();

  const fieldMask = [
    "places.id",
    "places.displayName",
    "places.formattedAddress",
    "places.rating",
    "places.userRatingCount",
    "places.websiteUri",
    "places.nationalPhoneNumber",
    "places.googleMapsUri",
    "places.businessStatus",
    "places.reviews",
  ].join(",");

  const body: Record<string, unknown> = {
    textQuery: query,
    languageCode: "en",
    maxResultCount: 20,
  };
  if (pageToken) {
    body.pageToken = pageToken;
  }

  const res = await fetch(`${PLACES_BASE}/places:searchText`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      "X-Goog-FieldMask": fieldMask,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Google Places API error: ${res.status} - ${err}`);
  }

  return res.json() as Promise<TextSearchResponse>;
}

export async function searchDentists(
  location: string,
  minRating: number = 3.5,
  minReviews: number = 10,
  maxPages: number = 3
) {
  const query = `dentist in ${location}`;
  const { city, state } = parseLocation(location);

  const searchHistory = await SearchHistory.create({
    query,
    location,
    minRating,
    minReviews,
    totalResultsFromGoogle: 0,
    leadsCreated: 0,
  });

  const allPlaces: PlaceResult[] = [];
  let nextPageToken: string | undefined;

  for (let page = 0; page < maxPages; page++) {
    const response = await textSearch(query, nextPageToken);
    if (response.places) {
      allPlaces.push(...response.places);
    }
    nextPageToken = response.nextPageToken;
    if (!nextPageToken) break;
  }

  searchHistory.totalResultsFromGoogle = allPlaces.length;

  const qualified = allPlaces.filter((place) => {
    if (place.businessStatus && place.businessStatus !== "OPERATIONAL") return false;
    if (!place.rating || place.rating < minRating) return false;
    if (!place.userRatingCount || place.userRatingCount < minReviews) return false;
    if (!place.websiteUri) return false;
    const site = place.websiteUri.toLowerCase();
    if (site.includes("facebook.com") || site.includes("yelp.com")) return false;
    return true;
  });

  const leads = [];
  for (const place of qualified) {
    const existing = await Lead.findOne({ googlePlaceId: place.id });
    if (existing) {
      leads.push(existing);
      continue;
    }

    const reviews = (place.reviews || []).map((r) => ({
      author: r.authorAttribution?.displayName || "Anonymous",
      rating: r.rating || 0,
      text: r.text?.text || "",
      date: r.publishTime ? new Date(r.publishTime) : new Date(),
      relativeTime: r.relativePublishTimeDescription,
    }));

    const lead = await Lead.create({
      businessName: place.displayName?.text || "Unknown",
      address: place.formattedAddress || "",
      city,
      state,
      phone: place.nationalPhoneNumber || "",
      website: place.websiteUri!,
      googlePlaceId: place.id,
      googleMapsUrl: place.googleMapsUri || "",
      googleRating: place.rating!,
      googleReviewCount: place.userRatingCount!,
      reviews,
      status: "discovered",
      searchQuery: query,
      searchId: searchHistory._id,
    });

    leads.push(lead);
  }

  searchHistory.leadsCreated = leads.length;
  await searchHistory.save();

  return {
    searchId: searchHistory._id,
    location,
    totalFromGoogle: allPlaces.length,
    leadsCreated: leads.length,
    leads,
  };
}

export async function getSearchHistory() {
  return SearchHistory.find().sort({ searchedAt: -1 }).limit(50);
}

import { GoogleAuth } from "google-auth-library";
import path from "path";
import Lead from "../models/Lead";
import SearchHistory from "../models/SearchHistory";
import SearchProgress, { IQueryProgress } from "../models/SearchProgress";

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

function isQualified(
  place: PlaceResult,
  minRating: number,
  minReviews: number
): boolean {
  if (place.businessStatus && place.businessStatus !== "OPERATIONAL")
    return false;
  if (!place.rating || place.rating < minRating) return false;
  if (!place.userRatingCount || place.userRatingCount < minReviews)
    return false;
  if (!place.websiteUri) return false;
  const site = place.websiteUri.toLowerCase();
  if (site.includes("facebook.com") || site.includes("yelp.com")) return false;
  return true;
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

function getQueryVariations(location: string): string[] {
  return [
    `dentist in ${location}`,
    `dental clinic in ${location}`,
    `dental office in ${location}`,
    `dentistry ${location}`,
    `family dentist ${location}`,
    `cosmetic dentist ${location}`,
    `dental care ${location}`,
    `dental practice ${location}`,
    `pediatric dentist ${location}`,
    `emergency dentist ${location}`,
    `orthodontist in ${location}`,
    `endodontist in ${location}`,
    `periodontist in ${location}`,
    `oral surgeon ${location}`,
    `dental implant ${location}`,
    `teeth whitening ${location}`,
    `dental hygienist ${location}`,
    `prosthodontist ${location}`,
    `dental specialist ${location}`,
    `sedation dentist ${location}`,
    `holistic dentist ${location}`,
    `affordable dentist ${location}`,
    `best dentist ${location}`,
    `top rated dentist ${location}`,
    `dentist near ${location}`,
    `dental center ${location}`,
    `dental group ${location}`,
    `dental associates ${location}`,
    `general dentist ${location}`,
    `dental surgery ${location}`,
  ];
}

async function getOrCreateProgress(location: string, userEmail: string) {
  const normalized = location.toLowerCase().trim();
  const allVariations = getQueryVariations(location);

  // Atomic upsert — no race condition
  const progress = await SearchProgress.findOneAndUpdate(
    { userEmail, location: normalized },
    {
      $setOnInsert: {
        userEmail,
        location: normalized,
        queries: allVariations.map((q) => ({
          query: q,
          nextPageToken: null,
          exhausted: false,
          pagesSearched: 0,
        })),
        currentQueryIndex: 0,
        totalLeadsFetched: 0,
        updatedAt: new Date(),
      },
    },
    { upsert: true, returnDocument: "after" }
  );

  // If existing progress has fewer queries than current variations,
  // append the new ones so old locations benefit from new query types
  const existingQueries = new Set(progress.queries.map((q) => q.query));
  const newQueries = allVariations.filter((q) => !existingQueries.has(q));

  if (newQueries.length > 0) {
    for (const q of newQueries) {
      progress.queries.push({
        query: q,
        nextPageToken: null,
        exhausted: false,
        pagesSearched: 0,
      });
    }
    await progress.save();
  }

  return progress;
}

export async function searchDentists(
  location: string,
  minRating: number = 3.5,
  minReviews: number = 10,
  targetLeads: number = 20,
  userEmail: string
) {
  // Hard cap at 100 leads per search. Higher values rapidly burn Google
  // Places quota AND downstream Claude/Hunter/Cloudinary cost. The frontend
  // also enforces this; this clamp is a safety net for direct API calls.
  targetLeads = Math.max(1, Math.min(100, Math.floor(targetLeads) || 20));
  const { city, state } = parseLocation(location);
  const progress = await getOrCreateProgress(location, userEmail);

  const searchHistory = await SearchHistory.create({
    userEmail,
    query: `dentist in ${location}`,
    location,
    minRating,
    minReviews,
    totalResultsFromGoogle: 0,
    leadsCreated: 0,
  });

  const newLeads: InstanceType<typeof Lead>[] = [];
  const skippedIds = new Set<string>();
  let totalFromGoogle = 0;
  let pagesSearched = 0;
  let allExhausted = false;

  // Resume from where we left off — no page limit, stops only when
  // target is reached or all query variations are exhausted
  let queryIdx = progress.currentQueryIndex;

  while (
    newLeads.length < targetLeads &&
    queryIdx < progress.queries.length
  ) {
    const qp = progress.queries[queryIdx];

    // Skip queries that are fully exhausted (no more pages)
    if (qp.exhausted) {
      queryIdx++;
      continue;
    }

    // Use saved pageToken to resume from last position
    const pageToken = qp.nextPageToken || undefined;

    const response = await textSearch(qp.query, pageToken);
    pagesSearched++;
    qp.pagesSearched++;

    if (!response.places || response.places.length === 0) {
      qp.exhausted = true;
      qp.nextPageToken = null;
      queryIdx++;
      continue;
    }

    totalFromGoogle += response.places.length;

    for (const place of response.places) {
      if (newLeads.length >= targetLeads) break;
      if (skippedIds.has(place.id)) continue;
      if (!isQualified(place, minRating, minReviews)) continue;

      const existing = await Lead.findOne({ googlePlaceId: place.id });
      if (existing) {
        skippedIds.add(place.id);
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
        searchQuery: qp.query,
        searchId: searchHistory._id,
      });

      newLeads.push(lead);
    }

    // Save page token for next time
    if (response.nextPageToken) {
      qp.nextPageToken = response.nextPageToken;
    } else {
      qp.exhausted = true;
      qp.nextPageToken = null;
      queryIdx++;
    }
  }

  // Check if all queries are exhausted
  allExhausted = progress.queries.every((q) => q.exhausted);

  // Save progress for next search on this location
  progress.currentQueryIndex = Math.min(queryIdx, progress.queries.length - 1);
  progress.totalLeadsFetched += newLeads.length;
  progress.updatedAt = new Date();
  await progress.save();

  searchHistory.totalResultsFromGoogle = totalFromGoogle;
  searchHistory.leadsCreated = newLeads.length;
  await searchHistory.save();

  return {
    searchId: searchHistory._id,
    location,
    totalFromGoogle,
    leadsCreated: newLeads.length,
    skippedExisting: skippedIds.size,
    pagesSearched,
    totalLeadsForLocation: progress.totalLeadsFetched,
    allExhausted,
    leads: newLeads,
  };
}

export async function getSearchHistory(userEmail: string) {
  return SearchHistory.find({ userEmail }).sort({ searchedAt: -1 }).limit(50);
}

export async function deleteSearchHistory(id: string, userEmail: string) {
  return SearchHistory.findOneAndDelete({ _id: id, userEmail });
}

export async function resetSearchProgress(location: string, userEmail: string) {
  const normalized = location.toLowerCase().trim();
  const result = await SearchProgress.deleteOne({ userEmail, location: normalized });
  return result.deletedCount > 0;
}

export async function autocompleteCities(input: string): Promise<
  Array<{ description: string; placeId: string }>
> {
  if (!input || input.length < 1) return [];

  const accessToken = await getAccessToken();

  const res = await fetch(
    `${PLACES_BASE}/places:autocomplete`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        input,
        includedPrimaryTypes: ["locality", "sublocality", "administrative_area_level_1", "administrative_area_level_2"],
        includedRegionCodes: [],
        languageCode: "en",
      }),
    }
  );

  if (!res.ok) return [];

  const data = await res.json() as {
    suggestions?: Array<{
      placePrediction?: {
        text?: { text: string };
        placeId?: string;
      };
    }>;
  };

  return (data.suggestions || [])
    .filter((s) => s.placePrediction?.text?.text)
    .map((s) => ({
      description: s.placePrediction!.text!.text,
      placeId: s.placePrediction!.placeId || "",
    }));
}

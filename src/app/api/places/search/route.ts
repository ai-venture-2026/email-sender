import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query");

  if (!query) {
    return NextResponse.json({ error: "Query is required" }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Google Places API key not configured" },
      { status: 500 }
    );
  }

  // Step 1: Text search to find places
  const searchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`;
  const searchRes = await fetch(searchUrl);
  const searchData = await searchRes.json();

  if (searchData.status !== "OK") {
    return NextResponse.json(
      { error: `Places API error: ${searchData.status}`, results: [] },
      { status: 200 }
    );
  }

  // Step 2: Get details for each place (phone, website)
  const detailedResults = await Promise.all(
    searchData.results.slice(0, 10).map(async (place: { place_id: string }) => {
      const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${place.place_id}&fields=name,formatted_address,formatted_phone_number,website,types,rating,user_ratings_total,business_status&key=${apiKey}`;
      const detailsRes = await fetch(detailsUrl);
      const detailsData = await detailsRes.json();
      return detailsData.result || place;
    })
  );

  return NextResponse.json({ results: detailedResults });
}

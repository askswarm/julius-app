import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const query = new URL(req.url).searchParams.get("query");
    const apiKey = process.env.PEXELS_API_KEY;

    if (!query || !apiKey) {
      return NextResponse.json({ url: null });
    }

    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query + " food")}&per_page=5&orientation=square`,
      { headers: { Authorization: apiKey } }
    );

    if (!res.ok) {
      return NextResponse.json({ url: null });
    }

    const data = await res.json();
    const photos = data.photos;

    if (!photos || photos.length === 0) {
      return NextResponse.json({ url: null });
    }

    const photo = photos[Math.floor(Math.random() * photos.length)];

    return NextResponse.json({
      url: photo.src.medium,
      alt: photo.alt || query,
      photographer: photo.photographer,
    });
  } catch {
    return NextResponse.json({ url: null });
  }
}

import { NextResponse } from "next/server";

const MAX_IMAGES = 18;
const IMAGE_URL_REGEX = /https?:\/\/[^"'\s>]+\.(?:jpg|jpeg|png|webp)(?:\?[^"'\s>]*)?/gi;

const isImageUrl = (value: string) =>
  /\.(?:jpg|jpeg|png|webp)(?:\?.*)?$/i.test(value);

const extractImageUrls = (html: string, pattern: RegExp) => {
  const matches = html.match(pattern) ?? [];
  return Array.from(new Set(matches));
};

const extractImageTags = (html: string) => {
  const items: Array<{ url: string; title?: string }> = [];
  const imgTagRegex = /<img\s+[^>]*>/gi;
  const srcRegex = /\bsrc=["']([^"']+)["']/i;
  const titleRegex = /\btitle=["']([^"']+)["']/i;
  const altRegex = /\balt=["']([^"']+)["']/i;
  const classRegex = /\bclass=["']([^"']+)["']/i;
  const addressLike = /\d+|\b(Ave|Avenue|St|Street|Rd|Road|Ln|Lane|Dr|Drive|Way|Blvd|Boulevard|Ct|Court|Cir|Circle|Pl|Place|Trail|Hwy|Highway)\b/i;
  const logoLike = /\b(logo|icon|avatar|flag|equal housing|mls|redfin|zillow|realtor)\b/i;

  const tags = html.match(imgTagRegex) ?? [];
  tags.forEach((tag) => {
    const srcMatch = tag.match(srcRegex);
    if (!srcMatch?.[1] || !isImageUrl(srcMatch[1])) return;

    const classMatch = tag.match(classRegex);
    const titleMatch = tag.match(titleRegex);
    const altMatch = tag.match(altRegex);
    const classValue = classMatch?.[1] ?? "";
    const altValue = altMatch?.[1];
    const titleValue = titleMatch?.[1];
    const labelSource = altValue || titleValue;
    const isAddressLike = labelSource ? addressLike.test(labelSource) : false;
    const isLogoLike = labelSource ? logoLike.test(labelSource) : false;
    const urlIsLogoLike = /logo|icon|flag|equal-housing|mls/i.test(srcMatch[1]);

    if (
      (classValue.includes("img-card") ||
        classValue.includes("media") ||
        classValue.includes("photo")) &&
      isAddressLike &&
      !isLogoLike &&
      !urlIsLogoLike
    ) {
      items.push({ url: srcMatch[1], title: labelSource });
    }
  });

  return items;
};

const extractJsonLdImages = (html: string) => {
  const images = new Set<string>();
  const scripts = html.match(
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  );

  if (!scripts) return images;

  const collect = (value: unknown) => {
    if (!value) return;
    if (typeof value === "string") {
      if (isImageUrl(value)) images.add(value);
      return;
    }
    if (Array.isArray(value)) {
      value.forEach(collect);
      return;
    }
    if (typeof value === "object") {
      Object.entries(value as Record<string, unknown>).forEach(([key, val]) => {
        if (["image", "images", "photo", "photos", "contentUrl"].includes(key)) {
          collect(val);
        } else if (typeof val === "object") {
          collect(val);
        }
      });
    }
  };

  scripts.forEach((scriptTag) => {
    const match = scriptTag.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
    if (!match?.[1]) return;
    try {
      const json = JSON.parse(match[1]);
      collect(json);
    } catch {
      // Ignore JSON parse errors in embedded scripts
    }
  });

  return images;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const listingUrl = searchParams.get("url");

  if (!listingUrl) {
    return NextResponse.json(
      { error: "Missing url parameter." },
      { status: 400 }
    );
  }

  try {
    const response = await fetch(listingUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0 Safari/537.36"
      },
      cache: "no-store"
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Unable to fetch listing page." },
        { status: 502 }
      );
    }

    const html = await response.text();
    const hostname = new URL(listingUrl).hostname.toLowerCase();

    const images = new Set<string>();
    const labeled: Record<string, string> = {};

    extractImageTags(html).forEach((item) => {
      images.add(item.url);
      if (item.title) labeled[item.url] = item.title;
    });

    extractJsonLdImages(html).forEach((url) => images.add(url));

    if (hostname.includes("redfin.com")) {
      extractImageUrls(
        html,
        /https:\/\/ssl\.cdn-redfin\.com\/[^"'\s>]+\.(?:jpg|jpeg|png|webp)(?:\?[^"'\s>]*)?/gi
      )
        .filter((url) => url.includes("/photo/") && url.includes("bigphoto"))
        .forEach((url) => images.add(url));
    } else if (hostname.includes("zillow.com")) {
      extractImageUrls(
        html,
        /https:\/\/photos\.zillowstatic\.com\/[^"'\s>]+\.(?:jpg|jpeg|png|webp)(?:\?[^"'\s>]*)?/gi
      )
        .filter((url) => url.includes("/p/") || url.includes("/fp/"))
        .forEach((url) => images.add(url));
    } else {
      extractImageUrls(html, IMAGE_URL_REGEX).forEach((url) => images.add(url));
    }

    const blocked = /flag|logo|icon|equal-housing|mls|footer|favicon|sprite|badge|watermark|tracking|analytics/i;
    const blockedPath = /\/vLATEST\/images\/|\/images\/footer\//i;
    const list = Array.from(images)
      .filter((url) => !blocked.test(url) && !blockedPath.test(url))
      .slice(0, MAX_IMAGES);

    return NextResponse.json({
      images: list.map((url) => ({ url, title: labeled[url] }))
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to parse listing images." },
      { status: 500 }
    );
  }
}

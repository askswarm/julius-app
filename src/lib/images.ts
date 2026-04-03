const FOOD: Record<string, string> = {
  default: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&h=200&fit=crop",
  omelette: "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=200&h=200&fit=crop",
  salat: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=200&h=200&fit=crop",
  fisch: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=200&h=200&fit=crop",
  bowl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&h=200&fit=crop",
  curry: "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=200&h=200&fit=crop",
  griechisch: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=200&h=200&fit=crop",
  brot: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200&h=200&fit=crop",
  smoothie: "https://images.unsplash.com/photo-1502741224143-90386d7f8c82?w=200&h=200&fit=crop",
  pasta: "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=200&h=200&fit=crop",
  steak: "https://images.unsplash.com/photo-1544025162-d76694265947?w=200&h=200&fit=crop",
  suppe: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=200&h=200&fit=crop",
  lachs: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=200&h=200&fit=crop",
  reis: "https://images.unsplash.com/photo-1516714435131-44d6b64dc6a2?w=200&h=200&fit=crop",
  huhn: "https://images.unsplash.com/photo-1532550907401-a500c9a57435?w=200&h=200&fit=crop",
  eier: "https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=200&h=200&fit=crop",
  tempeh: "https://images.unsplash.com/photo-1529566652340-2c41a1eb6d93?w=200&h=200&fit=crop",
  kimchi: "https://images.unsplash.com/photo-1583224964978-2257b960c3d3?w=200&h=200&fit=crop",
};

export function matchFoodImage(name: string): string {
  const lower = name.toLowerCase();
  for (const [key, url] of Object.entries(FOOD)) {
    if (key !== "default" && lower.includes(key)) return url;
  }
  // Extra keyword matching
  if (lower.includes("haehnchen") || lower.includes("chicken") || lower.includes("huhn")) return FOOD.huhn;
  if (lower.includes("lachs") || lower.includes("salmon")) return FOOD.lachs;
  if (lower.includes("ei") || lower.includes("shakshuka") || lower.includes("omelette")) return FOOD.eier;
  if (lower.includes("salat") || lower.includes("greek")) return FOOD.salat;
  if (lower.includes("fisch") || lower.includes("dorade") || lower.includes("makrele")) return FOOD.fisch;
  if (lower.includes("suppe") || lower.includes("avgolemono")) return FOOD.suppe;
  if (lower.includes("linse") || lower.includes("curry") || lower.includes("dal")) return FOOD.curry;
  if (lower.includes("joghurt") || lower.includes("skyr") || lower.includes("smoothie")) return FOOD.smoothie;
  if (lower.includes("brot") || lower.includes("pita") || lower.includes("toast")) return FOOD.brot;
  return FOOD.default;
}

export const TRAINING_IMAGES: Record<string, string> = {
  kraft: "/images/kraft-mann.jpg",
  hyrox: "https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?w=800&h=400&fit=crop",
  laufen: "/images/laufen.jpg",
  radfahren: "https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=800&h=400&fit=crop",
  schwimmen: "https://images.unsplash.com/photo-1530549387789-4c1017266635?w=800&h=400&fit=crop",
  yoga: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=400&fit=crop",
  crossfit: "https://images.unsplash.com/photo-1534258936925-c58bed479fcb?w=800&h=400&fit=crop",
  rudern: "https://images.unsplash.com/photo-1519505907962-0a6cb0167c73?w=800&h=400&fit=crop",
  sauna: "/images/sauna.jpg",
  mobility: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&h=400&fit=crop",
};

const TRAINING_IMAGES_MARIA: Record<string, string> = {
  kraft: "/images/kraft-frau.jpg",
  trx: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&h=400&fit=crop",
  yoga: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&h=400&fit=crop",
  laufen: "/images/laufen.jpg",
  hyrox: "https://images.unsplash.com/photo-1550345332-09e3ac987658?w=800&h=400&fit=crop",
  schwimmen: "https://images.unsplash.com/photo-1560089000-7433a4ebbd64?w=800&h=400&fit=crop",
  stretching: "https://images.unsplash.com/photo-1552196563-55cd4e45efb3?w=800&h=400&fit=crop",
  meditation: "https://images.unsplash.com/photo-1508672019048-805c876b67e2?w=800&h=400&fit=crop",
};

export function matchTrainingImage(typ: string, user: string = "vincent"): string {
  const lower = typ.toLowerCase();
  const images = user === "maria" ? TRAINING_IMAGES_MARIA : TRAINING_IMAGES;
  const fallbackImages = user === "maria" ? TRAINING_IMAGES_MARIA : TRAINING_IMAGES;

  for (const [key, url] of Object.entries(images)) {
    if (lower.includes(key)) return url;
  }
  if (lower.includes("langhantel") || lower.includes("kh")) return fallbackImages.kraft;
  if (lower.includes("trx")) return user === "maria" ? TRAINING_IMAGES_MARIA.trx : TRAINING_IMAGES.kraft;
  if (lower.includes("gravel") || lower.includes("bike") || lower.includes("rad")) return TRAINING_IMAGES.radfahren;
  if (lower.includes("rower") || lower.includes("concept")) return TRAINING_IMAGES.rudern;
  if (lower.includes("urban") || lower.includes("batch") || lower.includes("mobil")) return user === "maria" ? TRAINING_IMAGES_MARIA.stretching : TRAINING_IMAGES.mobility;
  if (lower.includes("sauna")) return TRAINING_IMAGES.sauna;
  return fallbackImages.kraft;
}

// Profile pictures
export const PROFILE_IMAGES: Record<string, string> = {
  vincent: "https://images.unsplash.com/photo-1583468982228-19f19164aee2?w=400&h=400&fit=crop&crop=face",
  maria: "https://images.unsplash.com/photo-1518310383802-640c2de311b2?w=400&h=400&fit=crop&crop=face",
};

// Hero images per page
export const HERO_IMAGES: Record<string, Record<string, string>> = {
  training: {
    vincent: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=800&h=500&fit=crop",
    maria: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&h=500&fit=crop",
  },
  ernaehrung: {
    default: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&h=300&fit=crop",
  },
};

export function getProfileImage(user: string): string {
  return PROFILE_IMAGES[user] || PROFILE_IMAGES.vincent;
}

export function getHeroImage(page: string, user: string): string {
  const pageImages = HERO_IMAGES[page];
  if (!pageImages) return "";
  return pageImages[user] || pageImages.default || pageImages.vincent || "";
}

const SLEEP_HEROES: Record<string, string> = {
  vincent: "https://images.unsplash.com/photo-1507400492013-162706c8c05e?w=800&h=300&fit=crop",
  maria: "https://images.unsplash.com/photo-1495197359483-d092478c170a?w=800&h=300&fit=crop",
};

export function getSleepHero(user: string = "vincent"): string {
  return SLEEP_HEROES[user] || SLEEP_HEROES.vincent;
}

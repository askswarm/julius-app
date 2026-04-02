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
  kraft: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=400&fit=crop",
  hyrox: "https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?w=800&h=400&fit=crop",
  laufen: "https://images.unsplash.com/photo-1461896836934-bd45ba1ea025?w=800&h=400&fit=crop",
  radfahren: "https://images.unsplash.com/photo-1541625602330-2277a4c46182?w=800&h=400&fit=crop",
  schwimmen: "https://images.unsplash.com/photo-1530549387789-4c1017266635?w=800&h=400&fit=crop",
  yoga: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=400&fit=crop",
  crossfit: "https://images.unsplash.com/photo-1534258936925-c58bed479fcb?w=800&h=400&fit=crop",
  rudern: "https://images.unsplash.com/photo-1519505907962-0a6cb0167c73?w=800&h=400&fit=crop",
  sauna: "https://images.unsplash.com/photo-1540555700478-4be289fbec6d?w=800&h=400&fit=crop",
  mobility: "https://images.unsplash.com/photo-1518611012118-696072aa579a?w=800&h=400&fit=crop",
};

export function matchTrainingImage(typ: string): string {
  const lower = typ.toLowerCase();
  for (const [key, url] of Object.entries(TRAINING_IMAGES)) {
    if (lower.includes(key)) return url;
  }
  if (lower.includes("langhantel") || lower.includes("kh") || lower.includes("trx")) return TRAINING_IMAGES.kraft;
  if (lower.includes("gravel") || lower.includes("bike") || lower.includes("rad")) return TRAINING_IMAGES.radfahren;
  if (lower.includes("rower") || lower.includes("concept")) return TRAINING_IMAGES.rudern;
  if (lower.includes("urban") || lower.includes("batch")) return TRAINING_IMAGES.mobility;
  return TRAINING_IMAGES.kraft;
}

export const SLEEP_HERO = "https://images.unsplash.com/photo-1495197359483-d092478c170a?w=800&h=300&fit=crop";

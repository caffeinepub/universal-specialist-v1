// ─── VERASLi™ Universal Career Cluster Taxonomy ───────────────────────────────
//
// Hierarchical taxonomy: 6 Themes → 13 Sectors
// Used across Dashboard, LiveVisionHUD, and sector routing.

export interface SectorItem {
  id: string;
  /** Display name */
  name: string;
  description: string;
  /** OKLCH raw "L C H" values — no oklch() wrapper */
  accent: string;
  /** Single unicode char or emoji */
  icon: string;
}

export interface Theme {
  id: string;
  name: string;
  description: string;
  /** Theme-level OKLCH accent — raw L C H values */
  accent: string;
  icon: string;
  sectors: SectorItem[];
}

export const TAXONOMY: Theme[] = [
  {
    id: "building-moving",
    name: "Building & Moving",
    description: "Construction, manufacturing, and supply chain",
    accent: "0.72 0.18 45",
    icon: "⬟",
    sectors: [
      {
        id: "construction",
        name: "Construction",
        description: "OSHA safety codes & structural specs",
        accent: "0.72 0.18 45",
        icon: "🏗",
      },
      {
        id: "advanced-manufacturing",
        name: "Advanced Manufacturing",
        description: "CNC, robotics & precision engineering",
        accent: "0.68 0.16 50",
        icon: "⚙",
      },
      {
        id: "supply-chain-transportation",
        name: "Supply Chain & Transportation",
        description: "Logistics, fleet ops & compliance",
        accent: "0.65 0.14 55",
        icon: "🚛",
      },
    ],
  },
  {
    id: "cultivating-resources",
    name: "Cultivating Resources",
    description: "Energy, natural resources & agriculture",
    accent: "0.72 0.18 145",
    icon: "🌿",
    sectors: [
      {
        id: "energy-natural-resources",
        name: "Energy & Natural Resources",
        description: "Power systems, extraction & sustainability",
        accent: "0.72 0.18 145",
        icon: "⚡",
      },
      {
        id: "agriculture",
        name: "Agriculture",
        description: "Crop science, equipment & food systems",
        accent: "0.75 0.16 130",
        icon: "🌾",
      },
    ],
  },
  {
    id: "caring-communities",
    name: "Caring for Communities",
    description: "Public service, healthcare & education",
    accent: "0.78 0.15 195",
    icon: "⚕",
    sectors: [
      {
        id: "public-service-safety",
        name: "Public Service & Safety",
        description: "Emergency response, law enforcement & civil",
        accent: "0.72 0.14 215",
        icon: "🛡",
      },
      {
        id: "healthcare-human-services",
        name: "Healthcare & Human Services",
        description: "Clinical diagnostics & patient care",
        accent: "0.78 0.15 195",
        icon: "⚕",
      },
      {
        id: "education",
        name: "Education",
        description: "Academic audit & curriculum compliance",
        accent: "0.78 0.16 85",
        icon: "◈",
      },
    ],
  },
  {
    id: "connecting-supporting",
    name: "Connecting & Supporting",
    description: "Marketing, sales & digital technology",
    accent: "0.65 0.18 250",
    icon: "⬡",
    sectors: [
      {
        id: "marketing-sales",
        name: "Marketing & Sales",
        description: "Brand strategy, analytics & customer engagement",
        accent: "0.68 0.20 300",
        icon: "📊",
      },
      {
        id: "digital-technology",
        name: "Digital Technology",
        description: "Engineering specs, system diagnostics & dev",
        accent: "0.65 0.18 250",
        icon: "⬡",
      },
    ],
  },
  {
    id: "investing-future",
    name: "Investing in the Future",
    description: "Management, entrepreneurship & finance",
    accent: "0.72 0.16 60",
    icon: "◆",
    sectors: [
      {
        id: "management-entrepreneurship",
        name: "Management & Entrepreneurship",
        description: "Operations, strategy & business development",
        accent: "0.72 0.16 60",
        icon: "◆",
      },
      {
        id: "financial-services",
        name: "Financial Services",
        description: "Accounting, investment & compliance",
        accent: "0.70 0.14 65",
        icon: "💹",
      },
    ],
  },
  {
    id: "creating-experiencing",
    name: "Creating & Experiencing",
    description: "Arts, design, hospitality & tourism",
    accent: "0.72 0.20 330",
    icon: "✦",
    sectors: [
      {
        id: "arts-entertainment-design",
        name: "Arts, Entertainment & Design",
        description: "Creative production, UX & media",
        accent: "0.72 0.20 330",
        icon: "✦",
      },
      {
        id: "hospitality-events-tourism",
        name: "Hospitality, Events & Tourism",
        description: "Event ops, guest experience & venue compliance",
        accent: "0.68 0.18 320",
        icon: "🏨",
      },
    ],
  },
];

// ─── Derived helpers ──────────────────────────────────────────────────────────

/** Flat list of all sectors across all themes */
export const ALL_SECTORS: SectorItem[] = TAXONOMY.flatMap((t) => t.sectors);

/** All sector IDs — used to validate detected_mode from vision model */
export const ALL_SECTOR_IDS: string[] = ALL_SECTORS.map((s) => s.id);

export function getSectorById(id: string): SectorItem | undefined {
  return ALL_SECTORS.find((s) => s.id === id);
}

/** Returns the OKLCH raw accent for a given sector ID, or a neutral fallback */
export function getSectorAccent(id: string): string {
  return getSectorById(id)?.accent ?? "0.62 0.14 230";
}

/** Returns the human-readable display label for a sector ID */
export function getSectorLabel(id: string): string {
  return (
    getSectorById(id)?.name ??
    id
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ")
  );
}

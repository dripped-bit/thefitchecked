/**
 * Priority Stores Configuration
 * Defines preferred stores for Perplexity product search
 * These stores will be searched FIRST before falling back to general search
 */

export interface PriorityStoreConfig {
  name: string;
  domain: string;
  priority: number; // Lower number = higher priority
  category: 'primary' | 'secondary';
}

/**
 * Primary priority stores - searched first
 * These are the user's preferred shopping sources
 */
export const PRIMARY_PRIORITY_STORES: PriorityStoreConfig[] = [
  // Top Priority - User Favorites
  { name: "Amazon", domain: "amazon.com", priority: 1, category: "primary" },
  { name: "Shein", domain: "shein.com", priority: 2, category: "primary" },
  { name: "Fashion Nova", domain: "fashionnova.com", priority: 3, category: "primary" },
  { name: "White Fox Boutique", domain: "whitefoxboutique.com", priority: 4, category: "primary" },
  { name: "House of CB", domain: "houseofcb.com", priority: 5, category: "primary" },
  { name: "Oh Polly", domain: "ohpolly.com", priority: 6, category: "primary" },

  // Fast Fashion - Affordable
  { name: "Forever 21", domain: "forever21.com", priority: 7, category: "primary" },
  { name: "Boohoo", domain: "boohoo.com", priority: 8, category: "primary" },
  { name: "Missguided", domain: "missguided.com", priority: 9, category: "primary" },
  { name: "Pretty Little Thing", domain: "prettylittlething.com", priority: 10, category: "primary" },
  { name: "Nasty Gal", domain: "nastygal.com", priority: 11, category: "primary" },
  { name: "Princess Polly", domain: "princesspolly.com", priority: 12, category: "primary" },
  { name: "Tiger Mist", domain: "tigermist.com.au", priority: 13, category: "primary" },
  { name: "Beginning Boutique", domain: "beginningboutique.com", priority: 14, category: "primary" },
  { name: "Showpo", domain: "showpo.com", priority: 15, category: "primary" },
  { name: "Meshki", domain: "meshki.us", priority: 16, category: "primary" },
  { name: "Rebellious Fashion", domain: "rebelliousfashion.co", priority: 17, category: "primary" },
  { name: "Sabo Skirt", domain: "saboskirt.com", priority: 18, category: "primary" },
  { name: "Lulus", domain: "lulus.com", priority: 19, category: "primary" },
  { name: "Tobi", domain: "tobi.com", priority: 20, category: "primary" },
  { name: "Windsor", domain: "windsorstore.com", priority: 21, category: "primary" },
  { name: "Charlotte Russe", domain: "charlotterusse.com", priority: 22, category: "primary" },
  { name: "Rue21", domain: "rue21.com", priority: 23, category: "primary" },
  { name: "Garage", domain: "garageclothing.com", priority: 24, category: "primary" },
  { name: "Zaful", domain: "zaful.com", priority: 25, category: "primary" },
  { name: "RoseGal", domain: "rosegal.com", priority: 26, category: "primary" },
  { name: "Romwe", domain: "romwe.com", priority: 27, category: "primary" },
  { name: "Cider", domain: "shopcider.com", priority: 28, category: "primary" }
];

/**
 * Secondary priority stores - searched if primary stores don't have enough results
 */
export const SECONDARY_PRIORITY_STORES: PriorityStoreConfig[] = [
  // Mid-Range Fashion
  { name: "ASOS", domain: "asos.com", priority: 29, category: "secondary" },
  { name: "Zara", domain: "zara.com", priority: 30, category: "secondary" },
  { name: "H&M", domain: "hm.com", priority: 31, category: "secondary" },
  { name: "Revolve", domain: "revolve.com", priority: 32, category: "secondary" },
  { name: "Urban Outfitters", domain: "urbanoutfitters.com", priority: 33, category: "secondary" },
  { name: "Free People", domain: "freepeople.com", priority: 34, category: "secondary" },
  { name: "Anthropologie", domain: "anthropologie.com", priority: 35, category: "secondary" },
  { name: "Mango", domain: "mango.com", priority: 36, category: "secondary" },
  { name: "& Other Stories", domain: "stories.com", priority: 37, category: "secondary" },
  { name: "COS", domain: "cosstores.com", priority: 38, category: "secondary" },
  { name: "Uniqlo", domain: "uniqlo.com", priority: 39, category: "secondary" },

  // Department Stores
  { name: "Nordstrom", domain: "nordstrom.com", priority: 40, category: "secondary" },
  { name: "Nordstrom Rack", domain: "nordstromrack.com", priority: 41, category: "secondary" },
  { name: "Macy's", domain: "macys.com", priority: 42, category: "secondary" },
  { name: "Bloomingdale's", domain: "bloomingdales.com", priority: 43, category: "secondary" },
  { name: "Dillard's", domain: "dillards.com", priority: 44, category: "secondary" },
  { name: "JCPenney", domain: "jcpenney.com", priority: 45, category: "secondary" },
  { name: "Kohl's", domain: "kohls.com", priority: 46, category: "secondary" },
  { name: "Target", domain: "target.com", priority: 47, category: "secondary" },
  { name: "Walmart", domain: "walmart.com", priority: 48, category: "secondary" },

  // Discount/Outlet
  { name: "TJ Maxx", domain: "tjmaxx.tjx.com", priority: 49, category: "secondary" },
  { name: "Marshalls", domain: "marshalls.com", priority: 50, category: "secondary" },
  { name: "Ross", domain: "rossstores.com", priority: 51, category: "secondary" },
  { name: "Burlington", domain: "burlington.com", priority: 52, category: "secondary" },
  { name: "Saks Off 5th", domain: "saksoff5th.com", priority: 53, category: "secondary" },

  // Specialty/Boutique
  { name: "ModCloth", domain: "modcloth.com", priority: 54, category: "secondary" },
  { name: "Unique Vintage", domain: "unique-vintage.com", priority: 55, category: "secondary" },
  { name: "Reformation", domain: "thereformation.com", priority: 56, category: "secondary" },
  { name: "Everlane", domain: "everlane.com", priority: 57, category: "secondary" },
  { name: "Aritzia", domain: "aritzia.com", priority: 58, category: "secondary" },
  { name: "Wildfang", domain: "wildfang.com", priority: 59, category: "secondary" },
  { name: "Girlfriend Collective", domain: "girlfriend.com", priority: 60, category: "secondary" },

  // Athletic/Athleisure
  { name: "Nike", domain: "nike.com", priority: 61, category: "secondary" },
  { name: "Adidas", domain: "adidas.com", priority: 62, category: "secondary" },
  { name: "Lululemon", domain: "lululemon.com", priority: 63, category: "secondary" },
  { name: "Athleta", domain: "athleta.gap.com", priority: 64, category: "secondary" },
  { name: "Fabletics", domain: "fabletics.com", priority: 65, category: "secondary" },

  // Plus Size Specialists
  { name: "Torrid", domain: "torrid.com", priority: 66, category: "secondary" },
  { name: "Lane Bryant", domain: "lanebryant.com", priority: 67, category: "secondary" },
  { name: "Eloquii", domain: "eloquii.com", priority: 68, category: "secondary" },

  // Luxury/Designer
  { name: "Saks Fifth Avenue", domain: "saksfifthavenue.com", priority: 69, category: "secondary" },
  { name: "Neiman Marcus", domain: "neimanmarcus.com", priority: 70, category: "secondary" },
  { name: "Net-a-Porter", domain: "net-a-porter.com", priority: 71, category: "secondary" },
  { name: "Farfetch", domain: "farfetch.com", priority: 72, category: "secondary" }
];

/**
 * All priority stores combined (primary + secondary)
 */
export const ALL_PRIORITY_STORES = [
  ...PRIMARY_PRIORITY_STORES,
  ...SECONDARY_PRIORITY_STORES
].sort((a, b) => a.priority - b.priority);

/**
 * Get priority store domains for search query
 */
export const getPriorityStoreDomains = (includePrimary = true, includeSecondary = true): string[] => {
  const stores: PriorityStoreConfig[] = [];

  if (includePrimary) {
    stores.push(...PRIMARY_PRIORITY_STORES);
  }

  if (includeSecondary) {
    stores.push(...SECONDARY_PRIORITY_STORES);
  }

  return stores
    .sort((a, b) => a.priority - b.priority)
    .map(store => store.domain);
};

/**
 * Build site-targeted search query for Perplexity
 * Example: "pink dress site:shein.com OR site:fashionnova.com OR site:whitefoxboutique.com"
 */
export const buildPriorityStoreQuery = (
  baseQuery: string,
  maxStores: number = 5,
  includePrimary: boolean = true,
  includeSecondary: boolean = false
): string => {
  const domains = getPriorityStoreDomains(includePrimary, includeSecondary).slice(0, maxStores);

  if (domains.length === 0) {
    return baseQuery;
  }

  const siteQuery = domains.map(domain => `site:${domain}`).join(' OR ');
  return `${baseQuery} ${siteQuery}`;
};

/**
 * Search strategy configuration
 */
export const SEARCH_STRATEGY = {
  // Minimum results needed before expanding search
  MIN_RESULTS_PRIMARY: 5,
  MIN_RESULTS_SECONDARY: 3,

  // Maximum stores to query at once (to avoid rate limits)
  MAX_STORES_PER_QUERY: 5,

  // Search phases
  PHASE_1_PRIMARY_ONLY: true,      // Try primary stores first
  PHASE_2_ADD_SECONDARY: true,     // Add secondary if not enough results
  PHASE_3_GENERAL_SEARCH: true     // Fall back to general search if still not enough
};

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
  {
    name: "Shein",
    domain: "shein.com",
    priority: 1,
    category: "primary"
  },
  {
    name: "Fashion Nova",
    domain: "fashionnova.com",
    priority: 2,
    category: "primary"
  },
  {
    name: "White Fox Boutique",
    domain: "whitefoxboutique.com",
    priority: 3,
    category: "primary"
  },
  {
    name: "House of CB",
    domain: "houseofcb.com",
    priority: 4,
    category: "primary"
  },
  {
    name: "Oh Polly",
    domain: "ohpolly.com",
    priority: 5,
    category: "primary"
  }
];

/**
 * Secondary priority stores - searched if primary stores don't have enough results
 */
export const SECONDARY_PRIORITY_STORES: PriorityStoreConfig[] = [
  {
    name: "ASOS",
    domain: "asos.com",
    priority: 6,
    category: "secondary"
  },
  {
    name: "Zara",
    domain: "zara.com",
    priority: 7,
    category: "secondary"
  },
  {
    name: "H&M",
    domain: "hm.com",
    priority: 8,
    category: "secondary"
  },
  {
    name: "Nordstrom",
    domain: "nordstrom.com",
    priority: 9,
    category: "secondary"
  },
  {
    name: "Revolve",
    domain: "revolve.com",
    priority: 10,
    category: "secondary"
  }
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

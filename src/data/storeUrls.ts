/**
 * Store URL Database
 * Comprehensive list of 77 clothing store URLs for targeted product searches
 * Includes luxury, mid-range, budget, designer, and fast-fashion retailers
 * Coverage: Men's (34 stores), Women's (42 stores), Unisex (1 store)
 */

export interface StoreInfo {
  name: string;
  url: string;
  category: 'luxury' | 'mid-range' | 'budget' | 'designer' | 'fast-fashion';
  gender: 'men' | 'women' | 'unisex';
  description?: string;
}

export const STORE_URLS: StoreInfo[] = [
  // Men's Clothing Stores
  {
    name: "Mr Porter",
    url: "https://www.mrporter.com/en-us/mens",
    category: "luxury",
    gender: "men",
    description: "Luxury men's fashion and designer clothing"
  },
  {
    name: "SSENSE",
    url: "https://www.ssense.com/en-us/men",
    category: "designer",
    gender: "men",
    description: "Contemporary and luxury designer fashion"
  },
  {
    name: "End Clothing",
    url: "https://www.endclothing.com/us/clothing",
    category: "mid-range",
    gender: "men",
    description: "Contemporary menswear and streetwear"
  },
  {
    name: "Matches Fashion",
    url: "https://www.matchesfashion.com/us/mens",
    category: "luxury",
    gender: "men",
    description: "Luxury fashion and designer clothing"
  },
  {
    name: "Farfetch",
    url: "https://www.farfetch.com/shopping/men/items.aspx",
    category: "luxury",
    gender: "men",
    description: "Global marketplace for luxury fashion"
  },
  {
    name: "Nordstrom",
    url: "https://www.nordstrom.com/browse/men",
    category: "mid-range",
    gender: "men",
    description: "Department store with designer and contemporary brands"
  },
  {
    name: "Saks Fifth Avenue",
    url: "https://www.saksfifthavenue.com/c/men-s-apparel",
    category: "luxury",
    gender: "men",
    description: "Luxury department store"
  },
  {
    name: "Barneys Warehouse",
    url: "https://www.barneyswarehouse.com/category/men",
    category: "luxury",
    gender: "men",
    description: "Designer clothing at warehouse prices"
  },
  {
    name: "Bergdorf Goodman",
    url: "https://www.bergdorfgoodman.com/c/men",
    category: "luxury",
    gender: "men",
    description: "Luxury men's fashion and accessories"
  },
  {
    name: "Neiman Marcus",
    url: "https://www.neimanmarcus.com/c/men-cat000000",
    category: "luxury",
    gender: "men",
    description: "Luxury department store"
  },
  {
    name: "Bloomingdale's",
    url: "https://www.bloomingdales.com/shop/mens",
    category: "mid-range",
    gender: "men",
    description: "Contemporary and designer men's fashion"
  },
  {
    name: "Macy's",
    url: "https://www.macys.com/shop/mens-clothing",
    category: "mid-range",
    gender: "men",
    description: "Department store with various brands"
  },
  {
    name: "J.Crew",
    url: "https://www.jcrew.com/c/mens_category",
    category: "mid-range",
    gender: "men",
    description: "Classic American style clothing"
  },
  {
    name: "Banana Republic",
    url: "https://bananarepublic.gap.com/browse/category.do?cid=1016720",
    category: "mid-range",
    gender: "men",
    description: "Professional and casual menswear"
  },
  {
    name: "Brooks Brothers",
    url: "https://www.brooksbrothers.com/mens",
    category: "mid-range",
    gender: "men",
    description: "Traditional American menswear"
  },
  {
    name: "Ralph Lauren",
    url: "https://www.ralphlauren.com/men",
    category: "mid-range",
    gender: "men",
    description: "Classic American luxury lifestyle brand"
  },
  {
    name: "Hugo Boss",
    url: "https://www.hugoboss.com/us/men/",
    category: "mid-range",
    gender: "men",
    description: "German luxury fashion and style house"
  },
  {
    name: "Calvin Klein",
    url: "https://www.calvinklein.us/mens",
    category: "mid-range",
    gender: "men",
    description: "Modern American designer brand"
  },
  {
    name: "Tommy Hilfiger",
    url: "https://usa.tommy.com/en/men",
    category: "mid-range",
    gender: "men",
    description: "Classic American cool style"
  },
  {
    name: "Lacoste",
    url: "https://www.lacoste.com/us/men/",
    category: "mid-range",
    gender: "men",
    description: "French clothing company"
  },
  {
    name: "Polo Ralph Lauren",
    url: "https://www.ralphlauren.com/men-clothing",
    category: "mid-range",
    gender: "men",
    description: "Classic American style"
  },
  {
    name: "Uniqlo",
    url: "https://www.uniqlo.com/us/en/men",
    category: "budget",
    gender: "men",
    description: "Japanese casual wear designer"
  },
  {
    name: "H&M",
    url: "https://www2.hm.com/en_us/men.html",
    category: "fast-fashion",
    gender: "men",
    description: "Swedish multinational clothing company"
  },
  {
    name: "Zara",
    url: "https://www.zara.com/us/en/man-c269231.html",
    category: "fast-fashion",
    gender: "men",
    description: "Spanish apparel retailer"
  },
  {
    name: "Express",
    url: "https://www.express.com/mens-clothing",
    category: "mid-range",
    gender: "men",
    description: "Fashion clothing for work, weekend, and going out"
  },
  {
    name: "Men's Wearhouse",
    url: "https://www.menswearhouse.com/",
    category: "mid-range",
    gender: "men",
    description: "American men's dress clothing retail chain"
  },
  {
    name: "Jos. A. Bank",
    url: "https://www.josbank.com/",
    category: "mid-range",
    gender: "men",
    description: "American men's clothing retailer"
  },
  {
    name: "Bonobos",
    url: "https://bonobos.com/",
    category: "mid-range",
    gender: "men",
    description: "American e-commerce driven apparel company"
  },
  {
    name: "Everlane",
    url: "https://www.everlane.com/mens",
    category: "mid-range",
    gender: "men",
    description: "American clothing retailer focused on transparency"
  },
  {
    name: "Theory",
    url: "https://www.theory.com/mens/",
    category: "luxury",
    gender: "men",
    description: "New York-based contemporary fashion label"
  },
  {
    name: "Club Monaco",
    url: "https://www.clubmonaco.com/en/men-clothing",
    category: "mid-range",
    gender: "men",
    description: "Canadian clothing retailer"
  },
  {
    name: "Patagonia",
    url: "https://www.patagonia.com/shop/mens",
    category: "mid-range",
    gender: "men",
    description: "American clothing company focused on outdoor clothing"
  },
  {
    name: "L.L.Bean",
    url: "https://www.llbean.com/llb/shop/men",
    category: "mid-range",
    gender: "men",
    description: "American privately held mail-order and retail company"
  },
  {
    name: "REI",
    url: "https://www.rei.com/c/mens-clothing",
    category: "mid-range",
    gender: "men",
    description: "American retail and outdoor recreation services corporation"
  },

  // Women's Clothing Stores
  {
    name: "Net-A-Porter",
    url: "https://www.net-a-porter.com/en-us/",
    category: "luxury",
    gender: "women",
    description: "Luxury fashion for women"
  },
  {
    name: "SSENSE Women",
    url: "https://www.ssense.com/en-us/women",
    category: "designer",
    gender: "women",
    description: "Contemporary and luxury designer fashion"
  },
  {
    name: "Matches Fashion Women",
    url: "https://www.matchesfashion.com/us/womens",
    category: "luxury",
    gender: "women",
    description: "Luxury fashion and designer clothing"
  },
  {
    name: "Farfetch Women",
    url: "https://www.farfetch.com/shopping/women/items.aspx",
    category: "luxury",
    gender: "women",
    description: "Global marketplace for luxury fashion"
  },
  {
    name: "Nordstrom Women",
    url: "https://www.nordstrom.com/browse/women",
    category: "mid-range",
    gender: "women",
    description: "Department store with designer and contemporary brands"
  },
  {
    name: "Saks Fifth Avenue Women",
    url: "https://www.saksfifthavenue.com/c/women-s-apparel",
    category: "luxury",
    gender: "women",
    description: "Luxury department store"
  },
  {
    name: "Barneys Warehouse Women",
    url: "https://www.barneyswarehouse.com/category/women",
    category: "luxury",
    gender: "women",
    description: "Designer clothing at warehouse prices"
  },
  {
    name: "Bergdorf Goodman Women",
    url: "https://www.bergdorfgoodman.com/c/women",
    category: "luxury",
    gender: "women",
    description: "Luxury women's fashion and accessories"
  },
  {
    name: "Neiman Marcus Women",
    url: "https://www.neimanmarcus.com/c/women-cat000001",
    category: "luxury",
    gender: "women",
    description: "Luxury department store"
  },
  {
    name: "Bloomingdale's Women",
    url: "https://www.bloomingdales.com/shop/womens",
    category: "mid-range",
    gender: "women",
    description: "Contemporary and designer women's fashion"
  },
  {
    name: "Macy's Women",
    url: "https://www.macys.com/shop/womens-clothing",
    category: "mid-range",
    gender: "women",
    description: "Department store with various brands"
  },
  {
    name: "J.Crew Women",
    url: "https://www.jcrew.com/c/womens_category",
    category: "mid-range",
    gender: "women",
    description: "Classic American style clothing"
  },
  {
    name: "Banana Republic Women",
    url: "https://bananarepublic.gap.com/browse/category.do?cid=5058",
    category: "mid-range",
    gender: "women",
    description: "Professional and casual women's wear"
  },
  {
    name: "Ann Taylor",
    url: "https://www.anntaylor.com/",
    category: "mid-range",
    gender: "women",
    description: "American women's clothing retailer"
  },
  {
    name: "Loft",
    url: "https://www.loft.com/",
    category: "mid-range",
    gender: "women",
    description: "American women's clothing retailer"
  },
  {
    name: "White House Black Market",
    url: "https://www.whitehouseblackmarket.com/",
    category: "mid-range",
    gender: "women",
    description: "American women's clothing retailer"
  },
  {
    name: "Talbots",
    url: "https://www.talbots.com/",
    category: "mid-range",
    gender: "women",
    description: "American specialty retailer of women's clothing"
  },
  {
    name: "Chico's",
    url: "https://www.chicos.com/",
    category: "mid-range",
    gender: "women",
    description: "American women's clothing retailer"
  },
  {
    name: "Anthropologie",
    url: "https://www.anthropologie.com/clothes",
    category: "mid-range",
    gender: "women",
    description: "American clothing retailer"
  },
  {
    name: "Free People",
    url: "https://www.freepeople.com/",
    category: "mid-range",
    gender: "women",
    description: "American bohemian apparel and lifestyle brand"
  },
  {
    name: "Urban Outfitters",
    url: "https://www.urbanoutfitters.com/womens",
    category: "mid-range",
    gender: "women",
    description: "American multinational clothing corporation"
  },
  {
    name: "Reformation",
    url: "https://www.thereformation.com/",
    category: "mid-range",
    gender: "women",
    description: "American clothing designer and manufacturer"
  },
  {
    name: "Revolve",
    url: "https://www.revolve.com/",
    category: "mid-range",
    gender: "women",
    description: "American online fashion retailer"
  },
  {
    name: "Shopbop",
    url: "https://www.shopbop.com/",
    category: "mid-range",
    gender: "women",
    description: "American online fashion retailer"
  },
  {
    name: "Zara Women",
    url: "https://www.zara.com/us/en/woman-c288001.html",
    category: "fast-fashion",
    gender: "women",
    description: "Spanish apparel retailer"
  },
  {
    name: "H&M Women",
    url: "https://www2.hm.com/en_us/women.html",
    category: "fast-fashion",
    gender: "women",
    description: "Swedish multinational clothing company"
  },
  {
    name: "Forever 21",
    url: "https://www.forever21.com/us/shop/catalog/women",
    category: "fast-fashion",
    gender: "women",
    description: "American fast fashion retailer"
  },
  {
    name: "Uniqlo Women",
    url: "https://www.uniqlo.com/us/en/women",
    category: "budget",
    gender: "women",
    description: "Japanese casual wear designer"
  },
  {
    name: "Target",
    url: "https://www.target.com/c/women-s-clothing/-/N-5xu2y",
    category: "budget",
    gender: "women",
    description: "American general merchandise retailer"
  },
  {
    name: "Old Navy",
    url: "https://oldnavy.gap.com/browse/category.do?cid=5248",
    category: "budget",
    gender: "women",
    description: "American clothing and accessories retailing company"
  },
  {
    name: "Gap",
    url: "https://www.gap.com/browse/category.do?cid=5664",
    category: "budget",
    gender: "women",
    description: "American worldwide clothing and accessories retailer"
  },
  {
    name: "Everlane Women",
    url: "https://www.everlane.com/womens",
    category: "mid-range",
    gender: "women",
    description: "American clothing retailer focused on transparency"
  },
  {
    name: "Theory Women",
    url: "https://www.theory.com/womens/",
    category: "luxury",
    gender: "women",
    description: "New York-based contemporary fashion label"
  },
  {
    name: "Club Monaco Women",
    url: "https://www.clubmonaco.com/en/women-clothing",
    category: "mid-range",
    gender: "women",
    description: "Canadian clothing retailer"
  },
  {
    name: "Madewell",
    url: "https://www.madewell.com/",
    category: "mid-range",
    gender: "women",
    description: "American clothing retailer"
  },

  // Additional Women's Fashion Stores
  {
    name: "Shein",
    url: "https://www.shein.com",
    category: "fast-fashion",
    gender: "women",
    description: "Ultra-fast fashion with global reach and budget-friendly prices"
  },
  {
    name: "Fashion Nova",
    url: "https://www.fashionnova.com",
    category: "fast-fashion",
    gender: "women",
    description: "Trendy affordable fashion with social media influence"
  },
  {
    name: "White Fox Boutique",
    url: "https://www.whitefoxboutique.com",
    category: "mid-range",
    gender: "women",
    description: "Contemporary Australian fashion brand"
  },
  {
    name: "House of CB",
    url: "https://www.houseofcb.com",
    category: "mid-range",
    gender: "women",
    description: "Body-con dresses and going-out wear"
  },
  {
    name: "Oh Polly",
    url: "https://www.ohpolly.com",
    category: "mid-range",
    gender: "women",
    description: "Party and occasion wear specialist"
  },
  {
    name: "Skims",
    url: "https://www.skims.com",
    category: "mid-range",
    gender: "women",
    description: "Shapewear and loungewear brand by Kim Kardashian"
  },
  {
    name: "Garage",
    url: "https://www.garageclothing.com",
    category: "fast-fashion",
    gender: "women",
    description: "Young women's casual fashion and trendy clothing"
  },
  {
    name: "Victoria's Secret",
    url: "https://www.victoriassecret.com",
    category: "budget",
    gender: "women",
    description: "Lingerie, loungewear, and intimate apparel"
  },
  {
    name: "Hollister",
    url: "https://www.hollister.com",
    category: "fast-fashion",
    gender: "unisex",
    description: "Casual American brand for young adults"
  }
];

// Helper functions for store selection
export const getStoresByGender = (gender: 'men' | 'women' | 'unisex'): StoreInfo[] => {
  return STORE_URLS.filter(store => store.gender === gender || store.gender === 'unisex');
};

export const getStoresByCategory = (category: StoreInfo['category']): StoreInfo[] => {
  return STORE_URLS.filter(store => store.category === category);
};

export const getStoresByBudget = (budget: 'low' | 'medium' | 'high'): StoreInfo[] => {
  const categoryMap = {
    'low': ['budget', 'fast-fashion'],
    'medium': ['mid-range'],
    'high': ['luxury', 'designer']
  };

  return STORE_URLS.filter(store => categoryMap[budget].includes(store.category));
};

export const getRandomStores = (count: number, gender?: 'men' | 'women'): StoreInfo[] => {
  let stores = gender ? getStoresByGender(gender) : STORE_URLS;
  const shuffled = [...stores].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

export const getStoresByClothingType = (clothingType: string, gender?: 'men' | 'women'): StoreInfo[] => {
  // Get base stores by gender
  let stores = gender ? getStoresByGender(gender) : STORE_URLS;

  // For formal wear, prioritize mid-range to luxury stores
  if (clothingType.includes('formal') || clothingType.includes('suit') || clothingType.includes('dress')) {
    stores = stores.filter(store => ['mid-range', 'luxury', 'designer'].includes(store.category));
  }

  // For casual wear, include all categories
  if (clothingType.includes('casual') || clothingType.includes('t-shirt') || clothingType.includes('jeans')) {
    // Keep all stores but shuffle to get variety
    stores = [...stores].sort(() => 0.5 - Math.random());
  }

  return stores;
};
import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  ExternalLink,
  Star,
  Heart,
  Filter,
  Search,
  Loader,
  Tag,
  MapPin,
  Clock,
  User,
  CheckCircle,
  Calendar
} from 'lucide-react';
import { GeneratedOutfit } from './TripleOutfitGenerator';
import { ParsedOccasion, BudgetRange } from './SmartOccasionInput';
import optionalProductSearchService from '../services/optionalProductSearchService';
import serpApiService, { ProductSearchResult } from '../services/serpApiService';
import { buildPriorityStoreQuery, SEARCH_STRATEGY, getPriorityStoreDomains } from '../config/priorityStores';
import { affiliateLinkService } from '../services/affiliateLinkService';
import productLinkHandler from '../services/productLinkHandler';
import ProductActionPullDown from './ProductActionPullDown';

interface IntegratedShoppingProps {
  selectedOutfit: GeneratedOutfit;
  occasion: ParsedOccasion;
  budget?: BudgetRange | null;
  onTryOnProduct?: (product: ProductSearchResult) => void;
  onSaveToCalendar?: () => void;
  onProductsCollected?: (products: ProductSearchResult[]) => void;
  avatarData?: any;
  className?: string;
}

interface ShoppingSection {
  title: string;
  products: ProductSearchResult[];
  description: string;
  priority: 'exact' | 'similar' | 'budget';
}

const IntegratedShopping: React.FC<IntegratedShoppingProps> = ({
  selectedOutfit,
  occasion,
  budget,
  onTryOnProduct,
  onSaveToCalendar,
  onProductsCollected,
  avatarData,
  className = ''
}) => {
  const [shoppingSections, setShoppingSections] = useState<ShoppingSection[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchProgress, setSearchProgress] = useState('');
  const [savedToCalendar, setSavedToCalendar] = useState(false);
  const [clickedProducts, setClickedProducts] = useState<ProductSearchResult[]>([]);

  // Pull-down menu state
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [lastViewedProduct, setLastViewedProduct] = useState<ProductSearchResult | null>(null);

  // Budget tiers matching SmartOccasionPlanner
  const budgetTiers = [
    { label: 'Value', range: '$1-50', min: 1, max: 50 },
    { label: 'Budget', range: '$50-150', min: 50, max: 150 },
    { label: 'Premium', range: '$150+', min: 150, max: 999999 }
  ];

  // Default to middle tier (Budget)
  const [activeBudgetIndex, setActiveBudgetIndex] = useState(1);

  // Set up browser closed callback for pull-down menu
  useEffect(() => {
    productLinkHandler.setOnBrowserClosed((productInfo) => {
      console.log('🔔 [INTEGRATED-SHOPPING] Browser closed, showing action menu for:', productInfo.title);
      setLastViewedProduct(productInfo);
      setShowActionMenu(true);
    });
  }, []);

  // Notify parent when clicked products change
  useEffect(() => {
    if (onProductsCollected && clickedProducts.length > 0) {
      onProductsCollected(clickedProducts);
    }
  }, [clickedProducts, onProductsCollected]);

  useEffect(() => {
    if (selectedOutfit) {
      searchContextualProducts();
    }
  }, [selectedOutfit, occasion]);

  /**
   * Extract new keywords from AI query that aren't in the user's original input
   * This preserves user intent while adding helpful visual details from AI
   */
  const extractNewKeywords = (aiQuery: string, userQuery: string): string => {
    if (!aiQuery || !userQuery) return '';
    
    const aiWords = aiQuery.toLowerCase().split(/\s+/);
    const userWords = userQuery.toLowerCase().split(/\s+/);
    
    // Find words in AI query that aren't in user query
    const newWords = aiWords.filter(word => {
      // Skip common words
      if (['the', 'a', 'an', 'and', 'or', 'with', 'for', 'in', 'on'].includes(word)) {
        return false;
      }
      // Check if word or its variations exist in user query
      return !userWords.some(userWord => 
        userWord.includes(word) || word.includes(userWord)
      );
    });
    
    return newWords.join(' ');
  };

  const searchContextualProducts = async () => {
    setIsSearching(true);
    setSearchProgress('Searching Google Shopping for your outfit...');

    try {
      // Use HYBRID search query: user input + AI enhancements
      const userOriginalInput = occasion.originalInput || occasion.occasion;
      const aiAnalyzedQuery = selectedOutfit.searchPrompt;

      // NEW: Hybrid approach - preserve user intent, add AI enhancements
      let baseQuery = userOriginalInput; // Start with user's exact words
      
      if (aiAnalyzedQuery && aiAnalyzedQuery !== userOriginalInput) {
        // Extract ONLY new keywords from AI that user didn't specify
        const newKeywords = extractNewKeywords(aiAnalyzedQuery, userOriginalInput);
        if (newKeywords) {
          baseQuery = `${userOriginalInput} ${newKeywords}`.trim();
          console.log('✨ [HYBRID-QUERY] Enhanced with AI keywords:', newKeywords);
        }
      }

      console.log('🛍️ [SHOPPING] ========== SEARCH DEBUG START ==========');
      console.log('📝 [SHOPPING] User\'s original input:', userOriginalInput);
      console.log('🔍 [SHOPPING] AI-analyzed query:', aiAnalyzedQuery);
      console.log('🎯 [SHOPPING] Hybrid query (PRESERVES USER INTENT):', baseQuery);
      console.log('🛍️ [SHOPPING] Query sent to search:', baseQuery);
      console.log('🎨 [SHOPPING] Outfit personality:', selectedOutfit.personality.name);

      let allProducts: ProductSearchResult[] = [];

      // Search via SerpAPI (Google Shopping) with priority stores - simpler and more reliable
      console.log('🔍 [SERPAPI] Searching Google Shopping with priority stores...');
      setSearchProgress('Finding products from your preferred stores...');

      // Use searchWithStores to prioritize the 72 saved stores first
      const searchResults = await serpApiService.searchWithStores(baseQuery, {
        maxResults: 20
      });

      allProducts.push(...searchResults);
      console.log(`✅ [SERPAPI] Found ${searchResults.length} products from Google Shopping`);

      // Log product details
      searchResults.forEach((product, index) => {
        console.log(`📦 [PRODUCT ${index + 1}]:`, {
          title: product.title,
          store: product.store,
          price: product.price,
          hasImage: !!product.imageUrl,
          url: product.url
        });
      });

      console.log('✅ [SHOPPING] Total products found:', allProducts.length);

      // Remove duplicates
      const uniqueProducts = allProducts.filter((product, index, self) =>
        index === self.findIndex((p) => p.url === product.url)
      );

      // Filter out YouTube URLs (backup filter in case they slip through)
      const nonYouTubeProducts = uniqueProducts.filter(product => {
        const isYouTube = product.url.includes('youtube.com') || product.url.includes('youtu.be');
        if (isYouTube) {
          console.log('🚫 [FILTER] Removed YouTube result:', product.title);
        }
        return !isYouTube;
      });

      console.log(`✅ [FILTER] Filtered products: ${uniqueProducts.length} → ${nonYouTubeProducts.length} (removed ${uniqueProducts.length - nonYouTubeProducts.length} YouTube results)`);

      // Final URL validation check
      console.log('🔍 [URL-VALIDATION] Checking all product URLs for potential errors:');
      nonYouTubeProducts.forEach((product, index) => {
        const isLikelyProductPage =
          product.url.includes('/products/') ||  // Shopify stores
          product.url.includes('/dp/') ||        // Amazon
          product.url.includes('/gp/product/') || // Amazon alternate
          product.url.includes('/goods') ||      // SHEIN
          product.url.includes('-p-') ||         // SHEIN product code
          product.url.includes('/item/') ||      // Generic item
          product.url.includes('/p/') ||         // Target, others
          product.url.includes('productId=') ||  // Product ID param
          product.url.includes('sku=');          // SKU param

        if (!isLikelyProductPage) {
          console.warn(`⚠️ [URL-VALIDATION] Product ${index + 1} may not be a product page:`, {
            title: product.title,
            url: product.url,
            store: product.store,
            reason: 'URL does not match known product page patterns'
          });
        } else {
          console.log(`✅ [URL-VALIDATION] Product ${index + 1} looks valid:`, product.title);
        }
      });

      // Categorize products into sections
      const sections = categorizeBySimilarity(nonYouTubeProducts);
      setShoppingSections(sections);

      const priorityStores = getPriorityStoreDomains(true, false);
      const priorityCount = nonYouTubeProducts.filter(p =>
        priorityStores.some(domain => p.url.includes(domain))
      ).length;

      setSearchProgress(`Found ${nonYouTubeProducts.length} products (${priorityCount} from priority stores)!`);
      setTimeout(() => setSearchProgress(''), 3000);

    } catch (error) {
      console.error('Shopping search failed:', error);
      setSearchProgress('Search failed. Showing similar items...');

      // Fallback to mock products if search fails
      const mockProducts = generateMockProducts();
      const sections = categorizeBySimilarity(mockProducts);
      setShoppingSections(sections);

      setTimeout(() => setSearchProgress(''), 3000);
    } finally {
      setIsSearching(false);
    }
  };

  const createEnhancedSearchQuery = (): string => {
    const personalityStyle = selectedOutfit.personality.name.toLowerCase();
    const occasionType = occasion.occasion;
    const formality = occasion.formality;
    const weatherContext = occasion.weather ? `${occasion.weather.temperature}°F` : '';
    const locationContext = occasion.location || '';

    return `${personalityStyle} ${formality} ${occasionType} outfit ${weatherContext} ${locationContext}`.trim();
  };

  const generateMockProducts = (): ProductSearchResult[] => {
    const baseProducts = [
      {
        id: '1',
        title: 'Elegant Maxi Dress in Coral',
        price: '$89',
        originalPrice: '$120',
        store: 'ASOS',
        imageUrl: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=300&h=400&fit=crop',
        url: 'https://asos.com/example',
        rating: 4.5,
        discount: '25%',
        inStock: true,
        description: 'Perfect for beach occasions'
      },
      {
        id: '2',
        title: 'Flowing Beach Wedding Dress',
        price: '$79',
        store: 'Zara',
        imageUrl: 'https://images.unsplash.com/photo-1566479179817-c0ca66b0c133?w=300&h=400&fit=crop',
        url: 'https://zara.com/example',
        rating: 4.3,
        inStock: true,
        description: 'Breathable fabric ideal for warm weather'
      },
      {
        id: '3',
        title: 'Summer Beach Dress',
        price: '$49',
        store: 'H&M',
        imageUrl: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=300&h=400&fit=crop',
        url: 'https://hm.com/example',
        rating: 4.1,
        inStock: true,
        description: 'Budget-friendly option'
      },
      {
        id: '4',
        title: 'Designer Beach Gown',
        price: '$189',
        store: 'Nordstrom',
        imageUrl: 'https://images.unsplash.com/photo-1583744946564-b52ac1c389c8?w=300&h=400&fit=crop',
        url: 'https://nordstrom.com/example',
        rating: 4.8,
        inStock: true,
        description: 'Luxury option with premium materials'
      },
      {
        id: '5',
        title: 'Romantic Lace Dress',
        price: '$95',
        store: 'Free People',
        imageUrl: 'https://images.unsplash.com/photo-1551688023-3bb0c40ba915?w=300&h=400&fit=crop',
        url: 'https://freepeople.com/example',
        rating: 4.4,
        inStock: true,
        description: 'Delicate details perfect for romantic occasions'
      }
    ];

    return baseProducts;
  };

  const categorizeBySimilarity = (products: ProductSearchResult[]): ShoppingSection[] => {
    return [
      {
        title: 'Exact Style Match',
        description: `Perfect matches for your ${selectedOutfit.personality.name.toLowerCase()} ${occasion.occasion}`,
        priority: 'exact',
        products: products.slice(0, 2)
      },
      {
        title: 'Similar Styles',
        description: 'Great alternatives that capture the same vibe',
        priority: 'similar',
        products: products.slice(2, 4)
      },
      {
        title: 'Budget-Friendly Options',
        description: 'Achieve the look for less',
        priority: 'budget',
        products: products.slice(4)
      }
    ];
  };

  const handleSaveToCalendar = () => {
    setSavedToCalendar(true);
    // Trigger the parent callback which opens the SaveToCalendarModal
    onSaveToCalendar?.();
  };

  const handleSaveFromMenu = () => {
    console.log('📅 [INTEGRATED-SHOPPING] Save to Calendar selected from menu');
    setShowActionMenu(false);
    
    // Add product to collected shopping links
    if (lastViewedProduct) {
      setClickedProducts(prev => {
        const alreadyExists = prev.some(p => p.url === lastViewedProduct.url);
        if (!alreadyExists) {
          console.log('💾 [INTEGRATED-SHOPPING] Adding product to calendar save:', lastViewedProduct.title);
          return [...prev, lastViewedProduct];
        }
        return prev;
      });
    }
    
    // Open calendar modal
    handleSaveToCalendar();
  };

  const handleKeepLooking = () => {
    console.log('🔍 [INTEGRATED-SHOPPING] Keep Looking selected from menu');
    setShowActionMenu(false);
    setLastViewedProduct(null);
  };

  const getBudgetFilteredSections = () => {
    const selectedTier = budgetTiers[activeBudgetIndex];

    return shoppingSections.map(section => ({
      ...section,
      products: section.products
        .filter(product => {
          const price = parseInt(product.price.replace(/[$,]/g, ''));
          return price >= selectedTier.min && price <= selectedTier.max;
        })
        .slice(0, 3) // Limit to 3 products per section
    })).filter(section => section.products.length > 0);
  };

  if (isSearching) {
    return (
      <div className={`integrated-shopping ${className}`}>
        <div className="max-w-6xl mx-auto p-6">
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-full mb-4">
              <Loader className="w-6 h-6 text-white animate-spin" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Finding Perfect Matches</h3>
            <p className="text-gray-600 mb-4">{searchProgress}</p>
            <div className="max-w-xs mx-auto">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`integrated-shopping ${className}`}>
      <div className="max-w-6xl mx-auto p-6 space-y-6">

        {/* Apple-Style Segmented Control for Budget Selection */}
        <div className="flex justify-center">
          <div className="inline-flex bg-ios-gray-5 rounded-ios-lg p-1" role="group">
            {budgetTiers.map((tier, index) => (
              <button
                key={tier.label}
                onClick={() => setActiveBudgetIndex(index)}
                className={`px-6 py-3 rounded-ios-md transition-all duration-200 ${
                  activeBudgetIndex === index
                    ? 'bg-white text-ios-label shadow-ios-sm'
                    : 'text-ios-label-secondary hover:text-ios-label'
                }`}
              >
                <div className={`font-semibold ${activeBudgetIndex === index ? 'text-ios-label' : ''}`}>
                  {tier.label}
                </div>
                <div className={`text-xs mt-0.5 ${
                  activeBudgetIndex === index ? 'text-ios-label-secondary' : 'text-ios-label-tertiary'
                }`}>
                  {tier.range}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Shopping Sections */}
        <div className="space-y-8">
          {getBudgetFilteredSections().map((section, sectionIndex) => (
            <div key={sectionIndex} className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xl font-bold text-gray-900">{section.title}</h4>
                  <p className="text-gray-600">{section.description}</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  section.priority === 'exact' ? 'bg-green-100 text-green-700' :
                  section.priority === 'similar' ? 'bg-blue-100 text-blue-700' :
                  'bg-orange-100 text-orange-700'
                }`}>
                  {section.priority === 'exact' ? '🎯 Best Match' :
                   section.priority === 'similar' ? '✨ Great Alternative' :
                   '💰 Budget Option'}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {section.products.map((product) => (
                  <div key={product.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow flex flex-row">
                    {/* Product Image - Left Side - CLICKABLE */}
                    <div
                      className="w-40 h-40 flex-shrink-0 bg-gray-100 relative group cursor-pointer"
                      onClick={() => {
                        console.log('🖼️ [IMAGE-CLICK] Product image clicked');

                        // Convert to affiliate link and open
                        const affiliateUrl = affiliateLinkService.convertToAffiliateLink(
                          product.url,
                          product.store || 'unknown'
                        );

                        console.log('🎯 [IMAGE-CLICK] Opening product URL:', affiliateUrl);
                        affiliateLinkService.trackClick(affiliateUrl, undefined, product);
                        
                        // Pass product info to handler for callback
                        const productInfo = {
                          url: product.url,
                          title: product.title,
                          imageUrl: product.imageUrl,
                          store: product.store,
                          price: product.price
                        };
                        productLinkHandler.openProductLink(affiliateUrl, product.store || 'unknown', productInfo);
                      }}
                    >
                      <img
                        src={product.imageUrl}
                        alt={product.title}
                        className="w-full h-full object-cover cursor-pointer"
                        onError={(e) => {
                          // Fallback to category icon if image fails
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            parent.classList.add('flex', 'items-center', 'justify-center', 'bg-gradient-to-br', 'from-purple-100', 'to-blue-100');
                            parent.innerHTML = `
                              <div class="text-center">
                                <div class="text-4xl mb-2">${
                                  // Handle both singular and plural forms
                                  product.category === 'one-pieces' || product.category === 'dress' ? '👗' :
                                  product.category === 'tops' || product.category === 'top' ? '👚' :
                                  product.category === 'bottoms' || product.category === 'bottom' ? '👖' :
                                  product.category === 'skirt' ? '👗' :
                                  product.category === 'outerwear' ? '🧥' :
                                  product.category === 'shoes' ? '👠' :
                                  '👔'
                                }</div>
                                <div class="text-xs font-medium text-gray-600 capitalize">${product.category || 'clothing'}</div>
                              </div>
                            `;
                          }
                        }}
                      />

                      {product.discount && (
                        <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-medium">
                          {product.discount}
                        </div>
                      )}

                      <button
                        onClick={(e) => e.stopPropagation()} // Prevent image click
                        className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow-md hover:bg-gray-50"
                      >
                        <Heart className="w-3 h-3 text-gray-600" />
                      </button>
                    </div>

                    {/* Product Details - Right Side */}
                    <div className="flex-1 p-4 flex flex-col justify-between">
                      <div>
                        <h5 className="font-medium text-gray-900 mb-2 line-clamp-2">{product.title}</h5>

                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-bold text-lg text-gray-900">{product.price}</span>
                          {product.originalPrice && product.originalPrice !== product.price && (
                            <span className="text-sm text-gray-500 line-through">{product.originalPrice}</span>
                          )}
                          {product.rating && (
                            <div className="flex items-center ml-auto">
                              <Star className="w-3 h-3 text-yellow-400 fill-current" />
                              <span className="text-sm text-gray-600 ml-1">{product.rating}</span>
                            </div>
                          )}
                        </div>

                        <p className="text-sm text-gray-600 mb-3">{product.store}</p>
                      </div>

                      <button
                        onClick={() => {
                          console.log('🛍️ [INTEGRATED-SHOPPING] Shop button clicked');
                          console.log('📦 [INTEGRATED-SHOPPING] Product data:', {
                            title: product.title,
                            store: product.store,
                            originalUrl: product.url,
                            price: product.price
                          });

                          const affiliateUrl = affiliateLinkService.convertToAffiliateLink(
                            product.url,
                            product.store || 'unknown'
                          );

                          console.log('🎯 [INTEGRATED-SHOPPING] Final URL to open:', affiliateUrl);
                          console.log('✅ [INTEGRATED-SHOPPING] Opening product link...');

                          affiliateLinkService.trackClick(affiliateUrl, undefined, product);
                          
                          // Pass product info to handler for callback
                          const productInfo = {
                            url: product.url,
                            title: product.title,
                            imageUrl: product.imageUrl,
                            store: product.store,
                            price: product.price
                          };
                          productLinkHandler.openProductLink(affiliateUrl, product.store || 'unknown', productInfo);
                        }}
                        className="w-full bg-gray-900 text-white py-2 px-4 rounded-lg font-medium hover:bg-gray-800 transition-colors flex items-center justify-center text-sm"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View Product
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {searchProgress && (
          <div className="text-center">
            <p className="text-sm text-green-600 font-medium">{searchProgress}</p>
          </div>
        )}
      </div>

      {/* iOS Pull-Down Action Menu */}
      <ProductActionPullDown
        isOpen={showActionMenu}
        onSaveToCalendar={handleSaveFromMenu}
        onKeepLooking={handleKeepLooking}
        productTitle={lastViewedProduct?.title}
      />
    </div>
  );
};

export default IntegratedShopping;
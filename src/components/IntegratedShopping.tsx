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
import { ParsedOccasion } from './SmartOccasionInput';
import optionalProductSearchService from '../services/optionalProductSearchService';
import perplexityService, { ProductSearchResult } from '../services/perplexityService';
import { buildPriorityStoreQuery, SEARCH_STRATEGY, getPriorityStoreDomains } from '../config/priorityStores';
import { affiliateLinkService } from '../services/affiliateLinkService';

interface IntegratedShoppingProps {
  selectedOutfit: GeneratedOutfit;
  occasion: ParsedOccasion;
  onTryOnProduct?: (product: ProductSearchResult) => void;
  onSaveToCalendar?: () => void;
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
  onTryOnProduct,
  onSaveToCalendar,
  avatarData,
  className = ''
}) => {
  const [shoppingSections, setShoppingSections] = useState<ShoppingSection[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchProgress, setSearchProgress] = useState('');
  const [selectedBudget, setSelectedBudget] = useState<'all' | 'budget' | 'mid' | 'luxury' | null>(null);
  const [savedToCalendar, setSavedToCalendar] = useState(false);

  useEffect(() => {
    if (selectedOutfit) {
      searchContextualProducts();
    }
  }, [selectedOutfit, occasion]);

  const searchContextualProducts = async () => {
    setIsSearching(true);
    setSearchProgress('Searching priority stores for your outfit...');

    try {
      const baseQuery = selectedOutfit.searchPrompt;
      console.log('🛍️ [SHOPPING] Base search query:', baseQuery);

      let allProducts: ProductSearchResult[] = [];

      // PHASE 1: Search primary priority stores FIRST (user's preferred webpages)
      console.log('🔍 [PHASE 1] Searching primary priority stores...');
      setSearchProgress('Checking Shein, Fashion Nova, White Fox...');

      const primaryQuery = buildPriorityStoreQuery(baseQuery, 5, true, false);
      console.log('🎯 [PRIORITY-SEARCH] Primary query:', primaryQuery);

      const primaryResults = await perplexityService.searchSimilarProducts(
        primaryQuery,
        { maxResults: 10 }
      );

      allProducts.push(...primaryResults);
      console.log(`✅ [PHASE 1] Found ${primaryResults.length} products from priority stores`);

      // PHASE 2: If not enough results, add secondary stores
      if (allProducts.length < SEARCH_STRATEGY.MIN_RESULTS_PRIMARY && SEARCH_STRATEGY.PHASE_2_ADD_SECONDARY) {
        console.log('🔍 [PHASE 2] Not enough results, searching secondary stores...');
        setSearchProgress('Expanding search to ASOS, Zara, H&M...');

        const secondaryQuery = buildPriorityStoreQuery(baseQuery, 5, false, true);
        console.log('🎯 [SECONDARY-SEARCH] Secondary query:', secondaryQuery);

        const secondaryResults = await perplexityService.searchSimilarProducts(
          secondaryQuery,
          { maxResults: 5 }
        );

        allProducts.push(...secondaryResults);
        console.log(`✅ [PHASE 2] Found ${secondaryResults.length} products from secondary stores`);
      }

      // PHASE 3: If still not enough, search ALL priority stores (primary + secondary)
      if (allProducts.length < SEARCH_STRATEGY.MIN_RESULTS_SECONDARY && SEARCH_STRATEGY.PHASE_3_GENERAL_SEARCH) {
        console.log('🔍 [PHASE 3] Still not enough, searching all priority stores...');
        setSearchProgress('Searching all available retailers...');

        const allStoresQuery = buildPriorityStoreQuery(baseQuery, 11, true, true);
        console.log('🎯 [ALL-STORES-SEARCH] Query:', allStoresQuery);

        const allStoresResults = await perplexityService.searchSimilarProducts(
          allStoresQuery,
          { maxResults: 10 }
        );

        allProducts.push(...allStoresResults);
        console.log(`✅ [PHASE 3] Found ${allStoresResults.length} products from all priority stores`);
      }

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

  const getBudgetFilteredSections = () => {
    // If no budget selected, return empty array (hide products)
    if (selectedBudget === null) return [];

    if (selectedBudget === 'all') return shoppingSections;

    return shoppingSections.map(section => ({
      ...section,
      products: section.products.filter(product => {
        const price = parseInt(product.price.replace('$', ''));
        switch (selectedBudget) {
          case 'budget':
            return price < 70;
          case 'mid':
            return price >= 70 && price <= 150;
          case 'luxury':
            return price > 150;
          default:
            return true;
        }
      })
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

        {/* Header Section */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-2xl p-6">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900">Shop This Look</h3>
              <p className="text-gray-600">
                {selectedOutfit.personality.name} style for your {occasion.occasion}
              </p>
            </div>
          </div>

          {/* Context Tags */}
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-blue-100 text-blue-700">
              <MapPin className="w-3 h-3 mr-1" />
              {occasion.location || 'Location-appropriate'}
            </span>
            {occasion.weather && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-orange-100 text-orange-700">
                <Tag className="w-3 h-3 mr-1" />
                {occasion.weather.temperature}°F weather
              </span>
            )}
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs bg-purple-100 text-purple-700">
              <Clock className="w-3 h-3 mr-1" />
              {occasion.formality}
            </span>
          </div>

          {/* Why These Products */}
          <div className="bg-white rounded-lg p-4 border border-green-200 mb-4">
            <h4 className="font-medium text-gray-900 mb-2">Smart matching based on:</h4>
            <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                {occasion.occasion} occasion
              </div>
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                {selectedOutfit.personality.name} personality
              </div>
              {occasion.weather && (
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  {occasion.weather.temperature}°F weather
                </div>
              )}
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                {occasion.formality} dress code
              </div>
            </div>
          </div>

          {/* Calendar Save Button - Now Prominent and Always Visible */}
          <button
            onClick={handleSaveToCalendar}
            disabled={savedToCalendar}
            className={`w-full px-6 py-3 rounded-xl font-medium transition-all shadow-md ${
              savedToCalendar
                ? 'bg-green-100 text-green-700 border border-green-300'
                : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700'
            }`}
          >
            {savedToCalendar ? (
              <>
                <CheckCircle className="w-5 h-5 inline mr-2" />
                <span className="font-semibold">Saved to Calendar</span>
              </>
            ) : (
              <>
                <Calendar className="w-5 h-5 inline mr-2" />
                <span className="font-semibold">Save to Calendar</span>
              </>
            )}
          </button>
        </div>

        {/* Budget Filter */}
        <div className="flex items-center space-x-4">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filter by budget:</span>
          <div className="flex space-x-2">
            {[
              { id: 'all', label: 'All', range: '' },
              { id: 'budget', label: 'Budget', range: '< $70' },
              { id: 'mid', label: 'Mid-range', range: '$70-$150' },
              { id: 'luxury', label: 'Luxury', range: '> $150' }
            ].map((option) => (
              <button
                key={option.id}
                onClick={() => setSelectedBudget(option.id as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedBudget === option.id
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {option.label}
                {option.range && <span className="block text-xs opacity-75">{option.range}</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Select Budget Prompt (shown when no budget selected) */}
        {selectedBudget === null && shoppingSections.length > 0 && (
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-300 rounded-2xl p-12 text-center">
            <div className="max-w-md mx-auto space-y-4">
              <div className="text-6xl mb-4">💰</div>
              <h3 className="text-2xl font-bold text-gray-900">Select Your Budget First</h3>
              <p className="text-gray-600 text-lg">
                Choose a budget range above to see matching products
              </p>
              <div className="flex items-center justify-center space-x-2 text-sm text-purple-600 mt-6">
                <span>👆</span>
                <span className="font-medium">Pick a budget filter to view options</span>
              </div>
            </div>
          </div>
        )}

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

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {section.products.map((product) => (
                  <div key={product.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="aspect-square bg-gray-100 relative group">
                      <img
                        src={product.imageUrl}
                        alt={product.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity duration-200 flex items-center justify-center">
                        {avatarData?.imageUrl && (
                          <button
                            onClick={() => onTryOnProduct?.(product)}
                            className="opacity-0 group-hover:opacity-100 bg-purple-600 text-white px-4 py-2 rounded-lg font-medium transition-opacity duration-200"
                          >
                            <User className="w-4 h-4 inline mr-2" />
                            Try-On
                          </button>
                        )}
                      </div>

                      {product.discount && (
                        <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-medium">
                          {product.discount}
                        </div>
                      )}

                      <button className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-gray-50">
                        <Heart className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>

                    <div className="p-4">
                      <h5 className="font-medium text-gray-900 mb-2 line-clamp-2">{product.title}</h5>

                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-lg text-gray-900">{product.price}</span>
                          {product.originalPrice && product.originalPrice !== product.price && (
                            <span className="text-sm text-gray-500 line-through">{product.originalPrice}</span>
                          )}
                        </div>
                        {product.rating && (
                          <div className="flex items-center">
                            <Star className="w-4 h-4 text-yellow-400 fill-current" />
                            <span className="text-sm text-gray-600 ml-1">{product.rating}</span>
                          </div>
                        )}
                      </div>

                      <p className="text-sm text-gray-600 mb-3">{product.store}</p>

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
                          console.log('✅ [INTEGRATED-SHOPPING] Opening in new tab...');

                          affiliateLinkService.trackClick(affiliateUrl, undefined, product);
                          window.open(affiliateUrl, '_blank');
                        }}
                        className="w-full bg-gray-900 text-white py-2 px-4 rounded-lg font-medium hover:bg-gray-800 transition-colors flex items-center justify-center"
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
    </div>
  );
};

export default IntegratedShopping;
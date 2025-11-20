/**
 * Shopping Board Section
 * Curated wishlist items inspired by FashionFeed
 */

import React, { useEffect, useState } from 'react';
import { Heart, ExternalLink, ShoppingBag } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';

interface WishlistItem {
  id: string;
  name: string;
  image_url: string;
  price?: number;
  store?: string;
  url?: string;
  inspired_by?: string;
  created_at: string;
}

export default function ShoppingBoardSection() {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWishlist();
  }, []);

  const loadWishlist = async () => {
    setLoading(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('wishlist_items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) {
        console.error('Error loading wishlist:', error);
      } else {
        setWishlistItems(data || []);
      }
    } catch (err) {
      console.error('Exception loading wishlist:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="torn-edge bg-white shadow-scrapbook animate-fadeInUp">
        <div className="washi-tape" />
        <div className="p-6">
          <div className="text-center py-12">
            <div className="animate-pulse text-4xl mb-4">🛍️</div>
            <p className="handwritten text-xl text-gray-500">
              Loading your shopping board...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (wishlistItems.length === 0) {
    return (
      <div className="torn-edge bg-white shadow-scrapbook animate-fadeInUp">
        <div className="washi-tape" />
        <div className="p-6">
          <h2 className="text-3xl font-black mb-4 flex items-center gap-3">
            <span>🛍️</span>
            <span>SHOPPING BOARD</span>
          </h2>
          
          <div className="speech-bubble">
            <p className="handwritten text-lg text-center">
              "Save items from Style Steal and AI Spotted to build your shopping board! 💕"
            </p>
            <p className="text-center text-sm text-gray-500 mt-2">
              Tap the heart icon on any inspiration image
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="torn-edge bg-white shadow-scrapbook animate-fadeInUp">
      <div className="washi-tape" />
      
      <div className="p-6">
        {/* Header */}
        <h2 className="text-3xl font-black mb-2 flex items-center gap-3">
          <span>🛍️</span>
          <span>SHOPPING BOARD</span>
        </h2>
        <p className="handwritten text-lg mb-4 text-gray-700">
          Items you loved from FashionFeed
        </p>
        <div className="section-divider">
          <div className="line" />
        </div>

        {/* Wishlist Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {wishlistItems.map((item, index) => (
            <div
              key={item.id}
              className="magazine-box-pink relative"
              style={{
                animationDelay: `${index * 100}ms`
              }}
            >
              {/* Image */}
              <div className="relative aspect-[3/4] mb-3">
                <img
                  src={item.image_url}
                  alt={item.name}
                  className="w-full h-full object-cover rounded-lg shadow-lg"
                />
                
                {/* Inspired by tag */}
                {item.inspired_by && (
                  <div className="absolute top-2 left-2">
                    <div className="sticker sticker-purple text-xs">
                      {item.inspired_by.replace('_', ' ')}
                    </div>
                  </div>
                )}
                
                {/* Heart indicator */}
                <div className="absolute top-2 right-2">
                  <div className="bg-pink-500 rounded-full p-1.5 shadow-lg">
                    <Heart className="w-4 h-4 text-white fill-white" />
                  </div>
                </div>
              </div>

              {/* Item Info */}
              <div className="space-y-2">
                <h3 className="font-bold text-sm line-clamp-2">{item.name}</h3>
                
                {/* Price */}
                {item.price && (
                  <div className="bg-yellow-100 border-2 border-yellow-400 rounded px-2 py-1 inline-block">
                    <p className="text-sm font-black">${item.price}</p>
                  </div>
                )}
                
                {/* Store */}
                {item.store && (
                  <p className="text-xs text-gray-600 capitalize">
                    from {item.store}
                  </p>
                )}
                
                {/* Shop Button */}
                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold text-sm rounded-lg hover:shadow-lg transition-shadow"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Shop Now</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        {wishlistItems.length > 0 && (
          <div className="mt-6 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg p-4 border-2 border-pink-200">
            <p className="handwritten text-lg text-center">
              💕 {wishlistItems.length} item{wishlistItems.length !== 1 ? 's' : ''} saved to your board!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

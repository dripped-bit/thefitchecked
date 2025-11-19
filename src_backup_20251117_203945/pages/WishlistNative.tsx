/**
 * Wishlist - Native Version (No Ionic)
 * View and manage your saved clothing items
 */

import React, { useState, useEffect } from 'react';
import { Trash2, ExternalLink, Sparkles, ChevronLeft, Filter } from 'lucide-react';
import { Browser } from '@capacitor/browser';
import { supabase } from '../services/supabaseClient';

interface WishlistItem {
  id: string;
  user_id: string;
  name: string;
  brand?: string;
  price: string;
  currency?: string;
  image: string;
  url: string;
  retailer: string;
  notes?: string;
  original_price?: string;
  discount?: string;
  category?: string;
  subcategory?: string;
  ai_generated?: boolean;
  design_prompt?: string;
  ai_generated_image?: string;
  created_at: string;
}

interface WishlistProps {
  onBack: () => void;
}

const Wishlist: React.FC<WishlistProps> = ({ onBack }) => {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData.user) {
        console.log('No user logged in');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('wishlist_items')
        .select('*')
        .eq('user_id', userData.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching wishlist:', error);
        throw error;
      }
      
      console.log('Fetched wishlist items:', data?.length || 0);
      setWishlistItems(data || []);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = async (id: string) => {
    if (!confirm('Remove this item from your wishlist?')) return;

    try {
      const { error } = await supabase
        .from('wishlist_items')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setWishlistItems(items => items.filter(item => item.id !== id));
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Failed to remove item. Please try again.');
    }
  };

  const openProductLink = async (url: string) => {
    try {
      await Browser.open({ url, presentationStyle: 'popover' });
    } catch (error) {
      console.error('Error opening link:', error);
    }
  };

  const filteredItems = selectedCategory === 'All' 
    ? wishlistItems 
    : wishlistItems.filter(item => item.category === selectedCategory);

  const categories = ['All', ...Array.from(new Set(wishlistItems.map(item => item.category).filter(Boolean)))];

  if (loading) {
    return (
      <div className="min-h-screen bg-ios-bg flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent mb-4"></div>
          <p className="text-ios-label-secondary">Loading wishlist...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ios-bg">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="px-4 py-3 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center text-ios-blue"
          >
            <ChevronLeft className="w-6 h-6" />
            <span className="text-base font-medium">StyleHub</span>
          </button>
          <h1 className="text-lg font-semibold text-ios-label">Wishlist</h1>
          <div className="w-20"></div> {/* Spacer for centering */}
        </div>

        {/* Category Filter */}
        {categories.length > 1 && (
          <div className="px-4 py-2 overflow-x-auto">
            <div className="flex gap-2">
              {categories.map(cat => (
                <button
                  key={cat || 'all'}
                  onClick={() => setSelectedCategory(cat || 'All')}
                  className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-colors ${
                    selectedCategory === cat
                      ? 'bg-ios-blue text-white'
                      : 'bg-ios-gray-light text-ios-label'
                  }`}
                >
                  {cat || 'All'}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {filteredItems.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">💜</div>
            <h3 className="text-xl font-semibold text-ios-label mb-2">
              {wishlistItems.length === 0 ? 'Your wishlist is empty' : 'No items in this category'}
            </h3>
            <p className="text-ios-label-secondary mb-6">
              {wishlistItems.length === 0 
                ? 'Save items from AI Design Shop or shopping search'
                : 'Try selecting a different category'}
            </p>
            {wishlistItems.length === 0 && (
              <button
                onClick={onBack}
                className="px-6 py-3 bg-ios-blue text-white rounded-lg font-medium"
              >
                Explore StyleHub
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filteredItems.map(item => (
              <div
                key={item.id}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm"
              >
                {/* Image */}
                <div className="relative aspect-square bg-gray-100">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Sparkles className="w-12 h-12" />
                    </div>
                  )}
                  
                  {/* AI Badge */}
                  {item.ai_generated && (
                    <div className="absolute top-2 left-2 bg-purple-600 text-white px-2 py-1 rounded-full flex items-center gap-1 text-xs font-medium">
                      <Sparkles className="w-3 h-3" />
                      AI
                    </div>
                  )}

                  {/* Delete Button */}
                  <button
                    onClick={() => deleteItem(item.id)}
                    className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>

                {/* Info */}
                <div className="p-3">
                  <h3 className="text-sm font-medium text-ios-label line-clamp-2 mb-1">
                    {item.name}
                  </h3>
                  
                  <p className="text-base font-semibold text-ios-blue mb-1">
                    {item.price}
                  </p>
                  
                  {item.retailer && (
                    <p className="text-xs text-ios-label-secondary mb-2">
                      from {item.retailer}
                    </p>
                  )}

                  {item.category && (
                    <span className="inline-block px-2 py-1 bg-ios-gray-light text-xs text-ios-label-secondary rounded mb-2">
                      {item.category}
                    </span>
                  )}

                  {/* Shop Button */}
                  <button
                    onClick={() => openProductLink(item.url)}
                    className="w-full py-2 bg-ios-blue text-white rounded-lg text-sm font-medium flex items-center justify-center gap-2 hover:bg-blue-600 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Shop Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Wishlist;

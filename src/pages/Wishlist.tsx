import React, { useEffect, useState } from 'react';
import {
  IonGrid,
  IonRow,
  IonCol,
  IonIcon,
  IonText,
  IonSpinner,
  IonToast,
} from '@ionic/react';
import { warningOutline, giftOutline, cart, trash } from 'ionicons/icons';
import { Browser } from '@capacitor/browser';
import { Share } from '@capacitor/share';
import { supabase } from '../services/supabaseClient';
import PriceComparisonModal from '../components/wishlist/PriceComparisonModal';
import MoveToClosetModal from '../components/wishlist/MoveToClosetModal';
import claudeComparisonService from '../services/claudeComparisonService';
import serpApiPriceSearchService from '../services/serpApiPriceSearchService';

interface WishlistItem {
  id: string;
  user_id: string;
  name: string;
  brand?: string;
  price: string;
  currency?: string;
  image: string;
  image_url?: string;
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
  is_birthday_item?: boolean;
  is_purchased?: boolean;
  availability_status?: 'in_stock' | 'low_stock' | 'out_of_stock' | 'restocking';
  availability_checked_at?: string;
  created_at: string;
}

interface WishlistProps {
  onBack: () => void;
}

const CATEGORY_LABELS: Record<string, { label: string; icon: string }> = {
  'All Items': { label: 'All Items', icon: '📋' },
  'tops': { label: 'Tops', icon: '👕' },
  'bottoms': { label: 'Bottoms', icon: '👖' },
  'dresses': { label: 'Dresses', icon: '👗' },
  'activewear': { label: 'Activewear', icon: '🏃' },
  'outerwear': { label: 'Outerwear', icon: '🧥' },
  'shoes': { label: 'Shoes', icon: '👠' },
  'accessories': { label: 'Accessories', icon: '👜' }
};

const Wishlist: React.FC<WishlistProps> = ({ onBack }) => {
  const [allWishlistItems, setAllWishlistItems] = useState<WishlistItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Category filter state
  const [selectedCategory, setSelectedCategory] = useState<string>('All Items');
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);

  // Tab bar state
  const [activeMainTab, setActiveMainTab] = useState<'compare' | 'purchased' | 'share' | 'gifts'>('compare');

  // Selection state
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // Feature states
  const [showGiftsMode, setShowGiftsMode] = useState(false);
  const [showPurchasedMode, setShowPurchasedMode] = useState(false);
  const [showPriceComparison, setShowPriceComparison] = useState(false);
  const [selectedItemForComparison, setSelectedItemForComparison] = useState<any>(null);
  const [showMoveToCloset, setShowMoveToCloset] = useState(false);
  const [selectedItemForMove, setSelectedItemForMove] = useState<any>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [comparingItem, setComparingItem] = useState(false);

  useEffect(() => {
    fetchWishlist();
  }, []);

  useEffect(() => {
    filterItems();
  }, [selectedCategory, allWishlistItems, showGiftsMode, showPurchasedMode]);

  const fetchWishlist = async () => {
    try {
      console.log('🛍️ [WISHLIST] Starting fetch...');
      setLoading(true);
      
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData.user) {
        console.log('❌ [WISHLIST] No authenticated user');
        setLoading(false);
        return;
      }
      
      console.log('👤 [WISHLIST] User ID:', userData.user.id);

      // Try both possible table names
      let data, error;
      
      // First try 'wishlist_items'
      console.log('🔍 [WISHLIST] Trying table: wishlist_items');
      const result1 = await supabase
        .from('wishlist_items')
        .select('*')
        .eq('user_id', userData.user.id)
        .order('created_at', { ascending: false });
      
      if (result1.error && result1.error.message.includes('does not exist')) {
        console.log('⚠️ [WISHLIST] wishlist_items not found, trying: wishlist');
        
        // Try 'wishlist' table
        const result2 = await supabase
          .from('wishlist')
          .select('*')
          .eq('user_id', userData.user.id)
          .order('created_at', { ascending: false });
        
        data = result2.data;
        error = result2.error;
        
        if (!error) {
          console.log('✅ [WISHLIST] Using table: wishlist');
        }
      } else {
        data = result1.data;
        error = result1.error;
        
        if (!error) {
          console.log('✅ [WISHLIST] Using table: wishlist_items');
        }
      }

      if (error) {
        console.error('❌ [WISHLIST] Database error:', error.message);
        throw error;
      }
      
      console.log(`✅ [WISHLIST] Loaded ${data?.length || 0} items`);
      setAllWishlistItems(data || []);
      setFilteredItems(data || []);
      
    } catch (error: any) {
      console.error('❌ [WISHLIST] Fatal error:', error);
      setError(error.message || 'Failed to load wishlist');
      // Show error toast
      setToastMessage(`Failed to load wishlist: ${error.message}`);
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  // Filter items based on category, gifts mode, and purchased mode
  const filterItems = () => {
    let filtered = [...allWishlistItems];

    // Filter by mode
    if (showGiftsMode) {
      filtered = filtered.filter(item => item.is_birthday_item);
    } else if (showPurchasedMode) {
      filtered = filtered.filter(item => item.is_purchased);
      // Sort by purchase date (most recent first)
      filtered.sort((a, b) => {
        const dateA = new Date(a.purchase_date || 0).getTime();
        const dateB = new Date(b.purchase_date || 0).getTime();
        return dateB - dateA;
      });
    } else {
      // Default: Show only non-purchased items
      filtered = filtered.filter(item => !item.is_purchased);
    }

    // Apply category filter
    if (selectedCategory !== 'All Items') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    setFilteredItems(filtered);
  };

  // Calculate total cost
  const calculateTotalCost = () => {
    return filteredItems.reduce((sum, item) => {
      const price = parseFloat(item.price.replace(/[^0-9.]/g, ''));
      return sum + (isNaN(price) ? 0 : price);
    }, 0);
  };

  // Calculate purchased total
  const calculatePurchasedTotal = () => {
    const purchasedItems = allWishlistItems.filter(item => item.is_purchased);
    return purchasedItems.reduce((sum, item) => {
      const price = parseFloat(item.price.replace(/[^0-9.]/g, ''));
      return sum + (isNaN(price) ? 0 : price);
    }, 0);
  };

  // Format purchase date
  const formatPurchaseDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  // Toggle item selection
  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const deleteItem = async (id: string) => {
    try {
      const { error } = await supabase
        .from('wishlist_items') // Change to 'wishlist' if that's your table name
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setAllWishlistItems(items => items.filter(item => item.id !== id));
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  const openProductLink = async (url: string) => {
    try {
      await Browser.open({ url, presentationStyle: 'popover' });
    } catch (error) {
      console.error('Browser error:', error);
    }
  };

  // Feature handlers
  const handleComparePrice = (item: WishlistItem) => {
    handleAIComparison(item);
  };

  const handleAIComparison = async (item: WishlistItem) => {
    try {
      setComparingItem(true);
      setToastMessage('🔄 Analyzing prices with AI...');
      setShowToast(true);

      console.log('🤖 [WISHLIST] Starting AI comparison for:', item.name);

      // Step 1: Use Claude to generate optimized search queries
      const queries = await claudeComparisonService.generateSearchQueries(item);

      // Step 2: Search SerpAPI for deals
      const results = await serpApiPriceSearchService.searchDeals(queries);

      console.log('✅ [WISHLIST] Got comparison results:', {
        exactMatches: results.exactMatches.length,
        similarItems: results.similarItems.length
      });

      // Step 3: Show results in modal
      setSelectedItemForComparison({
        original: item,
        aiResults: results
      });
      setShowPriceComparison(true);
      setComparingItem(false);
      
      if (results.exactMatches.length > 0 || results.similarItems.length > 0) {
        setToastMessage('✅ Found deals!');
      } else {
        setToastMessage('⚠️ No deals found');
      }
      setShowToast(true);
    } catch (error: any) {
      console.error('❌ [WISHLIST] AI comparison failed:', error);
      setToastMessage('❌ Comparison failed - check connection');
      setShowToast(true);
      setComparingItem(false);
    }
  };

  const handleShareList = async () => {
    try {
      const itemsToShare = selectedItems.size > 0
        ? filteredItems.filter(i => selectedItems.has(i.id))
        : filteredItems;

      const shareText = itemsToShare
        .map(item => `${item.name} - ${item.price}\n${item.url}`)
        .join('\n\n');

      await Share.share({
        title: 'My Wishlist',
        text: shareText,
        dialogTitle: 'Share Wishlist'
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleGiftsMode = () => {
    setActiveMainTab('gifts');
    setShowGiftsMode(!showGiftsMode);
    setShowPurchasedMode(false);
    if (!showGiftsMode) {
      setSelectedCategory('All Items');
    }
  };

  const handlePurchasedMode = () => {
    setActiveMainTab('purchased');
    setShowPurchasedMode(!showPurchasedMode);
    setShowGiftsMode(false);
  };

  const handlePurchaseItem = async (item: WishlistItem) => {
    try {
      await Browser.open({ url: item.url });
      
      setToastMessage('Marking as purchased...');
      setShowToast(true);
      
      const { error } = await supabase
        .from('wishlist_items')
        .update({ 
          is_purchased: true,
          purchase_date: new Date().toISOString()
        })
        .eq('id', item.id);
      
      if (error) throw error;
      
      setToastMessage('✅ Marked as purchased!');
      setShowToast(true);
      
      // Switch to Purchased tab
      setShowPurchasedMode(true);
      setShowGiftsMode(false);
      setActiveMainTab('purchased');
      
      fetchWishlist();
    } catch (error: any) {
      console.error('Error marking as purchased:', error);
      setToastMessage('❌ Failed to mark as purchased');
      setShowToast(true);
    }
  };

  const markAsBirthdayItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('wishlist_items')
        .update({ is_birthday_item: true })
        .eq('id', itemId);

      if (error) throw error;

      setToastMessage('Added to gift wishlist!');
      setShowToast(true);
      fetchWishlist();
    } catch (error) {
      console.error('Error marking as gift item:', error);
      setToastMessage('Failed to add to gift list');
      setShowToast(true);
    }
  };

  const handleBuyAndSave = async (item: WishlistItem) => {
    try {
      await Browser.open({ url: item.url });
      
      setToastMessage('Saving purchase to closet...');
      setShowToast(true);
      
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;
      
      const price = parseFloat(item.price.replace(/[^0-9.]/g, ''));
      
      // Save to closet with full analytics
      await supabase.from('clothing_items').insert({
        user_id: userData.user.id,
        name: item.name,
        category: item.category || 'tops',
        image_url: item.image,
        brand: item.brand,
        price: isNaN(price) ? null : price,
        notes: `Purchased from wishlist via ${item.retailer}`,
        purchase_date: new Date().toISOString(),
        favorite: false,
        times_worn: 0,
        tags: [
          'wishlist_purchase',
          item.retailer || 'unknown',
          item.brand || 'unknown_brand',
          `price_${Math.floor(price / 50) * 50}`,
          new Date().toISOString().slice(0, 7),
        ]
      });
      
      await supabase.from('wishlist_items').delete().eq('id', item.id);
      
      // Remove from selection
      setSelectedItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(item.id);
        return newSet;
      });
      
      setToastMessage('✅ Saved to closet with analytics!');
      setShowToast(true);
      fetchWishlist();
    } catch (error: any) {
      console.error('Buy and save error:', error);
      setToastMessage('Error: ' + error.message);
      setShowToast(true);
    }
  };

  const handleMarkPurchased = async (item: WishlistItem) => {
    try {
      setToastMessage('Saving to wardrobe...');
      setShowToast(true);

      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        setToastMessage('Please log in first');
        setShowToast(true);
        return;
      }

      // Save to clothing_items table
      const { error: saveError } = await supabase
        .from('clothing_items')
        .insert({
          user_id: userData.user.id,
          name: item.name,
          category: item.category || 'tops',
          image_url: item.image || item.image_url,
          thumbnail_url: item.image || item.image_url,
          brand: item.brand,
          price: item.price ? parseFloat(item.price.replace(/[^0-9.]/g, '')) : null,
          notes: `Purchased from ${item.retailer || 'wishlist'}`,
          favorite: false,
          times_worn: 0
        });

      if (saveError) throw saveError;

      // Mark as purchased in wishlist
      const { error: updateError } = await supabase
        .from('wishlist_items')
        .update({ is_purchased: true })
        .eq('id', item.id);

      if (updateError) throw updateError;

      setToastMessage('Saved to closet!');
      setShowToast(true);
      fetchWishlist(); // Refresh list
    } catch (error: any) {
      console.error('Error saving to closet:', error);
      setToastMessage('Failed to save: ' + error.message);
      setShowToast(true);
    }
  };

  const handleCheckAvailability = async (item: WishlistItem) => {
    setToastMessage('Checking availability...');
    setShowToast(true);

    const result = await availabilityCheckerService.checkAvailability(item.url, item.name);
    
    if (result.success) {
      // Refresh wishlist to show updated status
      fetchWishlist();
      setToastMessage(`Status: ${result.details || result.status}`);
    } else {
      setToastMessage('Could not check availability');
    }
    setShowToast(true);
  };

  const totalCost = calculateTotalCost();
  const selectedCount = selectedItems.size;

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#ffffff',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Header - Centered with Total & Selected Count */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '12px 16px',
        position: 'relative',
        borderBottom: '1px solid rgba(0,0,0,0.1)',
      }}>
        <button
          onClick={onBack}
          style={{
            position: 'absolute',
            left: '16px',
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            padding: '8px',
            color: '#007AFF'
          }}
        >
          ←
        </button>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center',
        }}>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#000' }}>
            {showPurchasedMode ? 'Purchased Items' : showGiftsMode ? 'Gift Wishlist' : 'Wishlist'}
          </h1>
          <div style={{ 
            display: 'flex', 
            gap: '12px',
            fontSize: '13px',
            color: '#86868b',
            marginTop: '4px',
          }}>
            {showPurchasedMode ? (
              <>
                <span>Spent: ${calculatePurchasedTotal().toFixed(2)}</span>
                <span style={{ 
                  color: '#007AFF',
                  fontWeight: '600',
                }}>
                  • {filteredItems.length} items
                </span>
              </>
            ) : (
              <>
                <span>Total: ${totalCost.toFixed(2)}</span>
                {selectedCount > 0 && (
                  <span style={{ 
                    color: '#007AFF',
                    fontWeight: '600',
                  }}>
                    • {selectedCount} selected
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ 
        flex: 1, 
        overflowY: 'auto',
        paddingBottom: '100px'
      }}>
        {loading ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '70vh',
            gap: '16px'
          }}>
            <IonSpinner name="crescent" color="primary" style={{ transform: 'scale(1.5)' }} />
            <IonText color="medium">
              <p style={{ fontSize: '16px' }}>Loading your wishlist...</p>
            </IonText>
          </div>
        ) : error ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '70vh',
            padding: '32px',
            gap: '16px'
          }}>
            <IonIcon 
              icon={warningOutline} 
              style={{ fontSize: '80px', color: '#ff3b30', marginBottom: '8px' }} 
            />
            <h2 style={{ fontSize: '24px', fontWeight: '600', margin: '0', color: '#1c1c1e' }}>
              Failed to Load Wishlist
            </h2>
            <p style={{ 
              fontSize: '16px', 
              color: '#86868b', 
              textAlign: 'center',
              maxWidth: '300px',
              lineHeight: '1.5'
            }}>
              {error}
            </p>
            <IonButton 
              onClick={() => {
                setError(null);
                fetchWishlist();
              }}
              style={{ marginTop: '16px' }}
            >
              Try Again
            </IonButton>
          </div>
        ) : allWishlistItems.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '70vh',
            padding: '32px',
            gap: '16px'
          }}>
            <IonIcon 
              icon={giftOutline} 
              style={{ fontSize: '80px', color: '#d1d1d6', marginBottom: '8px' }} 
            />
            <h2 style={{ fontSize: '24px', fontWeight: '600', margin: '0', color: '#1c1c1e' }}>
              No Wishlist Items Yet
            </h2>
            <p style={{ 
              fontSize: '16px', 
              color: '#86868b', 
              textAlign: 'center',
              maxWidth: '300px',
              lineHeight: '1.5'
            }}>
              Start adding items you love to your wishlist and they'll appear here!
            </p>
            <IonButton 
              onClick={onBack}
              fill="outline"
              style={{ marginTop: '16px' }}
            >
              Go Back
            </IonButton>
          </div>
        ) : (
          <>
            {/* Tab Bar - Apple Style */}
            <div style={{
              display: 'flex',
              gap: '4px',
              padding: '16px',
              paddingBottom: '8px',
            }}>
              <button
                onClick={() => {
                  setActiveMainTab('compare');
                  if (selectedItems.size === 0) {
                    setToastMessage('Select items by clicking on them');
                    setShowToast(true);
                  } else if (selectedItems.size === 1) {
                    const itemId = Array.from(selectedItems)[0];
                    const item = filteredItems.find(i => i.id === itemId);
                    if (item) {
                      handleAIComparison(item);
                    }
                  } else {
                    setToastMessage(`Comparing ${selectedItems.size} items...`);
                    setShowToast(true);
                    const itemId = Array.from(selectedItems)[0];
                    const item = filteredItems.find(i => i.id === itemId);
                    if (item) {
                      handleAIComparison(item);
                    }
                  }
                }}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: activeMainTab === 'compare' ? '#007AFF' : '#f2f2f7',
                  color: activeMainTab === 'compare' ? 'white' : '#000',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: '600',
                  fontSize: '15px',
                  cursor: 'pointer',
                }}
              >
                Compare
              </button>
              <button
                onClick={handlePurchasedMode}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: showPurchasedMode ? '#007AFF' : '#f2f2f7',
                  color: showPurchasedMode ? 'white' : '#000',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: '600',
                  fontSize: '15px',
                  cursor: 'pointer',
                }}
              >
                Purchased
              </button>
              <button
                onClick={() => {
                  setActiveMainTab('share');
                  handleShareList();
                }}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: activeMainTab === 'share' ? '#007AFF' : '#f2f2f7',
                  color: activeMainTab === 'share' ? 'white' : '#000',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: '600',
                  fontSize: '15px',
                  cursor: 'pointer',
                }}
              >
                Share
              </button>
              <button
                onClick={handleGiftsMode}
                style={{
                  flex: 1,
                  padding: '10px',
                  background: showGiftsMode ? '#007AFF' : '#f2f2f7',
                  color: showGiftsMode ? 'white' : '#000',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: '600',
                  fontSize: '15px',
                  cursor: 'pointer',
                }}
              >
                Gifts
              </button>
            </div>

            {/* Apple Pull-Down Button for Categories */}
            <div style={{ padding: '0 16px 16px', position: 'relative' }}>
              <button
                onClick={() => setShowCategoryMenu(!showCategoryMenu)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: '#f2f2f7',
                  border: 'none',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontWeight: '600',
                  fontSize: '15px',
                  cursor: 'pointer',
                }}
              >
                <span>
                  {CATEGORY_LABELS[selectedCategory]?.icon} {CATEGORY_LABELS[selectedCategory]?.label} ({filteredItems.length})
                </span>
                <span style={{ fontSize: '12px', color: '#86868b' }}>▼</span>
              </button>
              
              {showCategoryMenu && (
                <div style={{
                  position: 'absolute',
                  background: 'white',
                  borderRadius: '12px',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                  marginTop: '8px',
                  width: 'calc(100% - 32px)',
                  overflow: 'hidden',
                  zIndex: 1000,
                }}>
                  {Object.entries(CATEGORY_LABELS).map(([key, { icon, label }]) => (
                    <button
                      key={key}
                      onClick={() => {
                        setSelectedCategory(key);
                        setShowCategoryMenu(false);
                      }}
                      style={{
                        width: '100%',
                        padding: '14px 16px',
                        background: selectedCategory === key ? '#f2f2f7' : 'white',
                        border: 'none',
                        borderBottom: '1px solid #f2f2f7',
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontSize: '15px',
                      }}
                    >
                      {icon} {label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Wishlist Items Grid - 2 Column Portrait */}
            {filteredItems.length === 0 ? (
              <div className="ion-padding ion-text-center" style={{ marginTop: '50%' }}>
                {showPurchasedMode ? (
                  <>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>
                      🛍️
                    </div>
                    <h2 style={{ fontSize: '20px', fontWeight: '600', margin: '0 0 8px', color: '#1c1c1e' }}>
                      No Purchases Yet
                    </h2>
                    <p style={{ color: '#86868b', fontSize: '15px', margin: 0 }}>
                      Items you purchase will appear here
                    </p>
                  </>
                ) : (
                  <IonText color="medium">
                    <h2 style={{ fontWeight: '600', fontSize: '22px' }}>No items found</h2>
                    <p style={{ fontSize: '17px' }}>
                      {allWishlistItems.length === 0 
                        ? 'Your wishlist is empty. Start adding items!'
                        : 'Try adjusting your filters'}
                    </p>
                  </IonText>
                )}
              </div>
            ) : (
              <IonGrid style={{ padding: '16px' }}>
                <IonRow>
                  {filteredItems.map((item) => (
                    <IonCol size="6" key={item.id}>
                      <div style={{
                        background: 'white',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                      }}>
                        {/* Image with overlay buttons - Portrait Aspect Ratio - Clickable */}
                        <div 
                          onClick={() => toggleItemSelection(item.id)}
                          style={{ 
                            position: 'relative', 
                            aspectRatio: '3/4',
                            cursor: 'pointer',
                            border: selectedItems.has(item.id) 
                              ? '4px solid #007AFF' 
                              : '4px solid transparent',
                            borderRadius: '12px',
                            overflow: 'hidden',
                          }}
                        >
                          <img
                            src={item.image}
                            alt={item.name}
                            style={{ 
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              backgroundColor: 'rgba(120, 120, 128, 0.12)',
                            }}
                          />
                          
                          {/* Show checkmark when selected */}
                          {selectedItems.has(item.id) && (
                            <div style={{
                              position: 'absolute',
                              top: '8px',
                              left: '8px',
                              width: '28px',
                              height: '28px',
                              borderRadius: '50%',
                              background: '#007AFF',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'white',
                              fontWeight: 'bold',
                              fontSize: '18px',
                            }}>
                              ✓
                            </div>
                          )}
                          
                          {/* Top-right overlay buttons */}
                          <div style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            display: 'flex',
                            gap: '6px',
                          }}>
                            {/* Shop / View Button */}
                            {showPurchasedMode ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openProductLink(item.url);
                                }}
                                style={{
                                  width: '36px',
                                  height: '36px',
                                  borderRadius: '50%',
                                  background: 'rgba(255,255,255,0.95)',
                                  border: 'none',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                                  fontSize: '18px',
                                }}
                              >
                                👁️
                              </button>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePurchaseItem(item);
                                }}
                                style={{
                                  width: '36px',
                                  height: '36px',
                                  borderRadius: '50%',
                                  background: 'rgba(255,255,255,0.95)',
                                  border: 'none',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  cursor: 'pointer',
                                  boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                                  fontSize: '18px',
                                }}
                              >
                                🛒
                              </button>
                            )}
                            
                            {/* Trash Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteItem(item.id);
                              }}
                              style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '50%',
                                background: 'rgba(255,255,255,0.95)',
                                border: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                                fontSize: '18px',
                              }}
                            >
                              🗑️
                            </button>
                          </div>

                          {/* Bottom-right gift button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsBirthdayItem(item.id);
                              setShowGiftsMode(true);
                            }}
                            style={{
                              position: 'absolute',
                              bottom: '8px',
                              right: '8px',
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              background: 'rgba(255,255,255,0.95)',
                              border: 'none',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                              fontSize: '18px',
                            }}
                          >
                            🎁
                          </button>
                        </div>

                        
                        {/* Product Info - Enhanced for Purchased */}
                        <div style={{ padding: '12px' }}>
                          <h3 style={{
                            margin: '0 0 6px',
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#000',
                            lineHeight: '1.3',
                          }}>
                            {item.name.length > 50 ? `${item.name.substring(0, 50)}...` : item.name}
                          </h3>
                          
                          {showPurchasedMode && item.purchase_date && (
                            <p style={{
                              margin: '0 0 4px',
                              fontSize: '11px',
                              color: '#86868b',
                              fontStyle: 'italic',
                            }}>
                              Purchased {formatPurchaseDate(item.purchase_date)}
                            </p>
                          )}
                          
                          <p style={{
                            margin: '0 0 4px',
                            fontSize: '16px',
                            fontWeight: '700',
                            color: '#007AFF',
                          }}>
                            {item.price}
                          </p>
                          {item.retailer && (
                            <p style={{
                              margin: 0,
                              fontSize: '12px',
                              color: '#86868b',
                            }}>
                              from {item.retailer}
                            </p>
                          )}
                        </div>
                      </div>
                    </IonCol>
                  ))}
                </IonRow>
              </IonGrid>
            )}

            {/* Modals */}
            <PriceComparisonModal
              isOpen={showPriceComparison}
              onClose={() => setShowPriceComparison(false)}
              item={selectedItemForComparison}
            />

            <MoveToClosetModal
              isOpen={showMoveToCloset}
              onClose={() => setShowMoveToCloset(false)}
              item={selectedItemForMove}
              onSuccess={() => {
                fetchWishlist();
                setSelectedItemForMove(null);
              }}
            />

            <IonToast
              isOpen={showToast}
              onDidDismiss={() => setShowToast(false)}
              message={toastMessage}
              duration={2000}
              position="top"
            />

            {/* Loading Overlay for AI Comparison */}
            {comparingItem && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.5)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
              }}>
                <IonSpinner 
                  name="crescent" 
                  style={{ 
                    transform: 'scale(2)',
                    color: '#007AFF',
                    marginBottom: '20px',
                  }} 
                />
                <IonText style={{ 
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: '600',
                  textAlign: 'center',
                  padding: '0 20px',
                }}>
                  <p>🤖 AI is finding the best deals...</p>
                  <p style={{ fontSize: '14px', opacity: 0.8 }}>This may take a moment</p>
                </IonText>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Wishlist;

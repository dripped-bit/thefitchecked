import React, { useEffect, useState } from 'react';
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonImg,
  IonGrid,
  IonRow,
  IonCol,
  IonButton,
  IonIcon,
  IonText,
  IonSpinner,
  IonBadge,
  IonSelect,
  IonSelectOption,
  IonLabel,
  IonCheckbox,
  IonToast,
} from '@ionic/react';
import { trash, openOutline, sparkles, checkmarkCircle, giftOutline, pricetagsOutline, warningOutline } from 'ionicons/icons';
import { Browser } from '@capacitor/browser';
import { Share } from '@capacitor/share';
import { supabase } from '../services/supabaseClient';
import WishlistActionBar from '../components/wishlist/WishlistActionBar';
import PriceComparisonModal from '../components/wishlist/PriceComparisonModal';
import MoveToClosetModal from '../components/wishlist/MoveToClosetModal';
import AvailabilityBadge from '../components/wishlist/AvailabilityBadge';
import availabilityCheckerService from '../services/availabilityCheckerService';
import birthdayWishlistService from '../services/birthdayWishlistService';
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

  // New feature states
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showBirthdayMode, setShowBirthdayMode] = useState(false);
  const [showPriceComparison, setShowPriceComparison] = useState(false);
  const [selectedItemForComparison, setSelectedItemForComparison] = useState<any>(null);
  const [showMoveToCloset, setShowMoveToCloset] = useState(false);
  const [selectedItemForMove, setSelectedItemForMove] = useState<any>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [compareMode, setCompareMode] = useState(false);
  const [comparingItem, setComparingItem] = useState(false);

  useEffect(() => {
    fetchWishlist();
  }, []);

  useEffect(() => {
    filterItems();
  }, [selectedCategory, allWishlistItems, showBirthdayMode]);

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

  // Filter items based on category and birthday mode
  const filterItems = () => {
    let filtered = [...allWishlistItems];

    if (showBirthdayMode) {
      filtered = filtered.filter(item => item.is_birthday_item);
    }

    if (selectedCategory !== 'All Items') {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    setFilteredItems(filtered);
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

  // New feature handlers
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

  const handleComparePrice = () => {
    if (selectedItems.size === 0) {
      setToastMessage('Select items to compare prices');
      setShowToast(true);
      return;
    }
    
    const firstSelectedId = Array.from(selectedItems)[0];
    const item = allWishlistItems.find(i => i.id === firstSelectedId);
    
    if (item) {
      handleAIComparison(item);
    }
  };

  const handleAIComparison = async (item: WishlistItem) => {
    try {
      setComparingItem(true);
      setToastMessage('Finding best deals with AI...');
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
      
      setToastMessage('Found deals!');
      setShowToast(true);
    } catch (error: any) {
      console.error('❌ [WISHLIST] AI comparison failed:', error);
      setToastMessage('Failed to find deals');
      setShowToast(true);
      setComparingItem(false);
    }
  };

  const handleShareList = async () => {
    try {
      const itemsToShare = selectedItems.size > 0
        ? allWishlistItems.filter(i => selectedItems.has(i.id))
        : allWishlistItems;

      const shareText = itemsToShare
        .map(item => `${item.name} - ${item.price}\\n${item.url}`)
        .join('\\n\\n');

      await Share.share({
        title: 'My Wishlist',
        text: shareText,
        dialogTitle: 'Share Wishlist'
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleBirthdayMode = () => {
    setShowBirthdayMode(!showBirthdayMode);
    if (!showBirthdayMode) {
      // Filter to show only birthday items
      setSelectedCategory('All Items');
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

  console.log('🚀 [WISHLIST] Main render function executing');
  
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#f2f2f7',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {console.log('📄 [WISHLIST] Main div rendering')}
      
      {/* Header */}
      <div style={{
        position: 'sticky',
        top: '64px',
        zIndex: 10,
        background: '#fff',
        borderBottom: '1px solid rgba(0,0,0,0.1)',
        display: 'flex',
        alignItems: 'center',
        padding: '16px',
        minHeight: '60px'
      }}>
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            padding: '8px',
            marginRight: '12px'
          }}
        >
          ←
        </button>
        <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#000' }}>
          {showBirthdayMode ? 'Birthday Wishlist' : 'Wishlist'}
        </h1>
      </div>

      {/* Content */}
      <div style={{ 
        flex: 1, 
        overflowY: 'auto',
        padding: '16px',
        paddingTop: '80px',
        paddingBottom: '100px'
      }}>
        {console.log('🎨 [WISHLIST] Rendering - loading:', loading, 'error:', error, 'items:', allWishlistItems.length)}
        
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
            {console.log('✅ [WISHLIST] Rendering content section with', allWishlistItems.length, 'items')}
            {console.log('✅ [WISHLIST] filteredItems:', filteredItems.length)}
            
            {/* Action Bar */}
            <WishlistActionBar
              selectedItems={selectedItems}
              onComparePrice={handleComparePrice}
              onShareList={handleShareList}
              onBirthdayMode={handleBirthdayMode}
              allItems={allWishlistItems}
            />

        {/* Category Filter - Single Dropdown */}
        <div style={{ 
          backgroundColor: 'var(--ion-background-color)',
          padding: '16px',
          borderBottom: '0.5px solid rgba(60, 60, 67, 0.29)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}>
          <IonSelect
            value={selectedCategory}
            onIonChange={(e) => setSelectedCategory(e.detail.value)}
            interface="action-sheet"
            style={{
              width: '100%',
              '--padding-start': '16px',
              '--padding-end': '16px',
              '--background': 'rgba(120, 120, 128, 0.12)',
              '--border-radius': '10px',
              minHeight: '44px',
            }}
          >
            <IonSelectOption value="All Items">
              📋 All Items ({allWishlistItems.length} items)
            </IonSelectOption>
            {Object.entries(CATEGORY_LABELS)
              .filter(([key]) => key !== 'All Items')
              .map(([key, { icon, label }]) => (
                <IonSelectOption key={key} value={key}>
                  {icon} {label}
                </IonSelectOption>
              ))}
          </IonSelect>

          <IonText color="medium" style={{ fontSize: '13px', marginTop: '8px', display: 'block' }}>
            {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
          </IonText>
        </div>

        {/* Wishlist Items Grid */}
        {filteredItems.length === 0 ? (
          <div className="ion-padding ion-text-center" style={{ marginTop: '50%' }}>
            <IonText color="medium">
              <h2 style={{ fontWeight: '600', fontSize: '22px' }}>No items found</h2>
              <p style={{ fontSize: '17px' }}>
                {allWishlistItems.length === 0 
                  ? 'Your wishlist is empty. Start adding items!'
                  : 'Try adjusting your filters'}
              </p>
            </IonText>
          </div>
        ) : (
          <IonGrid style={{ padding: '16px' }}>
            <IonRow>
              {filteredItems.map((item) => (
                <IonCol size="12" sizeMd="6" sizeLg="4" key={item.id}>
                  <IonCard style={{ 
                    margin: 0,
                    borderRadius: '12px',
                    overflow: 'hidden',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  }}>
                    <div style={{ position: 'relative' }}>
                      <IonImg
                        src={item.image}
                        alt={item.name}
                        style={{ 
                          height: '250px', 
                          objectFit: 'cover',
                          backgroundColor: 'rgba(120, 120, 128, 0.12)',
                        }}
                      />
                      
                      {/* Selection Checkbox */}
                      <IonCheckbox
                        checked={selectedItems.has(item.id)}
                        onIonChange={() => toggleItemSelection(item.id)}
                        style={{
                          position: 'absolute',
                          top: '10px',
                          left: '10px',
                          '--size': '24px',
                          '--background': 'white',
                          '--border-radius': '6px',
                        }}
                      />

                      {/* AI Badge */}
                      {item.ai_generated && (
                        <IonBadge
                          color="secondary"
                          style={{
                            position: 'absolute',
                            top: '10px',
                            right: '10px',
                            padding: '6px 10px',
                            borderRadius: '8px',
                            fontWeight: '600',
                            fontSize: '12px',
                          }}
                        >
                          <IonIcon 
                            icon={sparkles} 
                            style={{ marginRight: '4px', fontSize: '14px', verticalAlign: 'middle' }} 
                          />
                          AI Design
                        </IonBadge>
                      )}

                      {/* Birthday Badge */}
                      {item.is_birthday_item && (
                        <IonBadge
                          color="secondary"
                          style={{
                            position: 'absolute',
                            top: item.ai_generated ? '48px' : '10px',
                            right: '10px',
                            padding: '6px 10px',
                            borderRadius: '8px',
                            fontWeight: '600',
                            fontSize: '12px',
                          }}
                        >
                          <IonIcon icon={giftOutline} style={{ marginRight: '4px', fontSize: '14px', verticalAlign: 'middle' }} />
                          Birthday
                        </IonBadge>
                      )}

                      {/* Purchased Badge */}
                      {item.is_purchased && (
                        <IonBadge
                          color="success"
                          style={{
                            position: 'absolute',
                            bottom: '10px',
                            left: '10px',
                            padding: '6px 10px',
                            borderRadius: '8px',
                            fontWeight: '600',
                            fontSize: '12px',
                          }}
                        >
                          <IonIcon icon={checkmarkCircle} style={{ marginRight: '4px', fontSize: '14px', verticalAlign: 'middle' }} />
                          Purchased
                        </IonBadge>
                      )}
                    </div>

                    <IonCardHeader>
                      <IonCardTitle style={{ 
                        fontSize: '16px', 
                        fontWeight: '600',
                        letterSpacing: '-0.32px',
                        lineHeight: '1.3',
                      }}>
                        {item.name.length > 60
                          ? `${item.name.substring(0, 60)}...`
                          : item.name}
                      </IonCardTitle>
                    </IonCardHeader>

                    <IonCardContent>
                      <IonText color="primary">
                        <strong style={{ fontSize: '18px', fontWeight: '600' }}>
                          {item.price}
                        </strong>
                      </IonText>
                      
                      {item.retailer && (
                        <IonText 
                          color="medium" 
                          style={{ 
                            display: 'block', 
                            fontSize: '13px', 
                            marginTop: '4px',
                          }}
                        >
                          from {item.retailer}
                        </IonText>
                      )}

                      {/* Category badges */}
                      {(item.category || item.subcategory) && (
                        <div style={{ marginTop: '8px', display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {item.category && (
                            <IonBadge 
                              color="light" 
                              style={{ 
                                fontSize: '11px',
                                padding: '4px 8px',
                                fontWeight: '500',
                              }}
                            >
                              {item.category}
                            </IonBadge>
                          )}
                          {item.subcategory && (
                            <IonBadge 
                              color="light" 
                              style={{ 
                                fontSize: '11px',
                                padding: '4px 8px',
                                fontWeight: '500',
                              }}
                            >
                              {item.subcategory}
                            </IonBadge>
                          )}
                        </div>
                      )}

                      {/* AI design prompt */}
                      {item.ai_generated && item.design_prompt && (
                        <IonText 
                          color="medium" 
                          style={{ 
                            display: 'block', 
                            fontSize: '12px', 
                            marginTop: '8px', 
                            fontStyle: 'italic',
                            lineHeight: '1.4',
                          }}
                        >
                          "{item.design_prompt.substring(0, 80)}{item.design_prompt.length > 80 ? '...' : ''}"
                        </IonText>
                      )}

                      {/* Availability Badge */}
                      {item.availability_status && (
                        <div style={{ marginTop: '8px' }}>
                          <AvailabilityBadge
                            status={item.availability_status}
                            onClick={() => handleCheckAvailability(item)}
                          />
                        </div>
                      )}

                      {/* Action Buttons - 3 Buttons, 20% Bigger */}
                      <div style={{ 
                        marginTop: '16px', 
                        display: 'flex', 
                        gap: '8px',
                        flexWrap: 'wrap',
                      }}>
                        <IonButton
                          expand="block"
                          onClick={() => openProductLink(item.url)}
                          style={{ 
                            flex: 1,
                            minWidth: '120px',
                            '--border-radius': '10px',
                            '--padding-top': '14px',
                            '--padding-bottom': '14px',
                            fontWeight: '600',
                            fontSize: '18px',
                          }}
                        >
                          <IonIcon icon={openOutline} slot="start" style={{ transform: 'scale(1.2)' }} />
                          Shop
                        </IonButton>

                        {!item.is_purchased && (
                          <IonButton
                            fill="outline"
                            size="small"
                            onClick={() => handleMarkPurchased(item)}
                            style={{
                              '--border-radius': '10px',
                              '--padding-top': '10px',
                              '--padding-bottom': '10px',
                              fontSize: '15px',
                            }}
                          >
                            <IonIcon icon={checkmarkCircle} slot="start" style={{ transform: 'scale(1.2)' }} />
                            Purchased
                          </IonButton>
                        )}

                        <IonButton
                          fill="outline"
                          color="danger"
                          size="small"
                          onClick={() => deleteItem(item.id)}
                          style={{
                            '--border-radius': '10px',
                            '--padding-top': '10px',
                            '--padding-bottom': '10px',
                            fontSize: '15px',
                          }}
                        >
                          <IonIcon icon={trash} style={{ transform: 'scale(1.2)' }} />
                        </IonButton>
                      </div>
                    </IonCardContent>
                  </IonCard>
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
          </>
        )}
      </div>
    </div>
  );
};

export default Wishlist;

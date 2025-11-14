import React, { useEffect, useState } from 'react';
import {
  IonContent,
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
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
} from '@ionic/react';
import { trash, openOutline, sparkles } from 'ionicons/icons';
import { Browser } from '@capacitor/browser';
import { supabase } from '../services/supabaseClient';

// Fashion categories with subcategories
const fashionCategories = {
  'All Items': ['All'],
  'Tops': [
    'All Tops',
    'T-Shirts & Tanks',
    'Blouses & Shirts',
    'Sweaters & Cardigans',
    'Hoodies & Sweatshirts',
    'Crop Tops',
    'Bodysuits',
  ],
  'Bottoms': [
    'All Bottoms',
    'Jeans & Denim',
    'Pants & Trousers',
    'Shorts',
    'Skirts',
    'Leggings & Tights',
  ],
  'Dresses & Jumpsuits': [
    'All Dresses',
    'Casual Dresses',
    'Formal Dresses',
    'Maxi Dresses',
    'Mini Dresses',
    'Jumpsuits',
    'Rompers',
  ],
  'Outerwear': [
    'All Outerwear',
    'Jackets',
    'Coats',
    'Blazers',
    'Vests',
    'Leather Jackets',
    'Trench Coats',
  ],
  'Shoes': [
    'All Shoes',
    'Sneakers',
    'Boots',
    'Heels',
    'Flats',
    'Sandals',
    'Loafers',
    'Slippers',
  ],
  'Bags': [
    'All Bags',
    'Handbags',
    'Crossbody Bags',
    'Backpacks',
    'Clutches',
    'Tote Bags',
    'Belt Bags',
    'Duffel Bags',
  ],
  'Accessories': [
    'All Accessories',
    'Necklaces',
    'Earrings',
    'Bracelets',
    'Rings',
    'Belts',
    'Scarves',
    'Hats & Caps',
    'Sunglasses',
    'Hair Accessories',
    'Watches',
  ],
  'Activewear': [
    'All Activewear',
    'Sports Bras',
    'Workout Leggings',
    'Athletic Shorts',
    'Performance Tops',
    'Athletic Sneakers',
    'Yoga Wear',
  ],
  'Swimwear': [
    'All Swimwear',
    'Bikinis',
    'One-Pieces',
    'Swim Trunks',
    'Cover-Ups',
    'Rash Guards',
  ],
  'Intimates & Sleepwear': [
    'All Intimates',
    'Bras',
    'Underwear',
    'Pajamas',
    'Loungewear',
    'Robes',
  ],
};

interface WishlistItem {
  id: string;
  user_id: string;
  product_name: string;
  product_image: string;
  product_price: string;
  product_link: string;
  source?: string;
  category?: string;
  subcategory?: string;
  ai_generated?: boolean;
  design_prompt?: string;
  ai_generated_image?: string;
  created_at: string;
}

const Wishlist: React.FC = () => {
  const [allWishlistItems, setAllWishlistItems] = useState<WishlistItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Category filter states
  const [selectedCategory, setSelectedCategory] = useState<string>('All Items');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('All');
  const [availableSubcategories, setAvailableSubcategories] = useState<string[]>(['All']);

  useEffect(() => {
    fetchWishlist();
  }, []);

  useEffect(() => {
    filterItems();
  }, [selectedCategory, selectedSubcategory, allWishlistItems]);

  const fetchWishlist = async () => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      
      if (!userData.user) {
        setLoading(false);
        return;
      }

      // Query the wishlist_items table (or wishlist table if that's what you're using)
      const { data, error } = await supabase
        .from('wishlist_items') // Change to 'wishlist' if that's your table name
        .select('*')
        .eq('user_id', userData.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setAllWishlistItems(data || []);
      setFilteredItems(data || []);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter items based on selected category and subcategory
  const filterItems = () => {
    let filtered = [...allWishlistItems];

    // Filter by category
    if (selectedCategory !== 'All Items') {
      filtered = filtered.filter(item => {
        // Show items that match the category OR items without a category (user can categorize later)
        return item.category === selectedCategory || !item.category;
      });
    }

    // Filter by subcategory
    if (selectedSubcategory !== 'All' && !selectedSubcategory.startsWith('All ')) {
      filtered = filtered.filter(item => {
        return item.subcategory === selectedSubcategory || !item.subcategory;
      });
    }

    setFilteredItems(filtered);
  };

  // Update subcategories when category changes
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    const subcats = fashionCategories[category as keyof typeof fashionCategories] || ['All'];
    setAvailableSubcategories(subcats);
    setSelectedSubcategory(subcats[0]);
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

  if (loading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Wishlist</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding ion-text-center">
          <IonSpinner name="crescent" style={{ marginTop: '50%' }} />
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Wishlist</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        {/* Category Filter Section - Apple Style */}
        <div style={{ 
          backgroundColor: 'var(--ion-background-color)',
          padding: '16px',
          borderBottom: '0.5px solid rgba(60, 60, 67, 0.29)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}>
          <IonText>
            <h3 style={{ 
              margin: '0 0 16px 0', 
              fontSize: '17px', 
              fontWeight: '600',
              letterSpacing: '-0.43px',
            }}>
              Filter by Category
            </h3>
          </IonText>

          {/* Main Category Picker */}
          <div style={{ marginBottom: '12px' }}>
            <IonLabel style={{ 
              fontSize: '13px', 
              color: 'var(--ion-color-medium)',
              display: 'block',
              marginBottom: '6px',
              fontWeight: '400',
            }}>
              Category
            </IonLabel>
            <IonSelect
              value={selectedCategory}
              onIonChange={(e) => handleCategoryChange(e.detail.value)}
              interface="action-sheet"
              style={{
                width: '100%',
                '--padding-start': '16px',
                '--padding-end': '16px',
                '--background': 'rgba(120, 120, 128, 0.12)',
                '--border-radius': '10px',
                '--placeholder-color': 'rgba(60, 60, 67, 0.6)',
                minHeight: '44px',
              }}
            >
              {Object.keys(fashionCategories).map((category) => (
                <IonSelectOption key={category} value={category}>
                  {category}
                </IonSelectOption>
              ))}
            </IonSelect>
          </div>

          {/* Subcategory Picker */}
          <div>
            <IonLabel style={{ 
              fontSize: '13px', 
              color: 'var(--ion-color-medium)',
              display: 'block',
              marginBottom: '6px',
              fontWeight: '400',
            }}>
              Subcategory
            </IonLabel>
            <IonSelect
              value={selectedSubcategory}
              onIonChange={(e) => setSelectedSubcategory(e.detail.value)}
              interface="action-sheet"
              style={{
                width: '100%',
                '--padding-start': '16px',
                '--padding-end': '16px',
                '--background': 'rgba(120, 120, 128, 0.12)',
                '--border-radius': '10px',
                '--placeholder-color': 'rgba(60, 60, 67, 0.6)',
                minHeight: '44px',
              }}
            >
              {availableSubcategories.map((subcategory) => (
                <IonSelectOption key={subcategory} value={subcategory}>
                  {subcategory}
                </IonSelectOption>
              ))}
            </IonSelect>
          </div>

          {/* Results count */}
          <IonText 
            color="medium" 
            style={{ 
              fontSize: '13px', 
              marginTop: '12px', 
              display: 'block',
              fontWeight: '400',
            }}
          >
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
                        src={item.product_image}
                        alt={item.product_name}
                        style={{ 
                          height: '250px', 
                          objectFit: 'cover',
                          backgroundColor: 'rgba(120, 120, 128, 0.12)',
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
                    </div>

                    <IonCardHeader>
                      <IonCardTitle style={{ 
                        fontSize: '16px', 
                        fontWeight: '600',
                        letterSpacing: '-0.32px',
                        lineHeight: '1.3',
                      }}>
                        {item.product_name.length > 60
                          ? `${item.product_name.substring(0, 60)}...`
                          : item.product_name}
                      </IonCardTitle>
                    </IonCardHeader>

                    <IonCardContent>
                      <IonText color="primary">
                        <strong style={{ fontSize: '18px', fontWeight: '600' }}>
                          {item.product_price}
                        </strong>
                      </IonText>
                      
                      {item.source && (
                        <IonText 
                          color="medium" 
                          style={{ 
                            display: 'block', 
                            fontSize: '13px', 
                            marginTop: '4px',
                          }}
                        >
                          from {item.source}
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

                      <div style={{ 
                        marginTop: '16px', 
                        display: 'flex', 
                        gap: '8px',
                      }}>
                        <IonButton
                          expand="block"
                          onClick={() => openProductLink(item.product_link)}
                          style={{ 
                            flex: 1,
                            '--border-radius': '10px',
                            '--padding-top': '12px',
                            '--padding-bottom': '12px',
                            fontWeight: '600',
                            fontSize: '15px',
                          }}
                        >
                          <IonIcon icon={openOutline} slot="start" />
                          Shop
                        </IonButton>
                        <IonButton
                          fill="outline"
                          color="danger"
                          onClick={() => deleteItem(item.id)}
                          style={{
                            '--border-radius': '10px',
                            '--padding-start': '16px',
                            '--padding-end': '16px',
                          }}
                        >
                          <IonIcon icon={trash} />
                        </IonButton>
                      </div>
                    </IonCardContent>
                  </IonCard>
                </IonCol>
              ))}
            </IonRow>
          </IonGrid>
        )}
      </IonContent>
    </IonPage>
  );
};

export default Wishlist;

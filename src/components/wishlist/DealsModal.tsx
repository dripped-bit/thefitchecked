import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';
import { IonButton, IonIcon, IonSpinner } from '@ionic/react';
import { close } from 'ionicons/icons';
import { Browser } from '@capacitor/browser';
import productLinkHandler from '../../services/productLinkHandler';
import haptics from '../../utils/haptics';

interface Deal {
  title: string;
  price: string;
  priceValue: number;
  retailer: string;
  url: string;
  image: string;
  rating?: number;
  reviews?: number;
}

interface DealsModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalItem: any;
  exactMatches: Deal[];
  similarItems: Deal[];
}

const DealsModal: React.FC<DealsModalProps> = ({
  isOpen,
  onClose,
  originalItem,
  exactMatches,
  similarItems
}) => {
  const [activeTab, setActiveTab] = useState<'exact' | 'similar'>('exact');
  const modalRef = useRef<HTMLDivElement>(null);

  console.log('🎁 [DEALS-MODAL] Render called - isOpen:', isOpen, 'exact:', exactMatches.length, 'similar:', similarItems.length);
  console.log('🎁 [DEALS-MODAL] OriginalItem:', originalItem?.name);

  useEffect(() => {
    if (isOpen && modalRef.current) {
      console.log('📐 [DEALS-MODAL] Modal mounted in DOM:', modalRef.current);
      console.log('📐 [DEALS-MODAL] Modal visibility:', window.getComputedStyle(modalRef.current).visibility);
      console.log('📐 [DEALS-MODAL] Modal display:', window.getComputedStyle(modalRef.current).display);
      console.log('📐 [DEALS-MODAL] Modal z-index:', window.getComputedStyle(modalRef.current).zIndex);
    }
  }, [isOpen]);

  if (!isOpen) {
    console.log('⏸️ [DEALS-MODAL] Not open, returning null');
    return null;
  }

  console.log('✅ [DEALS-MODAL] Modal IS OPEN! Rendering...');

  // Get original price for comparison
  const originalPrice = parseFloat(originalItem?.price?.replace('$', '') || '0');
  const minAcceptablePrice = originalPrice * 0.5; // At least 50% of original price (similar quality)
  const maxAcceptablePrice = originalPrice * 1.5; // Up to 150% (in case original was a deal)
  
  console.log(`💰 [DEALS-MODAL] Original price: $${originalPrice}, acceptable range: $${minAcceptablePrice}-$${maxAcceptablePrice}`);

  // Filter for similar quality items (within 50%-150% of original price)
  const qualityExact = exactMatches.filter(deal => 
    deal.priceValue >= minAcceptablePrice && deal.priceValue <= maxAcceptablePrice
  );
  
  const qualitySimilar = similarItems.filter(deal => 
    deal.priceValue >= minAcceptablePrice && deal.priceValue <= maxAcceptablePrice
  );
  
  // Sort by price (best deal first) and take top 4
  const sortedExact = [...qualityExact].sort((a, b) => a.priceValue - b.priceValue).slice(0, 4);
  const sortedSimilar = [...qualitySimilar].sort((a, b) => a.priceValue - b.priceValue).slice(0, 4);
  
  const deals = activeTab === 'exact' ? sortedExact : sortedSimilar;
  
  console.log(`🎯 [DEALS-MODAL] Filtered to ${qualityExact.length} exact, ${qualitySimilar.length} similar (similar quality)`);
  console.log(`🎯 [DEALS-MODAL] Showing top 4 ${activeTab} deals:`, deals.map(d => `${d.title.substring(0, 30)} - ${d.price}`));

  const openUrl = async (deal: Deal) => {
    try {
      console.log('🛍️ [DEALS-MODAL] Opening product link:', deal.title);
      
      // Use productLinkHandler service for smart link opening + tracking
      await productLinkHandler.openProductLink(
        deal.url,
        deal.retailer,
        {
          title: deal.title,
          price: deal.price,
          priceValue: deal.priceValue,
          retailer: deal.retailer,
          url: deal.url,
          image: deal.image,
          originalItem: originalItem, // Pass original for comparison
        }
      );
      
      console.log('✅ [DEALS-MODAL] Product link opened successfully');
      haptics.light();
    } catch (error) {
      console.error('❌ [DEALS-MODAL] Failed to open link:', error);
      // Fallback to direct Browser.open
      try {
        await Browser.open({ url: deal.url });
      } catch (fallbackError) {
        console.error('❌ [DEALS-MODAL] Fallback also failed:', fallbackError);
      }
    }
  };

  // Use React Portal to render at document.body level (escape IonContent overflow)
  const modalContent = (
    <div 
      ref={modalRef}
      onClick={(e) => {
        console.log('🔴 [DEALS-MODAL] Backdrop clicked, closing...');
        onClose();
      }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 999999,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
      }}
    >
      {/* Modal Content */}
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'white',
          borderRadius: '16px 16px 0 0',
          maxHeight: '90vh',
          height: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.3)',
        }}
      >
        {/* Header */}
        <div style={{
          background: '#007AFF',
          color: 'white',
          padding: '16px',
          borderRadius: '16px 16px 0 0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>
            🎁 Best Deals Found
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.3)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'white',
              fontSize: '20px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Original Item Info */}
        <div style={{ padding: '16px', borderBottom: '1px solid #e5e5e5' }}>
          <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: '600' }}>
            {originalItem?.name}
          </h3>
          <p style={{ margin: 0, color: '#86868b', fontSize: '14px' }}>
            Original: {originalItem?.price} from {originalItem?.retailer}
          </p>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          gap: '8px',
          padding: '12px 16px',
          borderBottom: '1px solid #e5e5e5',
        }}>
          <button
            onClick={() => setActiveTab('exact')}
            style={{
              flex: 1,
              padding: '10px',
              background: activeTab === 'exact' ? '#007AFF' : '#f5f5f7',
              color: activeTab === 'exact' ? 'white' : '#000',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            Same Item (Top 4)
          </button>
          <button
            onClick={() => setActiveTab('similar')}
            style={{
              flex: 1,
              padding: '10px',
              background: activeTab === 'similar' ? '#007AFF' : '#f5f5f7',
              color: activeTab === 'similar' ? 'white' : '#000',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            Similar Items (Top 4)
          </button>
        </div>

        {/* Deals List */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
        }}>
          {deals.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#86868b' }}>
              <p>No deals found</p>
            </div>
          ) : (
            deals.map((deal, index) => (
              <div
                key={index}
                style={{
                  background: index === 0 ? '#f0f9ff' : '#f9f9f9',
                  borderRadius: '12px',
                  padding: '12px',
                  marginBottom: '12px',
                  display: 'flex',
                  gap: '12px',
                  border: index === 0 ? '2px solid #007AFF' : 'none',
                  position: 'relative',
                }}
              >
              {index === 0 && (
                <div style={{
                  position: 'absolute',
                  top: '8px',
                  left: '8px',
                  background: '#34C759',
                  color: 'white',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '10px',
                  fontWeight: '700',
                  zIndex: 1,
                }}>
                  💰 BEST DEAL
                </div>
              )}
              <img
                src={deal.image}
                alt={deal.title}
                style={{
                  width: '80px',
                  height: '80px',
                  objectFit: 'cover',
                  borderRadius: '8px',
                }}
              />
              <div style={{ flex: 1 }}>
                <h4 style={{
                  margin: '0 0 4px',
                  fontSize: '14px',
                  fontWeight: '600',
                  lineHeight: '1.3',
                }}>
                  {deal.title.length > 50 ? `${deal.title.substring(0, 50)}...` : deal.title}
                </h4>
                <p style={{
                  margin: '0 0 4px',
                  fontSize: '20px',
                  fontWeight: '700',
                  color: index === 0 ? '#34C759' : '#007AFF',
                }}>
                  {deal.price}
                  {index === 0 && originalItem?.price && (
                    <span style={{
                      marginLeft: '8px',
                      fontSize: '12px',
                      color: '#34C759',
                      fontWeight: '600',
                    }}>
                      Save ${(parseFloat(originalItem.price.replace('$', '')) - deal.priceValue).toFixed(0)}!
                    </span>
                  )}
                </p>
                <p style={{
                  margin: '0 0 8px',
                  fontSize: '12px',
                  color: '#86868b',
                }}>
                  {deal.retailer}
                  {deal.rating && ` • ⭐ ${deal.rating}`}
                  {deal.reviews && ` (${deal.reviews})`}
                </p>
                <button
                  onClick={() => openUrl(deal)}
                  style={{
                    background: '#34C759',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  Shop Now →
                </button>
              </div>
            </div>
            ))
          )}
        </div>
      </div>

    </div>
  );

  // Render to document.body using Portal (escapes parent overflow/stacking context)
  return ReactDOM.createPortal(modalContent, document.body);
};

export default DealsModal;

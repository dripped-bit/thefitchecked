import React from 'react';
import ReactDOM from 'react-dom';
import haptics from '../../utils/haptics';

interface Deal {
  title: string;
  price: string;
  priceValue: number;
  retailer: string;
  url: string;
  image: string;
}

interface PurchaseDetectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Deal;
  originalItem: any;
  aiAnalysis: {
    likelyPurchased: boolean;
    confidence: string;
    reasoning: string;
    suggestedAction: string;
  };
  onMarkPurchased: () => void;
  onSaveToWishlist: () => void;
}

const PurchaseDetectionModal: React.FC<PurchaseDetectionModalProps> = ({
  isOpen,
  onClose,
  product,
  originalItem,
  aiAnalysis,
  onMarkPurchased,
  onSaveToWishlist
}) => {
  if (!isOpen) return null;

  console.log('🛍️ [PURCHASE-MODAL] Rendering with:', {
    product: product.title,
    confidence: aiAnalysis.confidence,
    suggestedAction: aiAnalysis.suggestedAction
  });

  const originalPrice = parseFloat(originalItem?.price?.replace(/[^0-9.]/g, '') || '0');
  const savings = originalPrice > 0 && product.priceValue < originalPrice
    ? originalPrice - product.priceValue
    : 0;

  const handleMarkPurchased = () => {
    console.log('✅ [PURCHASE-MODAL] User confirmed purchase');
    haptics.success();
    onMarkPurchased();
  };

  const handleSaveToWishlist = () => {
    console.log('💾 [PURCHASE-MODAL] User wants to save to wishlist');
    haptics.light();
    onSaveToWishlist();
  };

  const handleClose = () => {
    console.log('❌ [PURCHASE-MODAL] User dismissed modal');
    haptics.light();
    onClose();
  };

  const modalContent = (
    <div 
      onClick={handleClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000000,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
      }}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'white',
          borderRadius: '16px 16px 0 0',
          padding: '24px',
          maxHeight: '70vh',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '8px' }}>🛍️</div>
          <h2 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: '600', color: '#1c1c1e' }}>
            Shopping Session Complete
          </h2>
          <p style={{ margin: 0, fontSize: '14px', color: '#86868b' }}>
            Did you make a purchase?
          </p>
        </div>

        {/* Product Info */}
        <div style={{
          background: '#f5f5f7',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '16px'
        }}>
          <h3 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: '600', lineHeight: '1.3' }}>
            {product.title.length > 60 ? `${product.title.substring(0, 60)}...` : product.title}
          </h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ color: '#86868b', fontSize: '14px' }}>Price:</span>
            <span style={{ fontWeight: '700', color: '#007AFF', fontSize: '16px' }}>{product.price}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ color: '#86868b', fontSize: '14px' }}>Store:</span>
            <span style={{ fontWeight: '600', fontSize: '14px' }}>{product.retailer}</span>
          </div>
          {originalItem?.price && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#86868b', fontSize: '14px' }}>Original:</span>
              <span style={{ fontSize: '14px', textDecoration: 'line-through', color: '#86868b' }}>
                {originalItem.price}
              </span>
            </div>
          )}
          {savings > 0 && (
            <div style={{
              marginTop: '12px',
              padding: '10px',
              background: '#d4f4dd',
              borderRadius: '8px',
              textAlign: 'center',
              color: '#34C759',
              fontWeight: '700',
              fontSize: '15px'
            }}>
              💰 Save ${savings.toFixed(0)} from original!
            </div>
          )}
        </div>

        {/* AI Analysis */}
        {aiAnalysis && (
          <div style={{
            background: '#e8f4ff',
            borderRadius: '12px',
            padding: '14px',
            marginBottom: '24px'
          }}>
            <div style={{ 
              fontSize: '14px', 
              color: '#007AFF', 
              fontWeight: '600', 
              marginBottom: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span>💡</span>
              <span>AI Analysis ({aiAnalysis.confidence} confidence)</span>
            </div>
            <div style={{ fontSize: '13px', color: '#3c3c43', lineHeight: '1.4' }}>
              {aiAnalysis.reasoning}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button
            onClick={handleMarkPurchased}
            style={{
              width: '100%',
              padding: '16px',
              background: '#34C759',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 2px 8px rgba(52, 199, 89, 0.3)',
            }}
          >
            <span>✅</span>
            <span>Yes, I bought it!</span>
          </button>

          <button
            onClick={handleSaveToWishlist}
            style={{
              width: '100%',
              padding: '16px',
              background: '#007AFF',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 2px 8px rgba(0, 122, 255, 0.3)',
            }}
          >
            <span>💾</span>
            <span>No, save to wishlist</span>
          </button>

          <button
            onClick={handleClose}
            style={{
              width: '100%',
              padding: '14px',
              background: 'transparent',
              color: '#86868b',
              border: 'none',
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            ❌ Close
          </button>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

export default PurchaseDetectionModal;

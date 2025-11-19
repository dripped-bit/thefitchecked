import React, { useState } from 'react';
import { IonButton, IonIcon, IonSpinner } from '@ionic/react';
import { close } from 'ionicons/icons';
import { Browser } from '@capacitor/browser';

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

  if (!isOpen) return null;

  const deals = activeTab === 'exact' ? exactMatches : similarItems;

  const openUrl = async (url: string) => {
    if (url) {
      await Browser.open({ url });
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 99999,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-end',
    }}>
      {/* Modal Content */}
      <div style={{
        background: 'white',
        borderRadius: '16px 16px 0 0',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        animation: 'slideUp 0.3s ease-out',
      }}>
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
            Same Item ({exactMatches.length})
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
            Similar Items ({similarItems.length})
          </button>
        </div>

        {/* Deals List */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
        }}>
          {deals.map((deal, index) => (
            <div
              key={index}
              style={{
                background: '#f9f9f9',
                borderRadius: '12px',
                padding: '12px',
                marginBottom: '12px',
                display: 'flex',
                gap: '12px',
              }}
            >
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
                  {deal.title.length > 60 ? `${deal.title.substring(0, 60)}...` : deal.title}
                </h4>
                <p style={{
                  margin: '0 0 4px',
                  fontSize: '18px',
                  fontWeight: '700',
                  color: '#007AFF',
                }}>
                  {deal.price}
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
                  onClick={() => openUrl(deal.url)}
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
          ))}
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default DealsModal;

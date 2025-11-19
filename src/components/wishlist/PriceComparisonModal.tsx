import React, { useState, useEffect } from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonSpinner,
  IonText,
  IonBadge,
  IonCard,
  IonCardContent,
} from '@ionic/react';
import { close, checkmarkCircle, openOutline } from 'ionicons/icons';
import multiRetailerSearchService, { type RetailerPrice } from '../../services/multiRetailerSearchService';
import { Browser } from '@capacitor/browser';

interface PriceComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: any;
}

const PriceComparisonModal: React.FC<PriceComparisonModalProps> = ({
  isOpen,
  onClose,
  item,
}) => {
  const [loading, setLoading] = useState(false);
  const [retailers, setRetailers] = useState<RetailerPrice[]>([]);
  const [bestDealIndex, setBestDealIndex] = useState(-1);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'exact' | 'similar'>('exact');

  // Check if this is AI-powered results
  const hasAIResults = item?.aiResults;
  const originalItem = hasAIResults ? item.original : item;

  useEffect(() => {
    if (isOpen && item && !hasAIResults) {
      loadPriceComparison();
    }
  }, [isOpen, item]);

  const loadPriceComparison = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await multiRetailerSearchService.comparePrice(
        item.name,
        item.brand,
        item.url,
        parseFloat(item.price?.replace('$', '') || '0')
      );

      if (result.success) {
        setRetailers(result.retailers);
        setBestDealIndex(result.bestDealIndex);
      } else {
        setError(result.error || 'Could not find price comparisons');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const openRetailer = async (url: string) => {
    await Browser.open({ url });
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Price Comparison</IonTitle>
          <IonButton slot="end" fill="clear" onClick={onClose}>
            <IonIcon icon={close} />
          </IonButton>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <IonText>
          <h2 style={{ fontWeight: '600', marginTop: 0 }}>
            {originalItem?.name?.substring(0, 60)}
            {(originalItem?.name?.length || 0) > 60 ? '...' : ''}
          </h2>
          <p style={{ color: 'var(--ion-color-medium)', marginBottom: '20px' }}>
            Original: {originalItem?.price} from {originalItem?.retailer}
          </p>
        </IonText>

        {/* AI Results Tabs */}
        {hasAIResults && (
          <div style={{ 
            display: 'flex', 
            gap: '8px', 
            marginBottom: '16px',
            borderBottom: '1px solid rgba(0,0,0,0.1)',
            paddingBottom: '8px'
          }}>
            <button
              onClick={() => setActiveTab('exact')}
              style={{
                flex: 1,
                padding: '8px 16px',
                background: activeTab === 'exact' ? '#007AFF' : 'transparent',
                color: activeTab === 'exact' ? 'white' : '#007AFF',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Same Item ({item.aiResults.exactMatches.length})
            </button>
            <button
              onClick={() => setActiveTab('similar')}
              style={{
                flex: 1,
                padding: '8px 16px',
                background: activeTab === 'similar' ? '#007AFF' : 'transparent',
                color: activeTab === 'similar' ? 'white' : '#007AFF',
                border: 'none',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              Similar Items ({item.aiResults.similarItems.length})
            </button>
          </div>
        )}

        {loading && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <IonSpinner />
            <IonText color="medium">
              <p>Searching retailers...</p>
            </IonText>
          </div>
        )}

        {error && (
          <IonText color="danger">
            <p style={{ textAlign: 'center' }}>{error}</p>
          </IonText>
        )}

        {/* AI-Powered Results */}
        {hasAIResults && !loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {(activeTab === 'exact' ? item.aiResults.exactMatches : item.aiResults.similarItems).map((deal: any, index: number) => (
              <IonCard key={index} style={{ margin: 0 }}>
                <IonCardContent>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    {deal.image && (
                      <img 
                        src={deal.image} 
                        alt={deal.title}
                        style={{ 
                          width: '80px', 
                          height: '80px', 
                          objectFit: 'cover',
                          borderRadius: '8px'
                        }}
                      />
                    )}
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: '0 0 4px', fontWeight: '600', fontSize: '14px' }}>
                        {deal.title.substring(0, 60)}{deal.title.length > 60 ? '...' : ''}
                      </h3>
                      <IonText color="medium" style={{ fontSize: '12px' }}>
                        {deal.retailer}
                      </IonText>
                      <IonText color="primary">
                        <p style={{ margin: '8px 0 0', fontWeight: '700', fontSize: '18px' }}>
                          {deal.price}
                        </p>
                      </IonText>
                    </div>
                  </div>
                  <IonButton
                    expand="block"
                    size="small"
                    onClick={() => openRetailer(deal.url)}
                    style={{ '--border-radius': '8px', marginTop: '12px' }}
                  >
                    <IonIcon icon={openOutline} slot="start" />
                    Shop Now
                  </IonButton>
                </IonCardContent>
              </IonCard>
            ))}
            
            {(activeTab === 'exact' ? item.aiResults.exactMatches : item.aiResults.similarItems).length === 0 && (
              <IonText color="medium" style={{ textAlign: 'center', padding: '20px' }}>
                <p>No {activeTab === 'exact' ? 'exact matches' : 'similar items'} found</p>
              </IonText>
            )}
          </div>
        )}

        {/* Legacy Multi-Retailer Results */}
        {!hasAIResults && !loading && retailers.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {retailers.map((retailer, index) => (
              <IonCard
                key={index}
                style={{
                  margin: 0,
                  border: index === bestDealIndex ? '2px solid var(--ion-color-success)' : 'none',
                  background: index === bestDealIndex ? 'rgba(46, 213, 115, 0.05)' : undefined,
                }}
              >
                <IonCardContent>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <IonText>
                      <h3 style={{ margin: 0, fontWeight: '600' }}>
                        {retailer.retailer}
                        {index === bestDealIndex && (
                          <IonBadge color="success" style={{ marginLeft: '8px', fontSize: '11px' }}>
                            Best Deal
                          </IonBadge>
                        )}
                      </h3>
                    </IonText>
                    <IonIcon
                      icon={retailer.inStock ? checkmarkCircle : close}
                      color={retailer.inStock ? 'success' : 'danger'}
                      style={{ fontSize: '20px' }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                    <div>
                      <IonText color="medium" style={{ fontSize: '12px' }}>
                        Price
                      </IonText>
                      <IonText>
                        <p style={{ margin: 0, fontWeight: '600' }}>${retailer.price.toFixed(2)}</p>
                      </IonText>
                    </div>
                    <div>
                      <IonText color="medium" style={{ fontSize: '12px' }}>
                        Shipping
                      </IonText>
                      <IonText>
                        <p style={{ margin: 0, fontWeight: '600' }}>
                          {retailer.shipping === 0 ? 'Free' : `$${retailer.shipping.toFixed(2)}`}
                        </p>
                      </IonText>
                    </div>
                    <div>
                      <IonText color="medium" style={{ fontSize: '12px' }}>
                        Total
                      </IonText>
                      <IonText color="primary">
                        <p style={{ margin: 0, fontWeight: '700', fontSize: '16px' }}>
                          ${retailer.total.toFixed(2)}
                        </p>
                      </IonText>
                    </div>
                    {retailer.shippingTime && (
                      <div>
                        <IonText color="medium" style={{ fontSize: '12px' }}>
                          Delivery
                        </IonText>
                        <IonText>
                          <p style={{ margin: 0 }}>{retailer.shippingTime}</p>
                        </IonText>
                      </div>
                    )}
                  </div>

                  <IonButton
                    expand="block"
                    size="small"
                    onClick={() => openRetailer(retailer.url)}
                    style={{ '--border-radius': '8px' }}
                  >
                    <IonIcon icon={openOutline} slot="start" />
                    Shop at {retailer.retailer}
                  </IonButton>
                </IonCardContent>
              </IonCard>
            ))}
          </div>
        )}
      </IonContent>
    </IonModal>
  );
};

export default PriceComparisonModal;

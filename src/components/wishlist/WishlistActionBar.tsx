import React from 'react';
import { IonButton, IonIcon, IonText } from '@ionic/react';
import { cart, pricetagsOutline, shareSocial, giftOutline } from 'ionicons/icons';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Browser } from '@capacitor/browser';

interface WishlistActionBarProps {
  selectedItems: Set<string>;
  onComparePrice: () => void;
  onShareList: () => void;
  onBirthdayMode: () => void;
  allItems: any[];
}

const WishlistActionBar: React.FC<WishlistActionBarProps> = ({
  selectedItems,
  onComparePrice,
  onShareList,
  onBirthdayMode,
  allItems
}) => {
  const hasSelection = selectedItems.size > 0;

  const handleMoveToCart = async () => {
    if (!hasSelection) return;

    await Haptics.impact({ style: ImpactStyle.Medium });

    const selectedUrls = allItems
      .filter(item => selectedItems.has(item.id))
      .map(item => item.url);

    // Open all URLs
    for (const url of selectedUrls) {
      await Browser.open({ url });
      // Small delay between opens
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 999,
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
        padding: '12px 16px',
        display: 'flex',
        gap: '8px',
        flexWrap: 'nowrap',
      }}
    >
      <IonButton
        size="small"
        fill="solid"
        disabled={!hasSelection}
        onClick={handleMoveToCart}
        style={{
          '--background': 'var(--ion-color-primary)',
          '--border-radius': '10px',
          flex: '1',
          minWidth: '80px',
          height: '40px',
        }}
      >
        <IonIcon icon={cart} slot="start" />
        <span style={{ fontSize: '13px', fontWeight: '600' }}>
          Open ({selectedItems.size})
        </span>
      </IonButton>

      <IonButton
        size="small"
        fill="outline"
        disabled={!hasSelection}
        onClick={onComparePrice}
        style={{
          '--border-radius': '10px',
          flex: '1',
          minWidth: '80px',
          height: '40px',
        }}
      >
        <IonIcon icon={pricetagsOutline} slot="start" />
        <span style={{ fontSize: '13px', fontWeight: '600' }}>Compare</span>
      </IonButton>

      <IonButton
        size="small"
        fill="outline"
        onClick={onShareList}
        style={{
          '--border-radius': '10px',
          flex: '1',
          minWidth: '80px',
          height: '40px',
        }}
      >
        <IonIcon icon={shareSocial} slot="start" />
        <span style={{ fontSize: '13px', fontWeight: '600' }}>Share</span>
      </IonButton>

      <IonButton
        size="small"
        fill="outline"
        color="secondary"
        onClick={onBirthdayMode}
        style={{
          '--border-radius': '10px',
          flex: '1',
          minWidth: '80px',
          height: '40px',
        }}
      >
        <IonIcon icon={giftOutline} slot="start" />
        <span style={{ fontSize: '13px', fontWeight: '600' }}>Birthday</span>
      </IonButton>
    </div>
  );
};

export default WishlistActionBar;

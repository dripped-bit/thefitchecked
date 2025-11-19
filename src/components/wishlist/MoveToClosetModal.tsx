import React, { useState } from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonIcon,
  IonText,
  IonSelect,
  IonSelectOption,
  IonLabel,
  IonToast,
} from '@ionic/react';
import { close, checkmarkCircle } from 'ionicons/icons';
import { supabase } from '../../services/supabaseClient';
import { fashionCategories } from '../../config/fashionCategories';

interface MoveToClosetModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: any;
  onSuccess: () => void;
}

const MoveToClosetModal: React.FC<MoveToClosetModalProps> = ({
  isOpen,
  onClose,
  item,
  onSuccess,
}) => {
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const availableSubcategories = selectedCategory
    ? fashionCategories[selectedCategory as keyof typeof fashionCategories] || []
    : [];

  const handleMoveToCloset = async () => {
    if (!selectedCategory || !selectedSubcategory) {
      setToastMessage('Please select category and subcategory');
      setShowToast(true);
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Add to closet
      const { data: closetItem, error: closetError } = await supabase
        .from('clothing_items')
        .insert({
          user_id: user.id,
          image: item.image || item.image_url,
          category: selectedCategory,
          subcategory: selectedSubcategory,
          brand: item.brand || item.retailer,
          color: 'Unknown',
          favorite: false,
        })
        .select()
        .single();

      if (closetError) throw closetError;

      // Update wishlist item
      const { error: wishlistError } = await supabase
        .from('wishlist_items')
        .update({
          is_purchased: true,
          purchased_date: new Date().toISOString(),
          moved_to_closet: true,
          closet_item_id: closetItem.id,
        })
        .eq('id', item.id);

      if (wishlistError) throw wishlistError;

      setToastMessage('Successfully added to closet!');
      setShowToast(true);
      
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1000);
    } catch (error: any) {
      console.error('Error moving to closet:', error);
      setToastMessage(error.message);
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <IonModal isOpen={isOpen} onDidDismiss={onClose}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Move to Closet</IonTitle>
            <IonButton slot="end" fill="clear" onClick={onClose}>
              <IonIcon icon={close} />
            </IonButton>
          </IonToolbar>
        </IonHeader>

        <IonContent className="ion-padding">
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <IonIcon
              icon={checkmarkCircle}
              color="success"
              style={{ fontSize: '64px', marginBottom: '16px' }}
            />
            <IonText>
              <h2 style={{ fontWeight: '600', margin: 0 }}>Congrats on your purchase!</h2>
              <p style={{ color: 'var(--ion-color-medium)' }}>
                Add this item to your closet to track wears and build outfits
              </p>
            </IonText>
          </div>

          <img
            src={item?.image || item?.image_url}
            alt={item?.name}
            style={{
              width: '100%',
              height: '200px',
              objectFit: 'cover',
              borderRadius: '12px',
              marginBottom: '20px',
            }}
          />

          <IonText>
            <h3 style={{ fontWeight: '600', marginBottom: '8px' }}>
              {item?.name}
            </h3>
            <p style={{ color: 'var(--ion-color-medium)', marginBottom: '20px' }}>
              {item?.price} • {item?.retailer}
            </p>
          </IonText>

          <div style={{ marginBottom: '16px' }}>
            <IonLabel style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', display: 'block' }}>
              Category
            </IonLabel>
            <IonSelect
              value={selectedCategory}
              onIonChange={(e) => {
                setSelectedCategory(e.detail.value);
                setSelectedSubcategory('');
              }}
              interface="action-sheet"
              placeholder="Select category"
              style={{
                width: '100%',
                '--padding-start': '16px',
                '--padding-end': '16px',
                '--background': 'rgba(120, 120, 128, 0.12)',
                '--border-radius': '10px',
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

          {selectedCategory && (
            <div style={{ marginBottom: '24px' }}>
              <IonLabel style={{ fontSize: '14px', fontWeight: '500', marginBottom: '8px', display: 'block' }}>
                Subcategory
              </IonLabel>
              <IonSelect
                value={selectedSubcategory}
                onIonChange={(e) => setSelectedSubcategory(e.detail.value)}
                interface="action-sheet"
                placeholder="Select subcategory"
                style={{
                  width: '100%',
                  '--padding-start': '16px',
                  '--padding-end': '16px',
                  '--background': 'rgba(120, 120, 128, 0.12)',
                  '--border-radius': '10px',
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
          )}

          <IonButton
            expand="block"
            onClick={handleMoveToCloset}
            disabled={!selectedCategory || !selectedSubcategory || loading}
            style={{ '--border-radius': '10px', marginBottom: '12px' }}
          >
            {loading ? 'Adding...' : 'Add to Closet'}
          </IonButton>

          <IonButton
            expand="block"
            fill="outline"
            onClick={onClose}
            style={{ '--border-radius': '10px' }}
          >
            Keep in Wishlist
          </IonButton>
        </IonContent>
      </IonModal>

      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={2000}
        position="top"
      />
    </>
  );
};

export default MoveToClosetModal;

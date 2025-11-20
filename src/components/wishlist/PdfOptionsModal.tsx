/**
 * PDF Options Modal Component
 * Allows users to customize their wishlist PDF before generating/sharing
 */

import React, { useState } from 'react';
import {
  IonModal,
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonInput,
  IonTextarea,
  IonItem,
  IonLabel,
  IonToggle,
  IonSpinner
} from '@ionic/react';
import wishlistPdfService from '../../services/wishlistPdfService';
import styleQuizService from '../../services/styleQuizService';
import stylePreferencesService from '../../services/stylePreferencesService';

interface WishlistItem {
  id: string;
  name: string;
  brand?: string;
  price: string;
  image: string;
  url: string;
  retailer: string;
  notes?: string;
}

interface PdfOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: WishlistItem[];
  mode: 'share' | 'gifts';
}

const PdfOptionsModal: React.FC<PdfOptionsModalProps> = ({ isOpen, items, mode, onClose }) => {
  const [title, setTitle] = useState('');
  const [userName, setUserName] = useState('');
  const [personalMessage, setPersonalMessage] = useState('');
  const [includePrice, setIncludePrice] = useState(true);
  const [occasion, setOccasion] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (action: 'download' | 'share') => {
    if (items.length === 0) {
      setError('No items to include in PDF');
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      console.log('📄 [PDF-MODAL] Generating PDF...', action);

      // Get style data
      const [quizResults, stylePrefs] = await Promise.all([
        styleQuizService.getQuizResults(),
        stylePreferencesService.loadStyleProfile()
      ]);

      const options = {
        items,
        title: title || (mode === 'gifts' ? '🎁 Gift Ideas' : 'My Wishlist'),
        userName: userName || undefined,
        personalMessage: personalMessage || undefined,
        includePrice,
        occasion: mode === 'gifts' ? (occasion || undefined) : undefined,
        quizStyleType: quizResults?.styleType,
        stylePreferences: stylePrefs
      };

      const filename = `wishlist-${Date.now()}.pdf`;

      if (action === 'download') {
        await wishlistPdfService.downloadPDF(options, filename);
      } else {
        await wishlistPdfService.sharePDF(options, filename);
      }

      console.log('✅ [PDF-MODAL] PDF', action, 'complete');
      
      // Close modal on success
      onClose();
      
      // Reset form
      setTitle('');
      setUserName('');
      setPersonalMessage('');
      setOccasion('');
      setIncludePrice(true);
    } catch (err: any) {
      console.error('❌ [PDF-MODAL] Error:', err);
      setError(err.message || 'Failed to generate PDF');
    } finally {
      setGenerating(false);
    }
  };

  const handleClose = () => {
    if (!generating) {
      onClose();
      // Reset form
      setTitle('');
      setUserName('');
      setPersonalMessage('');
      setOccasion('');
      setError(null);
    }
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={handleClose}>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Customize Your PDF</IonTitle>
          <IonButtons slot="end">
            <IonButton onClick={handleClose} disabled={generating}>
              Close
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <h2 style={{ fontSize: 20, marginBottom: 20, color: '#FF69B4' }}>
            {mode === 'gifts' ? '🎁 Gift List PDF' : '📄 Wishlist PDF'}
          </h2>

          <p style={{ marginBottom: 20, color: '#666' }}>
            Create a beautiful PDF to {mode === 'gifts' ? 'share your gift ideas' : 'share your wishlist'}.
            All product links will be clickable!
          </p>

          {/* Title */}
          <IonItem style={{ marginBottom: 15 }}>
            <IonLabel position="stacked">Title</IonLabel>
            <IonInput
              value={title}
              onIonChange={e => setTitle(e.detail.value!)}
              placeholder={mode === 'gifts' ? 'Gift Ideas' : 'My Wishlist'}
            />
          </IonItem>

          {/* Your Name */}
          <IonItem style={{ marginBottom: 15 }}>
            <IonLabel position="stacked">Your Name (optional)</IonLabel>
            <IonInput
              value={userName}
              onIonChange={e => setUserName(e.detail.value!)}
              placeholder="e.g., Sarah"
            />
          </IonItem>

          {/* Occasion (for gifts mode) */}
          {mode === 'gifts' && (
            <IonItem style={{ marginBottom: 15 }}>
              <IonLabel position="stacked">Occasion (optional)</IonLabel>
              <IonInput
                value={occasion}
                onIonChange={e => setOccasion(e.detail.value!)}
                placeholder="Birthday, Holiday, Wedding, etc."
              />
            </IonItem>
          )}

          {/* Personal Message */}
          <IonItem style={{ marginBottom: 15 }}>
            <IonLabel position="stacked">Personal Message (optional)</IonLabel>
            <IonTextarea
              value={personalMessage}
              onIonChange={e => setPersonalMessage(e.detail.value!)}
              placeholder="Add a personal note at the top of your PDF..."
              rows={3}
            />
          </IonItem>

          {/* Include Prices Toggle */}
          <IonItem style={{ marginBottom: 20 }}>
            <IonLabel>Include Prices</IonLabel>
            <IonToggle
              checked={includePrice}
              onIonChange={e => setIncludePrice(e.detail.checked)}
              color="primary"
            />
          </IonItem>

          {/* Items Summary */}
          <div style={{
            padding: 15,
            background: '#FFF9F3',
            borderRadius: 8,
            marginBottom: 20,
            borderLeft: '4px solid #FF69B4'
          }}>
            <p style={{ margin: 0, fontSize: 14, color: '#333' }}>
              <strong>{items.length}</strong> {items.length === 1 ? 'item' : 'items'} will be included in your PDF
            </p>
            {includePrice && (
              <p style={{ margin: '8px 0 0 0', fontSize: 13, color: '#666' }}>
                Prices will be shown for all items
              </p>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              padding: 12,
              background: '#FFE5E5',
              border: '1px solid #FF6B6B',
              borderRadius: 8,
              marginBottom: 20,
              color: '#C92A2A'
            }}>
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button
              onClick={() => handleGenerate('download')}
              disabled={generating}
              style={{
                flex: 1,
                padding: '14px 20px',
                background: generating ? '#CCC' : '#007AFF',
                color: 'white',
                border: 'none',
                borderRadius: 10,
                fontSize: 16,
                fontWeight: '600',
                cursor: generating ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8
              }}
            >
              {generating ? <IonSpinner name="crescent" /> : '📥'}
              Download PDF
            </button>

            <button
              onClick={() => handleGenerate('share')}
              disabled={generating}
              style={{
                flex: 1,
                padding: '14px 20px',
                background: generating ? '#CCC' : '#FF69B4',
                color: 'white',
                border: 'none',
                borderRadius: 10,
                fontSize: 16,
                fontWeight: '600',
                cursor: generating ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8
              }}
            >
              {generating ? <IonSpinner name="crescent" /> : '📤'}
              Share PDF
            </button>
          </div>

          {/* Info Text */}
          <p style={{ marginTop: 20, fontSize: 13, color: '#999', textAlign: 'center' }}>
            Your PDF will include product images, clickable links, and your style profile
          </p>
        </div>
      </IonContent>
    </IonModal>
  );
};

export default PdfOptionsModal;

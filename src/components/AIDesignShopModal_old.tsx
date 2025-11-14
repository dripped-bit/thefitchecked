import React, { useState } from 'react';
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButton,
  IonTextarea,
  IonSpinner,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonGrid,
  IonRow,
  IonCol,
  IonImg,
  IonText,
  IonIcon,
  IonToast,
} from '@ionic/react';
import { close, heart, cartOutline } from 'ionicons/icons';
import { Browser } from '@capacitor/browser';
import { supabase } from '../services/supabaseClient';

interface ShoppingResult {
  title: string;
  link: string;
  price: string;
  thumbnail: string;
  source: string;
}

interface AIDesignShopModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AIDesignShopModal: React.FC<AIDesignShopModalProps> = ({ isOpen, onClose }) => {
  const [designPrompt, setDesignPrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<ShoppingResult[]>([]);
  const [showWishlistPrompt, setShowWishlistPrompt] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ShoppingResult | null>(null);
  const [currentStep, setCurrentStep] = useState<'design' | 'results' | 'wishlist'>('design');
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  // FAL AI Image Generation
  const generateDesign = async () => {
    if (!designPrompt.trim()) {
      setToastMessage('Please describe your garment design');
      setShowToast(true);
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('https://fal.run/fal-ai/bytedance/seedream/v4/text-to-image', {
        method: 'POST',
        headers: {
          'Authorization': `Key ${import.meta.env.VITE_FAL_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: `High-quality fashion product photography of ${designPrompt}, professional lighting, white background, studio quality, detailed texture`,
          image_size: 'square',
          num_inference_steps: 28,
          guidance_scale: 7.5,
        }),
      });

      const data = await response.json();
      
      if (data.images && data.images[0]) {
        setGeneratedImage(data.images[0].url);
        setCurrentStep('results');
      } else {
        throw new Error('No image generated');
      }
    } catch (error) {
      console.error('Generation error:', error);
      setToastMessage('Failed to generate design. Please try again.');
      setShowToast(true);
    } finally {
      setIsGenerating(false);
    }
  };

  // SerpAPI Shopping Search
  const searchForProduct = async () => {
    if (!generatedImage) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://serpapi.com/search.json?engine=google_shopping&q=${encodeURIComponent(designPrompt)}&api_key=${import.meta.env.VITE_SERPAPI_KEY}&num=6`
      );

      const data = await response.json();
      
      if (data.shopping_results) {
        const results: ShoppingResult[] = data.shopping_results.slice(0, 6).map((item: any) => ({
          title: item.title,
          link: item.link,
          price: item.price || 'Price not available',
          thumbnail: item.thumbnail,
          source: item.source,
        }));
        
        setSearchResults(results);
      }
    } catch (error) {
      console.error('Search error:', error);
      setToastMessage('Failed to find shopping results');
      setShowToast(true);
    } finally {
      setIsSearching(false);
    }
  };

  // Open link in in-app browser and track which product was viewed
  const openProductLink = async (product: ShoppingResult) => {
    try {
      // Save which product the user clicked on
      setSelectedProduct(product);
      
      // Open in-app browser
      await Browser.open({ url: product.link, presentationStyle: 'popover' });
      
      // Listen for browser close event
      Browser.addListener('browserFinished', () => {
        // Show wishlist prompt when browser closes
        setShowWishlistPrompt(true);
      });
      
    } catch (error) {
      console.error('Browser error:', error);
      setToastMessage('Failed to open link');
      setShowToast(true);
    }
  };

  // Add to wishlist in Supabase - uses the product the user clicked on
  const addToWishlist = async () => {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError || !userData.user) {
        setToastMessage('Please sign in to add to wishlist');
        setShowToast(true);
        return false;
      }

      // Use the product the user clicked on, or fall back to first result
      const productToSave = selectedProduct || searchResults[0];
      
      if (!productToSave) {
        setToastMessage('No product selected');
        setShowToast(true);
        return false;
      }

      const wishlistItem = {
        user_id: userData.user.id,
        name: productToSave.title,
        brand: productToSave.source,
        price: productToSave.price,
        currency: 'USD', // Default - could be parsed from price
        image: productToSave.thumbnail,
        url: productToSave.link,
        retailer: productToSave.source,
        notes: `AI Design: ${designPrompt}\n\nGenerated Image: ${generatedImage}`,
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('wishlist_items')
        .insert(wishlistItem);

      if (error) throw error;

      setToastMessage('Added to wishlist!');
      setShowToast(true);
      return true;
    } catch (error) {
      console.error('Wishlist error:', error);
      setToastMessage('Failed to add to wishlist');
      setShowToast(true);
      return false;
    }
  };

  // Handle modal close
  const handleClose = () => {
    if (generatedImage && currentStep === 'results') {
      setShowWishlistPrompt(true);
    } else {
      resetModal();
      onClose();
    }
  };

  const resetModal = () => {
    setDesignPrompt('');
    setGeneratedImage(null);
    setSearchResults([]);
    setSelectedProduct(null);
    setCurrentStep('design');
    setShowWishlistPrompt(false);
  };

  return (
    <>
      <IonModal isOpen={isOpen} onDidDismiss={handleClose}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>
              {currentStep === 'design' ? 'Design Your Item' : 'Shop Your Look'}
            </IonTitle>
            <IonButton slot="end" fill="clear" onClick={handleClose}>
              <IonIcon icon={close} />
            </IonButton>
          </IonToolbar>
        </IonHeader>

        <IonContent className="ion-padding">
          {/* Step 1: Design Prompt */}
          {currentStep === 'design' && (
            <div>
              <IonText>
                <h2>Describe Your Perfect Item</h2>
                <p>Describe one garment, accessory, or shoe in detail</p>
              </IonText>

              <IonTextarea
                value={designPrompt}
                onIonInput={(e) => setDesignPrompt(e.detail.value || '')}
                placeholder="E.g., A vintage brown leather crossbody bag with gold hardware and fringe details"
                rows={6}
                style={{
                  border: '1px solid var(--ion-color-medium)',
                  borderRadius: '8px',
                  padding: '12px',
                  marginTop: '16px',
                }}
              />

              <IonButton
                expand="block"
                onClick={generateDesign}
                disabled={isGenerating || !designPrompt.trim()}
                style={{ marginTop: '24px' }}
              >
                {isGenerating ? (
                  <>
                    <IonSpinner name="crescent" style={{ marginRight: '8px' }} />
                    Generating...
                  </>
                ) : (
                  'Generate Design'
                )}
              </IonButton>
            </div>
          )}

          {/* Step 2: Generated Image & Shopping Results */}
          {currentStep === 'results' && (
            <div>
              {generatedImage && (
                <IonCard>
                  <IonImg src={generatedImage} alt="Generated design" />
                  <IonCardContent>
                    <IonText>
                      <h3>Your AI-Generated Design</h3>
                      <p>{designPrompt}</p>
                    </IonText>
                    
                    <IonButton
                      expand="block"
                      onClick={searchForProduct}
                      disabled={isSearching}
                      style={{ marginTop: '16px' }}
                    >
                      {isSearching ? (
                        <>
                          <IonSpinner name="crescent" style={{ marginRight: '8px' }} />
                          Finding products...
                        </>
                      ) : (
                        <>
                          <IonIcon icon={cartOutline} slot="start" />
                          Shop This Look
                        </>
                      )}
                    </IonButton>
                  </IonCardContent>
                </IonCard>
              )}

              {/* Shopping Results Grid */}
              {searchResults.length > 0 && (
                <>
                  <IonText style={{ marginTop: '24px' }}>
                    <h3>Similar Products Available</h3>
                  </IonText>

                  <IonGrid>
                    <IonRow>
                      {searchResults.map((product, index) => (
                        <IonCol size="6" key={index}>
                          <IonCard>
                            <IonImg
                              src={product.thumbnail}
                              alt={product.title}
                              style={{ height: '150px', objectFit: 'cover' }}
                            />
                            <IonCardHeader>
                              <IonCardTitle style={{ fontSize: '14px' }}>
                                {product.title.length > 50
                                  ? `${product.title.substring(0, 50)}...`
                                  : product.title}
                              </IonCardTitle>
                            </IonCardHeader>
                            <IonCardContent>
                              <IonText color="primary">
                                <strong>{product.price}</strong>
                              </IonText>
                              <IonText color="medium" style={{ display: 'block', fontSize: '12px' }}>
                                {product.source}
                              </IonText>

                              <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                                <IonButton
                                  size="small"
                                  expand="block"
                                  onClick={() => openProductLink(product)}
                                >
                                  Shop Now
                                </IonButton>
                                <IonButton
                                  size="small"
                                  fill="outline"
                                  onClick={() => {
                                    setSelectedProduct(product);
                                    setShowWishlistPrompt(true);
                                  }}
                                >
                                  <IonIcon icon={heart} />
                                </IonButton>
                              </div>
                            </IonCardContent>
                          </IonCard>
                        </IonCol>
                      ))}
                    </IonRow>
                  </IonGrid>
                </>
              )}

              <IonButton
                expand="block"
                fill="outline"
                onClick={() => {
                  setCurrentStep('design');
                  setGeneratedImage(null);
                  setSearchResults([]);
                  setDesignPrompt('');
                }}
                style={{ marginTop: '24px' }}
              >
                Create New Design
              </IonButton>
            </div>
          )}
        </IonContent>
      </IonModal>

      {/* Wishlist Prompt Modal - Shows when browser closes */}
      <IonModal isOpen={showWishlistPrompt} onDidDismiss={() => setShowWishlistPrompt(false)}>
        <IonContent className="ion-padding ion-text-center">
          <div style={{ marginTop: '40px' }}>
            <IonIcon
              icon={heart}
              style={{ fontSize: '64px', color: 'var(--ion-color-primary)' }}
            />
            <h2>Save to Wishlist?</h2>
            <p>Add this item to your StyleHub wishlist</p>

            {/* Show the actual product image they clicked on */}
            {selectedProduct && (
              <>
                <IonImg
                  src={selectedProduct.thumbnail}
                  style={{
                    width: '200px',
                    height: '200px',
                    margin: '20px auto',
                    borderRadius: '8px',
                    objectFit: 'cover',
                  }}
                />
                
                <div style={{ textAlign: 'left', padding: '0 20px', marginBottom: '20px' }}>
                  <IonText color="medium">
                    <p><strong>Product:</strong> {selectedProduct.title.substring(0, 80)}...</p>
                    <p><strong>Price:</strong> {selectedProduct.price}</p>
                    <p><strong>From:</strong> {selectedProduct.source}</p>
                    <p style={{ fontSize: '12px', marginTop: '8px' }}>
                      <em>Based on your AI design: "{designPrompt.substring(0, 60)}..."</em>
                    </p>
                  </IonText>
                </div>
              </>
            )}

            {/* Fallback if no product selected but have search results */}
            {!selectedProduct && searchResults.length > 0 && (
              <>
                <IonImg
                  src={searchResults[0].thumbnail}
                  style={{
                    width: '200px',
                    height: '200px',
                    margin: '20px auto',
                    borderRadius: '8px',
                    objectFit: 'cover',
                  }}
                />
                
                <div style={{ textAlign: 'left', padding: '0 20px', marginBottom: '20px' }}>
                  <IonText color="medium">
                    <p><strong>Product:</strong> {searchResults[0].title.substring(0, 80)}...</p>
                    <p><strong>Price:</strong> {searchResults[0].price}</p>
                    <p><strong>From:</strong> {searchResults[0].source}</p>
                  </IonText>
                </div>
              </>
            )}

            <IonButton
              expand="block"
              onClick={async () => {
                const success = await addToWishlist();
                if (success) {
                  setShowWishlistPrompt(false);
                  resetModal();
                  onClose();
                }
              }}
            >
              Add to Wishlist
            </IonButton>

            <IonButton
              expand="block"
              fill="outline"
              onClick={() => {
                setShowWishlistPrompt(false);
                resetModal();
                onClose();
              }}
            >
              Skip
            </IonButton>
          </div>
        </IonContent>
      </IonModal>

      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={2000}
        position="bottom"
      />
    </>
  );
};

export default AIDesignShopModal;

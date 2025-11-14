import React, { useState } from 'react';
import { Browser } from '@capacitor/browser';
import { supabase } from '../services/supabaseClient';
import CustomModal from './CustomModal';
import serpApiService, { ProductSearchResult } from '../services/serpApiService';

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
      setTimeout(() => setShowToast(false), 3000);
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
          prompt: `Full-body product photography of ${designPrompt}, complete garment visible from top to bottom, professional lighting, white background, studio quality, detailed texture, centered composition, no cropping`,
          image_size: 'portrait_4_3',
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
      setTimeout(() => setShowToast(false), 3000);
    } finally {
      setIsGenerating(false);
    }
  };

  // Shopping Search using Service Layer
  const searchForProduct = async () => {
    if (!generatedImage) return;

    setIsSearching(true);
    try {
      console.log('🔍 Starting product search for:', designPrompt);

      // Search using service layer (goes through /api/serp proxy)
      const productResults = await serpApiService.searchProducts(
        designPrompt,
        {
          maxResults: 12 // Get more results
        }
      );

      console.log('✅ Found products:', productResults.length);

      if (productResults.length === 0) {
        // Fallback: Try broader search with just the category
        console.log('🔄 No results, trying broader search...');
        const categorySearch = designPrompt.split(' ')[0]; // First word (e.g., "jacket")
        const fallbackResults = await serpApiService.searchProducts(categorySearch, {
          maxResults: 12
        });
        
        // Map ProductSearchResult to ShoppingResult
        const mappedResults: ShoppingResult[] = fallbackResults.slice(0, 6).map((item: ProductSearchResult) => ({
          title: item.title,
          link: item.url,
          price: item.price,
          thumbnail: item.imageUrl,
          source: item.store,
        }));
        
        setSearchResults(mappedResults);
      } else {
        // Map ProductSearchResult to ShoppingResult
        const mappedResults: ShoppingResult[] = productResults.slice(0, 6).map((item: ProductSearchResult) => ({
          title: item.title,
          link: item.url,
          price: item.price,
          thumbnail: item.imageUrl,
          source: item.store,
        }));
        
        setSearchResults(mappedResults);
      }

    } catch (error) {
      console.error('❌ Product search error:', error);
      setToastMessage('Failed to find shopping results. Please try again.');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } finally {
      setIsSearching(false);
    }
  };

  // Open link in in-app browser
  const openProductLink = async (product: ShoppingResult) => {
    try {
      setSelectedProduct(product);
      await Browser.open({ url: product.link, presentationStyle: 'popover' });
      
      Browser.addListener('browserFinished', () => {
        setShowWishlistPrompt(true);
      });
    } catch (error) {
      console.error('Browser error:', error);
      setToastMessage('Failed to open link');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  // Add to wishlist
  const addToWishlist = async () => {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError || !userData.user) {
        setToastMessage('Please sign in to add to wishlist');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
        return false;
      }

      const productToSave = selectedProduct || searchResults[0];
      
      if (!productToSave) {
        setToastMessage('No product selected');
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
        return false;
      }

      const wishlistItem = {
        user_id: userData.user.id,
        name: productToSave.title,
        brand: productToSave.source,
        price: productToSave.price,
        currency: 'USD',
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
      setTimeout(() => setShowToast(false), 3000);
      return true;
    } catch (error) {
      console.error('Wishlist error:', error);
      setToastMessage('Failed to add to wishlist');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return false;
    }
  };

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
      <CustomModal isOpen={isOpen} onClose={handleClose}>
        <div className="modal-header">
          <h2>{currentStep === 'design' ? 'Design Your Item' : 'Shop Your Look'}</h2>
          <button className="modal-close" onClick={handleClose}>×</button>
        </div>

        <div className="modal-body">
          {/* Step 1: Design Prompt */}
          {currentStep === 'design' && (
            <div className="design-step">
              <h3>Describe Your Perfect Item</h3>
              <p>Describe one garment, accessory, or shoe in detail</p>

              <textarea
                value={designPrompt}
                onChange={(e) => setDesignPrompt(e.target.value)}
                placeholder="E.g., A vintage brown leather crossbody bag with gold hardware and fringe details"
                rows={6}
                className="design-textarea"
              />

              <button
                onClick={generateDesign}
                disabled={isGenerating || !designPrompt.trim()}
                className="primary-button"
              >
                {isGenerating && <div className="loading-spinner" />}
                {isGenerating ? 'Generating...' : 'Generate Design'}
              </button>
            </div>
          )}

          {/* Step 2: Generated Image & Shopping Results */}
          {currentStep === 'results' && (
            <div className="results-step">
              {generatedImage && (
                <div className="generated-image-card">
                  <img src={generatedImage} alt="Generated design" />
                  <div>
                    <h3>Your AI-Generated Design</h3>
                    <p>{designPrompt}</p>
                  </div>
                  
                  <button
                    onClick={searchForProduct}
                    disabled={isSearching}
                    className="primary-button"
                  >
                    {isSearching && <div className="loading-spinner" />}
                    {isSearching ? 'Finding products...' : '🛍️ Shop This Look'}
                  </button>
                </div>
              )}

              {/* Shopping Results Grid */}
              {searchResults.length > 0 && (
                <>
                  <h3 style={{ marginTop: '24px' }}>Similar Products Available</h3>

                  <div className="product-grid">
                    {searchResults.map((product, index) => (
                      <div key={index} className="product-card">
                        <img
                          src={product.thumbnail}
                          alt={product.title}
                        />
                        <h4>
                          {product.title.length > 50
                            ? `${product.title.substring(0, 50)}...`
                            : product.title}
                        </h4>
                        <p className="price">{product.price}</p>
                        <p className="source">{product.source}</p>

                        <div className="product-actions">
                          <button onClick={() => openProductLink(product)}>
                            Shop Now
                          </button>
                          <button
                            onClick={() => {
                              setSelectedProduct(product);
                              setShowWishlistPrompt(true);
                            }}
                          >
                            ♥
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <button
                onClick={() => {
                  setCurrentStep('design');
                  setGeneratedImage(null);
                  setSearchResults([]);
                  setDesignPrompt('');
                }}
                style={{ 
                  marginTop: '24px', 
                  background: '#f0f0f0', 
                  color: '#333' 
                }}
                className="primary-button"
              >
                Create New Design
              </button>
            </div>
          )}
        </div>
      </CustomModal>

      {/* Wishlist Prompt Modal */}
      <CustomModal isOpen={showWishlistPrompt} onClose={() => setShowWishlistPrompt(false)}>
        <div className="modal-body" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: '64px', marginBottom: '16px' }}>❤️</div>
          <h2>Save to Wishlist?</h2>
          <p>Add this item to your StyleHub wishlist</p>

          {selectedProduct && (
            <>
              <img
                src={selectedProduct.thumbnail}
                style={{
                  width: '200px',
                  height: '200px',
                  margin: '20px auto',
                  borderRadius: '8px',
                  objectFit: 'cover',
                  display: 'block'
                }}
                alt={selectedProduct.title}
              />
              
              <div style={{ textAlign: 'left', padding: '0 20px', marginBottom: '20px', color: '#666' }}>
                <p><strong>Product:</strong> {selectedProduct.title.substring(0, 80)}...</p>
                <p><strong>Price:</strong> {selectedProduct.price}</p>
                <p><strong>From:</strong> {selectedProduct.source}</p>
                <p style={{ fontSize: '12px', marginTop: '8px', fontStyle: 'italic' }}>
                  Based on your AI design: "{designPrompt.substring(0, 60)}..."
                </p>
              </div>
            </>
          )}

          <button
            onClick={async () => {
              const success = await addToWishlist();
              if (success) {
                setShowWishlistPrompt(false);
                resetModal();
                onClose();
              }
            }}
            className="primary-button"
          >
            Add to Wishlist
          </button>

          <button
            onClick={() => {
              setShowWishlistPrompt(false);
              resetModal();
              onClose();
            }}
            style={{ 
              marginTop: '12px', 
              background: '#f0f0f0', 
              color: '#666' 
            }}
            className="primary-button"
          >
            Skip
          </button>
        </div>
      </CustomModal>

      {/* Toast Notification */}
      {showToast && (
        <div className="toast">{toastMessage}</div>
      )}
    </>
  );
};

export default AIDesignShopModal;

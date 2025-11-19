// Safari compatibility - use chrome API if browser is not available
if (typeof browser === 'undefined') {
  var browser = chrome;
}

// popup.js - Main extension logic

// Your Supabase configuration
const SUPABASE_URL = https://thefitchecked.com;
const SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNjeXByc3Rwd3hqeHZuc3pvcXV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk2OTM1ODAsImV4cCI6MjA3NTI2OTU4MH0.G5SwrJGpPkbKa8owsKZ23w5sc4vVVCOQ0Dumy8jkDko; // Replace with your full key

let productData = null;

// Initialize when popup opens
document.addEventListener('DOMContentLoaded', async () => {
  alert('Extension popup opened!');
  console.log('Extension popup opened');
  
  try {
    // Check if user is authenticated
    const isAuthenticated = await checkAuthentication();
    alert('Is authenticated: ' + isAuthenticated);
    console.log('Is authenticated:', isAuthenticated);
    
    if (!isAuthenticated) {
      showAuthPrompt();
      return;
    }
    
    // Extract product from current page
    await extractAndDisplayProduct();
    
  } catch (error) {
    alert('Error: ' + error.message);
    console.error('Initialization error:', error);
    showError('Failed to load extension: ' + error.message);
  }
});

// Check if user has valid session
async function checkAuthentication() {
  try {
    const session = await browser.storage.local.get('supabase_session');
    console.log('Session from storage:', session);
    
    if (session && session.supabase_session) {
      const sessionData = JSON.parse(session.supabase_session);
      // Check if session is still valid (not expired)
      if (sessionData.expires_at && sessionData.expires_at > Date.now() / 1000) {
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error('Auth check error:', error);
    return false;
  }
}

// Show authentication prompt
function showAuthPrompt() {
  console.log('Showing auth prompt');
  document.getElementById('loading').style.display = 'none';
  document.getElementById('auth-prompt').style.display = 'block';
  
  document.getElementById('open-app-btn').addEventListener('click', () => {
    // Deep link to open TheFitChecked app
    window.location.href = 'thefitchecked://auth';
  });
}

// Extract product information from current page
async function extractAndDisplayProduct() {
  console.log('Starting product extraction');
  
  try {
    // Get active tab
    const tabs = await browser.tabs.query({ active: true, currentWindow: true });
    const activeTab = tabs[0];
    console.log('Active tab:', activeTab);
    
    // Send message to content script to extract product info
    const response = await browser.tabs.sendMessage(activeTab.id, {
      action: 'extractProduct'
    });
    
    console.log('Product data received:', response);
    productData = response;
    
    // Hide loading, show form
    document.getElementById('loading').style.display = 'none';
    document.getElementById('product-form').style.display = 'block';
    
    // Display product preview
    displayProductPreview(productData);
    
    // Setup event listeners
    setupEventListeners();
    
  } catch (error) {
    console.error('Product extraction error:', error);
    document.getElementById('loading').style.display = 'none';
    document.getElementById('product-form').style.display = 'block';
    
    // Allow manual entry
    showManualEntryForm();
  }
}

// Display product preview
function displayProductPreview(product) {
  console.log('Displaying product preview:', product);
  const preview = document.getElementById('product-preview');
  
  if (product.image) {
    document.getElementById('product-image').src = product.image;
    preview.classList.add('active');
  }
  
  if (product.brand) {
    document.getElementById('product-brand').textContent = product.brand;
  }
  
  if (product.title) {
    document.getElementById('product-title').textContent = product.title;
  }
  
  if (product.price) {
    document.getElementById('product-price').textContent = product.price;
  }
}

// Setup button event listeners
function setupEventListeners() {
  console.log('Setting up event listeners');
  document.getElementById('save-btn').addEventListener('click', saveToWishlist);
  
  // Optional: manual edit button
  const editBtn = document.getElementById('manual-edit-btn');
  if (editBtn) {
    editBtn.style.display = 'block';
    editBtn.addEventListener('click', showManualEditForm);
  }
}

// Save product to wishlist
async function saveToWishlist() {
  const saveBtn = document.getElementById('save-btn');
  const statusMessage = document.getElementById('status-message');
  
  console.log('Attempting to save to wishlist');
  
  try {
    // Disable button
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';
    
    // Get user notes
    const notes = document.getElementById('notes').value;
    
    // Get session
    const session = await browser.storage.local.get('supabase_session');
    const sessionData = JSON.parse(session.supabase_session);
    
    console.log('Session data:', sessionData);
    
    // Extract retailer from URL
    const retailer = extractRetailer(productData.url);
    
    // Prepare wishlist item
    const wishlistItem = {
      user_id: sessionData.user.id,
      name: productData.title || 'Untitled Item',
      brand: productData.brand || '',
      price: productData.price || '',
      currency: 'USD',
      image: productData.image || '',
      url: productData.url,
      retailer: retailer,
      notes: notes,
      ai_generated: false
    };
    
    console.log('Saving wishlist item:', wishlistItem);
    
    // Save to Supabase
    const response = await fetch(`${SUPABASE_URL}/rest/v1/wishlist_items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${sessionData.access_token}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(wishlistItem)
    });
    
    console.log('Supabase response:', response);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Supabase error:', errorData);
      throw new Error('Failed to save to wishlist');
    }
    
    // Show success
    statusMessage.textContent = '✓ Saved to your wishlist!';
    statusMessage.className = 'status-message success';
    saveBtn.textContent = '✓ Saved!';
    
    // Close popup after 1.5 seconds
    setTimeout(() => {
      window.close();
    }, 1500);
    
  } catch (error) {
    console.error('Save error:', error);
    statusMessage.textContent = '✗ Failed to save. Please try again.';
    statusMessage.className = 'status-message error';
    saveBtn.disabled = false;
    saveBtn.textContent = '💝 Add to Wishlist';
  }
}

// Extract retailer name from URL
function extractRetailer(url) {
  try {
    const hostname = new URL(url).hostname;
    // Remove www. and .com/.co.uk etc
    let retailer = hostname.replace('www.', '').split('.')[0];
    // Capitalize first letter
    return retailer.charAt(0).toUpperCase() + retailer.slice(1);
  } catch {
    return 'Unknown';
  }
}

// Show manual entry form (if auto-detection fails)
function showManualEntryForm() {
  console.log('Showing manual entry form');
  document.getElementById('product-preview').innerHTML = `
    <div style="text-align: center; padding: 20px; color: #666;">
      <p style="margin-bottom: 16px;">Couldn't detect product automatically</p>
      <p style="font-size: 14px;">The item will be saved with the current page URL. You can edit details in the app later.</p>
    </div>
  `;
  
  // Get current tab info
  browser.tabs.query({ active: true, currentWindow: true }).then(tabs => {
    const tab = tabs[0];
    productData = {
      title: tab.title || 'Fashion Item',
      url: tab.url,
      price: '',
      image: '',
      brand: ''
    };
    setupEventListeners();
  });
}

// Show manual edit form
function showManualEditForm() {
  alert('Manual editing will be available in a future update!');
}

// Show error message
function showError(message) {
  console.error('Showing error:', message);
  document.getElementById('loading').style.display = 'none';
  document.getElementById('product-form').style.display = 'block';
  
  const statusMessage = document.getElementById('status-message');
  statusMessage.textContent = message;
  statusMessage.className = 'status-message error';
}

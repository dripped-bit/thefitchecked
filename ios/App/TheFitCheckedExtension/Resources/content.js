// content.js - Enhanced product extraction for fashion e-commerce sites

function extractProductInfo() {
  const productData = {
    title: getProductTitle(),
    price: getProductPrice(),
    image: getProductImage(),
    brand: getProductBrand(),
    description: getProductDescription(),
    url: window.location.href,
    timestamp: new Date().toISOString()
  };
  
  return productData;
}

function getProductTitle() {
  const selectors = [
    'h1[itemprop="name"]',
    'h1.product-title',
    'h1.product-name',
    'h1[class*="product"]',
    'h1[class*="title"]',
    '[data-testid="product-title"]',
    '[data-test="product-title"]',
    'meta[property="og:title"]',
    'meta[name="twitter:title"]',
    '.product-name h1',
    '.product-title h1',
    'h1'
  ];
  
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      let title = selector.includes('meta')
        ? element.getAttribute('content')
        : element.textContent.trim();
      
      // Clean up the title
      title = title.replace(/\s+/g, ' ').trim();
      if (title && title.length > 3 && !title.toLowerCase().includes('sign in')) {
        return title;
      }
    }
  }
  
  // Fallback to page title, cleaned up
  let pageTitle = document.title;
  pageTitle = pageTitle.split('|')[0].split('-')[0].trim();
  return pageTitle;
}

function getProductPrice() {
  const selectors = [
    '[itemprop="price"]',
    '[class*="price"][class*="sale"]',
    '[class*="sale"][class*="price"]',
    '[data-testid="current-price"]',
    '[data-test="product-price"]',
    '.price-current',
    '.product-price',
    '.sale-price',
    '[class*="Price"]',
    'meta[property="product:price:amount"]',
    'meta[property="og:price:amount"]',
    'span[class*="price"]'
  ];
  
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      let price = selector.includes('meta')
        ? element.getAttribute('content')
        : element.textContent.trim();
      
      // Extract price with regex
      const priceMatch = price.match(/[\$£€¥]?\s*[\d,]+\.?\d{0,2}/);
      if (priceMatch) {
        return priceMatch[0].trim();
      }
    }
  }
  
  // Fallback: search for any price-like pattern in the page
  const bodyText = document.body.textContent;
  const pricePattern = /[\$£€¥]\s*\d{1,4}(?:[,\.]\d{2,3})?(?:\.\d{2})?/g;
  const matches = bodyText.match(pricePattern);
  
  if (matches && matches.length > 0) {
    // Return the first reasonable price (between $10 and $10,000)
    for (const match of matches) {
      const numericValue = parseFloat(match.replace(/[^\d.]/g, ''));
      if (numericValue >= 10 && numericValue <= 10000) {
        return match.trim();
      }
    }
  }
  
  return null;
}

function getProductImage() {
  const selectors = [
    'img[itemprop="image"]',
    'img.product-image',
    'img[class*="product"]',
    'img[class*="main"]',
    '.product-images img',
    '.product-gallery img',
    '[data-testid="product-image"]',
    '[data-test="product-image"]',
    'meta[property="og:image"]',
    'meta[property="twitter:image"]',
    'img[alt*="product"]',
    'img[alt*="Product"]',
    'picture img',
    '.gallery img'
  ];
  
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      let src = selector.includes('meta')
        ? element.getAttribute('content')
        : element.src || element.getAttribute('data-src') || element.getAttribute('data-lazy-src');
      
      if (src && isValidProductImage(src)) {
        // Ensure absolute URL
        if (src.startsWith('//')) {
          src = 'https:' + src;
        } else if (src.startsWith('/')) {
          src = window.location.origin + src;
        }
        return src;
      }
    }
  }
  
  return null;
}

function isValidProductImage(src) {
  if (!src) return false;
  
  const lowerSrc = src.toLowerCase();
  
  // Exclude common non-product images
  const excludePatterns = [
    'logo',
    'icon',
    'sprite',
    'placeholder',
    'avatar',
    'banner',
    'badge',
    'button'
  ];
  
  for (const pattern of excludePatterns) {
    if (lowerSrc.includes(pattern)) {
      return false;
    }
  }
  
  // Must be a valid image format
  const validFormats = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
  const hasValidFormat = validFormats.some(format => lowerSrc.includes(format));
  
  // Or check if it's from a CDN (likely a product image)
  const isCDN = lowerSrc.includes('cdn') || lowerSrc.includes('cloudinary') || lowerSrc.includes('imgix');
  
  return hasValidFormat || isCDN;
}

function getProductBrand() {
  const selectors = [
    '[itemprop="brand"]',
    '[itemprop="brand"] [itemprop="name"]',
    '.product-brand',
    '[class*="brand"]',
    '[data-testid="brand"]',
    '[data-test="brand"]',
    'meta[property="product:brand"]',
    'meta[property="og:brand"]',
    'a[href*="brand"]'
  ];
  
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      let brand = selector.includes('meta')
        ? element.getAttribute('content')
        : element.textContent.trim();
      
      // Clean up brand name
      brand = brand.replace(/Brand:|BRAND:/gi, '').trim();
      if (brand && brand.length > 1 && brand.length < 50) {
        return brand;
      }
    }
  }
  
  // Try to extract from URL (many fashion sites have /brand-name/ in URLs)
  const urlParts = window.location.pathname.split('/');
  for (const part of urlParts) {
    if (part && part.length > 2 && part.length < 30 && !part.match(/^\d+$/)) {
      // Capitalize first letter
      const potentialBrand = part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, ' ');
      if (!['product', 'item', 'shop', 'clothing', 'products', 'mens', 'womens'].includes(part.toLowerCase())) {
        return potentialBrand;
      }
    }
  }
  
  return null;
}

function getProductDescription() {
  const selectors = [
    '[itemprop="description"]',
    '.product-description',
    '[class*="description"]',
    'meta[name="description"]',
    'meta[property="og:description"]',
    'meta[property="twitter:description"]'
  ];
  
  for (const selector of selectors) {
    const element = document.querySelector(selector);
    if (element) {
      const desc = selector.includes('meta')
        ? element.getAttribute('content')
        : element.textContent.trim();
      if (desc && desc.length > 20) {
        // Limit description length
        return desc.substring(0, 500).trim();
      }
    }
  }
  
  return null;
}

// Detect if page is likely a product page
function isProductPage() {
  const url = window.location.href.toLowerCase();
  const pathname = window.location.pathname.toLowerCase();
  
  // Check URL patterns
  const productPatterns = [
    '/product/',
    '/item/',
    '/p/',
    '/dp/',
    '/products/',
    '-p-',
    '/collections/'
  ];
  
  const hasProductURL = productPatterns.some(pattern => pathname.includes(pattern));
  
  // Check for product schema
  const hasProductSchema = !!document.querySelector('[itemtype*="schema.org/Product"]');
  
  // Check for common e-commerce platforms
  const isEcommerceSite =
    url.includes('shopify') ||
    url.includes('woocommerce') ||
    document.querySelector('[data-shopify]') ||
    document.querySelector('meta[name="shopify"]');
  
  return hasProductURL || hasProductSchema || isEcommerceSite;
}

// Listen for messages from popup
if (typeof browser !== 'undefined') {
  browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'extractProduct') {
      const product = extractProductInfo();
      const isProduct = isProductPage();
      sendResponse({ ...product, isProductPage: isProduct });
    }
    return true;
  });
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    extractProductInfo,
    isProductPage
  };
}

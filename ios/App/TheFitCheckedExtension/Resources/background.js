// background.js - Service worker for extension

// Listen for extension installation
browser.runtime.onInstalled.addListener(() => {
  console.log('TheFitChecked extension installed');
});

// Handle messages from content scripts or popup
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'saveSession') {
    // Store session from app
    browser.storage.local.set({
      supabase_session: request.session
    }).then(() => {
      sendResponse({ success: true });
    }).catch((error) => {
      sendResponse({ success: false, error: error.message });
    });
    return true; // Keep channel open for async response
  }
  
  if (request.action === 'clearSession') {
    // Clear session on logout
    browser.storage.local.remove('supabase_session').then(() => {
      sendResponse({ success: true });
    });
    return true;
  }
});

// Optional: Handle browser action click (when user clicks extension icon)
browser.action.onClicked.addListener((tab) => {
  // Extension popup will open automatically
  console.log('Extension clicked on tab:', tab.url);
});

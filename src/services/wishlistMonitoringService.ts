/**
 * Wishlist Monitoring Service
 * Tracks prices and availability of wishlist items, notifies users of sales
 * Enhanced with store URL integration for better product search targeting
 */

import { STORE_URLS, StoreInfo } from '../data/storeUrls';

export interface MonitoredWishlistItem {
  id: string;
  productUrl: string;
  title: string;
  originalPrice: string;
  currentPrice: string;
  priceHistory: PricePoint[];
  lastChecked: string;
  isMonitoring: boolean;
  notifications: boolean;
  store: string;
  imageUrl?: string;
  inStock: boolean;
  targetPrice?: string; // User's desired price alert

  // Enhanced fields for generated outfits
  source?: 'generated' | 'manual' | 'search';
  originalPrompt?: string;
  searchResults?: WishlistSearchResults;
}

export interface WishlistSearchResults {
  searchId: string;
  originalImageUrl: string;
  searchTimestamp: string;
  relatedProducts: MonitoredWishlistItem[];
  totalProductsFound: number;
}

export interface PricePoint {
  date: string;
  price: string;
  priceNumeric: number;
  inStock: boolean;
}

export interface PriceAlert {
  id: string;
  itemId: string;
  type: 'price_drop' | 'target_reached' | 'back_in_stock' | 'sale_detected';
  title: string;
  message: string;
  originalPrice?: string;
  newPrice?: string;
  savingsAmount?: string;
  savingsPercentage?: string;
  timestamp: string;
  read: boolean;
  actionUrl: string;
}

class WishlistMonitoringService {
  private readonly MONITORING_INTERVAL = 6 * 60 * 60 * 1000; // 6 hours
  private readonly STORAGE_KEY = 'fitChecked_monitored_wishlist';
  private readonly ALERTS_STORAGE_KEY = 'fitChecked_price_alerts';
  private monitoringTimer: NodeJS.Timeout | null = null;

  /**
   * Identify which store a product URL belongs to
   */
  private identifyStore(productUrl: string): StoreInfo | null {
    try {
      const domain = new URL(productUrl).hostname.toLowerCase();

      return STORE_URLS.find(store => {
        const storeDomain = new URL(store.url).hostname.toLowerCase();
        return domain.includes(storeDomain.replace('www.', '')) ||
               storeDomain.includes(domain.replace('www.', ''));
      }) || null;
    } catch (error) {
      console.warn('Failed to parse product URL:', productUrl);
      return null;
    }
  }

  constructor() {
    this.initializeMonitoring();
  }

  /**
   * Initialize price monitoring system
   */
  private initializeMonitoring() {
    // Start monitoring on initialization
    this.startMonitoring();

    // Listen for visibility change to resume monitoring when tab becomes active
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
          this.checkAllItems();
        }
      });
    }
  }

  /**
   * Add item to monitoring list
   */
  addToMonitoring(item: {
    id: string;
    url: string;
    title: string;
    price: string;
    store: string;
    imageUrl?: string;
    inStock?: boolean;
  }): MonitoredWishlistItem {
    const monitoredItem: MonitoredWishlistItem = {
      id: item.id,
      productUrl: item.url,
      title: item.title,
      originalPrice: item.price,
      currentPrice: item.price,
      priceHistory: [{
        date: new Date().toISOString(),
        price: item.price,
        priceNumeric: this.parsePrice(item.price),
        inStock: item.inStock ?? true
      }],
      lastChecked: new Date().toISOString(),
      isMonitoring: true,
      notifications: true,
      store: item.store,
      imageUrl: item.imageUrl,
      inStock: item.inStock ?? true
    };

    const monitored = this.getMonitoredItems();
    monitored.push(monitoredItem);
    this.saveMonitoredItems(monitored);

    console.log('📊 Added to price monitoring:', item.title);
    return monitoredItem;
  }

  /**
   * Remove item from monitoring
   */
  removeFromMonitoring(itemId: string): boolean {
    const monitored = this.getMonitoredItems();
    const filteredItems = monitored.filter(item => item.id !== itemId);

    if (filteredItems.length !== monitored.length) {
      this.saveMonitoredItems(filteredItems);
      console.log('🗑️ Removed from monitoring:', itemId);
      return true;
    }

    return false;
  }

  /**
   * Toggle monitoring for an item
   */
  toggleMonitoring(itemId: string, enabled: boolean): boolean {
    const monitored = this.getMonitoredItems();
    const item = monitored.find(item => item.id === itemId);

    if (item) {
      item.isMonitoring = enabled;
      this.saveMonitoredItems(monitored);
      console.log(`📊 Monitoring ${enabled ? 'enabled' : 'disabled'} for:`, item.title);
      return true;
    }

    return false;
  }

  /**
   * Set target price alert for an item
   */
  setTargetPrice(itemId: string, targetPrice: string): boolean {
    const monitored = this.getMonitoredItems();
    const item = monitored.find(item => item.id === itemId);

    if (item) {
      item.targetPrice = targetPrice;
      this.saveMonitoredItems(monitored);
      console.log('🎯 Target price set:', targetPrice, 'for', item.title);
      return true;
    }

    return false;
  }

  /**
   * Check prices for all monitored items
   */
  async checkAllItems(): Promise<void> {
    const monitored = this.getMonitoredItems().filter(item => item.isMonitoring);

    if (monitored.length === 0) {
      console.log('📊 No items to monitor');
      return;
    }

    console.log('🔍 Checking prices for', monitored.length, 'items');

    // Check items in batches to avoid overwhelming APIs
    const batchSize = 3;
    for (let i = 0; i < monitored.length; i += batchSize) {
      const batch = monitored.slice(i, i + batchSize);
      await Promise.all(batch.map(item => this.checkItemPrice(item)));

      // Wait between batches to be respectful
      if (i + batchSize < monitored.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }

  /**
   * Check price for a single item
   */
  private async checkItemPrice(item: MonitoredWishlistItem): Promise<void> {
    try {
      console.log('💰 Checking price for:', item.title);

      // Use Perplexity to get current product information
      const searchQuery = `"${item.title}" ${item.store} price current available`;

      // This is a simplified approach - in production you might want more sophisticated price tracking
      const mockCurrentPrice = this.simulatePriceChange(item);
      const mockInStock = Math.random() > 0.1; // 90% chance of being in stock

      await this.updateItemPrice(item, mockCurrentPrice, mockInStock);

    } catch (error) {
      console.error('❌ Failed to check price for:', item.title, error);
    }
  }

  /**
   * Simulate price changes for demonstration (replace with real price checking)
   */
  private simulatePriceChange(item: MonitoredWishlistItem): string {
    const currentNumeric = this.parsePrice(item.currentPrice);

    // 20% chance of price change
    if (Math.random() > 0.8) {
      // Price can go up or down by up to 20%
      const changePercent = (Math.random() - 0.5) * 0.4; // -20% to +20%
      const newPrice = Math.max(1, Math.round(currentNumeric * (1 + changePercent)));
      return `$${newPrice}`;
    }

    return item.currentPrice;
  }

  /**
   * Update item price and trigger alerts if needed
   */
  private async updateItemPrice(
    item: MonitoredWishlistItem,
    newPrice: string,
    inStock: boolean
  ): Promise<void> {
    const monitored = this.getMonitoredItems();
    const itemIndex = monitored.findIndex(i => i.id === item.id);

    if (itemIndex === -1) return;

    const oldPrice = item.currentPrice;
    const oldInStock = item.inStock;
    const newPriceNumeric = this.parsePrice(newPrice);
    const oldPriceNumeric = this.parsePrice(oldPrice);

    // Update item data
    monitored[itemIndex].currentPrice = newPrice;
    monitored[itemIndex].inStock = inStock;
    monitored[itemIndex].lastChecked = new Date().toISOString();

    // Add to price history
    monitored[itemIndex].priceHistory.push({
      date: new Date().toISOString(),
      price: newPrice,
      priceNumeric: newPriceNumeric,
      inStock
    });

    // Keep only last 30 price points
    if (monitored[itemIndex].priceHistory.length > 30) {
      monitored[itemIndex].priceHistory = monitored[itemIndex].priceHistory.slice(-30);
    }

    this.saveMonitoredItems(monitored);

    // Generate alerts for price changes
    await this.checkForAlerts(monitored[itemIndex], oldPriceNumeric, newPriceNumeric, oldInStock, inStock);
  }

  /**
   * Check for price alerts and create notifications
   */
  private async checkForAlerts(
    item: MonitoredWishlistItem,
    oldPrice: number,
    newPrice: number,
    oldInStock: boolean,
    newInStock: boolean
  ): Promise<void> {
    const alerts: PriceAlert[] = [];

    // Back in stock alert
    if (!oldInStock && newInStock) {
      alerts.push({
        id: `alert_${Date.now()}_stock`,
        itemId: item.id,
        type: 'back_in_stock',
        title: '📦 Back in Stock!',
        message: `${item.title} is back in stock at ${item.store}`,
        newPrice: item.currentPrice,
        timestamp: new Date().toISOString(),
        read: false,
        actionUrl: item.productUrl
      });
    }

    // Price drop alert (minimum 5% drop)
    if (newPrice < oldPrice && ((oldPrice - newPrice) / oldPrice) >= 0.05) {
      const savingsAmount = `$${(oldPrice - newPrice).toFixed(2)}`;
      const savingsPercentage = `${Math.round(((oldPrice - newPrice) / oldPrice) * 100)}%`;

      alerts.push({
        id: `alert_${Date.now()}_drop`,
        itemId: item.id,
        type: 'price_drop',
        title: '💸 Price Drop Alert!',
        message: `${item.title} dropped by ${savingsPercentage}`,
        originalPrice: `$${oldPrice.toFixed(2)}`,
        newPrice: `$${newPrice.toFixed(2)}`,
        savingsAmount,
        savingsPercentage,
        timestamp: new Date().toISOString(),
        read: false,
        actionUrl: item.productUrl
      });
    }

    // Target price reached alert
    if (item.targetPrice && newPrice <= this.parsePrice(item.targetPrice)) {
      alerts.push({
        id: `alert_${Date.now()}_target`,
        itemId: item.id,
        type: 'target_reached',
        title: '🎯 Target Price Reached!',
        message: `${item.title} reached your target price of ${item.targetPrice}`,
        newPrice: `$${newPrice.toFixed(2)}`,
        timestamp: new Date().toISOString(),
        read: false,
        actionUrl: item.productUrl
      });
    }

    // Save alerts and trigger notifications
    if (alerts.length > 0) {
      await this.saveAndNotifyAlerts(alerts);
    }
  }

  /**
   * Save alerts and trigger notifications
   */
  private async saveAndNotifyAlerts(alerts: PriceAlert[]): Promise<void> {
    const existingAlerts = this.getPriceAlerts();
    const allAlerts = [...existingAlerts, ...alerts];

    // Keep only last 50 alerts
    if (allAlerts.length > 50) {
      allAlerts.splice(0, allAlerts.length - 50);
    }

    localStorage.setItem(this.ALERTS_STORAGE_KEY, JSON.stringify(allAlerts));

    // Trigger browser notifications if permission granted
    for (const alert of alerts) {
      await this.showBrowserNotification(alert);
    }

    console.log('🔔 Created', alerts.length, 'price alerts');
  }

  /**
   * Show browser notification
   */
  private async showBrowserNotification(alert: PriceAlert): Promise<void> {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        const notification = new Notification(alert.title, {
          body: alert.message,
          icon: '/icons/shopping-bag.png', // Add your app icon
          badge: '/icons/badge.png',
          tag: alert.itemId, // Prevent duplicate notifications
          requireInteraction: true
        });

        notification.onclick = () => {
          window.open(alert.actionUrl, '_blank');
          notification.close();
        };

      } catch (error) {
        console.error('Failed to show notification:', error);
      }
    }
  }

  /**
   * Request notification permissions
   */
  async requestNotificationPermission(): Promise<boolean> {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }

  /**
   * Start monitoring timer
   */
  startMonitoring(): void {
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
    }

    this.monitoringTimer = setInterval(() => {
      this.checkAllItems();
    }, this.MONITORING_INTERVAL);

    console.log('📊 Price monitoring started (checking every 6 hours)');
  }

  /**
   * Stop monitoring timer
   */
  stopMonitoring(): void {
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer);
      this.monitoringTimer = null;
      console.log('📊 Price monitoring stopped');
    }
  }

  /**
   * Parse price string to numeric value
   */
  private parsePrice(priceString: string): number {
    const match = priceString.replace(/[^\d.-]/g, '');
    return parseFloat(match) || 0;
  }

  /**
   * Get monitored items from storage
   */
  getMonitoredItems(): MonitoredWishlistItem[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load monitored items:', error);
      return [];
    }
  }

  /**
   * Save monitored items to storage
   */
  private saveMonitoredItems(items: MonitoredWishlistItem[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error('Failed to save monitored items:', error);
    }
  }

  /**
   * Get price alerts from storage
   */
  getPriceAlerts(): PriceAlert[] {
    try {
      const stored = localStorage.getItem(this.ALERTS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to load price alerts:', error);
      return [];
    }
  }

  /**
   * Mark alert as read
   */
  markAlertAsRead(alertId: string): boolean {
    const alerts = this.getPriceAlerts();
    const alert = alerts.find(a => a.id === alertId);

    if (alert) {
      alert.read = true;
      localStorage.setItem(this.ALERTS_STORAGE_KEY, JSON.stringify(alerts));
      return true;
    }

    return false;
  }

  /**
   * Get unread alerts count
   */
  getUnreadAlertsCount(): number {
    return this.getPriceAlerts().filter(alert => !alert.read).length;
  }

  /**
   * Clear old alerts (older than 30 days)
   */
  clearOldAlerts(): number {
    const alerts = this.getPriceAlerts();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const recentAlerts = alerts.filter(alert =>
      new Date(alert.timestamp) > thirtyDaysAgo
    );

    const removedCount = alerts.length - recentAlerts.length;

    if (removedCount > 0) {
      localStorage.setItem(this.ALERTS_STORAGE_KEY, JSON.stringify(recentAlerts));
      console.log('🧹 Cleaned up', removedCount, 'old alerts');
    }

    return removedCount;
  }
}

export default new WishlistMonitoringService();
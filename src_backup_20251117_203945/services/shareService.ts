/**
 * Share Service
 * Handles outfit sharing functionality including generating share links,
 * storing shared data, and managing privacy settings
 */

export interface SharedOutfitData {
  id: string;
  avatarImageUrl: string;
  outfitImageUrl?: string;
  outfitDetails: {
    description: string;
    occasion?: string;
    weather?: string;
    formality?: string;
    date?: string;
    time?: string;
    location?: string;
  };
  shoppingLinks?: Array<{
    name: string;
    url: string;
    price?: string;
    store?: string;
  }>;
  generatedBy: 'occasion-planner' | 'closet';
  timestamp: string;
  privacy: {
    hideFace: boolean;
    outfitOnly: boolean;
    allowSharing: boolean;
  };
}

class ShareService {
  private dbName = 'FitCheckedShares';
  private storeName = 'sharedOutfits';
  private dbVersion = 1;

  /**
   * Initialize IndexedDB for storing shared outfits
   */
  private async initDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('generatedBy', 'generatedBy', { unique: false });
        }
      };
    });
  }

  /**
   * Generate unique share ID
   */
  private generateShareId(): string {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 9);
    return `${timestamp}-${randomStr}`;
  }

  /**
   * Create shareable outfit data
   */
  async createShare(data: Omit<SharedOutfitData, 'id' | 'timestamp' | 'privacy'>): Promise<string> {
    const shareId = this.generateShareId();
    const sharedData: SharedOutfitData = {
      ...data,
      id: shareId,
      timestamp: new Date().toISOString(),
      privacy: {
        hideFace: false,
        outfitOnly: false,
        allowSharing: true
      }
    };

    const db = await this.initDB();
    const transaction = db.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(this.storeName);

    return new Promise((resolve, reject) => {
      const request = store.add(sharedData);
      request.onsuccess = () => {
        console.log('✅ Shared outfit created:', shareId);
        resolve(shareId);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get shared outfit by ID
   */
  async getSharedOutfit(shareId: string): Promise<SharedOutfitData | null> {
    const db = await this.initDB();
    const transaction = db.transaction([this.storeName], 'readonly');
    const store = transaction.objectStore(this.storeName);

    return new Promise((resolve, reject) => {
      const request = store.get(shareId);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Update privacy settings for a shared outfit
   */
  async updatePrivacy(shareId: string, privacy: Partial<SharedOutfitData['privacy']>): Promise<void> {
    const outfit = await this.getSharedOutfit(shareId);
    if (!outfit) {
      throw new Error('Shared outfit not found');
    }

    outfit.privacy = { ...outfit.privacy, ...privacy };

    const db = await this.initDB();
    const transaction = db.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(this.storeName);

    return new Promise((resolve, reject) => {
      const request = store.put(outfit);
      request.onsuccess = () => {
        console.log('✅ Privacy settings updated:', shareId);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Generate shareable URL
   */
  generateShareUrl(shareId: string): string {
    const baseUrl = window.location.origin;
    return `${baseUrl}?share=${shareId}`;
  }

  /**
   * Copy share URL to clipboard
   */
  async copyShareUrl(shareId: string): Promise<boolean> {
    const url = this.generateShareUrl(shareId);
    try {
      await navigator.clipboard.writeText(url);
      console.log('✅ Share URL copied to clipboard');
      return true;
    } catch (error) {
      console.error('❌ Failed to copy share URL:', error);
      return false;
    }
  }

  /**
   * Get all shared outfits (for user's history)
   */
  async getAllSharedOutfits(): Promise<SharedOutfitData[]> {
    const db = await this.initDB();
    const transaction = db.transaction([this.storeName], 'readonly');
    const store = transaction.objectStore(this.storeName);

    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Delete shared outfit
   */
  async deleteSharedOutfit(shareId: string): Promise<void> {
    const db = await this.initDB();
    const transaction = db.transaction([this.storeName], 'readwrite');
    const store = transaction.objectStore(this.storeName);

    return new Promise((resolve, reject) => {
      const request = store.delete(shareId);
      request.onsuccess = () => {
        console.log('✅ Shared outfit deleted:', shareId);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Generate social media share URLs
   */
  generateSocialShareUrls(shareId: string, message: string = 'Check out my outfit!') {
    const shareUrl = this.generateShareUrl(shareId);
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedMessage = encodeURIComponent(message);

    return {
      twitter: `https://twitter.com/intent/tweet?text=${encodedMessage}&url=${encodedUrl}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      pinterest: `https://pinterest.com/pin/create/button/?url=${encodedUrl}&description=${encodedMessage}`,
      instagram: shareUrl // Instagram doesn't support web sharing, just copy URL
    };
  }
}

const shareService = new ShareService();
export default shareService;

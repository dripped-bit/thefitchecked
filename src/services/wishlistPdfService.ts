/**
 * Wishlist PDF Service
 * Generates styled PDF documents from wishlist items
 * Integrates style quiz results and preferences
 */

import { pdf } from '@react-pdf/renderer';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import styleQuizService from './styleQuizService';
import stylePreferencesService from './stylePreferencesService';

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

export interface WishlistPdfOptions {
  items: WishlistItem[];
  title?: string;
  userName?: string;
  includePrice?: boolean;
  personalMessage?: string;
  occasion?: string;
  quizStyleType?: string;
  stylePreferences?: any;
}

class WishlistPdfService {
  /**
   * Load user's style data (quiz + preferences)
   */
  async loadUserStyleData() {
    try {
      const [quizResults, stylePrefs] = await Promise.all([
        styleQuizService.getQuizResults(),
        stylePreferencesService.loadStyleProfile()
      ]);

      return {
        quizStyleType: quizResults?.styleType,
        quizPriorities: quizResults?.priorities,
        quizPalette: quizResults?.recommendedPalette,
        styleArchetypes: stylePrefs?.fashionPersonality?.archetypes,
        favoriteColors: stylePrefs?.fashionPersonality?.colorPalette,
        sizes: stylePrefs?.sizes,
        stylePreferences: stylePrefs
      };
    } catch (error) {
      console.error('❌ [PDF] Error loading style data:', error);
      return {};
    }
  }

  /**
   * Generate PDF blob from wishlist items
   */
  async generatePdfBlob(options: WishlistPdfOptions): Promise<Blob> {
    try {
      console.log('📄 [PDF] Generating PDF with', options.items.length, 'items');

      // Dynamically import the PDF document component to avoid SSR issues
      const { WishlistPdfDocument } = await import('../components/wishlist/WishlistPdfDocument');
      
      // Create PDF document
      const element = WishlistPdfDocument({ options });
      const blob = await pdf(element).toBlob();

      console.log('✅ [PDF] PDF generated successfully:', blob.size, 'bytes');
      return blob;
    } catch (error) {
      console.error('❌ [PDF] Error generating PDF:', error);
      throw error;
    }
  }

  /**
   * Download PDF to device
   */
  async downloadPDF(options: WishlistPdfOptions, filename: string): Promise<void> {
    try {
      const blob = await this.generatePdfBlob(options);

      if (Capacitor.isNativePlatform()) {
        // iOS/Android: Save to Documents directory
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        
        await new Promise((resolve, reject) => {
          reader.onloadend = async () => {
            try {
              const base64Data = (reader.result as string).split(',')[1];
              
              const result = await Filesystem.writeFile({
                path: filename,
                data: base64Data,
                directory: Directory.Documents
              });

              console.log('✅ [PDF] Saved to:', result.uri);
              alert(`PDF saved to Documents folder: ${filename}`);
              resolve(result);
            } catch (error) {
              console.error('❌ [PDF] Error saving file:', error);
              reject(error);
            }
          };
          reader.onerror = reject;
        });
      } else {
        // Web: Trigger download
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        console.log('✅ [PDF] Download triggered:', filename);
      }
    } catch (error) {
      console.error('❌ [PDF] Error downloading PDF:', error);
      throw error;
    }
  }

  /**
   * Share PDF via native share sheet
   */
  async sharePDF(options: WishlistPdfOptions, filename: string): Promise<void> {
    try {
      const blob = await this.generatePdfBlob(options);

      if (Capacitor.isNativePlatform()) {
        // iOS/Android: Save temporarily then share
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        
        await new Promise((resolve, reject) => {
          reader.onloadend = async () => {
            try {
              const base64Data = (reader.result as string).split(',')[1];
              
              // Save to temp directory
              const tempFile = await Filesystem.writeFile({
                path: filename,
                data: base64Data,
                directory: Directory.Cache
              });

              // Share the file
              await Share.share({
                title: options.title || 'My Wishlist',
                text: options.personalMessage || 'Check out my wishlist!',
                files: [tempFile.uri],
                dialogTitle: 'Share Wishlist PDF'
              });

              console.log('✅ [PDF] Shared successfully');
              resolve(tempFile);
            } catch (error) {
              console.error('❌ [PDF] Error sharing:', error);
              reject(error);
            }
          };
          reader.onerror = reject;
        });
      } else {
        // Web: Use Web Share API if available
        if (navigator.share && navigator.canShare) {
          const file = new File([blob], filename, { type: 'application/pdf' });
          
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: options.title || 'My Wishlist',
              text: options.personalMessage || 'Check out my wishlist!',
              files: [file]
            });
            console.log('✅ [PDF] Shared via Web Share API');
          } else {
            // Fallback to download
            console.log('⚠️ [PDF] Can\'t share files, downloading instead');
            await this.downloadPDF(options, filename);
          }
        } else {
          // Fallback to download
          console.log('⚠️ [PDF] Share API not available, downloading instead');
          await this.downloadPDF(options, filename);
        }
      }
    } catch (error) {
      console.error('❌ [PDF] Error sharing PDF:', error);
      throw error;
    }
  }
}

// Export singleton
const wishlistPdfService = new WishlistPdfService();
export default wishlistPdfService;

/**
 * Social Share Service
 * Generates Instagram/TikTok story templates for closet analytics
 * Creates 1080x1920 canvas images with gradients and stats
 */

import { Share } from '@capacitor/share';
import { AnalyticsData } from './closetAnalyticsService';

export type StoryTemplate = 'big-spender' | 'closet-value' | 'usage-check' | 'best-value';

export interface StoryGenerationOptions {
  template: StoryTemplate;
  data: AnalyticsData;
  userName?: string;
  userPhoto?: string;
}

class SocialShareService {
  /**
   * Generate story image based on template
   */
  async generateStoryImage(options: StoryGenerationOptions): Promise<string> {
    const { template, data } = options;

    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    switch (template) {
      case 'big-spender':
        this.renderBigSpenderTemplate(ctx, data);
        break;
      case 'closet-value':
        this.renderClosetValueTemplate(ctx, data);
        break;
      case 'usage-check':
        this.renderUsageCheckTemplate(ctx, data);
        break;
      case 'best-value':
        this.renderBestValueTemplate(ctx, data);
        break;
    }

    // Convert to data URL
    return canvas.toDataURL('image/png', 0.95);
  }

  /**
   * Template 1: Big Spender - Shows top spending category
   */
  private renderBigSpenderTemplate(ctx: CanvasRenderingContext2D, data: AnalyticsData): void {
    const topCategory = data.categories[0];
    if (!topCategory) return;

    // Background gradient (gold to black)
    const gradient = ctx.createLinearGradient(0, 0, 0, 1920);
    gradient.addColorStop(0, '#FFD700');
    gradient.addColorStop(0.5, '#FFA500');
    gradient.addColorStop(1, '#000000');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1080, 1920);

    // Add decorative elements
    this.drawSparkles(ctx);

    // Main text
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 20;

    ctx.font = 'bold 64px Arial';
    ctx.fillText('I spent', 540, 750);

    ctx.font = 'bold 140px Arial';
    ctx.fillText(`$${topCategory.total.toLocaleString()}`, 540, 920);

    ctx.font = 'bold 68px Arial';
    const categoryText = `on ${topCategory.category}`;
    ctx.fillText(categoryText, 540, 1020);

    ctx.font = 'bold 68px Arial';
    ctx.fillText('this year 😱', 540, 1120);

    // Sub-stats
    ctx.font = '32px Arial';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillText(`Total Closet: $${data.totalValue.toLocaleString()}`, 540, 1300);
    ctx.fillText(`${data.categories.length} Categories`, 540, 1360);

    // Watermark
    ctx.shadowBlur = 0;
    ctx.font = '28px Arial';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillText('Tracked with TheFitChecked', 540, 1800);
  }

  /**
   * Template 2: Closet Value - Shows total wardrobe value
   */
  private renderClosetValueTemplate(ctx: CanvasRenderingContext2D, data: AnalyticsData): void {
    // Background gradient (emerald to teal)
    const gradient = ctx.createLinearGradient(0, 0, 0, 1920);
    gradient.addColorStop(0, '#10B981');
    gradient.addColorStop(0.5, '#14B8A6');
    gradient.addColorStop(1, '#0D9488');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1080, 1920);

    // Main text
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 15;

    ctx.font = 'bold 60px Arial';
    ctx.fillText('My closet is worth', 540, 750);

    ctx.font = 'bold 160px Arial';
    ctx.fillText(`$${data.totalValue.toLocaleString()}!`, 540, 950);

    // Category breakdown
    ctx.font = '36px Arial';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    
    let yPos = 1150;
    data.categories.slice(0, 3).forEach((cat, index) => {
      ctx.fillText(
        `${cat.category.charAt(0).toUpperCase() + cat.category.slice(1)}: $${cat.total.toLocaleString()}`,
        540,
        yPos + (index * 60)
      );
    });

    // Best value item
    if (data.bestValueItems.length > 0) {
      const bestItem = data.bestValueItems[0];
      ctx.font = 'bold 32px Arial';
      ctx.fillText('Best Value Item:', 540, 1450);
      ctx.font = '28px Arial';
      ctx.fillText(bestItem.name, 540, 1500);
      if (bestItem.timesWorn > 0) {
        ctx.fillText(`$${bestItem.costPerWear.toFixed(2)}/wear`, 540, 1545);
      }
    }

    // Watermark
    ctx.shadowBlur = 0;
    ctx.font = '28px Arial';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillText('Tracked with TheFitChecked', 540, 1800);
  }

  /**
   * Template 3: Usage Reality Check - Shows low usage stats
   */
  private renderUsageCheckTemplate(ctx: CanvasRenderingContext2D, data: AnalyticsData): void {
    // Background gradient (orange to red warning)
    const gradient = ctx.createLinearGradient(0, 0, 0, 1920);
    gradient.addColorStop(0, '#F97316');
    gradient.addColorStop(0.5, '#EF4444');
    gradient.addColorStop(1, '#DC2626');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1080, 1920);

    // Warning icon
    ctx.font = 'bold 120px Arial';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.fillText('⚠️', 540, 650);

    // Main text
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 15;
    ctx.font = 'bold 58px Arial';
    ctx.fillText("I've only worn", 540, 800);

    ctx.font = 'bold 140px Arial';
    ctx.fillText(`${data.itemsThisMonth}`, 540, 950);

    ctx.font = 'bold 58px Arial';
    ctx.fillText('items this month', 540, 1050);

    // Calculate percentage if we have total items data
    const totalItems = data.categories.reduce((sum, cat) => sum + cat.itemCount, 0);
    if (totalItems > 0) {
      const percentage = ((data.itemsThisMonth / totalItems) * 100).toFixed(0);
      ctx.font = '40px Arial';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fillText(`That's only ${percentage}% of my wardrobe!`, 540, 1200);
    }

    // Call to action
    ctx.font = 'bold 48px Arial';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('Time to shop my closet! 🛍️', 540, 1400);

    // Watermark
    ctx.shadowBlur = 0;
    ctx.font = '28px Arial';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillText('Tracked with TheFitChecked', 540, 1800);
  }

  /**
   * Template 4: Best Value - Highlights cost-per-wear winner
   */
  private renderBestValueTemplate(ctx: CanvasRenderingContext2D, data: AnalyticsData): void {
    const bestItem = data.bestValueItems[0];
    if (!bestItem) return;

    // Background gradient (green success)
    const gradient = ctx.createLinearGradient(0, 0, 0, 1920);
    gradient.addColorStop(0, '#22C55E');
    gradient.addColorStop(0.5, '#16A34A');
    gradient.addColorStop(1, '#15803D');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1080, 1920);

    // Trophy emoji
    ctx.font = 'bold 120px Arial';
    ctx.fillStyle = '#FFFFFF';
    ctx.textAlign = 'center';
    ctx.fillText('🏆', 540, 650);

    // Main text
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 15;
    ctx.font = 'bold 52px Arial';
    ctx.fillText('My best value item:', 540, 800);

    ctx.font = 'bold 56px Arial';
    // Wrap text if too long
    const maxWidth = 900;
    const words = bestItem.name.split(' ');
    let line = '';
    let yPos = 920;

    for (const word of words) {
      const testLine = line + word + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && line !== '') {
        ctx.fillText(line, 540, yPos);
        line = word + ' ';
        yPos += 70;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, 540, yPos);

    // Cost per wear
    if (bestItem.timesWorn > 0) {
      ctx.font = 'bold 80px Arial';
      ctx.fillStyle = '#FEF08A';
      ctx.fillText(`$${bestItem.costPerWear.toFixed(2)}`, 540, yPos + 150);
      
      ctx.font = '40px Arial';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fillText('per wear', 540, yPos + 210);

      ctx.font = '36px Arial';
      ctx.fillText(`Worn ${bestItem.timesWorn} times`, 540, yPos + 270);
      
      // Stars
      const stars = '⭐'.repeat(bestItem.stars);
      ctx.font = '48px Arial';
      ctx.fillText(stars, 540, yPos + 340);
    } else {
      ctx.font = '36px Arial';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fillText('Great value potential!', 540, yPos + 120);
      ctx.fillText('Start tracking wears', 540, yPos + 170);
    }

    // Watermark
    ctx.shadowBlur = 0;
    ctx.font = '28px Arial';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillText('Tracked with TheFitChecked', 540, 1800);
  }

  /**
   * Add decorative sparkles
   */
  private drawSparkles(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    const sparkles = [
      { x: 200, y: 400, size: 20 },
      { x: 850, y: 500, size: 25 },
      { x: 300, y: 1500, size: 18 },
      { x: 750, y: 1600, size: 22 },
    ];

    sparkles.forEach(sparkle => {
      ctx.beginPath();
      ctx.arc(sparkle.x, sparkle.y, sparkle.size, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  /**
   * Download image
   */
  async downloadImage(dataUrl: string, fileName: string): Promise<void> {
    const link = document.createElement('a');
    link.download = `${fileName}.png`;
    link.href = dataUrl;
    link.click();
  }

  /**
   * Share via native share sheet (iOS/Android)
   */
  async shareNative(dataUrl: string, title: string): Promise<void> {
    try {
      // Convert data URL to blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      
      // Convert blob to file
      const file = new File([blob], 'analytics-story.png', { type: 'image/png' });
      
      // Create a temporary URL
      const url = URL.createObjectURL(file);

      await Share.share({
        title,
        text: 'Check out my closet analytics! 👗✨',
        url,
        dialogTitle: 'Share Your Stats'
      });

      // Clean up
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('❌ Native share failed:', error);
      // Fallback to download
      await this.downloadImage(dataUrl, 'analytics-story');
    }
  }

  /**
   * Copy image to clipboard (web only)
   */
  async copyToClipboard(dataUrl: string): Promise<boolean> {
    try {
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      
      return true;
    } catch (error) {
      console.error('❌ Copy to clipboard failed:', error);
      return false;
    }
  }

  /**
   * Generate deep link for Instagram Stories
   */
  getInstagramStoriesLink(imageUrl: string): string {
    // Instagram Stories deep link
    return `instagram://story-camera`;
  }

  /**
   * Generate social media share URLs
   */
  getSocialShareUrls(message: string, imageUrl?: string): Record<string, string> {
    const encodedMessage = encodeURIComponent(message);
    const shareUrl = window.location.origin;

    return {
      twitter: `https://twitter.com/intent/tweet?text=${encodedMessage}&url=${shareUrl}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}&quote=${encodedMessage}`,
      instagram: this.getInstagramStoriesLink(imageUrl || ''),
      tiktok: 'https://www.tiktok.com/upload' // Opens TikTok upload page
    };
  }
}

// Export singleton
export const socialShareService = new SocialShareService();
export default socialShareService;

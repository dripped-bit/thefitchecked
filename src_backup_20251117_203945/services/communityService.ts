/**
 * Community Service - Handles social features and community interactions
 * Provides functionality for user profiles, following, outfit sharing, and social interactions
 */

// Types and Interfaces
export interface CommunityUser {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  bio: string;
  joinDate: Date;
  followers: number;
  following: number;
  isVerified: boolean;
  isStyleExpert: boolean;
  privacySettings: PrivacySettings;
  stylePreferences: string[];
  location?: string;
  website?: string;
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'friends' | 'private';
  closetVisibility: 'public' | 'friends' | 'private';
  activityVisibility: 'public' | 'friends' | 'private';
  allowStyleRequests: boolean;
  allowMessages: boolean;
  showOnlineStatus: boolean;
}

export interface OutfitPost {
  id: string;
  userId: string;
  username: string;
  userAvatar: string;
  outfitImage: string;
  outfitItems?: ClothingItem[];
  caption: string;
  description?: string;
  tags: string[];
  occasion: string;
  season: string;
  likes: number;
  comments: number;
  saves: number;
  shares: number;
  views: number;
  timestamp: Date;
  visibility: 'public' | 'friends' | 'private';
  isLiked: boolean;
  isSaved: boolean;
  challenge?: string;
  location?: string;
  brandCollabs?: string[];
}

export interface ClothingItem {
  id: string;
  name: string;
  imageUrl: string;
  category: string;
  brand?: string;
  price?: number;
  color?: string;
  size?: string;
}

export interface StyleRequest {
  id: string;
  requesterId: string;
  requesterName: string;
  requesterAvatar: string;
  title: string;
  description: string;
  occasion: string;
  budget?: number;
  preferences: string[];
  availableItems: ClothingItem[];
  images: string[];
  targetResponses?: number;
  responses: StyleResponse[];
  status: 'open' | 'closed' | 'completed';
  deadline?: Date;
  createdAt: Date;
  priority: 'low' | 'medium' | 'high';
}

export interface StyleResponse {
  id: string;
  responderId: string;
  responderName: string;
  responderAvatar: string;
  isStyleExpert: boolean;
  outfitSuggestion: OutfitSuggestion;
  explanation: string;
  tips: string[];
  rating: number;
  helpful: number;
  timestamp: Date;
  isSelected: boolean;
}

export interface OutfitSuggestion {
  items: ClothingItem[];
  alternatives: ClothingItem[];
  totalCost?: number;
  description: string;
  shoppingLinks?: ShoppingLink[];
}

export interface ShoppingLink {
  itemName: string;
  store: string;
  url: string;
  price: number;
  inStock: boolean;
}

export interface Interaction {
  type: 'like' | 'comment' | 'save' | 'share' | 'follow' | 'unfollow';
  userId: string;
  targetId: string;
  targetType: 'post' | 'user' | 'comment';
  timestamp: Date;
  metadata?: any;
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  username: string;
  userAvatar: string;
  content: string;
  likes: number;
  replies: Comment[];
  timestamp: Date;
  isLiked: boolean;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'like' | 'comment' | 'follow' | 'style_request' | 'challenge' | 'feature';
  title: string;
  message: string;
  actionUrl?: string;
  imageUrl?: string;
  isRead: boolean;
  timestamp: Date;
  metadata?: any;
}

class CommunityService {
  private currentUser: CommunityUser | null = null;
  private following: Set<string> = new Set();
  private blockedUsers: Set<string> = new Set();

  constructor() {
    this.loadUserData();
  }

  // =====================
  // User Profile Management
  // =====================

  async getCurrentUser(): Promise<CommunityUser | null> {
    return this.currentUser;
  }

  async updateProfile(updates: Partial<CommunityUser>): Promise<CommunityUser> {
    if (!this.currentUser) {
      throw new Error('No current user found');
    }

    this.currentUser = {
      ...this.currentUser,
      ...updates
    };

    this.saveUserData();
    console.log('👤 Profile updated:', updates);
    return this.currentUser;
  }

  async updatePrivacySettings(settings: Partial<PrivacySettings>): Promise<PrivacySettings> {
    if (!this.currentUser) {
      throw new Error('No current user found');
    }

    this.currentUser.privacySettings = {
      ...this.currentUser.privacySettings,
      ...settings
    };

    this.saveUserData();
    console.log('🔒 Privacy settings updated:', settings);
    return this.currentUser.privacySettings;
  }

  // =====================
  // Following & Social Connections
  // =====================

  async followUser(userId: string): Promise<boolean> {
    try {
      if (this.following.has(userId)) {
        console.log('Already following user:', userId);
        return false;
      }

      this.following.add(userId);
      this.saveFollowingData();

      // In a real app, this would make an API call
      console.log('✅ Now following user:', userId);

      // Trigger notification to the followed user
      await this.createNotification(userId, {
        type: 'follow',
        title: 'New Follower',
        message: `${this.currentUser?.displayName || 'Someone'} started following you!`,
        actionUrl: `/profile/${this.currentUser?.id}`
      });

      return true;
    } catch (error) {
      console.error('❌ Failed to follow user:', error);
      return false;
    }
  }

  async unfollowUser(userId: string): Promise<boolean> {
    try {
      if (!this.following.has(userId)) {
        console.log('Not following user:', userId);
        return false;
      }

      this.following.delete(userId);
      this.saveFollowingData();

      console.log('❌ Unfollowed user:', userId);
      return true;
    } catch (error) {
      console.error('❌ Failed to unfollow user:', error);
      return false;
    }
  }

  isFollowing(userId: string): boolean {
    return this.following.has(userId);
  }

  getFollowingList(): string[] {
    return Array.from(this.following);
  }

  // =====================
  // Outfit Posts & Feed
  // =====================

  async createOutfitPost(postData: Partial<OutfitPost>): Promise<OutfitPost> {
    if (!this.currentUser) {
      throw new Error('Must be logged in to create posts');
    }

    const post: OutfitPost = {
      id: `post_${Date.now()}`,
      userId: this.currentUser.id,
      username: this.currentUser.username,
      userAvatar: this.currentUser.avatar,
      outfitImage: postData.outfitImage || '',
      outfitItems: postData.outfitItems || [],
      caption: postData.caption || '',
      description: postData.description || '',
      tags: postData.tags || [],
      occasion: postData.occasion || 'casual',
      season: postData.season || 'all',
      likes: 0,
      comments: 0,
      saves: 0,
      shares: 0,
      views: 0,
      timestamp: new Date(),
      visibility: postData.visibility || 'public',
      isLiked: false,
      isSaved: false,
      challenge: postData.challenge,
      location: postData.location,
      brandCollabs: postData.brandCollabs || [],
      ...postData
    };

    // Save post to local storage (in real app, would save to backend)
    const posts = this.getSavedPosts();
    posts.unshift(post);
    localStorage.setItem('community_posts', JSON.stringify(posts));

    console.log('📸 Outfit post created:', post);
    return post;
  }

  async getFeedPosts(filter: 'trending' | 'following' | 'recent' = 'trending', limit: number = 20): Promise<OutfitPost[]> {
    try {
      // Get posts from local storage
      let posts = this.getSavedPosts();

      // Apply filtering logic
      switch (filter) {
        case 'following':
          const followingList = this.getFollowingList();
          posts = posts.filter(post => followingList.includes(post.userId));
          break;

        case 'trending':
          // Sort by engagement score (likes + comments + saves)
          posts = posts.sort((a, b) => {
            const scoreA = a.likes + a.comments + a.saves;
            const scoreB = b.likes + b.comments + b.saves;
            return scoreB - scoreA;
          });
          break;

        case 'recent':
          // Already sorted by timestamp in getSavedPosts
          break;
      }

      // Apply privacy filtering
      posts = posts.filter(post => {
        if (post.visibility === 'public') return true;
        if (post.visibility === 'friends' && this.isFollowing(post.userId)) return true;
        if (post.userId === this.currentUser?.id) return true;
        return false;
      });

      // Apply limit
      return posts.slice(0, limit);
    } catch (error) {
      console.error('❌ Failed to get feed posts:', error);
      return this.getMockPosts();
    }
  }

  // =====================
  // Post Interactions
  // =====================

  async likePost(postId: string): Promise<boolean> {
    try {
      const posts = this.getSavedPosts();
      const postIndex = posts.findIndex(p => p.id === postId);

      if (postIndex === -1) {
        console.error('Post not found:', postId);
        return false;
      }

      const post = posts[postIndex];
      const wasLiked = post.isLiked;

      post.isLiked = !post.isLiked;
      post.likes += post.isLiked ? 1 : -1;

      posts[postIndex] = post;
      localStorage.setItem('community_posts', JSON.stringify(posts));

      // Record interaction
      await this.recordInteraction({
        type: post.isLiked ? 'like' : 'unlike',
        userId: this.currentUser?.id || 'anonymous',
        targetId: postId,
        targetType: 'post',
        timestamp: new Date()
      });

      // Notify post owner if this is a new like
      if (post.isLiked && !wasLiked && post.userId !== this.currentUser?.id) {
        await this.createNotification(post.userId, {
          type: 'like',
          title: 'New Like',
          message: `${this.currentUser?.displayName} liked your outfit!`,
          actionUrl: `/post/${postId}`,
          imageUrl: post.outfitImage
        });
      }

      console.log(`${post.isLiked ? '❤️ Liked' : '💔 Unliked'} post:`, postId);
      return true;
    } catch (error) {
      console.error('❌ Failed to like post:', error);
      return false;
    }
  }

  async savePost(postId: string): Promise<boolean> {
    try {
      const posts = this.getSavedPosts();
      const postIndex = posts.findIndex(p => p.id === postId);

      if (postIndex === -1) return false;

      const post = posts[postIndex];
      post.isSaved = !post.isSaved;
      post.saves += post.isSaved ? 1 : -1;

      posts[postIndex] = post;
      localStorage.setItem('community_posts', JSON.stringify(posts));

      // Add to user's saved posts list
      const savedPosts = this.getUserSavedPosts();
      if (post.isSaved) {
        savedPosts.add(postId);
      } else {
        savedPosts.delete(postId);
      }
      localStorage.setItem('user_saved_posts', JSON.stringify(Array.from(savedPosts)));

      console.log(`${post.isSaved ? '🔖 Saved' : '📖 Unsaved'} post:`, postId);
      return true;
    } catch (error) {
      console.error('❌ Failed to save post:', error);
      return false;
    }
  }

  // =====================
  // Style Requests
  // =====================

  async createStyleRequest(requestData: Partial<StyleRequest>): Promise<StyleRequest> {
    if (!this.currentUser) {
      throw new Error('Must be logged in to create style requests');
    }

    const request: StyleRequest = {
      id: `request_${Date.now()}`,
      requesterId: this.currentUser.id,
      requesterName: this.currentUser.displayName,
      requesterAvatar: this.currentUser.avatar,
      title: requestData.title || 'Style Help Needed',
      description: requestData.description || '',
      occasion: requestData.occasion || 'casual',
      budget: requestData.budget,
      preferences: requestData.preferences || [],
      availableItems: requestData.availableItems || [],
      images: requestData.images || [],
      targetResponses: requestData.targetResponses || 5,
      responses: [],
      status: 'open',
      deadline: requestData.deadline,
      createdAt: new Date(),
      priority: requestData.priority || 'medium',
      ...requestData
    };

    // Save to local storage
    const requests = this.getSavedStyleRequests();
    requests.unshift(request);
    localStorage.setItem('style_requests', JSON.stringify(requests));

    console.log('🙋‍♀️ Style request created:', request);
    return request;
  }

  async respondToStyleRequest(requestId: string, response: Partial<StyleResponse>): Promise<StyleResponse> {
    if (!this.currentUser) {
      throw new Error('Must be logged in to respond to style requests');
    }

    const styleResponse: StyleResponse = {
      id: `response_${Date.now()}`,
      responderId: this.currentUser.id,
      responderName: this.currentUser.displayName,
      responderAvatar: this.currentUser.avatar,
      isStyleExpert: this.currentUser.isStyleExpert,
      outfitSuggestion: response.outfitSuggestion || {
        items: [],
        alternatives: [],
        description: 'Custom outfit suggestion'
      },
      explanation: response.explanation || '',
      tips: response.tips || [],
      rating: 0,
      helpful: 0,
      timestamp: new Date(),
      isSelected: false,
      ...response
    };

    // Add response to the request
    const requests = this.getSavedStyleRequests();
    const requestIndex = requests.findIndex(r => r.id === requestId);

    if (requestIndex !== -1) {
      requests[requestIndex].responses.push(styleResponse);
      localStorage.setItem('style_requests', JSON.stringify(requests));

      // Notify the requester
      await this.createNotification(requests[requestIndex].requesterId, {
        type: 'style_request',
        title: 'New Style Response',
        message: `${this.currentUser.displayName} responded to your style request!`,
        actionUrl: `/style-request/${requestId}`
      });
    }

    console.log('✨ Style response added:', styleResponse);
    return styleResponse;
  }

  // =====================
  // Comments
  // =====================

  async addComment(postId: string, content: string, parentCommentId?: string): Promise<Comment> {
    if (!this.currentUser) {
      throw new Error('Must be logged in to comment');
    }

    const comment: Comment = {
      id: `comment_${Date.now()}`,
      postId,
      userId: this.currentUser.id,
      username: this.currentUser.username,
      userAvatar: this.currentUser.avatar,
      content,
      likes: 0,
      replies: [],
      timestamp: new Date(),
      isLiked: false
    };

    // Save comment
    const comments = this.getSavedComments();
    comments.push(comment);
    localStorage.setItem('post_comments', JSON.stringify(comments));

    // Update post comment count
    const posts = this.getSavedPosts();
    const postIndex = posts.findIndex(p => p.id === postId);
    if (postIndex !== -1) {
      posts[postIndex].comments += 1;
      localStorage.setItem('community_posts', JSON.stringify(posts));

      // Notify post owner
      if (posts[postIndex].userId !== this.currentUser.id) {
        await this.createNotification(posts[postIndex].userId, {
          type: 'comment',
          title: 'New Comment',
          message: `${this.currentUser.displayName} commented on your outfit!`,
          actionUrl: `/post/${postId}`,
          imageUrl: posts[postIndex].outfitImage
        });
      }
    }

    console.log('💬 Comment added:', comment);
    return comment;
  }

  async getPostComments(postId: string): Promise<Comment[]> {
    const comments = this.getSavedComments();
    return comments.filter(c => c.postId === postId);
  }

  // =====================
  // Notifications
  // =====================

  async createNotification(userId: string, notificationData: Partial<Notification>): Promise<Notification> {
    const notification: Notification = {
      id: `notif_${Date.now()}`,
      userId,
      type: notificationData.type || 'feature',
      title: notificationData.title || 'Notification',
      message: notificationData.message || '',
      actionUrl: notificationData.actionUrl,
      imageUrl: notificationData.imageUrl,
      isRead: false,
      timestamp: new Date(),
      metadata: notificationData.metadata,
      ...notificationData
    };

    // Save notification
    const notifications = this.getSavedNotifications();
    notifications.unshift(notification);
    localStorage.setItem('user_notifications', JSON.stringify(notifications));

    console.log('🔔 Notification created:', notification);
    return notification;
  }

  async getNotifications(limit: number = 50): Promise<Notification[]> {
    const notifications = this.getSavedNotifications();
    return notifications.slice(0, limit);
  }

  async markNotificationAsRead(notificationId: string): Promise<boolean> {
    try {
      const notifications = this.getSavedNotifications();
      const notificationIndex = notifications.findIndex(n => n.id === notificationId);

      if (notificationIndex !== -1) {
        notifications[notificationIndex].isRead = true;
        localStorage.setItem('user_notifications', JSON.stringify(notifications));
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ Failed to mark notification as read:', error);
      return false;
    }
  }

  // =====================
  // Helper Methods
  // =====================

  private loadUserData(): void {
    try {
      const userData = localStorage.getItem('community_user');
      if (userData) {
        this.currentUser = JSON.parse(userData);
      } else {
        // Create default user if none exists
        this.currentUser = this.createDefaultUser();
      }

      const followingData = localStorage.getItem('user_following');
      if (followingData) {
        this.following = new Set(JSON.parse(followingData));
      }
    } catch (error) {
      console.error('❌ Failed to load user data:', error);
      this.currentUser = this.createDefaultUser();
    }
  }

  private createDefaultUser(): CommunityUser {
    return {
      id: `user_${Date.now()}`,
      username: 'fashion_lover',
      displayName: 'Fashion Lover',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
      bio: 'Passionate about style and fashion! 💫',
      joinDate: new Date(),
      followers: 0,
      following: 0,
      isVerified: false,
      isStyleExpert: false,
      stylePreferences: ['casual', 'minimal', 'modern'],
      privacySettings: {
        profileVisibility: 'public',
        closetVisibility: 'public',
        activityVisibility: 'public',
        allowStyleRequests: true,
        allowMessages: true,
        showOnlineStatus: true
      }
    };
  }

  private saveUserData(): void {
    if (this.currentUser) {
      localStorage.setItem('community_user', JSON.stringify(this.currentUser));
    }
  }

  private saveFollowingData(): void {
    localStorage.setItem('user_following', JSON.stringify(Array.from(this.following)));
  }

  private getSavedPosts(): OutfitPost[] {
    try {
      const posts = localStorage.getItem('community_posts');
      return posts ? JSON.parse(posts) : this.getMockPosts();
    } catch (error) {
      console.error('❌ Failed to get saved posts:', error);
      return this.getMockPosts();
    }
  }

  private getSavedComments(): Comment[] {
    try {
      const comments = localStorage.getItem('post_comments');
      return comments ? JSON.parse(comments) : [];
    } catch (error) {
      console.error('❌ Failed to get saved comments:', error);
      return [];
    }
  }

  private getSavedStyleRequests(): StyleRequest[] {
    try {
      const requests = localStorage.getItem('style_requests');
      return requests ? JSON.parse(requests) : [];
    } catch (error) {
      console.error('❌ Failed to get saved style requests:', error);
      return [];
    }
  }

  private getSavedNotifications(): Notification[] {
    try {
      const notifications = localStorage.getItem('user_notifications');
      return notifications ? JSON.parse(notifications) : [];
    } catch (error) {
      console.error('❌ Failed to get saved notifications:', error);
      return [];
    }
  }

  private getUserSavedPosts(): Set<string> {
    try {
      const saved = localStorage.getItem('user_saved_posts');
      return new Set(saved ? JSON.parse(saved) : []);
    } catch (error) {
      console.error('❌ Failed to get user saved posts:', error);
      return new Set();
    }
  }

  private async recordInteraction(interaction: Interaction): Promise<void> {
    // Record interaction for analytics (simplified implementation)
    const interactions = JSON.parse(localStorage.getItem('user_interactions') || '[]');
    interactions.push(interaction);
    localStorage.setItem('user_interactions', JSON.stringify(interactions));
  }

  private getMockPosts(): OutfitPost[] {
    return [
      {
        id: 'mock_1',
        userId: 'user1',
        username: 'stylequeen_alex',
        userAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b647?w=150',
        outfitImage: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400',
        caption: 'Perfect autumn vibes! 🍂 Loving this cozy oversized sweater with leather boots.',
        tags: ['autumn', 'cozy', 'sweater', 'boots'],
        occasion: 'casual',
        season: 'fall',
        likes: 127,
        comments: 23,
        saves: 45,
        shares: 12,
        views: 890,
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        visibility: 'public',
        isLiked: false,
        isSaved: true,
        challenge: 'Monochrome Monday'
      }
    ];
  }

  // =====================
  // Public API Methods
  // =====================

  async initializeUser(userData: Partial<CommunityUser>): Promise<CommunityUser> {
    this.currentUser = {
      ...this.createDefaultUser(),
      ...userData
    };
    this.saveUserData();
    return this.currentUser;
  }

  async searchUsers(query: string): Promise<CommunityUser[]> {
    // Mock implementation - in real app would search backend
    const mockUsers: CommunityUser[] = [
      {
        id: 'expert1',
        username: 'fashion_guru_jen',
        displayName: 'Jennifer Style',
        avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150',
        bio: 'Professional stylist with 10+ years experience ✨',
        joinDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
        followers: 12500,
        following: 890,
        isVerified: true,
        isStyleExpert: true,
        stylePreferences: ['professional', 'elegant', 'modern'],
        privacySettings: {
          profileVisibility: 'public',
          closetVisibility: 'public',
          activityVisibility: 'friends',
          allowStyleRequests: true,
          allowMessages: true,
          showOnlineStatus: false
        }
      }
    ];

    return mockUsers.filter(user =>
      user.username.toLowerCase().includes(query.toLowerCase()) ||
      user.displayName.toLowerCase().includes(query.toLowerCase())
    );
  }

  getStats(): {
    postsCount: number;
    followersCount: number;
    followingCount: number;
    likesReceived: number;
    commentsReceived: number;
  } {
    const posts = this.getSavedPosts().filter(p => p.userId === this.currentUser?.id);
    const likesReceived = posts.reduce((sum, post) => sum + post.likes, 0);
    const commentsReceived = posts.reduce((sum, post) => sum + post.comments, 0);

    return {
      postsCount: posts.length,
      followersCount: this.currentUser?.followers || 0,
      followingCount: this.following.size,
      likesReceived,
      commentsReceived
    };
  }
}

// Export singleton instance
export default new CommunityService();
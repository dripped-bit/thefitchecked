import React, { useState, useEffect } from 'react';
import {
  User, Settings, Edit3, Camera, MapPin, Calendar, Link2,
  Lock, Eye, EyeOff, Users, Heart, MessageCircle, Share2,
  Grid, List, BookOpen, Award, Crown, Verified, Shield,
  Globe, UserCheck, Mail, Bell, Image, ChevronDown,
  Save, X, Check, AlertCircle, Info
} from 'lucide-react';
import communityService, { CommunityUser, PrivacySettings, OutfitPost } from '../services/communityService';

interface PublicProfileProps {
  userId?: string;
  onBack: () => void;
  isOwnProfile?: boolean;
}

interface ProfileTab {
  id: 'posts' | 'saved' | 'collections' | 'settings';
  label: string;
  icon: React.ComponentType<any>;
}

const PublicProfile: React.FC<PublicProfileProps> = ({
  userId,
  onBack,
  isOwnProfile = false
}) => {
  // State Management
  const [user, setUser] = useState<CommunityUser | null>(null);
  const [userPosts, setUserPosts] = useState<OutfitPost[]>([]);
  const [activeTab, setActiveTab] = useState<'posts' | 'saved' | 'collections' | 'settings'>('posts');
  const [isEditing, setIsEditing] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Edit State
  const [editForm, setEditForm] = useState({
    displayName: '',
    bio: '',
    location: '',
    website: ''
  });

  // Privacy State
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    profileVisibility: 'public',
    closetVisibility: 'public',
    activityVisibility: 'public',
    allowStyleRequests: true,
    allowMessages: true,
    showOnlineStatus: true
  });

  // Load user data
  useEffect(() => {
    loadUserData();
  }, [userId]);

  const loadUserData = async () => {
    try {
      setLoading(true);

      // Get current user data
      const currentUser = await communityService.getCurrentUser();

      if (isOwnProfile || !userId) {
        setUser(currentUser);
        if (currentUser) {
          setPrivacySettings(currentUser.privacySettings);
          setEditForm({
            displayName: currentUser.displayName,
            bio: currentUser.bio,
            location: currentUser.location || '',
            website: currentUser.website || ''
          });
        }
      } else {
        // In a real app, this would fetch the specific user's profile
        setUser(currentUser); // Mock implementation
      }

      // Load user's posts
      const posts = await communityService.getFeedPosts('recent');
      const userSpecificPosts = posts.filter(post =>
        post.userId === (userId || currentUser?.id)
      );
      setUserPosts(userSpecificPosts);

      // Check if following (for other users' profiles)
      if (!isOwnProfile && userId) {
        setIsFollowing(communityService.isFollowing(userId));
      }

    } catch (error) {
      console.error('Failed to load user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    try {
      await communityService.updateProfile({
        displayName: editForm.displayName,
        bio: editForm.bio,
        location: editForm.location,
        website: editForm.website
      });

      setUser(prev => prev ? {
        ...prev,
        displayName: editForm.displayName,
        bio: editForm.bio,
        location: editForm.location,
        website: editForm.website
      } : null);

      setIsEditing(false);
      console.log('✅ Profile updated successfully');
    } catch (error) {
      console.error('❌ Failed to update profile:', error);
    }
  };

  const handlePrivacyUpdate = async (newSettings: Partial<PrivacySettings>) => {
    try {
      const updatedSettings = await communityService.updatePrivacySettings(newSettings);
      setPrivacySettings(updatedSettings);
      console.log('✅ Privacy settings updated');
    } catch (error) {
      console.error('❌ Failed to update privacy settings:', error);
    }
  };

  const handleFollow = async () => {
    if (!user || isOwnProfile) return;

    try {
      if (isFollowing) {
        await communityService.unfollowUser(user.id);
        setIsFollowing(false);
        setUser(prev => prev ? { ...prev, followers: prev.followers - 1 } : null);
      } else {
        await communityService.followUser(user.id);
        setIsFollowing(true);
        setUser(prev => prev ? { ...prev, followers: prev.followers + 1 } : null);
      }
    } catch (error) {
      console.error('❌ Failed to follow/unfollow user:', error);
    }
  };

  const tabs: ProfileTab[] = [
    { id: 'posts', label: 'Posts', icon: Grid },
    { id: 'saved', label: 'Saved', icon: BookOpen },
    { id: 'collections', label: 'Collections', icon: Heart },
    ...(isOwnProfile ? [{ id: 'settings' as const, label: 'Settings', icon: Settings }] : [])
  ];

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case 'public': return <Globe className="w-4 h-4 text-green-600" />;
      case 'friends': return <Users className="w-4 h-4 text-blue-600" />;
      case 'private': return <Lock className="w-4 h-4 text-red-600" />;
      default: return <Globe className="w-4 h-4 text-gray-600" />;
    }
  };

  const getVisibilityLabel = (visibility: string) => {
    switch (visibility) {
      case 'public': return 'Public';
      case 'friends': return 'Friends Only';
      case 'private': return 'Private';
      default: return 'Public';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Profile not found</p>
          <button
            onClick={onBack}
            className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={onBack}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <User className="w-5 h-5" />
              <span>Back to Feed</span>
            </button>

            <div className="flex items-center space-x-3">
              {isOwnProfile ? (
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className={`px-4 py-2 rounded-lg transition-all ${
                    isEditing
                      ? 'bg-gray-100 text-gray-700'
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    {isEditing ? <X className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                    <span>{isEditing ? 'Cancel' : 'Edit Profile'}</span>
                  </div>
                </button>
              ) : (
                <div className="flex items-center space-x-2">
                  <button className="p-2 text-gray-600 hover:text-gray-800 transition-colors">
                    <MessageCircle className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleFollow}
                    className={`px-4 py-2 rounded-lg transition-all ${
                      isFollowing
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        : 'bg-purple-600 text-white hover:bg-purple-700'
                    }`}
                  >
                    {isFollowing ? 'Following' : 'Follow'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Profile Header */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-200 mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-6 md:space-y-0 md:space-x-8">
            {/* Avatar */}
            <div className="relative">
              <img
                src={user.avatar}
                alt={user.displayName}
                className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
              />
              {isOwnProfile && isEditing && (
                <button className="absolute -bottom-2 -right-2 w-10 h-10 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-colors">
                  <Camera className="w-5 h-5 mx-auto" />
                </button>
              )}
              {user.isVerified && (
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center">
                  <Verified className="w-4 h-4" />
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
                    <input
                      type="text"
                      value={editForm.displayName}
                      onChange={(e) => setEditForm(prev => ({ ...prev, displayName: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                    <textarea
                      value={editForm.bio}
                      onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                      <input
                        type="text"
                        value={editForm.location}
                        onChange={(e) => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                        placeholder="City, Country"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                      <input
                        type="url"
                        value={editForm.website}
                        onChange={(e) => setEditForm(prev => ({ ...prev, website: e.target.value }))}
                        placeholder="https://..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={handleSaveProfile}
                      className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      <div className="flex items-center space-x-2">
                        <Save className="w-4 h-4" />
                        <span>Save Changes</span>
                      </div>
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <h1 className="text-2xl font-bold text-gray-800">{user.displayName}</h1>
                    {user.isStyleExpert && (
                      <div className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
                        <Crown className="w-3 h-3" />
                        <span>Style Expert</span>
                      </div>
                    )}
                  </div>
                  <p className="text-gray-600 text-lg mb-1">@{user.username}</p>
                  {user.bio && <p className="text-gray-700 mb-4">{user.bio}</p>}

                  <div className="flex items-center space-x-6 text-sm text-gray-600 mb-4">
                    {user.location && (
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-4 h-4" />
                        <span>{user.location}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>Joined {user.joinDate.toLocaleDateString()}</span>
                    </div>
                    {user.website && (
                      <a
                        href={user.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-1 text-purple-600 hover:text-purple-800"
                      >
                        <Link2 className="w-4 h-4" />
                        <span>Website</span>
                      </a>
                    )}
                  </div>

                  <div className="flex items-center space-x-6 text-sm">
                    <div className="text-center">
                      <div className="font-bold text-gray-800">{user.followers.toLocaleString()}</div>
                      <div className="text-gray-600">Followers</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-gray-800">{user.following.toLocaleString()}</div>
                      <div className="text-gray-600">Following</div>
                    </div>
                    <div className="text-center">
                      <div className="font-bold text-gray-800">{userPosts.length}</div>
                      <div className="text-gray-600">Posts</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 mb-8">
          <div className="flex items-center justify-between p-2">
            <div className="flex space-x-1">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                      activeTab === tab.id
                        ? 'bg-purple-100 text-purple-700'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {isOwnProfile && (
              <button
                onClick={() => setShowPrivacyModal(true)}
                className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <Shield className="w-4 h-4" />
                <span className="text-sm">Privacy</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'posts' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userPosts.map(post => (
                <div key={post.id} className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 overflow-hidden">
                  <img
                    src={post.outfitImage}
                    alt="Outfit"
                    className="w-full h-64 object-cover"
                  />
                  <div className="p-4">
                    <p className="text-gray-800 text-sm mb-2 line-clamp-2">{post.caption}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center space-x-3">
                        <span className="flex items-center space-x-1">
                          <Heart className="w-3 h-3" />
                          <span>{post.likes}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <MessageCircle className="w-3 h-3" />
                          <span>{post.comments}</span>
                        </span>
                      </div>
                      <span>{post.timestamp.toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              ))}

              {userPosts.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <Image className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No posts yet</p>
                  {isOwnProfile && (
                    <p className="text-gray-400 text-sm mt-1">Share your first outfit to get started!</p>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && isOwnProfile && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-800 mb-6">Account Settings</h3>

              <div className="space-y-6">
                {/* Privacy Quick Settings */}
                <div>
                  <h4 className="font-medium text-gray-800 mb-3">Privacy & Visibility</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getVisibilityIcon(privacySettings.profileVisibility)}
                        <div>
                          <p className="font-medium text-gray-800">Profile Visibility</p>
                          <p className="text-sm text-gray-600">Who can see your profile</p>
                        </div>
                      </div>
                      <span className="text-sm text-gray-600">{getVisibilityLabel(privacySettings.profileVisibility)}</span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        {getVisibilityIcon(privacySettings.closetVisibility)}
                        <div>
                          <p className="font-medium text-gray-800">Closet Visibility</p>
                          <p className="text-sm text-gray-600">Who can see your clothing items</p>
                        </div>
                      </div>
                      <span className="text-sm text-gray-600">{getVisibilityLabel(privacySettings.closetVisibility)}</span>
                    </div>

                    <button
                      onClick={() => setShowPrivacyModal(true)}
                      className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      Manage All Privacy Settings
                    </button>
                  </div>
                </div>

                {/* Feature Toggles */}
                <div>
                  <h4 className="font-medium text-gray-800 mb-3">Features</h4>
                  <div className="space-y-3">
                    <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer">
                      <div>
                        <p className="font-medium text-gray-800">Style Requests</p>
                        <p className="text-sm text-gray-600">Allow others to ask for styling help</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={privacySettings.allowStyleRequests}
                        onChange={(e) => handlePrivacyUpdate({ allowStyleRequests: e.target.checked })}
                        className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer">
                      <div>
                        <p className="font-medium text-gray-800">Direct Messages</p>
                        <p className="text-sm text-gray-600">Allow others to message you directly</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={privacySettings.allowMessages}
                        onChange={(e) => handlePrivacyUpdate({ allowMessages: e.target.checked })}
                        className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {(activeTab === 'saved' || activeTab === 'collections') && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-12 border border-gray-200 text-center">
              <div className="text-gray-400 mb-4">
                {activeTab === 'saved' ? <BookOpen className="w-12 h-12 mx-auto" /> : <Heart className="w-12 h-12 mx-auto" />}
              </div>
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                {activeTab === 'saved' ? 'Saved Outfits' : 'Style Collections'}
              </h3>
              <p className="text-gray-500">
                {activeTab === 'saved'
                  ? 'Your saved outfits will appear here'
                  : 'Create collections to organize your favorite styles'
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Privacy Settings Modal */}
      {showPrivacyModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-800">Privacy Settings</h3>
              <button
                onClick={() => setShowPrivacyModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Profile Visibility */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Profile Visibility</label>
                <select
                  value={privacySettings.profileVisibility}
                  onChange={(e) => handlePrivacyUpdate({ profileVisibility: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="public">Public - Anyone can see</option>
                  <option value="friends">Friends Only</option>
                  <option value="private">Private - Only me</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Controls who can view your profile information</p>
              </div>

              {/* Closet Visibility */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Closet Visibility</label>
                <select
                  value={privacySettings.closetVisibility}
                  onChange={(e) => handlePrivacyUpdate({ closetVisibility: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="public">Public - Anyone can see</option>
                  <option value="friends">Friends Only</option>
                  <option value="private">Private - Only me</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Controls who can see your clothing items and wardrobe</p>
              </div>

              {/* Activity Visibility */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Activity Visibility</label>
                <select
                  value={privacySettings.activityVisibility}
                  onChange={(e) => handlePrivacyUpdate({ activityVisibility: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="public">Public - Anyone can see</option>
                  <option value="friends">Friends Only</option>
                  <option value="private">Private - Only me</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">Controls who can see your likes, comments, and activity</p>
              </div>

              {/* Feature Toggles */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-800">Communication Preferences</h4>

                <label className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-800">Allow Style Requests</p>
                    <p className="text-sm text-gray-600">Let others ask you for outfit advice</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={privacySettings.allowStyleRequests}
                    onChange={(e) => handlePrivacyUpdate({ allowStyleRequests: e.target.checked })}
                    className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                  />
                </label>

                <label className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-800">Allow Direct Messages</p>
                    <p className="text-sm text-gray-600">Receive messages from other users</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={privacySettings.allowMessages}
                    onChange={(e) => handlePrivacyUpdate({ allowMessages: e.target.checked })}
                    className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                  />
                </label>

                <label className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-800">Show Online Status</p>
                    <p className="text-sm text-gray-600">Let others see when you're active</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={privacySettings.showOnlineStatus}
                    onChange={(e) => handlePrivacyUpdate({ showOnlineStatus: e.target.checked })}
                    className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                  />
                </label>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-start space-x-3">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-800">Privacy Tip</p>
                    <p className="text-sm text-blue-700">
                      You can always change these settings later. Your privacy and safety are our top priority.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicProfile;
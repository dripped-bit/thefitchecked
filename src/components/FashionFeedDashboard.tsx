import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, Heart, MessageCircle, Share2, Bookmark, Users,
  TrendingUp, Award, Crown, Sparkles, Calendar, Camera,
  Search, Filter, Settings, Plus, ChevronDown, Clock,
  Star, ThumbsUp, Eye, Zap, Target, Gift, Trophy,
  CheckCircle, User, X, Copy, Link, Mail, Twitter
} from 'lucide-react';

interface FashionFeedDashboardProps {
  onBack: () => void;
  userData?: any;
}

interface OutfitPost {
  id: string;
  userId: string;
  username: string;
  userAvatar: string;
  outfitImage: string;
  caption: string;
  tags: string[];
  likes: number;
  comments: number;
  saves: number;
  timestamp: Date;
  isLiked: boolean;
  isSaved: boolean;
  challenge?: string;
}

interface StyleChallenge {
  id: string;
  title: string;
  description: string;
  theme: string;
  endDate: Date;
  participants: number;
  prize: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface CommunityUser {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  followers: number;
  isFollowing: boolean;
  isStyleExpert: boolean;
}

const FashionFeedDashboard: React.FC<FashionFeedDashboardProps> = ({
  onBack,
  userData
}) => {
  // State Management
  const [activeTab, setActiveTab] = useState<'feed' | 'challenges' | 'discover' | 'profile'>('feed');
  const [feedFilter, setFeedFilter] = useState<'trending' | 'following' | 'recent'>('trending');
  const [showStyleMe, setShowStyleMe] = useState(false);

  // Mock Data
  const [outfitPosts, setOutfitPosts] = useState<OutfitPost[]>([
    {
      id: '1',
      userId: 'user1',
      username: 'stylequeen_alex',
      userAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b647?w=150',
      outfitImage: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400',
      caption: 'Perfect autumn vibes! 🍂 Loving this cozy oversized sweater with leather boots. What do you think?',
      tags: ['autumn', 'cozy', 'sweater', 'boots'],
      likes: 127,
      comments: 23,
      saves: 45,
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      isLiked: false,
      isSaved: true,
      challenge: 'Monochrome Monday'
    },
    {
      id: '2',
      userId: 'user2',
      username: 'minimalist_maya',
      userAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
      outfitImage: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400',
      caption: 'Clean lines and neutral tones for a productive Tuesday ✨',
      tags: ['minimalist', 'neutral', 'professional'],
      likes: 89,
      comments: 12,
      saves: 31,
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
      isLiked: true,
      isSaved: false
    }
  ]);

  const [styleChallenges, setStyleChallenges] = useState<StyleChallenge[]>([
    {
      id: '1',
      title: 'Monochrome Monday',
      description: 'Create a stunning single-color outfit using different shades and textures',
      theme: 'monochrome',
      endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      participants: 234,
      prize: 'Featured on our homepage + $50 shopping credit',
      difficulty: 'easy',
      isJoined: false,
      hasSubmitted: false,
      submissions: 45,
      topSubmissions: [
        {
          id: 'sub1',
          userId: 'user1',
          username: 'style_maven',
          avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b647?w=150',
          outfitImage: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400',
          votes: 89,
          description: 'All black ensemble with textured layers'
        },
        {
          id: 'sub2',
          userId: 'user2',
          username: 'fashion_forward',
          avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
          outfitImage: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400',
          votes: 72,
          description: 'White on white with silver accessories'
        }
      ]
    },
    {
      id: '2',
      title: 'Vintage Vibes',
      description: 'Show us your best vintage-inspired look with modern twists',
      theme: 'vintage',
      endDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      participants: 156,
      prize: 'Personal styling session + wardrobe consultation',
      difficulty: 'medium',
      isJoined: true,
      hasSubmitted: false,
      submissions: 23,
      topSubmissions: []
    },
    {
      id: '3',
      title: 'Sustainable Style',
      description: 'Create an eco-friendly outfit using thrifted or sustainable pieces',
      theme: 'sustainable',
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      participants: 89,
      prize: 'Sustainable fashion brand collaboration + $100 eco-fashion voucher',
      difficulty: 'hard',
      isJoined: false,
      hasSubmitted: false,
      submissions: 12,
      topSubmissions: []
    }
  ]);
  const [showChallengeSubmission, setShowChallengeSubmission] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<StyleChallenge | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedPost, setSelectedPost] = useState<OutfitPost | null>(null);
  const [showCreatePost, setShowCreatePost] = useState(false);

  const [suggestedUsers, setSuggestedUsers] = useState<CommunityUser[]>([
    {
      id: '1',
      username: 'fashion_guru_jen',
      displayName: 'Jennifer Style',
      avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150',
      followers: 12500,
      isFollowing: false,
      isStyleExpert: true
    },
    {
      id: '2',
      username: 'streetwear_sam',
      displayName: 'Sam Chen',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      followers: 8900,
      isFollowing: false,
      isStyleExpert: false
    }
  ]);

  // Interaction Handlers
  const handleLike = (postId: string) => {
    setOutfitPosts(prev => prev.map(post =>
      post.id === postId
        ? {
            ...post,
            isLiked: !post.isLiked,
            likes: post.isLiked ? post.likes - 1 : post.likes + 1
          }
        : post
    ));
  };

  const handleSave = (postId: string) => {
    setOutfitPosts(prev => prev.map(post =>
      post.id === postId
        ? {
            ...post,
            isSaved: !post.isSaved,
            saves: post.isSaved ? post.saves - 1 : post.saves + 1
          }
        : post
    ));
  };

  const handleFollow = (userId: string) => {
    setSuggestedUsers(prev => prev.map(user =>
      user.id === userId
        ? {
            ...user,
            isFollowing: !user.isFollowing,
            followers: user.isFollowing ? user.followers - 1 : user.followers + 1
          }
        : user
    ));
  };

  const handleJoinChallenge = (challengeId: string) => {
    setStyleChallenges(prev => prev.map(challenge =>
      challenge.id === challengeId
        ? {
            ...challenge,
            isJoined: !challenge.isJoined,
            participants: challenge.isJoined ? challenge.participants - 1 : challenge.participants + 1
          }
        : challenge
    ));
  };

  const handleSubmitToChallenge = (challenge: StyleChallenge) => {
    setSelectedChallenge(challenge);
    setShowChallengeSubmission(true);
  };

  const handleVoteSubmission = (challengeId: string, submissionId: string) => {
    setStyleChallenges(prev => prev.map(challenge =>
      challenge.id === challengeId
        ? {
            ...challenge,
            topSubmissions: challenge.topSubmissions?.map(sub =>
              sub.id === submissionId
                ? { ...sub, votes: sub.votes + 1 }
                : sub
            ) || []
          }
        : challenge
    ));
  };

  const handleShare = (post: OutfitPost) => {
    setSelectedPost(post);
    setShowShareModal(true);
  };

  const formatTimeAgo = (date: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-indigo-50">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back</span>
              </button>

              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
                  <Users className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-gray-800">Fashion Feed</h1>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button className="relative p-2 text-gray-600 hover:text-gray-800 transition-colors">
                <Search className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowCreatePost(true)}
                className="bg-gradient-to-r from-green-600 to-teal-600 text-white px-4 py-2 rounded-lg hover:from-green-700 hover:to-teal-700 transition-all"
              >
                <div className="flex items-center space-x-2">
                  <Plus className="w-4 h-4" />
                  <span>Share Outfit</span>
                </div>
              </button>
              <button
                onClick={() => setShowStyleMe(true)}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
              >
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4" />
                  <span>Style Me</span>
                </div>
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex space-x-6 mt-4">
            {[
              { id: 'feed', label: 'Feed', icon: TrendingUp },
              { id: 'challenges', label: 'Challenges', icon: Target },
              { id: 'discover', label: 'Discover', icon: Eye },
              { id: 'profile', label: 'My Profile', icon: User }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
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
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

          {/* Left Sidebar - Community Info */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200">
              <h3 className="font-semibold text-gray-800 mb-4">Community</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Active Stylists</span>
                  <span className="font-semibold text-purple-600">127</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Outfits Today</span>
                  <span className="font-semibold text-pink-600">234</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Active Challenges</span>
                  <span className="font-semibold text-indigo-600">5</span>
                </div>
              </div>
            </div>

            {/* Suggested Users */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200">
              <h3 className="font-semibold text-gray-800 mb-4">Suggested Stylists</h3>
              <div className="space-y-3">
                {suggestedUsers.map(user => (
                  <div key={user.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <img
                        src={user.avatar}
                        alt={user.displayName}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div>
                        <div className="flex items-center space-x-1">
                          <p className="font-medium text-sm text-gray-800">{user.displayName}</p>
                          {user.isStyleExpert && (
                            <Crown className="w-3 h-3 text-yellow-500" />
                          )}
                        </div>
                        <p className="text-xs text-gray-500">{user.followers.toLocaleString()} followers</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleFollow(user.id)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                        user.isFollowing
                          ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          : 'bg-purple-600 text-white hover:bg-purple-700'
                      }`}
                    >
                      {user.isFollowing ? 'Following' : 'Follow'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Feed */}
          <div className="lg:col-span-2 space-y-6">
            {activeTab === 'feed' && (
              <>
                {/* Feed Filters */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 border border-gray-200">
                  <div className="flex items-center space-x-4">
                    {['trending', 'following', 'recent'].map(filter => (
                      <button
                        key={filter}
                        onClick={() => setFeedFilter(filter as any)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          feedFilter === filter
                            ? 'bg-purple-100 text-purple-700'
                            : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                        }`}
                      >
                        {filter.charAt(0).toUpperCase() + filter.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Outfit Posts */}
                <div className="space-y-6">
                  {outfitPosts.map(post => (
                    <div key={post.id} className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200 overflow-hidden">
                      {/* Post Header */}
                      <div className="p-4 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <img
                            src={post.userAvatar}
                            alt={post.username}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <div>
                            <p className="font-medium text-gray-800">{post.username}</p>
                            <p className="text-xs text-gray-500">{formatTimeAgo(post.timestamp)}</p>
                          </div>
                        </div>

                        {post.challenge && (
                          <div className="bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 px-3 py-1 rounded-full text-xs font-medium">
                            {post.challenge}
                          </div>
                        )}
                      </div>

                      {/* Outfit Image */}
                      <div className="relative">
                        <img
                          src={post.outfitImage}
                          alt="Outfit"
                          className="w-full h-96 object-cover"
                        />
                      </div>

                      {/* Post Actions */}
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-4">
                            <button
                              onClick={() => handleLike(post.id)}
                              className={`flex items-center space-x-1 transition-colors ${
                                post.isLiked ? 'text-red-500' : 'text-gray-600 hover:text-red-500'
                              }`}
                            >
                              <Heart className={`w-5 h-5 ${post.isLiked ? 'fill-current' : ''}`} />
                              <span className="text-sm">{post.likes}</span>
                            </button>

                            <button className="flex items-center space-x-1 text-gray-600 hover:text-gray-800 transition-colors">
                              <MessageCircle className="w-5 h-5" />
                              <span className="text-sm">{post.comments}</span>
                            </button>

                            <button
                              onClick={() => handleShare(post)}
                              className="text-gray-600 hover:text-gray-800 transition-colors"
                            >
                              <Share2 className="w-5 h-5" />
                            </button>
                          </div>

                          <button
                            onClick={() => handleSave(post.id)}
                            className={`transition-colors ${
                              post.isSaved ? 'text-purple-600' : 'text-gray-600 hover:text-purple-600'
                            }`}
                          >
                            <Bookmark className={`w-5 h-5 ${post.isSaved ? 'fill-current' : ''}`} />
                          </button>
                        </div>

                        {/* Caption */}
                        <p className="text-gray-800 mb-2">{post.caption}</p>

                        {/* Tags */}
                        <div className="flex items-center space-x-2">
                          {post.tags.map(tag => (
                            <span
                              key={tag}
                              className="bg-gray-100 text-gray-700 px-2 py-1 rounded-lg text-xs"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {activeTab === 'challenges' && (
              <div className="space-y-6">
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200">
                  <h2 className="text-xl font-bold text-gray-800 mb-4">Weekly Style Challenges</h2>
                  <div className="space-y-6">
                    {styleChallenges.map(challenge => (
                      <div key={challenge.id} className="border border-gray-200 rounded-xl p-6 bg-white/50">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="font-semibold text-gray-800 text-lg">{challenge.title}</h3>
                              <span className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(challenge.difficulty)}`}>
                                {challenge.difficulty}
                              </span>
                              {challenge.isJoined && (
                                <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                  Joined
                                </span>
                              )}
                            </div>
                            <p className="text-gray-600 text-sm mb-3">{challenge.description}</p>
                            <div className="flex items-center space-x-6 text-xs text-gray-500 mb-4">
                              <div className="flex items-center space-x-1">
                                <Users className="w-3 h-3" />
                                <span>{challenge.participants} participants</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Camera className="w-3 h-3" />
                                <span>{challenge.submissions} submissions</span>
                              </div>
                              <span>Ends {challenge.endDate.toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg mb-4">
                          <div className="flex items-center space-x-2 mb-2">
                            <Gift className="w-4 h-4 text-purple-600" />
                            <span className="font-medium text-purple-800 text-sm">Prize</span>
                          </div>
                          <p className="text-purple-700 text-sm">{challenge.prize}</p>
                        </div>

                        {challenge.topSubmissions && challenge.topSubmissions.length > 0 && (
                          <div className="mb-4">
                            <h4 className="font-medium text-gray-700 mb-3 flex items-center space-x-2">
                              <Trophy className="w-4 h-4 text-yellow-500" />
                              <span>Top Submissions</span>
                            </h4>
                            <div className="grid grid-cols-2 gap-3">
                              {challenge.topSubmissions.slice(0, 2).map(submission => (
                                <div key={submission.id} className="relative group">
                                  <div className="aspect-[3/4] rounded-lg overflow-hidden bg-gray-100">
                                    <img
                                      src={submission.outfitImage}
                                      alt={submission.description}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                    <div className="absolute bottom-2 left-2 right-2">
                                      <div className="bg-white/90 backdrop-blur-sm rounded-lg p-2">
                                        <div className="flex items-center space-x-2 mb-1">
                                          <img
                                            src={submission.avatar}
                                            alt={submission.username}
                                            className="w-5 h-5 rounded-full"
                                          />
                                          <span className="text-xs font-medium text-gray-800">
                                            @{submission.username}
                                          </span>
                                        </div>
                                        <p className="text-xs text-gray-600 truncate">
                                          {submission.description}
                                        </p>
                                        <button
                                          onClick={() => handleVoteSubmission(challenge.id, submission.id)}
                                          className="flex items-center space-x-1 mt-1 text-xs text-purple-600 hover:text-purple-800"
                                        >
                                          <Heart className="w-3 h-3" />
                                          <span>{submission.votes}</span>
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex space-x-3">
                          {!challenge.isJoined ? (
                            <button
                              onClick={() => handleJoinChallenge(challenge.id)}
                              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2.5 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-medium"
                            >
                              Join Challenge
                            </button>
                          ) : (
                            <>
                              {!challenge.hasSubmitted ? (
                                <button
                                  onClick={() => handleSubmitToChallenge(challenge)}
                                  className="flex-1 bg-gradient-to-r from-green-600 to-teal-600 text-white py-2.5 rounded-lg hover:from-green-700 hover:to-teal-700 transition-all font-medium flex items-center justify-center space-x-2"
                                >
                                  <Camera className="w-4 h-4" />
                                  <span>Submit Entry</span>
                                </button>
                              ) : (
                                <button
                                  disabled
                                  className="flex-1 bg-gray-400 text-white py-2.5 rounded-lg font-medium flex items-center justify-center space-x-2"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                  <span>Submitted</span>
                                </button>
                              )}
                              <button
                                onClick={() => handleJoinChallenge(challenge.id)}
                                className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all"
                              >
                                Leave
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'discover' && (
              <div className="space-y-6">
                {/* Discovery Filters */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-800">Discover Styles</h2>
                    <button className="text-purple-600 hover:text-purple-800 transition-colors">
                      <Filter className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {['All', 'Casual', 'Formal', 'Streetwear', 'Vintage', 'Minimalist', 'Bohemian', 'Elegant'].map(style => (
                      <button
                        key={style}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-purple-100 hover:text-purple-700 transition-colors"
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Trending Outfits Grid */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200">
                  <h3 className="font-semibold text-gray-800 mb-4 flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5 text-orange-500" />
                    <span>Trending This Week</span>
                  </h3>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                      {
                        id: 'trend1',
                        image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400',
                        user: 'style_maven',
                        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b647?w=150',
                        likes: 145,
                        tags: ['Monochrome', 'Chic'],
                        description: 'All black sophistication'
                      },
                      {
                        id: 'trend2',
                        image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400',
                        user: 'fashion_forward',
                        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
                        likes: 98,
                        tags: ['Vintage', 'Elegant'],
                        description: 'Retro elegance'
                      },
                      {
                        id: 'trend3',
                        image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400',
                        user: 'street_style_pro',
                        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
                        likes: 127,
                        tags: ['Casual', 'Street'],
                        description: 'Effortless streetwear'
                      },
                      {
                        id: 'trend4',
                        image: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400',
                        user: 'boho_chic',
                        avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150',
                        likes: 89,
                        tags: ['Bohemian', 'Free'],
                        description: 'Bohemian dreams'
                      },
                      {
                        id: 'trend5',
                        image: 'https://images.unsplash.com/photo-1532453288672-3a27e9be9efd?w=400',
                        user: 'minimal_maven',
                        avatar: 'https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?w=150',
                        likes: 156,
                        tags: ['Minimal', 'Clean'],
                        description: 'Less is more'
                      },
                      {
                        id: 'trend6',
                        image: 'https://images.unsplash.com/photo-1581044777550-4cfa60707c03?w=400',
                        user: 'formal_finesse',
                        avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150',
                        likes: 203,
                        tags: ['Formal', 'Power'],
                        description: 'Professional power'
                      }
                    ].map(outfit => (
                      <div key={outfit.id} className="relative group cursor-pointer">
                        <div className="aspect-[3/4] rounded-lg overflow-hidden bg-gray-100">
                          <img
                            src={outfit.image}
                            alt={outfit.description}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                          {/* Overlay Info */}
                          <div className="absolute top-2 left-2 right-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-1">
                                <img
                                  src={outfit.avatar}
                                  alt={outfit.user}
                                  className="w-6 h-6 rounded-full border-2 border-white"
                                />
                                <span className="text-white text-xs font-medium bg-black/50 px-2 py-1 rounded">
                                  @{outfit.user}
                                </span>
                              </div>
                              <button className="bg-white/20 backdrop-blur-sm rounded-full p-1">
                                <Bookmark className="w-4 h-4 text-white" />
                              </button>
                            </div>
                          </div>

                          <div className="absolute bottom-2 left-2 right-2">
                            <div className="bg-white/90 backdrop-blur-sm rounded-lg p-2">
                              <p className="text-xs text-gray-800 font-medium mb-1">{outfit.description}</p>
                              <div className="flex items-center justify-between">
                                <div className="flex flex-wrap gap-1">
                                  {outfit.tags.map(tag => (
                                    <span key={tag} className="text-xs bg-purple-100 text-purple-700 px-1 rounded">
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                                <div className="flex items-center space-x-1 text-xs text-gray-600">
                                  <Heart className="w-3 h-3" />
                                  <span>{outfit.likes}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Style Recommendations */}
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200">
                  <h3 className="font-semibold text-gray-800 mb-4 flex items-center space-x-2">
                    <Sparkles className="w-5 h-5 text-yellow-500" />
                    <span>Recommended For You</span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                      <div className="w-16 h-16 rounded-lg overflow-hidden">
                        <img
                          src="https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=200"
                          alt="Style suggestion"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-800">Autumn Layering</h4>
                        <p className="text-sm text-gray-600">Perfect for the season</p>
                        <div className="flex items-center space-x-1 mt-1">
                          <Star className="w-3 h-3 text-yellow-500" />
                          <span className="text-xs text-gray-500">95% match</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                      <div className="w-16 h-16 rounded-lg overflow-hidden">
                        <img
                          src="https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=200"
                          alt="Style suggestion"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-800">Smart Casual</h4>
                        <p className="text-sm text-gray-600">For work meetings</p>
                        <div className="flex items-center space-x-1 mt-1">
                          <Star className="w-3 h-3 text-yellow-500" />
                          <span className="text-xs text-gray-500">89% match</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-12 border border-gray-200 text-center">
                <div className="text-gray-400 mb-4">
                  <Settings className="w-12 h-12 mx-auto" />
                </div>
                <h3 className="text-lg font-semibold text-gray-600 mb-2">Your Profile</h3>
                <p className="text-gray-500">
                  Coming soon! Manage your profile, view your posts, and track your style journey.
                </p>
              </div>
            )}
          </div>

          {/* Right Sidebar - Trending & Tips */}
          <div className="space-y-6">
            {/* Trending Hashtags */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200">
              <h3 className="font-semibold text-gray-800 mb-4">Trending Now</h3>
              <div className="space-y-2">
                {['#MonochromeMonday', '#VintageVibes', '#AutumnLayers', '#MinimalistStyle', '#CozyChic'].map((tag, index) => (
                  <div key={tag} className="flex items-center justify-between">
                    <span className="text-sm text-purple-600 font-medium">{tag}</span>
                    <span className="text-xs text-gray-500">{(Math.random() * 100 + 50).toFixed(0)} posts</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Style Tips */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-200">
              <h3 className="font-semibold text-gray-800 mb-4">Daily Style Tip</h3>
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-lg border border-yellow-200">
                <div className="flex items-start space-x-3">
                  <Sparkles className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-800 font-medium mb-1">Layer Like a Pro</p>
                    <p className="text-xs text-gray-600">
                      Try the "rule of three" - combine three different textures in similar colors for a sophisticated layered look.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Style Me Modal */}
      {showStyleMe && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Get Style Help</h3>
              <button
                onClick={() => setShowStyleMe(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <button className="w-full bg-purple-100 text-purple-800 p-4 rounded-xl text-left hover:bg-purple-200 transition-colors">
                <div className="flex items-center space-x-3">
                  <Users className="w-5 h-5" />
                  <div>
                    <p className="font-medium">Ask the Community</p>
                    <p className="text-sm text-purple-600">Get outfit suggestions from fellow stylists</p>
                  </div>
                </div>
              </button>

              <button className="w-full bg-pink-100 text-pink-800 p-4 rounded-xl text-left hover:bg-pink-200 transition-colors">
                <div className="flex items-center space-x-3">
                  <Crown className="w-5 h-5" />
                  <div>
                    <p className="font-medium">AI Stylist</p>
                    <p className="text-sm text-pink-600">Get instant AI-powered outfit recommendations</p>
                  </div>
                </div>
              </button>

              <button className="w-full bg-indigo-100 text-indigo-800 p-4 rounded-xl text-left hover:bg-indigo-200 transition-colors">
                <div className="flex items-center space-x-3">
                  <Star className="w-5 h-5" />
                  <div>
                    <p className="font-medium">Professional Stylist</p>
                    <p className="text-sm text-indigo-600">Book a consultation with a human expert</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Challenge Submission Modal */}
      {showChallengeSubmission && selectedChallenge && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Submit to {selectedChallenge.title}</h3>
              <button
                onClick={() => setShowChallengeSubmission(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Your Outfit Photo
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-400 transition-colors">
                  <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">Click to upload or drag and drop</p>
                  <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 10MB</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={3}
                  placeholder="Describe your outfit and how it fits the challenge theme..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Items Used
                </label>
                <div className="flex flex-wrap gap-2">
                  {['Top', 'Bottom', 'Shoes', 'Accessories', 'Outerwear'].map(item => (
                    <button
                      key={item}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-purple-100 hover:text-purple-700 transition-colors"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-800 mb-2">Challenge Requirements:</h4>
                <p className="text-sm text-yellow-700">{selectedChallenge.description}</p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowChallengeSubmission(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // Handle submission logic here
                    setShowChallengeSubmission(false);
                    // Update challenge to mark as submitted
                    setStyleChallenges(prev => prev.map(challenge =>
                      challenge.id === selectedChallenge.id
                        ? { ...challenge, hasSubmitted: true }
                        : challenge
                    ));
                  }}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all font-medium"
                >
                  Submit Entry
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && selectedPost && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Share Outfit</h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <button className="w-full flex items-center space-x-3 p-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">
                <Link className="w-5 h-5" />
                <span>Copy Link</span>
              </button>

              <button className="w-full flex items-center space-x-3 p-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors">
                <Mail className="w-5 h-5" />
                <span>Share via Email</span>
              </button>

              <button className="w-full flex items-center space-x-3 p-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">
                <Twitter className="w-5 h-5" />
                <span>Share on Twitter</span>
              </button>

              <button className="w-full flex items-center space-x-3 p-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors">
                <Users className="w-5 h-5" />
                <span>Share to Fashion Feed</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Post Modal */}
      {showCreatePost && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Share Your Outfit</h3>
              <button
                onClick={() => setShowCreatePost(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Outfit Photo
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-purple-400 transition-colors">
                  <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">Click to upload or drag and drop</p>
                  <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 10MB</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Caption
                </label>
                <textarea
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  rows={3}
                  placeholder="Tell the community about your outfit, where you're wearing it, or styling tips..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Outfit Tags
                </label>
                <div className="flex flex-wrap gap-2">
                  {['Casual', 'Formal', 'Date Night', 'Work', 'Weekend', 'Party', 'Travel', 'Cozy'].map(tag => (
                    <button
                      key={tag}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-purple-100 hover:text-purple-700 transition-colors"
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Items in this outfit
                </label>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="e.g., Black leather jacket from Zara"
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                  />
                  <button className="text-purple-600 hover:text-purple-800 text-sm flex items-center space-x-1">
                    <Plus className="w-4 h-4" />
                    <span>Add another item</span>
                  </button>
                </div>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Eye className="w-4 h-4 text-purple-600" />
                  <span className="font-medium text-purple-800 text-sm">Privacy Settings</span>
                </div>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input type="radio" name="privacy" className="text-purple-600" defaultChecked />
                    <span className="text-sm text-purple-700">Public - Everyone can see</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="radio" name="privacy" className="text-purple-600" />
                    <span className="text-sm text-purple-700">Friends only</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="radio" name="privacy" className="text-purple-600" />
                    <span className="text-sm text-purple-700">Private - Just for me</span>
                  </label>
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowCreatePost(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // Handle post creation logic here
                    setShowCreatePost(false);
                    // You could add the new post to the outfit posts state
                  }}
                  className="flex-1 bg-gradient-to-r from-green-600 to-teal-600 text-white py-2 rounded-lg hover:from-green-700 hover:to-teal-700 transition-all font-medium"
                >
                  Share Outfit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FashionFeedDashboard;
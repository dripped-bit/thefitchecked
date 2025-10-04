import React from 'react';
import { Sun, Cloud, Camera, Plus, Sparkles, TrendingUp, Star, Clock, ShoppingBag, ExternalLink } from 'lucide-react';
import { UserProfile } from '../types';
import affiliateLinkService from '../services/affiliateLinkService';

interface DashboardProps {
  user: any;
  userProfile: UserProfile | null;
}

const Dashboard: React.FC<DashboardProps> = ({ user, userProfile }) => {
  const weatherData = {
    temp: '72°F',
    condition: 'Partly Cloudy',
    icon: Cloud
  };

  const todayOutfit = {
    image: 'https://images.pexels.com/photos/1040945/pexels-photo-1040945.jpeg?auto=compress&cs=tinysrgb&w=300&h=400&fit=crop',
    name: 'Casual Friday Look',
    items: ['Blue Denim Jacket', 'White T-Shirt', 'Black Jeans']
  };

  const recentActivity = [
    { action: 'Tried on', item: 'Floral Summer Dress', time: '2 hours ago', liked: true },
    { action: 'Added to closet', item: 'Leather Boots', time: '5 hours ago', liked: false },
    { action: 'Saved outfit', item: 'Weekend Casual', time: '1 day ago', liked: true }
  ];

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 px-6 py-8 text-white">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Good morning!</h1>
            <p className="text-white/80">{userProfile?.name || 'Fashionista'}</p>
          </div>
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>

        {/* Weather Widget */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <weatherData.icon className="w-8 h-8 text-white" />
              <div>
                <p className="text-lg font-semibold">{weatherData.temp}</p>
                <p className="text-sm text-white/80">{weatherData.condition}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-white/80">Perfect for</p>
              <p className="font-medium">Light layers</p>
            </div>
          </div>
        </div>
      </div>

      {/* Today's Outfit */}
      <div className="px-6 -mt-6 mb-8">
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800">Today's Suggestion</h2>
            <button className="p-2 hover:bg-gray-100 hover:scale-105 rounded-full transition-all duration-300">
              <TrendingUp className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          
          <div className="flex space-x-4">
            <img
              src={todayOutfit.image}
              alt={todayOutfit.name}
              className="w-20 h-24 object-cover rounded-xl"
            />
            <div className="flex-1">
              <h3 className="font-semibold text-gray-800 mb-2">{todayOutfit.name}</h3>
              <div className="space-y-1">
                {todayOutfit.items.map((item, index) => (
                  <p key={index} className="text-sm text-gray-600">• {item}</p>
                ))}
              </div>
              <button className="mt-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:shadow-lg hover:shadow-purple-500/50 hover:scale-105 transition-all duration-300">
                Try This On
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-6 mb-8">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-4">
          <button className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-2xl p-6 text-left hover:shadow-lg hover:shadow-purple-500/30 hover:scale-105 transition-all duration-300">
            <Camera className="w-8 h-8 text-purple-600 mb-3" />
            <h3 className="font-semibold text-gray-800 mb-1">Virtual Try-On</h3>
            <p className="text-sm text-gray-600">Try new clothes instantly</p>
          </button>

          <button className="bg-gradient-to-br from-pink-50 to-pink-100 border border-pink-200 rounded-2xl p-6 text-left hover:shadow-lg hover:shadow-pink-500/30 hover:scale-105 transition-all duration-300">
            <Plus className="w-8 h-8 text-pink-600 mb-3" />
            <h3 className="font-semibold text-gray-800 mb-1">Add to Closet</h3>
            <p className="text-sm text-gray-600">Organize your wardrobe</p>
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="px-6 mb-8">
        <h2 className="text-lg font-bold text-gray-800 mb-4">Recent Activity</h2>
        <div className="space-y-3">
          {recentActivity.map((activity, index) => (
            <div key={index} className="bg-white rounded-xl p-4 border border-gray-100 hover:shadow-md hover:scale-105 transition-all duration-300 cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-gray-800">
                    <span className="font-medium">{activity.action}</span> {activity.item}
                  </p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <p className="text-sm text-gray-500">{activity.time}</p>
                  </div>
                </div>
                {activity.liked && (
                  <Star className="w-5 h-5 text-yellow-500 fill-current" />
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-6 mb-8">
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-4 text-center border border-gray-100">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-gray-800">24</p>
            <p className="text-sm text-gray-600">Items Tried</p>
          </div>
          
          <div className="bg-white rounded-xl p-4 text-center border border-gray-100">
            <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <Star className="w-5 h-5 text-pink-600" />
            </div>
            <p className="text-2xl font-bold text-gray-800">12</p>
            <p className="text-sm text-gray-600">Saved Outfits</p>
          </div>
          
          <div className="bg-white rounded-xl p-4 text-center border border-gray-100">
            <div className="w-10 h-10 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <TrendingUp className="w-5 h-5 text-cyan-600" />
            </div>
            <p className="text-2xl font-bold text-gray-800">89%</p>
            <p className="text-sm text-gray-600">Fit Score</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
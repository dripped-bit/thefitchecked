/**
 * Wishlist - View and manage your saved clothing items
 */

import React, { useState, useEffect } from 'react';
import { Trash2, ExternalLink, Edit3 } from 'lucide-react';

interface WishlistProps {
  onBack: () => void;
}

interface WishlistItem {
  id: string;
  name: string;
  brand: string;
  price: string;
  currency: string;
  image: string;
  url: string;
  retailer: string;
  notes: string;
  addedDate: string;
  originalPrice?: string;
  discount?: string;
}

// Mock wishlist data
const mockWishlistItems: WishlistItem[] = [
  {
    id: '1',
    name: 'ADANOLA Logo-embroidered oversized...',
    brand: 'ADANOLA SPORT',
    price: '$65',
    currency: 'USD',
    image: 'https://via.placeholder.com/300x400/F5F5F5/666?text=Sweatshirt',
    url: 'https://selfridges.com',
    retailer: 'selfridges.com',
    notes: '',
    addedDate: '2024-11-10',
  },
  {
    id: '2',
    name: 'Lori Baguette Bag in Rebel Crackle...',
    brand: 'STAUD',
    price: '£1490',
    currency: 'GBP',
    image: 'https://via.placeholder.com/300x400/FFE5E5/666?text=Red+Bag',
    url: 'https://khaite.com',
    retailer: 'khaite.com',
    notes: 'Perfect for date night',
    addedDate: '2024-11-12',
  },
  {
    id: '3',
    name: 'ADIDAS ORIGINALS Taekwondo Mei...',
    brand: 'ADIDAS',
    price: '$84',
    currency: 'USD',
    originalPrice: '$120',
    discount: '30% OFF',
    image: 'https://via.placeholder.com/300x400/F5F5F5/666?text=Sneakers',
    url: 'https://net-a-porter.com',
    retailer: 'net-a-porter.com',
    notes: '',
    addedDate: '2024-11-13',
  },
  {
    id: '4',
    name: 'POLO RALPH LAUREN Embroidered...',
    brand: 'POLO RALPH LAUREN',
    price: '$50',
    currency: 'USD',
    image: 'https://via.placeholder.com/300x400/E8F5E9/666?text=Green+Cap',
    url: 'https://net-a-porter.com',
    retailer: 'net-a-porter.com',
    notes: '',
    addedDate: '2024-11-14',
  },
];

export default function Wishlist({ onBack }: WishlistProps) {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>(mockWishlistItems);
  const [mounted, setMounted] = useState(false);
  const [notesModalVisible, setNotesModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<WishlistItem | null>(null);
  const [editingNotes, setEditingNotes] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  const handleDelete = (itemId: string) => {
    if (window.confirm('Are you sure you want to remove this item?')) {
      setWishlistItems(items => items.filter(item => item.id !== itemId));
    }
  };

  const handleEditNotes = (item: WishlistItem) => {
    setSelectedItem(item);
    setEditingNotes(item.notes || '');
    setNotesModalVisible(true);
  };

  const handleSaveNotes = () => {
    if (selectedItem) {
      setWishlistItems(items =>
        items.map(item =>
          item.id === selectedItem.id
            ? { ...item, notes: editingNotes }
            : item
        )
      );
    }
    setNotesModalVisible(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-100 to-blue-50 pb-40">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mt-12 mb-8 relative">
          {/* Back Button */}
          <button
            onClick={onBack}
            className="absolute top-0 left-0 w-10 h-10 flex items-center justify-center text-gray-700 active:text-gray-900 active:scale-95 transition-all rounded-full"
            aria-label="Go back"
          >
            <svg 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              className="w-6 h-6"
              aria-hidden="true"
            >
              <path 
                d="M20 12H4M4 12L10 6M4 12L10 18" 
                stroke="currentColor" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {/* Title */}
          <div 
            className={`text-center pt-2 transition-all duration-700 ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            <h1 className="text-4xl font-bold text-gray-900 mb-2">❤️ Wishlist</h1>
            <p className="text-gray-600">
              {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'}
            </p>
          </div>
        </div>

        {/* Empty State */}
        {wishlistItems.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-8xl mb-6">❤️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Your wishlist is empty</h2>
            <p className="text-gray-600 mb-6">Start adding items you love!</p>
            <button
              onClick={onBack}
              className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-8 py-3 rounded-xl font-semibold active:scale-95 transition-transform"
            >
              Browse Style Hub
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {wishlistItems.map((item, index) => (
              <WishlistCard
                key={item.id}
                item={item}
                index={index}
                mounted={mounted}
                onDelete={() => handleDelete(item.id)}
                onEditNotes={() => handleEditNotes(item)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Notes Modal */}
      {notesModalVisible && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
          <div 
            className="bg-white rounded-t-3xl w-full max-w-2xl p-6 animate-slide-up"
            style={{
              backdropFilter: 'blur(40px)',
              WebkitBackdropFilter: 'blur(40px)'
            }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Add Notes</h2>
              <button
                onClick={() => setNotesModalVisible(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>

            <textarea
              className="w-full bg-gray-100 rounded-xl p-4 mb-6 min-h-[120px] resize-none focus:outline-none focus:ring-2 focus:ring-pink-500"
              placeholder="Add notes about this item..."
              value={editingNotes}
              onChange={(e) => setEditingNotes(e.target.value)}
            />

            <button
              onClick={handleSaveNotes}
              className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white py-4 rounded-xl font-semibold active:scale-95 transition-transform"
            >
              Save Notes
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Wishlist Card Component
interface WishlistCardProps {
  item: WishlistItem;
  index: number;
  mounted: boolean;
  onDelete: () => void;
  onEditNotes: () => void;
}

function WishlistCard({ item, index, mounted, onDelete, onEditNotes }: WishlistCardProps) {
  return (
    <div
      className={`transition-all duration-700 ${
        mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
      style={{ transitionDelay: `${index * 75}ms` }}
    >
      <div
        className="bg-white/30 rounded-2xl overflow-hidden border border-white/40 shadow-lg hover:shadow-xl transition-all duration-300 relative"
        style={{
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)'
        }}
      >
        {/* Discount Badge */}
        {item.discount && (
          <div className="absolute top-3 right-3 bg-pink-500 text-white text-xs font-bold px-2 py-1 rounded-lg z-10">
            {item.discount}
          </div>
        )}

        {/* Image */}
        <a href={item.url} target="_blank" rel="noopener noreferrer" className="block">
          <img
            src={item.image}
            alt={item.name}
            className="w-full aspect-[3/4] object-cover hover:scale-105 transition-transform duration-300"
          />
        </a>

        {/* Content */}
        <div className="p-3">
          {/* Brand */}
          <p className="text-xs text-gray-500 font-semibold uppercase mb-1">
            {item.brand}
          </p>

          {/* Product Name */}
          <h3 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-2">
            {item.name}
          </h3>

          {/* Price */}
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg font-bold text-gray-900">{item.price}</span>
            {item.originalPrice && (
              <span className="text-sm text-gray-500 line-through">{item.originalPrice}</span>
            )}
          </div>

          {/* Retailer Link */}
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-purple-600 font-medium mb-2 hover:text-purple-700"
          >
            <span>{item.retailer}</span>
            <ExternalLink className="w-3 h-3" />
          </a>

          {/* Notes Preview */}
          {item.notes && (
            <div className="bg-gray-100 rounded-lg p-2 mb-3">
              <p className="text-xs text-gray-600 italic line-clamp-1">{item.notes}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={onEditNotes}
              className="flex-1 bg-purple-100 text-purple-700 py-2 rounded-lg flex items-center justify-center gap-1 hover:bg-purple-200 active:scale-95 transition-all"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={onDelete}
              className="flex-1 bg-pink-100 text-pink-600 py-2 rounded-lg flex items-center justify-center gap-1 hover:bg-pink-200 active:scale-95 transition-all"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

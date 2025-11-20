/**
 * Wishlist PDF Document Component
 * Renders a styled PDF document using react-pdf
 */

import React from 'react';
import { Document, Page, Text, View, Image, Link, StyleSheet } from '@react-pdf/renderer';
import { WishlistPdfOptions } from '../../services/wishlistPdfService';

// PDF Styles
const styles = StyleSheet.create({
  page: {
    backgroundColor: '#FFFFFF',
    padding: 30,
    fontFamily: 'Helvetica'
  },
  header: {
    marginBottom: 20,
    borderBottom: '3px solid #FF69B4',
    paddingBottom: 15
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FF69B4',
    marginBottom: 5
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 3
  },
  personalMessage: {
    backgroundColor: '#FFF9F3',
    padding: 15,
    marginBottom: 20,
    borderLeft: '4px solid #FF69B4',
    fontSize: 12,
    fontStyle: 'italic',
    color: '#333333'
  },
  styleProfile: {
    backgroundColor: '#FFF0F5',
    padding: 12,
    marginBottom: 15,
    borderRadius: 6
  },
  styleProfileTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#000000'
  },
  styleProfileText: {
    fontSize: 10,
    color: '#333333',
    marginBottom: 2
  },
  itemsContainer: {
    marginTop: 10
  },
  itemRow: {
    flexDirection: 'row',
    marginBottom: 15,
    gap: 15
  },
  itemCard: {
    width: '48%',
    border: '1px solid #E0E0E0',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#FFFFFF'
  },
  itemImage: {
    width: '100%',
    height: 180,
    objectFit: 'cover',
    borderRadius: 4,
    marginBottom: 10
  },
  itemName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#000000'
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF69B4',
    marginBottom: 5
  },
  itemStore: {
    fontSize: 11,
    color: '#666666',
    marginBottom: 8
  },
  itemNotes: {
    fontSize: 10,
    color: '#888888',
    fontStyle: 'italic',
    marginBottom: 8
  },
  linkButton: {
    backgroundColor: '#FF69B4',
    padding: 8,
    borderRadius: 4,
    textAlign: 'center',
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: 'bold',
    textDecoration: 'none'
  },
  footer: {
    marginTop: 30,
    paddingTop: 15,
    borderTop: '1px solid #E0E0E0',
    fontSize: 10,
    color: '#999999',
    textAlign: 'center'
  }
});

interface WishlistPdfDocumentProps {
  options: WishlistPdfOptions;
}

// Helper function to calculate total price
function calculateTotal(items: any[]): string {
  const total = items.reduce((sum, item) => {
    const priceStr = item.price || '0';
    const price = parseFloat(priceStr.replace(/[^0-9.]/g, ''));
    return sum + (isNaN(price) ? 0 : price);
  }, 0);
  return `$${total.toFixed(2)}`;
}

// Helper to chunk items into pairs for 2-column layout
function chunkItems(items: any[], size: number) {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

export const WishlistPdfDocument: React.FC<WishlistPdfDocumentProps> = ({ options }) => {
  const itemRows = chunkItems(options.items, 2);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>
            {options.title || 'My Wishlist'}
          </Text>
          {options.userName && (
            <Text style={styles.subtitle}>
              Curated by {options.userName}
            </Text>
          )}
          {options.occasion && (
            <Text style={styles.subtitle}>
              Occasion: {options.occasion}
            </Text>
          )}
          <Text style={styles.subtitle}>
            {new Date().toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </Text>
        </View>

        {/* Personal Message */}
        {options.personalMessage && (
          <View style={styles.personalMessage}>
            <Text>{options.personalMessage}</Text>
          </View>
        )}

        {/* Style Profile (if quiz completed or preferences set) */}
        {(options.quizStyleType || options.stylePreferences) && (
          <View style={styles.styleProfile}>
            <Text style={styles.styleProfileTitle}>
              💕 My Style Profile
            </Text>
            {options.quizStyleType && (
              <Text style={styles.styleProfileText}>
                Style: {options.quizStyleType}
              </Text>
            )}
            {options.stylePreferences?.fashionPersonality?.archetypes && 
             options.stylePreferences.fashionPersonality.archetypes.length > 0 && (
              <Text style={styles.styleProfileText}>
                Vibes: {options.stylePreferences.fashionPersonality.archetypes.join(', ')}
              </Text>
            )}
            {options.stylePreferences?.sizes && (
              <Text style={styles.styleProfileText}>
                Sizes: {options.stylePreferences.sizes.tops || '?'} tops, {' '}
                {options.stylePreferences.sizes.bottoms || '?'} bottoms, {' '}
                {options.stylePreferences.sizes.shoes || '?'} shoes
              </Text>
            )}
          </View>
        )}

        {/* Items Grid */}
        <View style={styles.itemsContainer}>
          {itemRows.map((row, rowIndex) => (
            <View key={rowIndex} style={styles.itemRow}>
              {row.map((item: any) => (
                <View key={item.id} style={styles.itemCard}>
                  {/* Product Image */}
                  {item.image && (
                    <Image
                      src={item.image}
                      style={styles.itemImage}
                    />
                  )}

                  {/* Product Name */}
                  <Text style={styles.itemName}>
                    {item.name}
                    {item.brand && ` by ${item.brand}`}
                  </Text>

                  {/* Price */}
                  {options.includePrice !== false && (
                    <Text style={styles.itemPrice}>
                      {item.price}
                    </Text>
                  )}

                  {/* Store */}
                  <Text style={styles.itemStore}>
                    📍 {item.retailer}
                  </Text>

                  {/* Notes */}
                  {item.notes && (
                    <Text style={styles.itemNotes}>
                      Note: {item.notes}
                    </Text>
                  )}

                  {/* Clickable Link */}
                  <Link src={item.url} style={styles.linkButton}>
                    <Text>View Product →</Text>
                  </Link>
                </View>
              ))}
              
              {/* Add empty placeholder if odd number of items in last row */}
              {row.length === 1 && <View style={{ width: '48%' }} />}
            </View>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text>Created with ❤️ using FitChecked</Text>
          <Text>
            Total Items: {options.items.length}
            {options.includePrice !== false && (
              ` • Total Value: ${calculateTotal(options.items)}`
            )}
          </Text>
        </View>
      </Page>
    </Document>
  );
};

import { useState, useEffect, useMemo } from 'react';
import { CheckSquare, Shirt, Droplet, FileText, Smartphone } from 'lucide-react';
import {
  useTripActivities,
  useAllTripOutfits,
  useTripDaysArray,
  useManualDayClothes,
  useTripChecklist,
  useToggleChecklistItem,
  useInitializeChecklist,
  type Trip,
} from '../../hooks/useTrips';
import { useCloset } from '../../hooks/useCloset';
import { ShopForTripSection } from './ShopForTripSection';
import { ChecklistSection } from './ChecklistSection';
import { FIXED_CHECKLIST_ITEMS, CLOTHING_CHECKLIST_ITEMS } from '../../constants/tripTypes';

interface TripListTabProps {
  trip: Trip;
}

export function TripListTab({ trip }: TripListTabProps) {
  const { data: activities = [] } = useTripActivities(trip.id);
  const { data: allOutfits = [] } = useAllTripOutfits(trip.id);
  const { items: closetItems } = useCloset();
  const tripDays = useTripDaysArray(trip.start_date, trip.end_date);
  
  const { data: checklistItems = [], isLoading: checklistLoading } = useTripChecklist(trip.id);
  const toggleChecklistItem = useToggleChecklistItem();
  const initializeChecklist = useInitializeChecklist();

  const [isInitializing, setIsInitializing] = useState(false);

  // Aggregate all clothes from PLAN page
  const allClothes = useMemo(() => {
    const itemsMap = new Map();

    // Add items from activity outfits
    allOutfits.forEach(outfit => {
      outfit.clothing_item_ids?.forEach(itemId => {
        if (!itemsMap.has(itemId)) {
          const item = closetItems.find(i => i.id === itemId);
          if (item) {
            itemsMap.set(itemId, item);
          }
        }
      });
    });

    return Array.from(itemsMap.values());
  }, [allOutfits, closetItems]);

  // Group clothes by category
  const clothesByCategory = useMemo(() => {
    const grouped: Record<string, any[]> = {};
    
    allClothes.forEach(item => {
      const category = item.category;
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(item);
    });

    return grouped;
  }, [allClothes]);

  // Calculate clothing counts per category
  const clothingCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    
    allClothes.forEach(item => {
      const category = item.category.toLowerCase();
      counts[category] = (counts[category] || 0) + 1;
    });

    return counts;
  }, [allClothes]);

  // Initialize checklist on first load
  useEffect(() => {
    if (!checklistLoading && checklistItems.length === 0 && !isInitializing) {
      setIsInitializing(true);
      
      const items: Array<{ item_name: string; category: string; item_count?: number }> = [];

      // Add clothing items with counts
      CLOTHING_CHECKLIST_ITEMS.forEach(category => {
        const count = clothingCounts[category] || 0;
        if (count > 0) {
          // Capitalize first letter
          const label = category.charAt(0).toUpperCase() + category.slice(1);
          items.push({
            item_name: label,
            category: 'clothing',
            item_count: count,
          });
        }
      });

      // Add fixed toiletries items
      FIXED_CHECKLIST_ITEMS.toiletries.forEach(itemName => {
        items.push({
          item_name: itemName,
          category: 'toiletries',
        });
      });

      // Add fixed documents items
      FIXED_CHECKLIST_ITEMS.documents.forEach(itemName => {
        items.push({
          item_name: itemName,
          category: 'documents',
        });
      });

      // Add fixed electronics items
      FIXED_CHECKLIST_ITEMS.electronics.forEach(itemName => {
        items.push({
          item_name: itemName,
          category: 'electronics',
        });
      });

      if (items.length > 0) {
        initializeChecklist.mutate(
          { tripId: trip.id, items },
          {
            onSettled: () => {
              setIsInitializing(false);
            },
          }
        );
      } else {
        setIsInitializing(false);
      }
    }
  }, [checklistLoading, checklistItems.length, clothingCounts, trip.id, isInitializing]);

  // Group checklist items by category
  const checklistByCategory = useMemo(() => {
    const grouped: Record<string, any[]> = {
      clothing: [],
      toiletries: [],
      documents: [],
      electronics: [],
    };

    checklistItems.forEach(item => {
      if (grouped[item.category]) {
        grouped[item.category].push(item);
      }
    });

    return grouped;
  }, [checklistItems]);

  const handleToggle = async (itemId: string, currentlyChecked: boolean) => {
    try {
      await toggleChecklistItem.mutateAsync({
        itemId,
        isChecked: !currentlyChecked,
      });
    } catch (error) {
      console.error('Failed to toggle checklist item:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <CheckSquare className="w-8 h-8 text-purple-600" />
          <h2 className="text-2xl font-bold text-gray-900">CHECKLIST</h2>
        </div>
      </div>

      {/* Shop for Trip Section */}
      <ShopForTripSection clothesByCategory={clothesByCategory} />

      {/* Checklist Sections */}
      {(checklistLoading || isInitializing) ? (
        <div className="bg-white rounded-xl p-12 text-center shadow-sm">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading checklist...</p>
        </div>
      ) : (
        <div className="space-y-4">
          <ChecklistSection
            title="CLOTHING"
            icon={<Shirt className="w-5 h-5 text-purple-600" />}
            items={checklistByCategory.clothing}
            onToggle={handleToggle}
          />

          <ChecklistSection
            title="TOILETRIES"
            icon={<Droplet className="w-5 h-5 text-blue-600" />}
            items={checklistByCategory.toiletries}
            onToggle={handleToggle}
          />

          <ChecklistSection
            title="DOCUMENTS"
            icon={<FileText className="w-5 h-5 text-orange-600" />}
            items={checklistByCategory.documents}
            onToggle={handleToggle}
          />

          <ChecklistSection
            title="ELECTRONICS"
            icon={<Smartphone className="w-5 h-5 text-green-600" />}
            items={checklistByCategory.electronics}
            onToggle={handleToggle}
          />
        </div>
      )}
    </div>
  );
}

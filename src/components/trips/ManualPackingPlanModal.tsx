import { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { useTripDaysArray, useAddPackingItem, Trip } from '../../hooks/useTrips';
import { ClothingItem, ClothingCategory } from '../../hooks/useCloset';
import { DayPackingSelector } from './DayPackingSelector';
import { ClosetItemSelectorModal } from './ClosetItemSelectorModal';
import { ChecklistSection, ChecklistItem } from './ChecklistSection';
import { supabase } from '../../services/supabaseClient';
import type { PackingCategory } from '../../constants/tripTypes';

interface ManualPackingPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: Trip;
  onSuccess?: () => void;
}

// Map closet categories to packing categories
const mapClosetCategoryToPackingCategory = (category: ClothingCategory): PackingCategory => {
  const mapping: Record<ClothingCategory, PackingCategory> = {
    'tops': 'clothing',
    'bottoms': 'clothing',
    'dresses': 'clothing',
    'activewear': 'clothing',
    'outerwear': 'clothing',
    'shoes': 'clothing',
    'accessories': 'accessories',
  };
  return mapping[category] || 'clothing';
};

export function ManualPackingPlanModal({
  isOpen,
  onClose,
  trip,
  onSuccess,
}: ManualPackingPlanModalProps) {
  const tripDays = useTripDaysArray(trip.start_date, trip.end_date);
  const addPackingItem = useAddPackingItem();

  // State: Map of date string to selected items
  const [daySelections, setDaySelections] = useState<Map<string, ClothingItem[]>>(new Map());
  const [showClosetSelector, setShowClosetSelector] = useState(false);
  const [currentDayIndex, setCurrentDayIndex] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Checklist states
  const [essentials, setEssentials] = useState<ChecklistItem[]>([]);
  const [toiletries, setToiletries] = useState<ChecklistItem[]>([]);
  const [documents, setDocuments] = useState<ChecklistItem[]>([]);
  const [electronics, setElectronics] = useState<ChecklistItem[]>([]);

  // Clear state when modal closes to prevent duplicates
  useEffect(() => {
    if (!isOpen) {
      setDaySelections(new Map());
      setEssentials([]);
      setToiletries([]);
      setDocuments([]);
      setElectronics([]);
    }
  }, [isOpen]);

  // Initialize checklists when modal opens
  useEffect(() => {
    if (isOpen) {
      const duration = tripDays.length;
      
      // Essentials - smart quantities based on trip duration
      setEssentials([
        { 
          name: 'Underwear', 
          category: 'essentials', 
          quantity: duration + 2, 
          isEssential: true, 
          checked: true 
        },
        { 
          name: 'Socks', 
          category: 'essentials', 
          quantity: duration + 2, 
          isEssential: true, 
          checked: true 
        },
        { 
          name: 'Sleepwear', 
          category: 'essentials', 
          quantity: Math.max(2, Math.ceil(duration / 2)), 
          isEssential: true, 
          checked: true 
        },
      ]);
      
      // Toiletries - always the same
      setToiletries([
        { 
          name: 'Toothbrush & Toothpaste', 
          category: 'toiletries', 
          quantity: 1, 
          isEssential: true, 
          checked: true 
        },
        { 
          name: 'Shampoo & Conditioner', 
          category: 'toiletries', 
          quantity: 1, 
          isEssential: true, 
          checked: true 
        },
        { 
          name: 'Deodorant', 
          category: 'toiletries', 
          quantity: 1, 
          isEssential: true, 
          checked: true 
        },
        { 
          name: 'Sunscreen', 
          category: 'toiletries', 
          quantity: 1, 
          isEssential: true, 
          checked: true 
        },
      ]);
      
      // Documents - always the same
      setDocuments([
        { 
          name: 'ID / Passport', 
          category: 'documents', 
          quantity: 1, 
          isEssential: true, 
          checked: true 
        },
        { 
          name: 'Travel Tickets / Confirmations', 
          category: 'documents', 
          quantity: 1, 
          isEssential: true, 
          checked: true 
        },
      ]);
      
      // Electronics - context-aware based on trip type
      const electronicsItems: ChecklistItem[] = [
        { 
          name: 'Phone Charger', 
          category: 'electronics', 
          quantity: 1, 
          isEssential: true, 
          checked: true 
        },
      ];
      
      if (trip.trip_type === 'business') {
        electronicsItems.push({ 
          name: 'Laptop & Charger', 
          category: 'electronics', 
          quantity: 1, 
          isEssential: true, 
          checked: true 
        });
      }
      
      if (trip.trip_type === 'vacation') {
        electronicsItems.push({ 
          name: 'Camera', 
          category: 'electronics', 
          quantity: 1, 
          isEssential: false, 
          checked: false 
        });
      }
      
      setElectronics(electronicsItems);
    }
  }, [isOpen, trip, tripDays.length]);

  const handleAddItemsForDay = (dayIndex: number) => {
    setCurrentDayIndex(dayIndex);
    setShowClosetSelector(true);
  };

  const handleSelectItems = (items: ClothingItem[]) => {
    if (currentDayIndex === null) return;

    const dateStr = tripDays[currentDayIndex].toISOString().split('T')[0];
    const currentItems = daySelections.get(dateStr) || [];
    
    // Add new items that aren't already selected
    const existingIds = new Set(currentItems.map(item => item.id));
    const newItems = items.filter(item => !existingIds.has(item.id));
    
    setDaySelections(new Map(daySelections.set(dateStr, [...currentItems, ...newItems])));
  };

  const handleRemoveItem = (dayIndex: number, itemId: string) => {
    const dateStr = tripDays[dayIndex].toISOString().split('T')[0];
    const currentItems = daySelections.get(dateStr) || [];
    const updatedItems = currentItems.filter(item => item.id !== itemId);
    
    if (updatedItems.length === 0) {
      daySelections.delete(dateStr);
      setDaySelections(new Map(daySelections));
    } else {
      setDaySelections(new Map(daySelections.set(dateStr, updatedItems)));
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Check for existing items to prevent duplicates
      const { data: existingItems } = await supabase
        .from('trip_packing_list')
        .select('item_name')
        .eq('trip_id', trip.id);

      const existingNames = new Set(existingItems?.map(i => i.item_name) || []);
      const itemsToAdd: any[] = [];

      // 1. Add clothing items from day selections
      const allItemsMap = new Map<string, { item: ClothingItem; dates: string[] }>();
      
      daySelections.forEach((items, date) => {
        items.forEach(item => {
          if (allItemsMap.has(item.id)) {
            allItemsMap.get(item.id)!.dates.push(date);
          } else {
            allItemsMap.set(item.id, { item, dates: [date] });
          }
        });
      });

      allItemsMap.forEach(({ item }) => {
        if (!existingNames.has(item.name)) {
          itemsToAdd.push({
            trip_id: trip.id,
            item_name: item.name,
            category: mapClosetCategoryToPackingCategory(item.category),
            quantity: 1,
            is_packed: false,
            is_essential: false,
            clothing_item_id: item.id,
          });
        }
      });

      // 2. Add checked essentials (skip duplicates)
      essentials.filter(item => item.checked && !existingNames.has(item.name)).forEach(item => {
        itemsToAdd.push({
          trip_id: trip.id,
          item_name: item.name,
          category: item.category,
          quantity: item.quantity,
          is_packed: false,
          is_essential: item.isEssential,
        });
      });

      // 3. Add checked toiletries (skip duplicates)
      toiletries.filter(item => item.checked && !existingNames.has(item.name)).forEach(item => {
        itemsToAdd.push({
          trip_id: trip.id,
          item_name: item.name,
          category: item.category,
          quantity: item.quantity,
          is_packed: false,
          is_essential: item.isEssential,
        });
      });

      // 4. Add checked documents (skip duplicates)
      documents.filter(item => item.checked && !existingNames.has(item.name)).forEach(item => {
        itemsToAdd.push({
          trip_id: trip.id,
          item_name: item.name,
          category: item.category,
          quantity: item.quantity,
          is_packed: false,
          is_essential: item.isEssential,
        });
      });

      // 5. Add checked electronics (skip duplicates)
      electronics.filter(item => item.checked && !existingNames.has(item.name)).forEach(item => {
        itemsToAdd.push({
          trip_id: trip.id,
          item_name: item.name,
          category: item.category,
          quantity: item.quantity,
          is_packed: false,
          is_essential: item.isEssential,
        });
      });

      // Save all items at once
      if (itemsToAdd.length > 0) {
        const promises = itemsToAdd.map(item => addPackingItem.mutateAsync(item));
        await Promise.all(promises);
      }

      console.log(`✅ Added ${itemsToAdd.length} items to packing list`);
      
      if (onSuccess) {
        onSuccess();
      }
      
      onClose();
    } catch (error) {
      console.error('Failed to save packing plan:', error);
      alert('Failed to save packing plan');
    } finally {
      setIsSaving(false);
    }
  };

  // Get currently selected item IDs to mark them in the selector
  const getAlreadySelectedIds = (): string[] => {
    if (currentDayIndex === null) return [];
    const dateStr = tripDays[currentDayIndex].toISOString().split('T')[0];
    return (daySelections.get(dateStr) || []).map(item => item.id);
  };

  // Count total items selected across all categories
  const clothingCount = Array.from(daySelections.values()).reduce(
    (sum, items) => sum + items.length,
    0
  );
  const essentialsCount = essentials.filter(i => i.checked).length;
  const toiletriesCount = toiletries.filter(i => i.checked).length;
  const documentsCount = documents.filter(i => i.checked).length;
  const electronicsCount = electronics.filter(i => i.checked).length;
  
  const totalItemsSelected = clothingCount + essentialsCount + toiletriesCount + documentsCount + electronicsCount;

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1 min-w-0">
                <h2 className="text-2xl font-bold mb-1 break-words">Plan Trip Packing</h2>
                <p className="text-gray-600 text-sm truncate">{trip.name} - {trip.destination}</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Stats */}
            {totalItemsSelected > 0 && (
              <div className="mt-4 px-4 py-2 bg-purple-50 rounded-lg border border-purple-200">
                <p className="text-sm text-purple-900">
                  <span className="font-semibold">{totalItemsSelected}</span> items selected
                  {clothingCount > 0 && (
                    <span className="ml-1">
                      ({clothingCount} clothing, {essentialsCount + toiletriesCount + documentsCount + electronicsCount} essentials)
                    </span>
                  )}
                </p>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              {/* Section 1: Clothing by Day */}
              <div>
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span>👕</span>
                  Clothing by Day
                </h3>
                <div className="space-y-4">
                  {tripDays.map((day, index) => {
                    const dateStr = day.toISOString().split('T')[0];
                    const selectedItems = daySelections.get(dateStr) || [];

                    return (
                      <DayPackingSelector
                        key={dateStr}
                        date={day}
                        dayNumber={index + 1}
                        selectedItems={selectedItems}
                        onAddItems={() => handleAddItemsForDay(index)}
                        onRemoveItem={(itemId) => handleRemoveItem(index, itemId)}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Section 2: Essentials */}
              <ChecklistSection
                title="Essentials"
                emoji="✨"
                items={essentials}
                onToggle={(index) => {
                  const newEssentials = [...essentials];
                  newEssentials[index].checked = !newEssentials[index].checked;
                  setEssentials(newEssentials);
                }}
                onQuantityChange={(index, quantity) => {
                  const newEssentials = [...essentials];
                  newEssentials[index].quantity = quantity;
                  setEssentials(newEssentials);
                }}
              />

              {/* Section 3: Toiletries */}
              <ChecklistSection
                title="Toiletries"
                emoji="🧴"
                items={toiletries}
                onToggle={(index) => {
                  const newToiletries = [...toiletries];
                  newToiletries[index].checked = !newToiletries[index].checked;
                  setToiletries(newToiletries);
                }}
                onQuantityChange={() => {}}
              />

              {/* Section 4: Documents */}
              <ChecklistSection
                title="Documents"
                emoji="📄"
                items={documents}
                onToggle={(index) => {
                  const newDocuments = [...documents];
                  newDocuments[index].checked = !newDocuments[index].checked;
                  setDocuments(newDocuments);
                }}
                onQuantityChange={() => {}}
              />

              {/* Section 5: Electronics */}
              <ChecklistSection
                title="Electronics"
                emoji="🔌"
                items={electronics}
                onToggle={(index) => {
                  const newElectronics = [...electronics];
                  newElectronics[index].checked = !newElectronics[index].checked;
                  setElectronics(newElectronics);
                }}
                onQuantityChange={() => {}}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6">
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || totalItemsSelected === 0}
                className="flex-1 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                {isSaving ? 'Saving...' : `Save Plan (${totalItemsSelected} items)`}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Closet Selector Modal */}
      <ClosetItemSelectorModal
        isOpen={showClosetSelector}
        onClose={() => {
          setShowClosetSelector(false);
          setCurrentDayIndex(null);
        }}
        onSelect={handleSelectItems}
        alreadySelected={getAlreadySelectedIds()}
      />
    </>
  );
}

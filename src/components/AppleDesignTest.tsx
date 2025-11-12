import { IOSButton, GlassCard, OutfitCard } from './ui';
import { Plus, Heart } from 'lucide-react';

export function AppleDesignTest() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 p-8">
      {/* Test GlassCard */}
      <GlassCard variant="light" shadow="lg" radius="xl" padding="lg" className="mb-6">
        <h1 className="ios-text-large-title text-[var(--ios-label)] mb-2">
          🍎 Apple Design Works!
        </h1>
        <p className="ios-text-body text-[var(--ios-secondary-label)] mb-4">
          Glass morphism is active. Try the buttons below:
        </p>
        
        {/* Test IOSButton variants */}
        <div className="flex flex-col gap-3">
          <IOSButton 
            variant="filled" 
            color="blue"
            onClick={() => alert('Filled button works! 🎉')}
          >
            Filled Button
          </IOSButton>
          
          <IOSButton 
            variant="tinted" 
            color="green"
            startIcon={<Plus className="w-4 h-4" />}
            onClick={() => alert('Tinted button works! ✨')}
          >
            Tinted Button
          </IOSButton>
          
          <IOSButton 
            variant="bordered" 
            color="red"
            endIcon={<Heart className="w-4 h-4" />}
            onClick={() => alert('Bordered button works! 💖')}
          >
            Bordered Button
          </IOSButton>
        </div>
      </GlassCard>

      {/* Test OutfitCard */}
      <div className="grid grid-cols-2 gap-4">
        <OutfitCard
          imageUrl="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=400"
          title="Summer Casual"
          description="Perfect for sunny days"
          weather="☀️ 75°F"
          date="Jun 15"
          onClick={() => alert('Outfit card clicked!')}
        />
        
        <OutfitCard
          imageUrl="https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400"
          title="Winter Style"
          description="Cozy and warm"
          weather="❄️ 45°F"
          date="Dec 20"
          onClick={() => alert('Outfit card 2 clicked!')}
        />
      </div>
    </div>
  );
}

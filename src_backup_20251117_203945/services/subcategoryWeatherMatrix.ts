/**
 * Comprehensive Matrix: Subcategory × Weather × Time × Lifestyle × Day
 * Reference guide for AI outfit suggestions in Weather Picks
 */

export interface SubcategoryContext {
  subcategory: string;
  category: string;
  weather: {
    idealTemp: string;
    tempRange: string;
    conditions: string[];
  };
  timeOfDay: {
    morning: string[];
    afternoon: string[];
    evening: string[];
  };
  dayOfWeek: {
    weekdayMorning: string[];
    weekdayAfternoon: string[];
    weekdayEvening: string[];
    saturdayMorning: string[];
    saturdayAfternoon: string[];
    saturdayEvening: string[];
    sundayMorning: string[];
    sundayAfternoon: string[];
    sundayEvening: string[];
  };
  lifestyles: string[];
  bestFor: string;
}

export const SUBCATEGORY_WEATHER_MATRIX: SubcategoryContext[] = [
  // ==================== TOPS & BLOUSES ====================
  {
    subcategory: 'T-shirts',
    category: 'tops',
    weather: {
      idealTemp: '65°F+',
      tempRange: 'Warm (65°F+), Mild (50-65°F with layers)',
      conditions: ['Clear', 'Partly Cloudy', 'Sunny']
    },
    timeOfDay: {
      morning: ['All lifestyles', 'Work (casual Friday)', 'Remote work'],
      afternoon: ['All lifestyles', 'Post-workout'],
      evening: ['Casual dinner', 'Errands', 'Relaxation']
    },
    dayOfWeek: {
      weekdayMorning: ['Professional (casual Friday)', 'Remote Worker', 'Student', 'Parent/Caregiver', 'Creative/Artistic'],
      weekdayAfternoon: ['All lifestyles'],
      weekdayEvening: ['All lifestyles'],
      saturdayMorning: ['Weekend brunch', 'Casual errands'],
      saturdayAfternoon: ['Shopping', 'Family activities'],
      saturdayEvening: ['Casual hangouts'],
      sundayMorning: ['Relaxed weekend'],
      sundayAfternoon: ['Casual activities'],
      sundayEvening: ['Relaxation']
    },
    lifestyles: ['Remote Worker', 'Student', 'Parent/Caregiver', 'Creative/Artistic', 'Active/Athletic'],
    bestFor: 'Spring/Summer all day, Fall/Winter indoors'
  },
  {
    subcategory: 'Button-down shirts / Blouses',
    category: 'tops',
    weather: {
      idealTemp: 'All weather',
      tempRange: 'All weather (layerable)',
      conditions: ['Any']
    },
    timeOfDay: {
      morning: ['Work', 'Professional meetings', 'Video calls'],
      afternoon: ['Work continues', 'Lunch meetings'],
      evening: ['After-work events', 'Date nights', 'Networking']
    },
    dayOfWeek: {
      weekdayMorning: ['Professional/Corporate', 'Remote Worker (video calls)', 'Creative/Artistic', 'Frequent Traveler'],
      weekdayAfternoon: ['Professional/Corporate', 'Social Butterfly'],
      weekdayEvening: ['Professional/Corporate (Thu-Fri)', 'Social Butterfly'],
      saturdayMorning: ['Weekend brunch (polished)'],
      saturdayAfternoon: ['Gallery visits', 'Upscale shopping'],
      saturdayEvening: ['Date night', 'Nice restaurants'],
      sundayMorning: ['Weekend brunch'],
      sundayAfternoon: ['Upscale casual'],
      sundayEvening: ['Date nights']
    },
    lifestyles: ['Professional/Corporate', 'Remote Worker', 'Creative/Artistic', 'Frequent Traveler', 'Social Butterfly'],
    bestFor: 'Year-round versatile piece, layerable for all temperatures'
  },
  {
    subcategory: 'Tank tops / Camisoles',
    category: 'tops',
    weather: {
      idealTemp: '75°F+',
      tempRange: 'Hot (75°F+), Warm (65-75°F)',
      conditions: ['Sunny', 'Hot', 'Clear']
    },
    timeOfDay: {
      morning: ['Gym commute layering', 'Under cardigans'],
      afternoon: ['Peak heat comfort', 'Outdoor activities'],
      evening: ['Summer evening casual']
    },
    dayOfWeek: {
      weekdayMorning: ['Active/Athletic', 'Remote Worker (under layers)'],
      weekdayAfternoon: ['All lifestyles', 'Parent/Caregiver (playground)'],
      weekdayEvening: ['Summer casual'],
      saturdayMorning: ['Farmers markets', 'Casual brunch'],
      saturdayAfternoon: ['Beach', 'Pool', 'Outdoor activities'],
      saturdayEvening: ['Backyard BBQs', 'Summer parties'],
      sundayMorning: ['Beach', 'Relaxed summer'],
      sundayAfternoon: ['Outdoor activities'],
      sundayEvening: ['Casual summer']
    },
    lifestyles: ['Active/Athletic', 'Remote Worker', 'Parent/Caregiver', 'Student'],
    bestFor: 'Summer all day, layering piece in other seasons'
  },
  {
    subcategory: 'Bodysuits',
    category: 'tops',
    weather: {
      idealTemp: 'All weather',
      tempRange: 'All weather (sleeve dependent)',
      conditions: ['Any']
    },
    timeOfDay: {
      morning: ['Professional (under suits)', 'Creative/Artistic'],
      afternoon: ['Social activities', 'Transition wear'],
      evening: ['Date night', 'Going out', 'Happy hours']
    },
    dayOfWeek: {
      weekdayMorning: ['Professional/Corporate', 'Creative/Artistic'],
      weekdayAfternoon: ['Social Butterfly'],
      weekdayEvening: ['Date nights (Thu-Fri)', 'Social Butterfly', 'Happy hours'],
      saturdayMorning: [],
      saturdayAfternoon: ['Shopping', 'Social activities'],
      saturdayEvening: ['Date nights', 'Parties', 'Clubs (PRIME)'],
      sundayMorning: [],
      sundayAfternoon: ['Social activities'],
      sundayEvening: ['Date nights']
    },
    lifestyles: ['Professional/Corporate', 'Creative/Artistic', 'Social Butterfly'],
    bestFor: 'Year-round, sleeveless for warm, long-sleeve for cool'
  },
  {
    subcategory: 'Crop tops',
    category: 'tops',
    weather: {
      idealTemp: '65°F+',
      tempRange: 'Warm to Hot (65°F+)',
      conditions: ['Sunny', 'Warm', 'Hot']
    },
    timeOfDay: {
      morning: ['Gym sessions', 'Campus casual'],
      afternoon: ['Studio work', 'Social activities'],
      evening: ['Social events', 'Parties', 'Going out']
    },
    dayOfWeek: {
      weekdayMorning: ['Active/Athletic', 'Student'],
      weekdayAfternoon: ['Creative/Artistic', 'Student'],
      weekdayEvening: ['Student (Thu-Fri)', 'Social Butterfly'],
      saturdayMorning: [],
      saturdayAfternoon: ['Festivals', 'Outdoor concerts', 'Shopping'],
      saturdayEvening: ['Clubs', 'Parties', 'Concerts (PEAK)'],
      sundayMorning: [],
      sundayAfternoon: ['Outdoor events'],
      sundayEvening: ['Going out']
    },
    lifestyles: ['Active/Athletic', 'Student', 'Creative/Artistic', 'Social Butterfly'],
    bestFor: 'Summer workouts and social events'
  },

  // ==================== BOTTOMS ====================
  {
    subcategory: 'Jeans',
    category: 'bottoms',
    weather: {
      idealTemp: '40-70°F',
      tempRange: 'Cool to Mild (40-70°F), adaptable all weather',
      conditions: ['Any']
    },
    timeOfDay: {
      morning: ['Casual work', 'Classes', 'School run'],
      afternoon: ['All casual activities'],
      evening: ['Universal casual wear', 'Bars', 'Restaurants']
    },
    dayOfWeek: {
      weekdayMorning: ['Remote Worker', 'Creative/Artistic', 'Student', 'Parent/Caregiver'],
      weekdayAfternoon: ['All casual lifestyles'],
      weekdayEvening: ['All lifestyles', 'Social Butterfly (any day)'],
      saturdayMorning: ['Errands', 'Brunch', 'Casual activities'],
      saturdayAfternoon: ['Shopping', 'Movies', 'Casual outings'],
      saturdayEvening: ['Casual date nights', 'Friend hangouts'],
      sundayMorning: ['Casual weekend'],
      sundayAfternoon: ['Relaxed activities'],
      sundayEvening: ['Casual wear']
    },
    lifestyles: ['Remote Worker', 'Creative/Artistic', 'Student', 'Parent/Caregiver', 'Social Butterfly'],
    bestFor: 'Fall/Winter/Spring all day, Summer evenings'
  },
  {
    subcategory: 'Leggings',
    category: 'bottoms',
    weather: {
      idealTemp: '40-65°F',
      tempRange: 'Cool to Mild (40-65°F for fashion, any temp for athletic)',
      conditions: ['Any']
    },
    timeOfDay: {
      morning: ['Gym', 'Morning runs', 'School drop-off', 'WFH comfort'],
      afternoon: ['Playground', 'Errands', 'Training'],
      evening: ['Gym', 'Yoga', 'Casual wear']
    },
    dayOfWeek: {
      weekdayMorning: ['Active/Athletic', 'Parent/Caregiver', 'Remote Worker'],
      weekdayAfternoon: ['Parent/Caregiver', 'Active/Athletic'],
      weekdayEvening: ['All lifestyles (gym)', 'Remote Worker'],
      saturdayMorning: ['Workout classes', 'Yoga', 'Pilates'],
      saturdayAfternoon: ['Hiking', 'Athleisure activities'],
      saturdayEvening: ['Casual home'],
      sundayMorning: ['Workouts'],
      sundayAfternoon: ['Athleisure'],
      sundayEvening: ['Relaxation']
    },
    lifestyles: ['Active/Athletic', 'Parent/Caregiver', 'Remote Worker'],
    bestFor: 'Fall/Winter/Spring workouts, year-round athleisure'
  },
  {
    subcategory: 'Trousers',
    category: 'bottoms',
    weather: {
      idealTemp: 'All weather',
      tempRange: 'All weather (fabric dependent)',
      conditions: ['Any']
    },
    timeOfDay: {
      morning: ['Work', 'Travel', 'Client meetings'],
      afternoon: ['Work continues', 'Networking'],
      evening: ['Formal events', 'Upscale dinners']
    },
    dayOfWeek: {
      weekdayMorning: ['Professional/Corporate', 'Frequent Traveler', 'Creative/Artistic'],
      weekdayAfternoon: ['Professional/Corporate', 'Social Butterfly'],
      weekdayEvening: ['Professional/Corporate', 'Social Butterfly'],
      saturdayMorning: ['Weekend brunch (polished)'],
      saturdayAfternoon: [],
      saturdayEvening: ['Nice restaurants', 'Theater', 'Formal dates'],
      sundayMorning: ['Polished brunch'],
      sundayAfternoon: [],
      sundayEvening: ['Formal occasions']
    },
    lifestyles: ['Professional/Corporate', 'Frequent Traveler', 'Creative/Artistic', 'Social Butterfly'],
    bestFor: 'Year-round professional wear'
  },
  {
    subcategory: 'Shorts',
    category: 'bottoms',
    weather: {
      idealTemp: '70°F+',
      tempRange: 'Warm to Hot (70°F+)',
      conditions: ['Sunny', 'Hot', 'Clear']
    },
    timeOfDay: {
      morning: ['Morning runs', 'Outdoor workouts', 'Hot WFH'],
      afternoon: ['Peak heat comfort', 'Park activities'],
      evening: ['Summer campus social', 'Casual summer evenings']
    },
    dayOfWeek: {
      weekdayMorning: ['Active/Athletic', 'Remote Worker'],
      weekdayAfternoon: ['All lifestyles', 'Parent/Caregiver'],
      weekdayEvening: ['Student (Thu-Fri)', 'Casual summer'],
      saturdayMorning: ['Beach', 'Farmers markets', 'Outdoor brunch'],
      saturdayAfternoon: ['Outdoor activities', 'Sports', 'Barbecues'],
      saturdayEvening: ['Beach parties', 'Casual summer nights'],
      sundayMorning: ['Beach', 'Outdoor activities'],
      sundayAfternoon: ['Summer activities'],
      sundayEvening: ['Casual']
    },
    lifestyles: ['Active/Athletic', 'Remote Worker', 'Parent/Caregiver', 'Student'],
    bestFor: 'Summer all day, warm climates year-round'
  },
  {
    subcategory: 'Skirts',
    category: 'bottoms',
    weather: {
      idealTemp: '65°F+',
      tempRange: 'Warm to Hot (65°F+), All weather (maxi with tights)',
      conditions: ['Clear', 'Sunny', 'Warm']
    },
    timeOfDay: {
      morning: ['Work (pencil skirts)', 'Campus (midi/mini)'],
      afternoon: ['Work continues', 'Styled meetings'],
      evening: ['Date nights', 'Going out', 'Feminine wear']
    },
    dayOfWeek: {
      weekdayMorning: ['Professional/Corporate (pencil)', 'Student (midi/mini)'],
      weekdayAfternoon: ['Professional/Corporate', 'Creative/Artistic'],
      weekdayEvening: ['Social Butterfly (Thu-Fri)', 'All lifestyles'],
      saturdayMorning: ['Brunch (midi/maxi)'],
      saturdayAfternoon: ['Shopping', 'Garden parties'],
      saturdayEvening: ['Date nights', 'Summer events', 'Weddings'],
      sundayMorning: ['Brunch'],
      sundayAfternoon: ['Social events'],
      sundayEvening: ['Date nights']
    },
    lifestyles: ['Professional/Corporate', 'Student', 'Creative/Artistic', 'Social Butterfly'],
    bestFor: 'Spring/Summer primarily, styled with tights Fall/Winter'
  },

  // ==================== DRESSES ====================
  {
    subcategory: 'Casual day dresses / Sundresses',
    category: 'dresses',
    weather: {
      idealTemp: '70°F+',
      tempRange: 'Warm to Hot (70°F+)',
      conditions: ['Sunny', 'Hot', 'Clear']
    },
    timeOfDay: {
      morning: ['WFH comfort', 'School drop-off', 'Campus'],
      afternoon: ['Easy summer solution', 'Playground-friendly'],
      evening: ['Casual summer dinner']
    },
    dayOfWeek: {
      weekdayMorning: ['Remote Worker', 'Parent/Caregiver', 'Student'],
      weekdayAfternoon: ['All lifestyles'],
      weekdayEvening: ['Casual summer'],
      saturdayMorning: ['Farmers markets', 'Brunch (PEAK)'],
      saturdayAfternoon: ['Outdoor activities', 'Picnics', 'Shopping'],
      saturdayEvening: ['Casual BBQs', 'Outdoor concerts'],
      sundayMorning: ['Relaxed weekend'],
      sundayAfternoon: ['Outdoor activities'],
      sundayEvening: ['Casual']
    },
    lifestyles: ['Remote Worker', 'Parent/Caregiver', 'Student'],
    bestFor: 'Spring/Summer all day'
  },
  {
    subcategory: 'Midi dresses',
    category: 'dresses',
    weather: {
      idealTemp: '60°F+',
      tempRange: 'Mild to Warm (60°F+), can layer for cooler',
      conditions: ['Clear', 'Mild', 'Warm']
    },
    timeOfDay: {
      morning: ['Work-appropriate', 'Office/studio'],
      afternoon: ['Meetings', 'Presentations', 'Lunch events'],
      evening: ['Dinner dates', 'Versatile evening wear']
    },
    dayOfWeek: {
      weekdayMorning: ['Professional/Corporate', 'Creative/Artistic'],
      weekdayAfternoon: ['Professional/Corporate', 'Social Butterfly'],
      weekdayEvening: ['Social Butterfly (Thu-Fri)', 'All lifestyles'],
      saturdayMorning: ['Brunch (polished)'],
      saturdayAfternoon: ['Baby showers', 'Garden parties', 'Weddings'],
      saturdayEvening: ['Date nights', 'Restaurant dinners'],
      sundayMorning: ['Brunch'],
      sundayAfternoon: ['Social events'],
      sundayEvening: ['Date nights']
    },
    lifestyles: ['Professional/Corporate', 'Creative/Artistic', 'Social Butterfly'],
    bestFor: 'Spring/Summer/Early Fall, versatile all day'
  },
  {
    subcategory: 'Maxi dresses',
    category: 'dresses',
    weather: {
      idealTemp: '65°F+',
      tempRange: 'Warm to Hot (65°F+)',
      conditions: ['Sunny', 'Warm', 'Hot']
    },
    timeOfDay: {
      morning: ['Comfortable all-day WFH', 'Studio days'],
      afternoon: ['Flowing comfort'],
      evening: ['Summer evening events', 'Breezy dinner']
    },
    dayOfWeek: {
      weekdayMorning: ['Remote Worker', 'Creative/Artistic'],
      weekdayAfternoon: ['All casual lifestyles'],
      weekdayEvening: ['Social Butterfly', 'All lifestyles'],
      saturdayMorning: ['Relaxed brunch'],
      saturdayAfternoon: ['Beach cover-ups', 'Resort wear'],
      saturdayEvening: ['Summer weddings', 'Outdoor concerts', 'Date nights'],
      sundayMorning: ['Relaxed weekend'],
      sundayAfternoon: ['Beach', 'Resort'],
      sundayEvening: ['Summer events']
    },
    lifestyles: ['Remote Worker', 'Creative/Artistic', 'Social Butterfly'],
    bestFor: 'Summer all day, Spring/Fall afternoons'
  },
  {
    subcategory: 'Cocktail dresses / Party dresses',
    category: 'dresses',
    weather: {
      idealTemp: 'All weather',
      tempRange: 'All weather (indoor events)',
      conditions: ['Any']
    },
    timeOfDay: {
      morning: [],
      afternoon: [],
      evening: ['Work galas', 'Dinner transitions', 'Special events']
    },
    dayOfWeek: {
      weekdayMorning: [],
      weekdayAfternoon: [],
      weekdayEvening: ['Professional/Corporate (Thu-Fri galas)', 'Social Butterfly', 'Special events'],
      saturdayMorning: [],
      saturdayAfternoon: [],
      saturdayEvening: ['Weddings', 'Celebrations', 'Parties (PEAK)', 'Social Butterfly (PRIME)'],
      sundayMorning: [],
      sundayAfternoon: [],
      sundayEvening: ['Special evening events']
    },
    lifestyles: ['Professional/Corporate', 'Social Butterfly'],
    bestFor: 'Year-round evening events'
  },
  {
    subcategory: 'Little black dress (LBD) / Bodycon dresses',
    category: 'dresses',
    weather: {
      idealTemp: 'All weather',
      tempRange: 'All weather (indoor venues)',
      conditions: ['Any']
    },
    timeOfDay: {
      morning: [],
      afternoon: [],
      evening: ['Date nights', 'Clubs', 'Bars', 'Fancy dinners']
    },
    dayOfWeek: {
      weekdayMorning: [],
      weekdayAfternoon: [],
      weekdayEvening: ['Social Butterfly (Thu-Fri)', 'All lifestyles', 'After-work cocktails'],
      saturdayMorning: [],
      saturdayAfternoon: [],
      saturdayEvening: ['Date nights', 'Clubs', 'Parties (PEAK SATURDAY)', 'Social Butterfly (PRIME)'],
      sundayMorning: [],
      sundayAfternoon: [],
      sundayEvening: ['Date nights', 'Going out']
    },
    lifestyles: ['Social Butterfly', 'All lifestyles (special occasions)'],
    bestFor: 'Year-round evening wear'
  },

  // ==================== ACTIVEWEAR ====================
  {
    subcategory: 'Leggings',
    category: 'activewear',
    weather: {
      idealTemp: '40-65°F',
      tempRange: 'Cool to Mild (40-65°F ideal), works all weather',
      conditions: ['Any']
    },
    timeOfDay: {
      morning: ['Training (6-8am PRIME)', 'Pre-work gym', 'Fitness classes'],
      afternoon: ['Continued training'],
      evening: ['After-work gym', 'Evening yoga']
    },
    dayOfWeek: {
      weekdayMorning: ['Active/Athletic', 'Professional/Corporate (pre-work)', 'All lifestyles'],
      weekdayAfternoon: ['Active/Athletic', 'Parent/Caregiver (errands)'],
      weekdayEvening: ['All lifestyles (gym)', 'Remote Worker'],
      saturdayMorning: ['Workout classes', 'Runs (PEAK ATHLETIC)'],
      saturdayAfternoon: ['Hiking', 'Active recovery', 'Athleisure'],
      saturdayEvening: ['Relaxation', 'Casual home'],
      sundayMorning: ['Workouts', 'Yoga'],
      sundayAfternoon: ['Athleisure'],
      sundayEvening: ['Casual']
    },
    lifestyles: ['Active/Athletic', 'All lifestyles (fitness)'],
    bestFor: 'Fall/Winter/Spring workouts, year-round athleisure'
  },
  {
    subcategory: 'Sports bras',
    category: 'activewear',
    weather: {
      idealTemp: '65°F+',
      tempRange: 'Warm to Hot (65°F+ standalone), all temps as underlayer',
      conditions: ['Hot', 'Sunny', 'Warm']
    },
    timeOfDay: {
      morning: ['Intense training (6-8am)', 'Hot yoga', 'Cardio'],
      afternoon: ['Outdoor runs', 'Training'],
      evening: ['Evening gym sessions']
    },
    dayOfWeek: {
      weekdayMorning: ['Active/Athletic', 'All lifestyles (workouts)'],
      weekdayAfternoon: ['Active/Athletic'],
      weekdayEvening: ['All lifestyles (gym)'],
      saturdayMorning: ['Long runs', 'HIIT classes', 'Outdoor training'],
      saturdayAfternoon: ['Outdoor sports', 'Hiking (hot)'],
      saturdayEvening: [],
      sundayMorning: ['Workouts'],
      sundayAfternoon: ['Hot weather activities'],
      sundayEvening: []
    },
    lifestyles: ['Active/Athletic', 'All lifestyles (fitness)'],
    bestFor: 'Summer standalone, year-round under tops'
  },
  {
    subcategory: 'Athletic shorts',
    category: 'activewear',
    weather: {
      idealTemp: '70°F+',
      tempRange: 'Warm to Hot (70°F+)',
      conditions: ['Hot', 'Sunny', 'Clear']
    },
    timeOfDay: {
      morning: ['Outdoor runs', 'Training'],
      afternoon: ['Afternoon training'],
      evening: ['Summer evening runs']
    },
    dayOfWeek: {
      weekdayMorning: ['Active/Athletic', 'All lifestyles (hot workouts)'],
      weekdayAfternoon: ['Active/Athletic'],
      weekdayEvening: ['Summer workouts'],
      saturdayMorning: ['Long runs', 'Outdoor sports', 'Tennis'],
      saturdayAfternoon: ['Basketball', 'Recreational sports', 'Hiking'],
      saturdayEvening: [],
      sundayMorning: ['Outdoor workouts'],
      sundayAfternoon: ['Sports'],
      sundayEvening: []
    },
    lifestyles: ['Active/Athletic', 'All lifestyles (summer fitness)'],
    bestFor: 'Spring/Summer workouts'
  },
  {
    subcategory: 'Athletic tops',
    category: 'activewear',
    weather: {
      idealTemp: 'All weather',
      tempRange: 'All weather (fabric dependent)',
      conditions: ['Any']
    },
    timeOfDay: {
      morning: ['All training (6-9am)', 'Gym workouts'],
      afternoon: ['Continued training'],
      evening: ['After-work fitness']
    },
    dayOfWeek: {
      weekdayMorning: ['Active/Athletic', 'All lifestyles (gym)'],
      weekdayAfternoon: ['Active/Athletic'],
      weekdayEvening: ['All lifestyles (fitness)'],
      saturdayMorning: ['Workout classes', 'Long training'],
      saturdayAfternoon: ['Active sports', 'Outdoor activities'],
      saturdayEvening: [],
      sundayMorning: ['Workouts'],
      sundayAfternoon: ['Active'],
      sundayEvening: []
    },
    lifestyles: ['Active/Athletic', 'All lifestyles (fitness)'],
    bestFor: 'Year-round active wear'
  },
  {
    subcategory: 'Hoodies / Joggers',
    category: 'activewear',
    weather: {
      idealTemp: '40-60°F',
      tempRange: 'Cool to Cold (40-60°F)',
      conditions: ['Cool', 'Cold', 'Cloudy']
    },
    timeOfDay: {
      morning: ['Casual WFH', 'Campus', 'Cool workouts'],
      afternoon: ['All-day WFH', 'Study sessions'],
      evening: ['Relaxed wear', 'Casual errands']
    },
    dayOfWeek: {
      weekdayMorning: ['Remote Worker', 'Student', 'All lifestyles (cool workouts)'],
      weekdayAfternoon: ['Remote Worker', 'Student'],
      weekdayEvening: ['All lifestyles'],
      saturdayMorning: ['Coffee runs', 'Lazy weekends', 'Casual errands'],
      saturdayAfternoon: ['Relaxed activities', 'Movie days'],
      saturdayEvening: ['Cozy nights', 'Casual hangouts'],
      sundayMorning: ['Relaxed weekend'],
      sundayAfternoon: ['Casual'],
      sundayEvening: ['Cozy']
    },
    lifestyles: ['Remote Worker', 'Student', 'All lifestyles (athleisure)'],
    bestFor: 'Fall/Spring all day, Summer evenings'
  },

  // ==================== OUTERWEAR ====================
  {
    subcategory: 'Sweaters',
    category: 'outerwear',
    weather: {
      idealTemp: '40-65°F',
      tempRange: 'Cool to Cold (40-65°F)',
      conditions: ['Cool', 'Cold', 'Cloudy']
    },
    timeOfDay: {
      morning: ['Crisp starts', 'Office layering'],
      afternoon: ['Indoor/outdoor transition', 'Office AC'],
      evening: ['Cooling down', 'Temperature drops']
    },
    dayOfWeek: {
      weekdayMorning: ['Professional/Corporate', 'Remote Worker', 'Student'],
      weekdayAfternoon: ['All lifestyles'],
      weekdayEvening: ['All lifestyles'],
      saturdayMorning: ['Brunch layering', 'Casual warmth'],
      saturdayAfternoon: ['Shopping', 'Indoor/outdoor'],
      saturdayEvening: ['Dinner layering', 'Cozy evenings'],
      sundayMorning: ['Relaxed weekend'],
      sundayAfternoon: ['Casual'],
      sundayEvening: ['Cozy']
    },
    lifestyles: ['Professional/Corporate', 'Remote Worker', 'Student', 'All lifestyles'],
    bestFor: 'Fall/Winter/Spring all day'
  },
  {
    subcategory: 'Hoodies / Sweatshirts',
    category: 'outerwear',
    weather: {
      idealTemp: '45-65°F',
      tempRange: 'Cool to Mild (45-65°F)',
      conditions: ['Cool', 'Mild', 'Cloudy']
    },
    timeOfDay: {
      morning: ['Casual WFH', 'Campus', 'Warm-up layers'],
      afternoon: ['All-day casual', 'Between classes'],
      evening: ['Casual comfort', 'Gym layer']
    },
    dayOfWeek: {
      weekdayMorning: ['Remote Worker', 'Student', 'Active/Athletic'],
      weekdayAfternoon: ['Remote Worker', 'Student'],
      weekdayEvening: ['All lifestyles'],
      saturdayMorning: ['Casual weekend', 'Coffee runs'],
      saturdayAfternoon: ['Errands', 'Casual outings', 'Sports events'],
      saturdayEvening: ['Relaxed hangouts', 'Movie nights'],
      sundayMorning: ['Relaxed'],
      sundayAfternoon: ['Casual'],
      sundayEvening: ['Cozy']
    },
    lifestyles: ['Remote Worker', 'Student', 'Active/Athletic', 'All lifestyles'],
    bestFor: 'Fall/Spring all day, Summer evenings'
  },
  {
    subcategory: 'Denim jackets',
    category: 'outerwear',
    weather: {
      idealTemp: '50-70°F',
      tempRange: 'Mild to Cool (50-70°F)',
      conditions: ['Mild', 'Cool', 'Cloudy']
    },
    timeOfDay: {
      morning: ['Campus layer', 'Casual office', 'Errands'],
      afternoon: ['Temperature transition'],
      evening: ['Cool evening layer', 'Bars', 'Casual dinners']
    },
    dayOfWeek: {
      weekdayMorning: ['Student', 'Creative/Artistic', 'Remote Worker'],
      weekdayAfternoon: ['All lifestyles'],
      weekdayEvening: ['Social Butterfly (Thu-Fri)', 'All lifestyles'],
      saturdayMorning: ['Brunch layer', 'Farmers markets'],
      saturdayAfternoon: ['Shopping', 'Outdoor activities'],
      saturdayEvening: ['Concerts', 'Casual date nights'],
      sundayMorning: ['Casual'],
      sundayAfternoon: ['Outdoor'],
      sundayEvening: ['Casual']
    },
    lifestyles: ['Student', 'Creative/Artistic', 'Remote Worker', 'Social Butterfly'],
    bestFor: 'Spring/Fall all day, Summer evenings'
  },
  {
    subcategory: 'Blazers',
    category: 'outerwear',
    weather: {
      idealTemp: '55-70°F',
      tempRange: 'Mild to Cool (55-70°F), indoors any temp',
      conditions: ['Any']
    },
    timeOfDay: {
      morning: ['Work attire', 'Business meetings', 'Client presentations'],
      afternoon: ['Meetings', 'Presentations', 'Networking'],
      evening: ['After-work events', 'Upscale dinners']
    },
    dayOfWeek: {
      weekdayMorning: ['Professional/Corporate', 'Frequent Traveler', 'Creative/Artistic'],
      weekdayAfternoon: ['Professional/Corporate', 'Social Butterfly'],
      weekdayEvening: ['Professional/Corporate (Thu-Fri)', 'Social Butterfly'],
      saturdayMorning: ['Business brunch (occasional)'],
      saturdayAfternoon: [],
      saturdayEvening: ['Formal events', 'Nice restaurants', 'Theater'],
      sundayMorning: [],
      sundayAfternoon: [],
      sundayEvening: ['Formal occasions']
    },
    lifestyles: ['Professional/Corporate', 'Frequent Traveler', 'Creative/Artistic', 'Social Butterfly'],
    bestFor: 'Spring/Fall work hours, year-round professional'
  },
  {
    subcategory: 'Puffer jackets / Down coats',
    category: 'outerwear',
    weather: {
      idealTemp: '20-50°F',
      tempRange: 'Cold to Freezing (20-50°F)',
      conditions: ['Cold', 'Snow', 'Freezing']
    },
    timeOfDay: {
      morning: ['Cold commutes', 'School runs', 'Winter walks'],
      afternoon: ['Outdoor errands', 'Cold weather'],
      evening: ['Cold evening outings', 'Winter events']
    },
    dayOfWeek: {
      weekdayMorning: ['All lifestyles', 'Professional/Corporate (commute)'],
      weekdayAfternoon: ['All lifestyles', 'Parent/Caregiver (pickup)'],
      weekdayEvening: ['All lifestyles'],
      saturdayMorning: ['Winter outdoor', 'Cold errands'],
      saturdayAfternoon: ['Winter sports', 'Outdoor activities'],
      saturdayEvening: ['Cold weather outings', 'Winter events'],
      sundayMorning: ['Cold weather'],
      sundayAfternoon: ['Winter activities'],
      sundayEvening: ['Cold outings']
    },
    lifestyles: ['All lifestyles'],
    bestFor: 'Winter all day, late Fall/early Spring'
  },

  // ==================== SHOES ====================
  {
    subcategory: 'Sneakers',
    category: 'shoes',
    weather: {
      idealTemp: 'All weather',
      tempRange: 'All weather (material dependent)',
      conditions: ['Any']
    },
    timeOfDay: {
      morning: ['Active workouts', 'Commute', 'Campus walking'],
      afternoon: ['Casual errands', 'Active parenting', 'All-day campus'],
      evening: ['Gym', 'Casual outings', 'Athleisure social']
    },
    dayOfWeek: {
      weekdayMorning: ['Active/Athletic', 'All lifestyles', 'Student'],
      weekdayAfternoon: ['Remote Worker', 'Parent/Caregiver', 'Student'],
      weekdayEvening: ['All lifestyles', 'Social Butterfly'],
      saturdayMorning: ['Workouts', 'Errands', 'Brunch (casual)'],
      saturdayAfternoon: ['Shopping', 'Active outings', 'Travel'],
      saturdayEvening: ['Casual hangouts', 'Concerts'],
      sundayMorning: ['Casual weekend'],
      sundayAfternoon: ['Activities'],
      sundayEvening: ['Casual']
    },
    lifestyles: ['Active/Athletic', 'All lifestyles'],
    bestFor: 'Year-round, waterproof styles for rain/snow'
  },
  {
    subcategory: 'Ankle boots',
    category: 'shoes',
    weather: {
      idealTemp: '40-65°F',
      tempRange: 'Cool to Cold (40-65°F)',
      conditions: ['Cool', 'Cold', 'Cloudy']
    },
    timeOfDay: {
      morning: ['Work footwear', 'Stylish office'],
      afternoon: ['Versatile day-to-evening'],
      evening: ['Date nights', 'Going out', 'Elevated casual']
    },
    dayOfWeek: {
      weekdayMorning: ['Professional/Corporate', 'Creative/Artistic', 'Frequent Traveler'],
      weekdayAfternoon: ['All lifestyles'],
      weekdayEvening: ['Social Butterfly', 'All lifestyles'],
      saturdayMorning: ['Brunch', 'Shopping', 'Errands'],
      saturdayAfternoon: ['Sightseeing', 'Galleries', 'Activities'],
      saturdayEvening: ['Date nights', 'Dinners', 'Events'],
      sundayMorning: ['Brunch'],
      sundayAfternoon: ['Activities'],
      sundayEvening: ['Dinners']
    },
    lifestyles: ['Professional/Corporate', 'Creative/Artistic', 'Frequent Traveler', 'Social Butterfly'],
    bestFor: 'Fall/Winter/Spring all day'
  },
  {
    subcategory: 'Flats',
    category: 'shoes',
    weather: {
      idealTemp: '55-75°F',
      tempRange: 'Mild to Warm (55-75°F)',
      conditions: ['Mild', 'Warm', 'Clear']
    },
    timeOfDay: {
      morning: ['Office-appropriate', 'Comfortable commute'],
      afternoon: ['All-day work comfort', 'Active parenting'],
      evening: ['Casual dinners', 'Errands']
    },
    dayOfWeek: {
      weekdayMorning: ['Professional/Corporate', 'All lifestyles'],
      weekdayAfternoon: ['Professional/Corporate', 'Parent/Caregiver'],
      weekdayEvening: ['All lifestyles'],
      saturdayMorning: ['Brunch', 'Errands', 'Shopping'],
      saturdayAfternoon: ['Walking tours', 'Museums', 'Activities'],
      saturdayEvening: ['Casual dinners', 'Relaxed outings'],
      sundayMorning: ['Brunch', 'Casual'],
      sundayAfternoon: ['Activities'],
      sundayEvening: ['Casual']
    },
    lifestyles: ['Professional/Corporate', 'All lifestyles'],
    bestFor: 'Spring/Summer/Fall, indoor year-round'
  },
  {
    subcategory: 'Heels',
    category: 'shoes',
    weather: {
      idealTemp: 'All weather',
      tempRange: 'All weather (indoor focus)',
      conditions: ['Any']
    },
    timeOfDay: {
      morning: ['Important meetings', 'Presentations'],
      afternoon: ['Work events', 'Upscale lunches'],
      evening: ['Date nights', 'After-work events', 'Fancy dinners']
    },
    dayOfWeek: {
      weekdayMorning: ['Professional/Corporate'],
      weekdayAfternoon: ['Professional/Corporate', 'Social Butterfly'],
      weekdayEvening: ['All lifestyles (Thu-Fri)', 'Social Butterfly', 'Professional/Corporate'],
      saturdayMorning: [],
      saturdayAfternoon: [],
      saturdayEvening: ['Special occasions', 'Weddings', 'Fancy dates', 'Social Butterfly (PRIME)', 'Upscale restaurants', 'Clubs'],
      sundayMorning: [],
      sundayAfternoon: [],
      sundayEvening: ['Special occasions', 'Fancy dates']
    },
    lifestyles: ['Professional/Corporate', 'Social Butterfly', 'All lifestyles (special)'],
    bestFor: 'Year-round indoor/event wear'
  },
  {
    subcategory: 'Sandals',
    category: 'shoes',
    weather: {
      idealTemp: '70°F+',
      tempRange: 'Warm to Hot (70°F+)',
      conditions: ['Sunny', 'Hot', 'Clear']
    },
    timeOfDay: {
      morning: ['WFH comfort', 'Casual summer office'],
      afternoon: ['Peak heat comfort', 'Summer activities'],
      evening: ['Summer evening casual']
    },
    dayOfWeek: {
      weekdayMorning: ['Remote Worker', 'Creative/Artistic'],
      weekdayAfternoon: ['All lifestyles', 'Parent/Caregiver'],
      weekdayEvening: ['Summer casual'],
      saturdayMorning: ['Beach', 'Pool', 'Brunch (warm)'],
      saturdayAfternoon: ['Outdoor summer', 'Beach days'],
      saturdayEvening: ['Summer BBQs', 'Beach parties', 'Casual dinners'],
      sundayMorning: ['Beach', 'Relaxed summer'],
      sundayAfternoon: ['Summer activities'],
      sundayEvening: ['Casual summer']
    },
    lifestyles: ['Remote Worker', 'Creative/Artistic', 'Parent/Caregiver', 'All lifestyles (summer)'],
    bestFor: 'Summer all day, warm climates year-round'
  },

  // ==================== ACCESSORIES ====================
  {
    subcategory: 'Bags',
    category: 'accessories',
    weather: {
      idealTemp: 'All weather',
      tempRange: 'All weather',
      conditions: ['Any']
    },
    timeOfDay: {
      morning: ['Work bags', 'Errand totes', 'School essentials'],
      afternoon: ['Continuation'],
      evening: ['Crossbody for socializing', 'Evening bags']
    },
    dayOfWeek: {
      weekdayMorning: ['Professional/Corporate (work)', 'Parent/Caregiver (diaper/errand)', 'Student (books)'],
      weekdayAfternoon: ['All lifestyles'],
      weekdayEvening: ['Social Butterfly (crossbody)', 'Special events (clutches)'],
      saturdayMorning: ['Brunch bags', 'Errand totes'],
      saturdayAfternoon: ['Shopping totes', 'Activity bags'],
      saturdayEvening: ['Crossbody (nights out)', 'Clutches (Fri-Sat)'],
      sundayMorning: ['Casual bags'],
      sundayAfternoon: ['Activity bags'],
      sundayEvening: ['Evening bags (special)']
    },
    lifestyles: ['All lifestyles'],
    bestFor: 'Year-round, weather-resistant for rain'
  },
  {
    subcategory: 'Jewelry',
    category: 'accessories',
    weather: {
      idealTemp: 'All weather',
      tempRange: 'All weather',
      conditions: ['Any']
    },
    timeOfDay: {
      morning: ['Simple elegant pieces', 'Daily basics'],
      afternoon: ['Continuation'],
      evening: ['Statement pieces for going out', 'Elevated jewelry']
    },
    dayOfWeek: {
      weekdayMorning: ['Professional/Corporate (simple)', 'All lifestyles (basics)'],
      weekdayAfternoon: ['Continuation'],
      weekdayEvening: ['All lifestyles (Thu-Fri statement)', 'Social Butterfly'],
      saturdayMorning: ['Casual minimal'],
      saturdayAfternoon: ['Minimal'],
      saturdayEvening: ['Statement jewelry (special occasions)'],
      sundayMorning: ['Minimal'],
      sundayAfternoon: ['Casual'],
      sundayEvening: ['Statement (special)']
    },
    lifestyles: ['All lifestyles'],
    bestFor: 'Year-round all occasions'
  },
  {
    subcategory: 'Sunglasses',
    category: 'accessories',
    weather: {
      idealTemp: 'Sunny',
      tempRange: 'Sunny days (any temp)',
      conditions: ['Sunny', 'Clear', 'Bright']
    },
    timeOfDay: {
      morning: ['Commute protection', 'Bright light'],
      afternoon: ['Peak sun hours'],
      evening: ['Summer only (late sun)']
    },
    dayOfWeek: {
      weekdayMorning: ['All lifestyles', 'Frequent Traveler'],
      weekdayAfternoon: ['All lifestyles'],
      weekdayEvening: ['Summer sunset'],
      saturdayMorning: ['Outdoor activities'],
      saturdayAfternoon: ['Beach', 'Driving', 'Outdoor (PEAK)'],
      saturdayEvening: ['Summer sunset'],
      sundayMorning: ['Outdoor'],
      sundayAfternoon: ['Outdoor activities'],
      sundayEvening: ['Summer']
    },
    lifestyles: ['All lifestyles'],
    bestFor: 'Year-round sun protection, especially summer'
  },
  {
    subcategory: 'Belts',
    category: 'accessories',
    weather: {
      idealTemp: 'All weather',
      tempRange: 'All weather',
      conditions: ['Any']
    },
    timeOfDay: {
      morning: ['Styling trousers', 'Work dresses', 'Jeans/pants'],
      afternoon: ['Continuation'],
      evening: ['Styling outfits']
    },
    dayOfWeek: {
      weekdayMorning: ['Professional/Corporate', 'All lifestyles'],
      weekdayAfternoon: ['Continuation'],
      weekdayEvening: ['Styling'],
      saturdayMorning: ['Styling casual'],
      saturdayAfternoon: ['Styling'],
      saturdayEvening: ['Styling'],
      sundayMorning: ['Casual'],
      sundayAfternoon: ['Styling'],
      sundayEvening: ['Styling']
    },
    lifestyles: ['All lifestyles'],
    bestFor: 'Year-round styling accessory'
  },
  {
    subcategory: 'Scarves',
    category: 'accessories',
    weather: {
      idealTemp: '35-60°F',
      tempRange: 'Cool to Cold (35-60°F)',
      conditions: ['Cold', 'Cool', 'Windy']
    },
    timeOfDay: {
      morning: ['Cold commute protection', 'Styling blazers/coats'],
      afternoon: ['Temperature drops'],
      evening: ['Cold evening outings']
    },
    dayOfWeek: {
      weekdayMorning: ['All lifestyles', 'Professional/Corporate'],
      weekdayAfternoon: ['All lifestyles'],
      weekdayEvening: ['Cold outings'],
      saturdayMorning: ['Brunch styling', 'Cold outings'],
      saturdayAfternoon: ['Winter activities', 'Styling'],
      saturdayEvening: ['Cold evenings', 'Winter styling'],
      sundayMorning: ['Cold weather'],
      sundayAfternoon: ['Styling'],
      sundayEvening: ['Cold']
    },
    lifestyles: ['All lifestyles'],
    bestFor: 'Fall/Winter/Spring, lightweight silk for summer evenings'
  }
];

/**
 * Get weather-appropriate subcategories for current conditions
 */
export function getAppropriateSubcategories(
  temperature: number,
  timeOfDay: 'morning' | 'afternoon' | 'evening',
  dayType: 'weekday' | 'saturday' | 'sunday',
  lifestyle: string
): SubcategoryContext[] {
  return SUBCATEGORY_WEATHER_MATRIX.filter(item => {
    // Check temperature suitability
    const tempSuitable = isTempSuitable(item.weather.tempRange, temperature);
    
    // Check time appropriateness
    const timeKey = `${dayType}${timeOfDay.charAt(0).toUpperCase() + timeOfDay.slice(1)}` as keyof typeof item.dayOfWeek;
    const timeAppropriate = item.dayOfWeek[timeKey]?.some(l => 
      l.includes('All') || l.toLowerCase().includes(lifestyle.toLowerCase())
    );
    
    return tempSuitable && (timeAppropriate || item.dayOfWeek[timeKey]?.length === 0);
  });
}

/**
 * Check if temperature is suitable for given range
 */
function isTempSuitable(tempRange: string, currentTemp: number): boolean {
  if (tempRange.includes('75°F+') && currentTemp >= 75) return true;
  if (tempRange.includes('70°F+') && currentTemp >= 70) return true;
  if (tempRange.includes('65-75°F') && currentTemp >= 65 && currentTemp < 75) return true;
  if (tempRange.includes('65°F+') && currentTemp >= 65) return true;
  if (tempRange.includes('60°F+') && currentTemp >= 60) return true;
  if (tempRange.includes('55-75°F') && currentTemp >= 55 && currentTemp < 75) return true;
  if (tempRange.includes('55-70°F') && currentTemp >= 55 && currentTemp < 70) return true;
  if (tempRange.includes('50-70°F') && currentTemp >= 50 && currentTemp < 70) return true;
  if (tempRange.includes('50-65°F') && currentTemp >= 50 && currentTemp < 65) return true;
  if (tempRange.includes('45-65°F') && currentTemp >= 45 && currentTemp < 65) return true;
  if (tempRange.includes('40-70°F') && currentTemp >= 40 && currentTemp < 70) return true;
  if (tempRange.includes('40-65°F') && currentTemp >= 40 && currentTemp < 65) return true;
  if (tempRange.includes('40-60°F') && currentTemp >= 40 && currentTemp < 60) return true;
  if (tempRange.includes('40-50°F') && currentTemp >= 40 && currentTemp < 50) return true;
  if (tempRange.includes('35-60°F') && currentTemp >= 35 && currentTemp < 60) return true;
  if (tempRange.includes('20-50°F') && currentTemp >= 20 && currentTemp < 50) return true;
  if (tempRange.includes('All weather')) return true;
  return false;
}

/**
 * Get temperature category label
 */
export function getTempCategory(temperature: number): string {
  if (temperature >= 75) return 'HOT (75°F+)';
  if (temperature >= 65) return 'WARM (65-75°F)';
  if (temperature >= 50) return 'MILD (50-65°F)';
  if (temperature >= 40) return 'COOL (40-50°F)';
  return 'COLD (Below 40°F)';
}

/**
 * Get quick reference items for temperature
 */
export function getQuickRefForTemp(temperature: number): string {
  if (temperature >= 75) return 'Tank tops, crop tops, shorts, sundresses, sandals';
  if (temperature >= 65) return 'T-shirts, skirts, midi dresses, casual dresses, flats';
  if (temperature >= 50) return 'Button-downs, jeans, trousers, sweaters, denim jackets, ankle boots';
  if (temperature >= 40) return 'Sweaters, hoodies, blazers, leggings, boots, scarves';
  return 'Puffer jackets, down coats, heavy sweaters, boots, scarves, gloves';
}

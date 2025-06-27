
import type { Icon as LucideIconType } from 'lucide-react';
import { Shell, Sun, Moon, Leaf, Droplets, Mountain, Zap, Wind, Award, Star, Sparkles, Feather, Gem } from 'lucide-react';

export interface ChrysalisVariantData {
  id: string; // e.g., "coin_day_1", "coin_day_2" ... "coin_day_133"
  dayNumber: number; // 1 to 133
  name: string;
  description: string;
  themePrimaryHSL: string; // HSL string e.g., "39 100% 50%"
  themePrimaryForegroundHSL: string; // HSL string
  themeAccentHSL: string; // HSL string
  themeAccentForegroundHSL: string; // HSL string
  icon?: LucideIconType; // Optional: Specific icon for this coin, defaults to Shell if not provided
}

export const ALL_CHRYSALIS_VARIANTS: ChrysalisVariantData[] = [
  // June (10 days: June 21st to June 30th)
  // Overall Day 1 to 10
  {
    id: 'coin_day_1', // June 21
    dayNumber: 1,
    name: 'Golden Chrysalis',
    description: 'Collected on the first day, basking in the summer solstice light. A bright start!',
    themePrimaryHSL: '39 100% 50%', // Saturated Orange (App Default Primary)
    themePrimaryForegroundHSL: '0 0% 100%', // White (App Default Primary Foreground)
    themeAccentHSL: '51 100% 50%', // Analogous Yellow (App Default Accent)
    themeAccentForegroundHSL: '39 60% 30%', // Darker Orange/Brown (App Default Accent Foreground)
    icon: Sun,
  },
  {
    id: 'coin_day_2', // June 22
    dayNumber: 2,
    name: 'Dawnfire Chrysalis',
    description: 'Represents the fiery hope of a new dawn in your journey.',
    themePrimaryHSL: '25 95% 55%', // Fiery Orange
    themePrimaryForegroundHSL: '0 0% 100%', // White
    themeAccentHSL: '10 80% 50%', // Soft Red
    themeAccentForegroundHSL: '0 0% 0%',   // Black
    icon: Sparkles,
  },
  {
    id: 'coin_day_3', // June 23
    dayNumber: 3,
    name: 'Emerald Dewdrop',
    description: 'Like a fresh dewdrop on a milkweed leaf, symbolizing new growth.',
    themePrimaryHSL: '130 50% 45%', // Leafy Green
    themePrimaryForegroundHSL: '0 0% 100%',   // White
    themeAccentHSL: '80 60% 65%', // Lime Green
    themeAccentForegroundHSL: '130 50% 15%',  // Dark Green
    icon: Droplets,
  },
  {
    id: 'coin_day_4', // June 24
    dayNumber: 4,
    name: 'Skyward Ambition',
    description: 'Your aspirations take flight, reaching for the clear blue sky.',
    themePrimaryHSL: '200 70% 60%', // Sky Blue
    themePrimaryForegroundHSL: '0 0% 100%',   // White
    themeAccentHSL: '180 50% 75%', // Light Cyan
    themeAccentForegroundHSL: '200 70% 20%',  // Dark Blue
    icon: Feather,
  },
  {
    id: 'coin_day_5', // June 25
    dayNumber: 5,
    name: 'Steady Stone Shell',
    description: 'A symbol of the steady, unwavering pace you\'ve set.',
    themePrimaryHSL: '220 10% 50%', // Stone Grey
    themePrimaryForegroundHSL: '0 0% 100%',   // White
    themeAccentHSL: '220 10% 70%', // Light Slate Grey
    themeAccentForegroundHSL: '0 0% 0%',   // Black
    icon: Mountain,
  },
  {
    id: 'coin_day_6', // June 26
    dayNumber: 6,
    name: 'Whispering Wind Coin',
    description: 'Carried forward by the gentle encouragement of a summer breeze.',
    themePrimaryHSL: '170 40% 70%', // Light Teal
    themePrimaryForegroundHSL: '0 0% 0%',   // Black
    themeAccentHSL: '180 50% 60%', // Cyan
    themeAccentForegroundHSL: '170 40% 20%',  // Dark Teal
    icon: Wind,
  },
  {
    id: 'coin_day_7', // June 27
    dayNumber: 7,
    name: 'Summer Stamina Coin',
    description: 'A coin representing the stamina built over the first week.',
    themePrimaryHSL: '120 50% 55%', // A nice green
    themePrimaryForegroundHSL: '0 0% 100%',   // White
    themeAccentHSL: '100 60% 70%', // A lighter green
    themeAccentForegroundHSL: '120 50% 20%',  // Darker green
    icon: Shell,
  },
  {
    id: 'coin_day_8', // June 28
    dayNumber: 8,
    name: 'Pathfinder Pebble',
    description: 'Each step, like a pebble, builds the path to your goal.',
    themePrimaryHSL: '45 60% 75%', // Light Yellow
    themePrimaryForegroundHSL: '0 0% 0%',   // Black
    themeAccentHSL: '40 80% 60%', // Amber
    themeAccentForegroundHSL: '45 60% 25%',  // Dark Yellow
    icon: Shell,
  },
  {
    id: 'coin_day_9', // June 29
    dayNumber: 9,
    name: 'Growth Spurt Gem',
    description: 'A gem representing a surge in your progress and commitment.',
    themePrimaryHSL: '270 60% 65%', // Amethyst Purple
    themePrimaryForegroundHSL: '0 0% 100%',   // White
    themeAccentHSL: '310 70% 70%', // Fuchsia
    themeAccentForegroundHSL: '270 60% 25%',  // Dark Purple
    icon: Gem,
  },
  {
    id: 'coin_day_10', // June 30
    dayNumber: 10,
    name: 'June Bloom Chrysalis',
    description: 'Marking the end of June, full of blossoming potential.',
    themePrimaryHSL: '340 80% 70%', // Rose Pink
    themePrimaryForegroundHSL: '0 0% 0%',   // Black
    themeAccentHSL: '350 70% 80%', // Light Rose
    themeAccentForegroundHSL: '340 80% 30%',  // Dark Rose
    icon: Leaf,
  },

  // Manually defined specific July items (these are overallDayNumbers)
  // Challenge Day 11 (July 1) to Day 41 (July 31)
  {
    id: 'coin_day_21', // Overall Day 21 (July 11)
    dayNumber: 21,
    name: 'July Radiance Shell',
    description: 'Shining with the bright energy of early July.',
    themePrimaryHSL: '50 90% 60%', // Golden Yellow
    themePrimaryForegroundHSL: '0 0% 0%',   // Black
    themeAccentHSL: '45 100% 70%', // Pale Yellow
    themeAccentForegroundHSL: '50 90% 20%',  // Dark Gold
    icon: Sun,
  },
  {
    id: 'coin_day_22', // Overall Day 22 (July 12)
    dayNumber: 22,
    name: 'Riverflow Resilience',
    description: 'Flowing steadily towards your goal, like a determined river.',
    themePrimaryHSL: '210 60% 50%', // River Blue
    themePrimaryForegroundHSL: '0 0% 100%',   // White
    themeAccentHSL: '190 70% 70%', // Sky Blue
    themeAccentForegroundHSL: '210 60% 15%',  // Dark River Blue
    icon: Droplets,
  },
  {
    id: 'coin_day_23', // Overall Day 23 (July 13)
    dayNumber: 23,
    name: 'Thirteen Steps Strong',
    description: 'Day thirteen, a lucky number for a strong commitment!',
    themePrimaryHSL: '150 55% 60%', // Seafoam Green
    themePrimaryForegroundHSL: '0 0% 0%',   // Black
    themeAccentHSL: '120 60% 75%', // Light Green
    themeAccentForegroundHSL: '150 55% 20%',  // Dark Seafoam
    icon: Shell,
  },
  {
    id: 'coin_day_24', // Overall Day 24 (July 14 - was July 4th theme)
    dayNumber: 24,
    name: 'Sparkler Shell',
    description: 'A burst of energy, like a celebratory sparkler!',
    themePrimaryHSL: '0 80% 60%', // Bright Red
    themePrimaryForegroundHSL: '0 0% 100%', // White
    themeAccentHSL: '30 90% 70%', // Light Orange
    themeAccentForegroundHSL: '0 80% 25%',  // Dark Red
    icon: Sparkles,
  },
  {
    id: 'coin_day_25', // Overall Day 25 (July 15)
    dayNumber: 25,
    name: 'Mid-Month Memento',
    description: 'A memento for reaching the midpoint of July.',
    themePrimaryHSL: '250 50% 70%', // Lavender Blue
    themePrimaryForegroundHSL: '0 0% 0%',   // Black
    themeAccentHSL: '280 60% 80%', // Light Purple
    themeAccentForegroundHSL: '250 50% 30%',  // Dark Lavender
    icon: Star,
  },
   {
    id: 'coin_day_30', // Overall Day 30 (July 20)
    dayNumber: 30,
    name: 'Summer Heat Haze',
    description: 'Collected amidst the warmth and shimmer of mid-summer.',
    themePrimaryHSL: '38 80% 60%', // Warm Yellow
    themePrimaryForegroundHSL: '40 100% 10%', // Dark Brown
    themeAccentHSL: '45 70% 55%', // Pale Amber
    themeAccentForegroundHSL: '40 100% 10%', // Dark Brown
    icon: Sun,
  },
  {
    id: 'coin_day_35', // Overall Day 35 (July 25)
    dayNumber: 35,
    name: 'Oceanic Current Coin',
    description: 'Pulled by the strong currents of determination.',
    themePrimaryHSL: '210 70% 55%', // Deep Blue
    themePrimaryForegroundHSL: '0 0% 100%', // White
    themeAccentHSL: '180 50% 60%', // Cyan
    themeAccentForegroundHSL: '210 50% 20%', // Darker Blue
    icon: Droplets,
  },
  {
    id: 'coin_day_40', // Overall Day 40 (July 30)
    dayNumber: 40,
    name: 'Full Moon Glimmer',
    description: 'Shining bright under the influence of a full moon.',
    themePrimaryHSL: '50 80% 85%', // Pale Yellow
    themePrimaryForegroundHSL: '0 0% 15%',   // Dark Grey/Black
    themeAccentHSL: '240 10% 75%', // Light Slate (moonlight)
    themeAccentForegroundHSL: '0 0% 15%',   // Dark Grey/Black
    icon: Moon,
  },

  // Generate for July (31 days total for July, so up to day 10 + 31 = 41)
  // Overall Day 11 to 41 are July days
  ...Array.from({ length: 31 }, (_, i) => {
    const dayInJuly = i + 1; // dayInJuly from 1 to 31
    const overallDayNumber = 10 + dayInJuly; // overallDayNumber from 11 to 41

    const manuallyDefinedOverallJulyDays = [21, 22, 23, 24, 25, 30, 35, 40];

    if (manuallyDefinedOverallJulyDays.includes(overallDayNumber)) {
        return null;
    }

    const primaryHues = [198, 210, 225, 240, 260, 275, 290]; // Cyan, Sky, Blue, Indigo, Violet, Purple, Fuchsia
    const accentHues = [160, 140, 120, 90, 60, 50, 40]; // Teal, Emerald, Green, Lime, Yellow, Amber, Orange
    const primarySat = 50 + (i % 5) * 5; // 50-70
    const primaryLight = 55 + (i % 4) * 5; // 55-70
    const accentSat = 60 + (i % 5) * 5; // 60-80
    const accentLight = 60 + (i % 4) * 5; // 60-75

    const fgPrimaryLight = primaryLight > 50 ? '0 0% 0%' : '0 0% 100%'; // Black on light, White on dark
    const fgAccentLight = accentLight > 50 ? '0 0% 0%' : '0 0% 100%';

    return {
      id: `coin_day_${overallDayNumber}`,
      dayNumber: overallDayNumber,
      name: `July Strider Coin #${dayInJuly}`,
      description: `Stepping through July with consistent effort. Day ${overallDayNumber} of the challenge.`,
      themePrimaryHSL: `${primaryHues[i % primaryHues.length]} ${primarySat}% ${primaryLight}%`,
      themePrimaryForegroundHSL: fgPrimaryLight,
      themeAccentHSL: `${accentHues[i % accentHues.length]} ${accentSat}% ${accentLight}%`,
      themeAccentForegroundHSL: fgAccentLight,
      icon: Shell,
    };
  }).filter(Boolean) as ChrysalisVariantData[],

  // Manually defined specific August items
  // Challenge Day 42 (Aug 1) to Day 72 (Aug 31)
  {
    id: 'coin_day_67', // Overall Day 67 (August 26) - Midpoint
    dayNumber: 67,
    name: 'Journey\'s Crest Coin',
    description: 'Reached the crest of the challenge! Halfway to the migration\'s end.',
    themePrimaryHSL: '51 100% 50%', // Accent Yellow
    themePrimaryForegroundHSL: '39 60% 30%', // Dark Orange/Brown
    themeAccentHSL: '39 100% 50%',   // Primary Orange
    themeAccentForegroundHSL: '0 0% 100%',   // White
    icon: Mountain,
  },

  // Generate for August (31 days total, overall day 42 to 72)
  ...Array.from({ length: 31 }, (_, i) => {
    const dayInAugust = i + 1; // dayInAugust from 1 to 31
    const overallDayNumber = 41 + dayInAugust; // overallDayNumber from 42 to 72

    if (overallDayNumber === 67) return null; // Skip Midpoint

    const primaryHues = [40, 30, 20, 0, 350, 340]; // Yellow, Amber, Orange, Red, Rose, Pink
    const accentHues = [90, 120, 140, 160, 180, 200]; // Lime, Green, Emerald, Teal, Cyan, Sky
    const primarySat = 70 - (i % 5) * 5; // 70-50
    const primaryLight = 60 - (i % 4) * 5; // 60-45
    const accentSat = 80 - (i % 5) * 5; // 80-60
    const accentLight = 70 - (i % 4) * 5; // 70-55

    const fgPrimaryLight = primaryLight > 50 ? '0 0% 0%' : '0 0% 100%';
    const fgAccentLight = accentLight > 50 ? '0 0% 0%' : '0 0% 100%';

    return {
      id: `coin_day_${overallDayNumber}`,
      dayNumber: overallDayNumber,
      name: `August Endurance Shell #${dayInAugust}`,
      description: `Enduring the August path. Day ${overallDayNumber} of the challenge.`,
      themePrimaryHSL: `${primaryHues[i % primaryHues.length]} ${primarySat}% ${primaryLight}%`,
      themePrimaryForegroundHSL: fgPrimaryLight,
      themeAccentHSL: `${accentHues[i % accentHues.length]} ${accentSat}% ${accentLight}%`,
      themeAccentForegroundHSL: fgAccentLight,
      icon: Shell,
    };
  }).filter(Boolean) as ChrysalisVariantData[],

  // Manually defined specific September items
  // Challenge Day 73 (Sep 1) to Day 102 (Sep 30)
  {
      id: 'coin_day_94', // Overall Day 94 (September 22) - Equinox
      dayNumber: 94,
      name: 'Autumn Equinox Leaf',
      description: 'Marking the balance of autumn. New season, continued dedication.',
      themePrimaryHSL: '30 90% 45%', // Burnt Orange
      themePrimaryForegroundHSL: '0 0% 100%', // White
      themeAccentHSL: '45 70% 50%',   // Goldenrod
      themeAccentForegroundHSL: '0 0% 0%',   // Black
      icon: Leaf,
  },
  {
    id: 'coin_day_100', // Overall Day 100
    dayNumber: 100,
    name: 'Century Shell',
    description: 'A monumental 100 days of participation! Truly outstanding.',
    themePrimaryHSL: '220 70% 50%', // Royal Blue
    themePrimaryForegroundHSL: '0 0% 100%',   // White
    themeAccentHSL: '200 80% 80%', // Light Sky Blue
    themeAccentForegroundHSL: '220 70% 15%',  // Dark Royal Blue
    icon: Award,
  },

  // Generate for September (30 days total, overall day 73 to 102)
  ...Array.from({ length: 30 }, (_, i) => {
    const dayInSeptember = i + 1; // dayInSeptember from 1 to 30
    const overallDayNumber = 72 + dayInSeptember; // overallDayNumber from 73 to 102

    if (overallDayNumber === 94 || overallDayNumber === 100) return null; // Skip Equinox and Century

    const primaryHues = [0, 25, 40, 50, 80]; // Red, Orange, Amber, Yellow, Lime
    const accentHues = [350, 330, 310, 280, 260]; // Rose, Pink, Fuchsia, Purple, Violet
    const primarySat = 60 + (i % 3) * 10; // 60-80
    const primaryLight = 50 + (i % 3) * 5; // 50-60
    const accentSat = 70 + (i % 3) * 5; // 70-80
    const accentLight = 65 + (i % 3) * 5; // 65-75

    const fgPrimaryLight = primaryLight > 50 ? '0 0% 0%' : '0 0% 100%';
    const fgAccentLight = accentLight > 50 ? '0 0% 0%' : '0 0% 100%';

    return {
      id: `coin_day_${overallDayNumber}`,
      dayNumber: overallDayNumber,
      name: `September Spirit Shell #${dayInSeptember}`,
      description: `Moving with the spirit of September. Day ${overallDayNumber} of the challenge.`,
      themePrimaryHSL: `${primaryHues[i % primaryHues.length]} ${primarySat}% ${primaryLight}%`,
      themePrimaryForegroundHSL: fgPrimaryLight,
      themeAccentHSL: `${accentHues[i % accentHues.length]} ${accentSat}% ${accentLight}%`,
      themeAccentForegroundHSL: fgAccentLight,
      icon: Shell,
    };
  }).filter(Boolean) as ChrysalisVariantData[],

  // Manually defined specific October items
  // Challenge Day 103 (Oct 1) to Day 133 (Oct 31)
  {
    id: 'coin_day_130', // Overall Day 130 (October 28)
    dayNumber: 130,
    name: 'Twilight Trekker Shell',
    description: 'Stepping through the late October twilight, journey nearing its end.',
    themePrimaryHSL: '260 50% 40%', // Deep Purple
    themePrimaryForegroundHSL: '0 0% 100%',   // White
    themeAccentHSL: '230 40% 65%', // Indigo
    themeAccentForegroundHSL: '260 50% 10%',  // Darker Purple
    icon: Moon,
  },
  {
    id: 'coin_day_131', // Overall Day 131 (October 29)
    dayNumber: 131,
    name: 'Ancestral Whisper Coin',
    description: 'Feeling the echoes of generations of migrating Monarchs.',
    themePrimaryHSL: '30 20% 35%', // Dark Brown
    themePrimaryForegroundHSL: '0 0% 90%',  // Off-White
    themeAccentHSL: '40 50% 50%',   // Amber
    themeAccentForegroundHSL: '0 0% 0%',   // Black
    icon: Feather,
  },
  {
    id: 'coin_day_132', // Overall Day 132 (October 30)
    dayNumber: 132,
    name: 'Eve of Migration Shell',
    description: 'The final day approaches. Anticipation for the Monarchs\' arrival.',
    themePrimaryHSL: '220 15% 60%', // Silver Grey
    themePrimaryForegroundHSL: '0 0% 0%',   // Black
    themeAccentHSL: '200 50% 85%', // Pale Sky Blue
    themeAccentForegroundHSL: '220 15% 20%',  // Dark Grey
    icon: Star,
  },
  {
    id: 'coin_day_133', // Overall Day 133 (Oct 31)
    dayNumber: 133,
    name: 'Spirit of the Monarch',
    description: 'Challenge complete! Embodying the enduring spirit of the Monarch butterfly. (Halloween)',
    themePrimaryHSL: '25 100% 50%', // Vibrant Orange (Primary like theme, but could be more intense)
    themePrimaryForegroundHSL: '0 0% 0%', // Black
    themeAccentHSL: '0 0% 10%',   // Deep Black
    themeAccentForegroundHSL: '0 0% 100%', // White
    icon: Zap,
  },

  // Generate for October (31 days total, overall day 103 to 133)
  ...Array.from({ length: 31 }, (_, i) => {
    const dayInOctober = i + 1; // dayInOctober from 1 to 31
    const overallDayNumber = 102 + dayInOctober; // overallDayNumber from 103 to 133

    if (overallDayNumber >= 130) return null; // Skip last few manually defined days

    const primaryHues = [25, 10, 350, 40, 50]; // Orange, Red, Rose, Amber, Yellow
    const accentHues = [50, 80, 330, 300, 270]; // Yellow, Lime, Pink, Fuchsia, Purple
    const primarySat = 80 - (i % 4) * 5; // 80-65
    const primaryLight = 55 - (i % 3) * 5; // 55-45
    const accentSat = 90 - (i % 4) * 5; // 90-75
    const accentLight = 70 - (i % 3) * 5; // 70-60

    const fgPrimaryLight = primaryLight > 50 ? '0 0% 0%' : '0 0% 100%';
    const fgAccentLight = accentLight > 50 ? '0 0% 0%' : '0 0% 100%';

    return {
      id: `coin_day_${overallDayNumber}`,
      dayNumber: overallDayNumber,
      name: `October Harvest Coin #${dayInOctober}`,
      description: `Gathering resolve in October. Day ${overallDayNumber} of the challenge.`,
      themePrimaryHSL: `${primaryHues[i % primaryHues.length]} ${primarySat}% ${primaryLight}%`,
      themePrimaryForegroundHSL: fgPrimaryLight,
      themeAccentHSL: `${accentHues[i % accentHues.length]} ${accentSat}% ${accentLight}%`,
      themeAccentForegroundHSL: fgAccentLight,
      icon: Shell,
    };
  }).filter(Boolean) as ChrysalisVariantData[],

].flat().filter((variant, index, self) => {
    if (!variant) return false;
    // Ensure unique by ID, preferring the first encountered (manually defined ones)
    return self.findIndex(v => v?.id === variant.id) === index;
});


// Helper function to get a specific coin variant by its day number
export function getChrysalisVariantByDay(dayNumber: number): ChrysalisVariantData {
  const variant = ALL_CHRYSALIS_VARIANTS.find(v => v.dayNumber === dayNumber);
  if (variant) return variant;

  // Fallback for safety if an exact day match isn't found
  console.warn(`Chrysalis variant for dayNumber ${dayNumber} not found. Using fallback.`);
  const fallbackDay = Math.max(1, Math.min(dayNumber, 133)); // Clamp to 1-133
  const fallbackVariant = ALL_CHRYSALIS_VARIANTS.find(v => v.dayNumber === fallbackDay);
  if (fallbackVariant) return fallbackVariant;

  // Absolute fallback if all else fails (should not happen with correct data)
  return {
      id: `coin_day_fallback_${dayNumber}`,
      dayNumber: dayNumber,
      name: `Chrysalis Coin #${dayNumber}`,
      description: `A special coin for day ${dayNumber} of your journey.`,
      themePrimaryHSL: '39 100% 50%', // Default app primary
      themePrimaryForegroundHSL: '0 0% 100%', // Default app primary foreground
      themeAccentHSL: '51 100% 50%', // Default app accent
      themeAccentForegroundHSL: '39 60% 30%', // Default app accent foreground
      icon: Shell
  };
}

// Helper function to get a specific coin variant by its ID
export function getChrysalisVariantById(id: string): ChrysalisVariantData | undefined {
  return ALL_CHRYSALIS_VARIANTS.find(v => v.id === id);
}


// Sanity checks
const finalVariantsCheck: ChrysalisVariantData[] = [];
const seenDayNumbers = new Set<number>();

for (const variant of ALL_CHRYSALIS_VARIANTS) {
    if (variant && !seenDayNumbers.has(variant.dayNumber) && variant.dayNumber >=1 && variant.dayNumber <= 133) {
        finalVariantsCheck.push(variant);
        seenDayNumbers.add(variant.dayNumber);
    } else if (variant && seenDayNumbers.has(variant.dayNumber)) {
        console.warn(`Duplicate dayNumber ${variant.dayNumber} found for id ${variant.id}. The first one was kept.`);
    } else if (variant) {
        console.warn(`Variant with out-of-range dayNumber: ${variant.dayNumber} for id ${variant.id}`);
    }
}

let isDataCorrect = true;
if (finalVariantsCheck.length !== 133) {
    console.warn(`Chrysalis Variants final count issue: Expected 133, Got ${finalVariantsCheck.length}. Unique dayNumbers found: ${seenDayNumbers.size}. Review generation logic and manual entries.`);
    isDataCorrect = false;
}

for (let i = 1; i <= 133; i++) {
    if (!seenDayNumbers.has(i)) {
        console.error(`CRITICAL: Missing Chrysalis Variant for day ${i}. Adding placeholder will occur if getChrysalisVariantByDay is called for this day.`);
        isDataCorrect = false;
    }
}

const uniqueIds = new Set(ALL_CHRYSALIS_VARIANTS.map(v => v.id));
if (uniqueIds.size !== ALL_CHRYSALIS_VARIANTS.length) {
    console.error(`CRITICAL: IDs in ALL_CHRYSALIS_VARIANTS are not unique. Count: ${ALL_CHRYSALIS_VARIANTS.length}, Unique IDs: ${uniqueIds.size}`);
    isDataCorrect = false;
}


if (!isDataCorrect) {
    console.warn("There are issues with the Chrysalis Coin variant data. Please review the console logs above.");
}

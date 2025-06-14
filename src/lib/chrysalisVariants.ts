
import type { Icon as LucideIconType } from 'lucide-react';
import { Shell, Sun, Moon, Leaf, Droplets, Mountain, Zap, Wind, Award, Star, Sparkles, Feather, Gem } from 'lucide-react';

export interface ChrysalisVariantData {
  id: string; // e.g., "coin_day_1", "coin_day_2" ... "coin_day_133"
  dayNumber: number; // 1 to 133
  name: string;
  description: string;
  themePrimaryColor: string; // Tailwind text color class, e.g., "text-yellow-500"
  themeAccentColor: string; // Tailwind text color class, e.g., "text-orange-400"
  icon?: LucideIconType; // Optional: Specific icon for this coin, defaults to Shell if not provided
}

export const ALL_CHRYSALIS_VARIANTS: ChrysalisVariantData[] = [
  // June
  {
    id: 'coin_day_1',
    dayNumber: 1,
    name: 'Solstice Sun Shell',
    description: 'Collected on the first day, basking in the summer solstice light. A bright start!',
    themePrimaryColor: 'text-yellow-500', // Bright Yellow
    themeAccentColor: 'text-orange-400', // Warm Orange
    icon: Sun,
  },
  {
    id: 'coin_day_2',
    dayNumber: 2,
    name: 'Dawnfire Chrysalis',
    description: 'Represents the fiery hope of a new dawn in your journey.',
    themePrimaryColor: 'text-orange-500', // Orange
    themeAccentColor: 'text-red-400', // Light Red
    icon: Sparkles,
  },
  {
    id: 'coin_day_3',
    dayNumber: 3,
    name: 'Emerald Dewdrop',
    description: 'Like a fresh dewdrop on a milkweed leaf, symbolizing new growth.',
    themePrimaryColor: 'text-green-600', // Leafy Green
    themeAccentColor: 'text-lime-400', // Lime Green
    icon: Droplets,
  },
  {
    id: 'coin_day_4',
    dayNumber: 4,
    name: 'Skyward Ambition',
    description: 'Your aspirations take flight, reaching for the clear blue sky.',
    themePrimaryColor: 'text-sky-500', // Sky Blue
    themeAccentColor: 'text-cyan-300', // Light Cyan
    icon: Feather,
  },
  {
    id: 'coin_day_5',
    dayNumber: 5,
    name: 'Steady Stone Shell',
    description: 'A symbol of the steady, unwavering pace you\'ve set.',
    themePrimaryColor: 'text-stone-500', // Stone Grey
    themeAccentColor: 'text-slate-400', // Slate Grey
    icon: Mountain,
  },
  {
    id: 'coin_day_6',
    dayNumber: 6,
    name: 'Whispering Wind Coin',
    description: 'Carried forward by the gentle encouragement of a summer breeze.',
    themePrimaryColor: 'text-teal-400', // Light Teal
    themeAccentColor: 'text-cyan-500', // Cyan
    icon: Wind,
  },
  {
    id: 'coin_day_7',
    dayNumber: 7,
    name: 'First Week Flourish',
    description: 'Celebrating a full week of dedication to the Butterfly Steps!',
    themePrimaryColor: 'text-primary', // Theme Primary (Orange)
    themeAccentColor: 'text-accent', // Theme Accent (Yellow)
    icon: Award,
  },
  {
    id: 'coin_day_8',
    dayNumber: 8,
    name: 'Pathfinder Pebble',
    description: 'Each step, like a pebble, builds the path to your goal.',
    themePrimaryColor: 'text-yellow-300', // Light Yellow
    themeAccentColor: 'text-amber-500', // Amber
    icon: Shell,
  },
  {
    id: 'coin_day_9',
    dayNumber: 9,
    name: 'Growth Spurt Gem',
    description: 'A gem representing a surge in your progress and commitment.',
    themePrimaryColor: 'text-purple-500', // Amethyst Purple
    themeAccentColor: 'text-fuchsia-400', // Fuchsia
    icon: Gem,
  },
  {
    id: 'coin_day_10', // End of June
    dayNumber: 10,
    name: 'June Bloom Chrysalis',
    description: 'Marking the end of June, full of blossoming potential.',
    themePrimaryColor: 'text-pink-500', // Rose Pink
    themeAccentColor: 'text-rose-300', // Light Rose
    icon: Leaf,
  },
  // July
  {
    id: 'coin_day_11',
    dayNumber: 11,
    name: 'July Radiance Shell',
    description: 'Shining with the bright energy of early July.',
    themePrimaryColor: 'text-amber-400', // Golden Yellow
    themeAccentColor: 'text-yellow-300', // Pale Yellow
    icon: Sun,
  },
  {
    id: 'coin_day_12',
    dayNumber: 12,
    name: 'Riverflow Resilience',
    description: 'Flowing steadily towards your goal, like a determined river.',
    themePrimaryColor: 'text-blue-600', // River Blue
    themeAccentColor: 'text-sky-400', // Sky Blue
    icon: Droplets,
  },
  {
    id: 'coin_day_13',
    dayNumber: 13,
    name: 'Thirteen Steps Strong',
    description: 'Day thirteen, a lucky number for a strong commitment!',
    themePrimaryColor: 'text-emerald-400', // Seafoam Green
    themeAccentColor: 'text-green-300', // Light Green
    icon: Shell,
  },
  {
    id: 'coin_day_14', // July 4th
    dayNumber: 14,
    name: 'Sparkler Shell',
    description: 'A burst of energy, like a celebratory sparkler! (July 4th)',
    themePrimaryColor: 'text-red-500', // Bright Red
    themeAccentColor: 'text-orange-300', // Light Orange
    icon: Sparkles,
  },
  {
    id: 'coin_day_15',
    dayNumber: 15,
    name: 'Mid-Month Memento',
    description: 'A memento for reaching the midpoint of July.',
    themePrimaryColor: 'text-indigo-400', // Lavender Blue
    themeAccentColor: 'text-purple-300', // Light Purple
    icon: Star,
  },
  {
    id: 'coin_day_16',
    dayNumber: 16,
    name: '***',
    description: '***',
    themePrimaryColor: 'text-indigo-400', // Lavender Blue
    themeAccentColor: 'text-purple-300', // Light Purple
    icon: Star,
  },
  {
    id: 'coin_day_17',
    dayNumber: 17,
    name: '***',
    description: '***',
    themePrimaryColor: 'text-indigo-400', // Lavender Blue
    themeAccentColor: 'text-purple-300', // Light Purple
    icon: Star,
  },
  {
    id: 'coin_day_18',
    dayNumber: 18,
    name: '***',
    description: 'A***',
    themePrimaryColor: 'text-indigo-400', // Lavender Blue
    themeAccentColor: 'text-purple-300', // Light Purple
    icon: Star,
  },
  {
    id: 'coin_day_19',
    dayNumber: 19,
    name: '***',
    description: '***',
    themePrimaryColor: 'text-indigo-400', // Lavender Blue
    themeAccentColor: 'text-purple-300', // Light Purple
    icon: Star,
  },
  {
    id: 'coin_day_20',
    dayNumber: 20,
    name: 'Summer Heat Haze',
    description: 'Collected amidst the warmth and shimmer of mid-summer.',
    themePrimaryColor: 'text-yellow-400', // Warm Yellow
    themeAccentColor: 'text-amber-300', // Pale Amber
    icon: Sun,
  },
  {
    id: 'coin_day_21',
    dayNumber: 21,
    name: '***',
    description: '***',
    themePrimaryColor: 'text-indigo-400', // Lavender Blue
    themeAccentColor: 'text-purple-300', // Light Purple
    icon: Star,
  },
  {
    id: 'coin_day_22',
    dayNumber: 22,
    name: '***',
    description: '***',
    themePrimaryColor: 'text-indigo-400', // Lavender Blue
    themeAccentColor: 'text-purple-300', // Light Purple
    icon: Star,
  },
  {
    id: 'coin_day_23',
    dayNumber: 23,
    name: '***',
    description: '***',
    themePrimaryColor: 'text-indigo-400', // Lavender Blue
    themeAccentColor: 'text-purple-300', // Light Purple
    icon: Star,
  },
  {
    id: 'coin_day_24',
    dayNumber: 24,
    name: '***',
    description: '***',
    themePrimaryColor: 'text-indigo-400', // Lavender Blue
    themeAccentColor: 'text-purple-300', // Light Purple
    icon: Star,
  },
  {
    id: 'coin_day_25',
    dayNumber: 25,
    name: 'Oceanic Current Coin',
    description: 'Pulled by the strong currents of determination.',
    themePrimaryColor: 'text-blue-700', // Deep Blue
    themeAccentColor: 'text-cyan-400', // Cyan
    icon: Droplets,
  },
  {
    id: 'coin_day_26',
    dayNumber: 26,
    name: '***',
    description: '***',
    themePrimaryColor: 'text-indigo-400', // Lavender Blue
    themeAccentColor: 'text-purple-300', // Light Purple
    icon: Star,
  },
  {
    id: 'coin_day_27',
    dayNumber: 27,
    name: '***',
    description: '***',
    themePrimaryColor: 'text-indigo-400', // Lavender Blue
    themeAccentColor: 'text-purple-300', // Light Purple
    icon: Star,
  },
  {
    id: 'coin_day_28',
    dayNumber: 28,
    name: '***',
    description: '***',
    themePrimaryColor: 'text-indigo-400', // Lavender Blue
    themeAccentColor: 'text-purple-300', // Light Purple
    icon: Star,
  },
  {
    id: 'coin_day_29',
    dayNumber: 29,
    name: '***',
    description: '***',
    themePrimaryColor: 'text-indigo-400', // Lavender Blue
    themeAccentColor: 'text-purple-300', // Light Purple
    icon: Star,
  },
  {
    id: 'coin_day_30',
    dayNumber: 30,
    name: 'Full Moon Glimmer',
    description: 'Shining bright under the influence of a full moon.',
    themePrimaryColor: 'text-yellow-200', // Pale Yellow
    themeAccentColor: 'text-slate-300', // Light Slate (moonlight)
    icon: Moon,
  },
  // Generate for July (31 days total for July, so up to day 10 + 31 = 41)
  // Day 11 to 41 are July days
  ...Array.from({ length: 31 - 10 }, (_, i) => {
    const dayInJuly = i + 11;
    const overallDayNumber = 10 + dayInJuly;
    // Skip if already defined (e.g. day 11, 12, 13, 14, 15, 20, 25, 30 were defined)
    if ([11,12,13,14,15,20,25,30].map(d => d+10).includes(overallDayNumber)) return null;

    const primaryHues = ['cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia'];
    const accentHues = ['teal', 'emerald', 'green', 'lime', 'yellow', 'amber', 'orange'];
    const shadePrimary = 500 + (i % 3) * 100; // 500, 600, 700
    const shadeAccent = 300 + (i % 3) * 100;  // 300, 400, 500

    const primaryColorClass = `text-${primaryHues[i % primaryHues.length]}-${shadePrimary}`;
    const accentColorClass = `text-${accentHues[i % accentHues.length]}-${shadeAccent}`;

    return {
      id: `coin_day_${overallDayNumber}`,
      dayNumber: overallDayNumber,
      name: `July Strider Coin #${dayInJuly}`,
      description: `Stepping through July with consistent effort. Day ${overallDayNumber} of the challenge.`,
      themePrimaryColor: primaryColorClass,
      themeAccentColor: accentColorClass,
      icon: Shell,
    };
  }).filter(Boolean) as ChrysalisVariantData[],

  // Generate for August (31 days total, overall day 42 to 72)
  ...Array.from({ length: 31 }, (_, i) => {
    const dayInAugust = i + 1;
    const overallDayNumber = 41 + dayInAugust;
    if (overallDayNumber === 67) return null; // Midpoint handled separately

    const primaryHues = ['yellow', 'amber', 'orange', 'red', 'rose', 'pink'];
    const accentHues = ['lime', 'green', 'emerald', 'teal', 'cyan', 'sky'];
    const shadePrimary = 600 - (i % 3) * 100; // 600, 500, 400
    const shadeAccent = 400 - (i % 3) * 100;  // 400, 300, 200

    const primaryColorClass = `text-${primaryHues[i % primaryHues.length]}-${shadePrimary}`;
    const accentColorClass = `text-${accentHues[i % accentHues.length]}-${shadeAccent}`;

    return {
      id: `coin_day_${overallDayNumber}`,
      dayNumber: overallDayNumber,
      name: `August Endurance Shell #${dayInAugust}`,
      description: `Enduring the August path. Day ${overallDayNumber} of the challenge.`,
      themePrimaryColor: primaryColorClass,
      themeAccentColor: accentColorClass,
      icon: Shell,
    };
  }).filter(Boolean) as ChrysalisVariantData[],

  // Midpoint (around day 66/67)
  {
    id: 'coin_day_67',
    dayNumber: 67,
    name: 'Journey\'s Crest Coin',
    description: 'Reached the crest of the challenge! Halfway to the migration\'s end.',
    themePrimaryColor: 'text-accent', // Theme Accent (Yellow)
    themeAccentColor: 'text-primary', // Theme Primary (Orange)
    icon: Mountain,
  },
  // Generate for September (30 days total, overall day 73 to 102)
  ...Array.from({ length: 30 }, (_, i) => {
    const dayInSeptember = i + 1;
    const overallDayNumber = 72 + dayInSeptember;
    if (overallDayNumber === 94 || overallDayNumber === 100) return null; // Equinox and Century handled separately

    const primaryHues = ['red', 'orange', 'amber', 'yellow', 'lime'];
    const accentHues = ['rose', 'pink', 'fuchsia', 'purple', 'violet'];
    const shadePrimary = 500 + (i % 2) * 100; // 500, 600
    const shadeAccent = 300 + (i % 2) * 100;  // 300, 400

    const primaryColorClass = `text-${primaryHues[i % primaryHues.length]}-${shadePrimary}`;
    const accentColorClass = `text-${accentHues[i % accentHues.length]}-${shadeAccent}`;

    return {
      id: `coin_day_${overallDayNumber}`,
      dayNumber: overallDayNumber,
      name: `September Spirit Shell #${dayInSeptember}`,
      description: `Moving with the spirit of September. Day ${overallDayNumber} of the challenge.`,
      themePrimaryColor: primaryColorClass,
      themeAccentColor: accentColorClass,
      icon: Shell,
    };
  }).filter(Boolean) as ChrysalisVariantData[],
  {
      id: 'coin_day_94',
      dayNumber: 94,
      name: 'Autumn Equinox Leaf',
      description: 'Marking the balance of autumn. New season, continued dedication.',
      themePrimaryColor: 'text-orange-700', // Burnt Orange
      themeAccentColor: 'text-yellow-600', // Goldenrod
      icon: Leaf,
  },
  // Day 100
  {
    id: 'coin_day_100',
    dayNumber: 100,
    name: 'Century Shell',
    description: 'A monumental 100 days of participation! Truly outstanding.',
    themePrimaryColor: 'text-blue-700', // Royal Blue
    themeAccentColor: 'text-sky-300', // Light Sky Blue
    icon: Award,
  },
  // Generate for October (31 days total, overall day 103 to 133)
  ...Array.from({ length: 31 }, (_, i) => {
    const dayInOctober = i + 1;
    const overallDayNumber = 102 + dayInOctober;
    if (overallDayNumber >= 130) return null; // Handled by specific entries below

    const primaryHues = ['orange', 'red', 'rose', 'amber', 'yellow'];
    const accentHues = ['yellow', 'lime', 'pink', 'fuchsia', 'purple'];
    const shadePrimary = 600 - (i % 2) * 100; // 600, 500
    const shadeAccent = 400 - (i % 2) * 100;  // 400, 300

    const primaryColorClass = `text-${primaryHues[i % primaryHues.length]}-${shadePrimary}`;
    const accentColorClass = `text-${accentHues[i % accentHues.length]}-${shadeAccent}`;

    return {
      id: `coin_day_${overallDayNumber}`,
      dayNumber: overallDayNumber,
      name: `October Harvest Coin #${dayInOctober}`,
      description: `Gathering resolve in October. Day ${overallDayNumber} of the challenge.`,
      themePrimaryColor: primaryColorClass,
      themeAccentColor: accentColorClass,
      icon: Shell,
    };
  }).filter(Boolean) as ChrysalisVariantData[],

  // Last few days of October
  {
    id: 'coin_day_130',
    dayNumber: 130,
    name: 'Twilight Trekker Shell',
    description: 'Stepping through the late October twilight, journey nearing its end.',
    themePrimaryColor: 'text-purple-700', // Deep Purple
    themeAccentColor: 'text-indigo-400', // Indigo
    icon: Moon,
  },
  {
    id: 'coin_day_131',
    dayNumber: 131,
    name: 'Ancestral Whisper Coin',
    description: 'Feeling the echoes of generations of migrating Monarchs.',
    themePrimaryColor: 'text-stone-700', // Dark Brown
    themeAccentColor: 'text-amber-600', // Amber
    icon: Feather,
  },
  {
    id: 'coin_day_132',
    dayNumber: 132,
    name: 'Eve of Migration Shell',
    description: 'The final day approaches. Anticipation for the Monarchs\' arrival.',
    themePrimaryColor: 'text-slate-500', // Silver Grey
    themeAccentColor: 'text-sky-200', // Pale Sky Blue
    icon: Star,
  },
  {
    id: 'coin_day_133', // Oct 31
    dayNumber: 133,
    name: 'Spirit of the Monarch',
    description: 'Challenge complete! Embodying the enduring spirit of the Monarch butterfly. (Halloween)',
    themePrimaryColor: 'text-primary', // Theme Primary (Orange)
    themeAccentColor: 'text-black', // Deep Black for contrast
    icon: Zap,
  },
].flat().filter((variant, index, self) => {
    if (!variant) return false;
    // Ensure unique by ID, preferring the first encountered (manually defined ones)
    return self.findIndex(v => v?.id === variant.id) === index;
});


// Helper function to get a specific coin variant by its day number
export function getChrysalisVariantByDay(dayNumber: number): ChrysalisVariantData | undefined {
  const variant = ALL_CHRYSALIS_VARIANTS.find(v => v.dayNumber === dayNumber);
  if (variant) return variant;

  // Fallback for safety if an exact day match isn't found, though it should be.
  if (dayNumber < 1 && ALL_CHRYSALIS_VARIANTS.length > 0) return ALL_CHRYSALIS_VARIANTS[0];
  if (dayNumber > ALL_CHRYSALIS_VARIANTS.length && ALL_CHRYSALIS_VARIANTS.length > 0) {
    return ALL_CHRYSALIS_VARIANTS[ALL_CHRYSALIS_VARIANTS.length -1];
  }
  // Default fallback if no variants exist or dayNumber is completely off
  return {
      id: `coin_day_fallback_${dayNumber}`,
      dayNumber: dayNumber,
      name: `Chrysalis Coin #${dayNumber}`,
      description: `A special coin for day ${dayNumber} of your journey.`,
      themePrimaryColor: 'text-muted-foreground',
      themeAccentColor: 'text-foreground',
      icon: Shell
  };
}

// Ensure we have exactly 133 unique items after generation logic
// and that dayNumbers are sequential from 1 to 133.
const finalVariantsCheck: ChrysalisVariantData[] = [];
const seenDayNumbers = new Set<number>();

for (const variant of ALL_CHRYSALIS_VARIANTS) {
    if (variant && !seenDayNumbers.has(variant.dayNumber) && variant.dayNumber >=1 && variant.dayNumber <= 133) {
        finalVariantsCheck.push(variant);
        seenDayNumbers.add(variant.dayNumber);
    }
}
// Sort by dayNumber to ensure order before filling gaps
finalVariantsCheck.sort((a, b) => a.dayNumber - b.dayNumber);

let isDataCorrect = true;
if (finalVariantsCheck.length !== 133) {
    console.warn(`Chrysalis Variants final count issue: Expected 133, Got ${finalVariantsCheck.length}. Please check generation logic.`);
    isDataCorrect = false;
}

for (let i = 1; i <= 133; i++) {
    if (!seenDayNumbers.has(i)) {
        console.error(`CRITICAL: Missing Chrysalis Variant for day ${i}. Adding placeholder will occur if getChrysalisVariantByDay is called for this day.`);
        isDataCorrect = false;
        // No automatic addition to ALL_CHRYSALIS_VARIANTS here to keep the export clean,
        // but getChrysalisVariantByDay will provide a fallback.
    }
}

const uniqueDayNumbersCount = new Set(ALL_CHRYSALIS_VARIANTS.map(v => v.dayNumber)).size;
if (uniqueDayNumbersCount !== 133 && ALL_CHRYSALIS_VARIANTS.length === 133) {
    console.error(`CRITICAL: ALL_CHRYSALIS_VARIANTS has 133 items, but only ${uniqueDayNumbersCount} unique dayNumbers. Duplicates exist.`);
    isDataCorrect = false;
}

if (!isDataCorrect) {
    console.warn("There are issues with the Chrysalis Coin variant data. Please review the console logs.");
}

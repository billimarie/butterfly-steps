'use client';

import { Leaf } from 'lucide-react'; // Using Leaf as a placeholder for a butterfly icon

interface ButterflyAnimationProps {
  progress: number; // Percentage 0-100
  type: 'user' | 'community';
}

const DESCRIPTIONS = {
    user: {
        start: "Your Starting Point",
        end: "Your Goal!",
        title: "Your Migration Path"
    },
    community: {
        start: "Mojave Desert",
        end: "Mexico",
        title: "Community's Migration Path"
    }
}

export default function ButterflyAnimation({ progress, type }: ButterflyAnimationProps) {
  const safeProgress = Math.max(0, Math.min(100, progress));
  const description = DESCRIPTIONS[type];

  return (
    <div className="p-4 rounded-lg bg-card border shadow-md">
      <h3 className="text-lg font-semibold mb-4 text-center font-headline">{description.title}</h3>
      <div className="relative w-full h-8 bg-muted rounded-full overflow-hidden">
        {/* Path */}
        <div 
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-yellow-300 via-orange-400 to-red-400 rounded-full"
          style={{ width: `${safeProgress}%`, transition: 'width 0.5s ease-in-out' }}
        />
        {/* Butterfly Icon */}
        <div
          className="absolute top-1/2 -translate-y-1/2 h-10 w-10 flex items-center justify-center"
          style={{ 
            left: `calc(${safeProgress}% - 20px)`, // Adjust to center the icon on the progress line end
            transition: 'left 0.5s ease-in-out' 
          }}
          data-ai-hint="butterfly monarch"
        >
          <Leaf className="h-7 w-7 text-primary animate-pulse" />
        </div>
      </div>
      <div className="flex justify-between text-xs text-muted-foreground mt-2 px-1">
        <span>{description.start}</span>
        <span>{description.end}</span>
      </div>
       {safeProgress === 100 && (
        <p className="text-center text-green-500 font-semibold mt-2">
          {type === 'user' ? "You've reached your destination!" : "The community has completed the migration!"}
        </p>
      )}
    </div>
  );
}

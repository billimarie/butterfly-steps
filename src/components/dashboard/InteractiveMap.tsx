
'use client';

import Image from 'next/image';
import { useState, useEffect, useMemo } from 'react';
import { MapPin, Leaf } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

// Define milestone step counts (consistent with ButterflyAnimation)
const START_POINT_STEPS = 0; // Mojave Desert
const LA_MILESTONE = 140000;
const DISNEYLAND_MILESTONE = 180000;
const SAN_DIEGO_MILESTONE = 360000;
const SONORAN_DESERT_MILESTONE = 900000;
const CHIHUAHUA_MILESTONE = 2200000;
const MEXICO_CITY_MILESTONE = 3600000; // Overall goal

interface Milestone {
  name: string;
  steps: number;
  coords: { x: number; y: number }; // Percentage-based: x = left, y = top
  icon?: React.ElementType;
}

// IMPORTANT: Adjust these coordinates to match your map image accurately.
const milestones: Milestone[] = [
  { name: 'Mojave Desert (Start)', steps: START_POINT_STEPS, coords: { x: 8, y: 18 }, icon: MapPin },
  { name: 'Los Angeles', steps: LA_MILESTONE, coords: { x: 14, y: 30 }, icon: MapPin },
  { name: 'Disneyland', steps: DISNEYLAND_MILESTONE, coords: { x: 17, y: 33 }, icon: MapPin },
  { name: 'San Diego', steps: SAN_DIEGO_MILESTONE, coords: { x: 18, y: 40 }, icon: MapPin },
  { name: 'Sonoran Desert', steps: SONORAN_DESERT_MILESTONE, coords: { x: 30, y: 55 }, icon: MapPin },
  { name: 'Chihuahua', steps: CHIHUAHUA_MILESTONE, coords: { x: 48, y: 70 }, icon: MapPin },
  { name: 'Mexico City (Destination)', steps: MEXICO_CITY_MILESTONE, coords: { x: 65, y: 85 }, icon: MapPin },
];

interface InteractiveMapProps {
  totalCommunitySteps: number;
  className?: string;
}

export default function InteractiveMap({ totalCommunitySteps, className }: InteractiveMapProps) {
  const [mapReady, setMapReady] = useState(false);

  const currentProgressMarkerPosition = useMemo(() => {
    if (!mapReady) return { x: milestones[0].coords.x, y: milestones[0].coords.y, visible: false };

    let segmentStartIndex = -1;
    let segmentEndIndex = -1;

    // Find the current segment the progress falls into
    for (let i = 0; i < milestones.length - 1; i++) {
      if (totalCommunitySteps >= milestones[i].steps && totalCommunitySteps < milestones[i+1].steps) {
        segmentStartIndex = i;
        segmentEndIndex = i + 1;
        break;
      }
    }
    
    // If progress is beyond the last defined milestone (or exactly at it)
    if (totalCommunitySteps >= milestones[milestones.length - 1].steps) {
        segmentStartIndex = milestones.length - 2; // Show progress towards the final one
        segmentEndIndex = milestones.length - 1;
    } else if (segmentStartIndex === -1 && totalCommunitySteps < milestones[0].steps) { 
        // Before the first milestone (should ideally not happen if steps >= 0)
        return { x: milestones[0].coords.x, y: milestones[0].coords.y, visible: true };
    } else if (segmentStartIndex === -1 ) {
         // Default to start if something is off, or if on the first step
        return { x: milestones[0].coords.x, y: milestones[0].coords.y, visible: true };
    }


    const startMile = milestones[segmentStartIndex];
    const endMile = milestones[segmentEndIndex];

    const segmentTotalSteps = endMile.steps - startMile.steps;
    const stepsIntoSegment = totalCommunitySteps - startMile.steps;
    
    let progressInSegment = 0;
    if (segmentTotalSteps > 0) {
        progressInSegment = Math.min(1, Math.max(0, stepsIntoSegment / segmentTotalSteps));
    } else if (totalCommunitySteps >= endMile.steps) {
        progressInSegment = 1; // At or beyond the end of this segment
    }


    const x = startMile.coords.x + (endMile.coords.x - startMile.coords.x) * progressInSegment;
    const y = startMile.coords.y + (endMile.coords.y - startMile.coords.y) * progressInSegment;

    return { x, y, visible: true };
  }, [totalCommunitySteps, mapReady]);

  return (
    <TooltipProvider>
      <div className={cn("relative w-full aspect-[1.77] max-w-4xl mx-auto shadow-xl rounded-lg overflow-hidden", className)}>
        <Image
          src="https://res.cloudinary.com/djrhjkkvm/image/upload/v1749629242/Maps/steps-for-monarchs_mqqw8h.png"
          alt="Monarch Migration Map"
          layout="fill"
          objectFit="contain" 
          objectPosition="center"
          priority
          onLoad={() => setMapReady(true)}
          data-ai-hint="migration map"
        />

        {mapReady && milestones.map((milestone) => {
          const IconComponent = milestone.icon || MapPin;
          const isReached = totalCommunitySteps >= milestone.steps;
          return (
            <Tooltip key={milestone.name} delayDuration={100}>
              <TooltipTrigger asChild>
                <div
                  className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                  style={{
                    left: `${milestone.coords.x}%`,
                    top: `${milestone.coords.y}%`,
                    zIndex: 10,
                  }}
                >
                  <IconComponent className={cn(
                    "h-6 w-6 sm:h-8 sm:w-8",
                    isReached ? "text-primary animate-pulse" : "text-gray-400",
                     milestone.name.includes('(Start)') || milestone.name.includes('(Destination)') ? "text-accent" : ""
                  )} />
                </div>
              </TooltipTrigger>
              <TooltipContent className="bg-background border-primary">
                <p className="font-semibold">{milestone.name}</p>
                <p className="text-sm text-muted-foreground">{milestone.steps.toLocaleString()} steps</p>
                {isReached && milestone.steps > 0 && <p className="text-xs text-green-500">Reached!</p>}
              </TooltipContent>
            </Tooltip>
          );
        })}

        {mapReady && currentProgressMarkerPosition.visible && (
          <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-1000 ease-out"
            style={{
              left: `${currentProgressMarkerPosition.x}%`,
              top: `${currentProgressMarkerPosition.y}%`,
              zIndex: 20,
            }}
            title={`Current community progress: ${totalCommunitySteps.toLocaleString()} steps`}
          >
            <Leaf className="h-8 w-8 text-orange-500 animate-bounce" data-ai-hint="butterfly monarch" />
          </div>
        )}
         {!mapReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50">
            <p className="text-foreground">Loading map...</p>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}


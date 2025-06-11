
'use client';

import { Leaf } from 'lucide-react';
import { useState, useEffect } from 'react';

// Milestone step counts
const LA_MILESTONE = 140000;
const DISNEYLAND_MILESTONE = 180000;
const SAN_DIEGO_MILESTONE = 360000;
const SONORAN_DESERT_MILESTONE = 900000;
const CHIHUAHUA_MILESTONE = 2200000;
const MEXICO_CITY_MILESTONE = 3600000; // Overall goal

interface ButterflyAnimationProps {
  type: 'user' | 'community';
  // Props for user type
  userCurrentSteps?: number;
  userStepGoal?: number;
  // Props for community type
  totalCommunitySteps?: number;
}

export default function ButterflyAnimation({
  type,
  userCurrentSteps,
  userStepGoal,
  totalCommunitySteps,
}: ButterflyAnimationProps) {
  const [currentDescription, setCurrentDescription] = useState({ start: "", end: "", title: "" });
  const [visualProgress, setVisualProgress] = useState(0);

  useEffect(() => {
    let newStartLabel = "";
    let newEndLabel = "";
    let newTitleLabel = "";
    let calculatedProgress = 0;

    if (type === 'user') {
      newStartLabel = "Your Starting Point";
      newEndLabel = userStepGoal ? "Your Goal!" : "Set a Goal!";
      newTitleLabel = "Your Migration Path";
      if (typeof userCurrentSteps === 'number' && typeof userStepGoal === 'number' && userStepGoal > 0) {
        calculatedProgress = (userCurrentSteps / userStepGoal) * 100;
      } else {
        calculatedProgress = 0;
      }
    } else if (type === 'community') {
      newTitleLabel = "Community's Migration Path";
      
      if (typeof totalCommunitySteps === 'number') {
        if (totalCommunitySteps <= LA_MILESTONE) {
          newStartLabel = "Mojave Desert";
          newEndLabel = "Los Angeles";
          const segmentLength = LA_MILESTONE;
          calculatedProgress = segmentLength > 0 ? (totalCommunitySteps / segmentLength) * 100 : 0;
        } else if (totalCommunitySteps <= DISNEYLAND_MILESTONE) {
          newStartLabel = "Los Angeles";
          newEndLabel = "Disneyland";
          const segmentLength = DISNEYLAND_MILESTONE - LA_MILESTONE;
          const stepsInSegment = totalCommunitySteps - LA_MILESTONE;
          calculatedProgress = segmentLength > 0 ? (stepsInSegment / segmentLength) * 100 : 0;
        } else if (totalCommunitySteps <= SAN_DIEGO_MILESTONE) {
          newStartLabel = "Disneyland";
          newEndLabel = "San Diego";
          const segmentLength = SAN_DIEGO_MILESTONE - DISNEYLAND_MILESTONE;
          const stepsInSegment = totalCommunitySteps - DISNEYLAND_MILESTONE;
          calculatedProgress = segmentLength > 0 ? (stepsInSegment / segmentLength) * 100 : 0;
        } else if (totalCommunitySteps <= SONORAN_DESERT_MILESTONE) {
          newStartLabel = "San Diego";
          newEndLabel = "Sonoran Desert";
          const segmentLength = SONORAN_DESERT_MILESTONE - SAN_DIEGO_MILESTONE;
          const stepsInSegment = totalCommunitySteps - SAN_DIEGO_MILESTONE;
          calculatedProgress = segmentLength > 0 ? (stepsInSegment / segmentLength) * 100 : 0;
        } else if (totalCommunitySteps <= CHIHUAHUA_MILESTONE) {
          newStartLabel = "Sonoran Desert";
          newEndLabel = "Chihuahua";
          const segmentLength = CHIHUAHUA_MILESTONE - SONORAN_DESERT_MILESTONE;
          const stepsInSegment = totalCommunitySteps - SONORAN_DESERT_MILESTONE;
          calculatedProgress = segmentLength > 0 ? (stepsInSegment / segmentLength) * 100 : 0;
        } else if (totalCommunitySteps <= MEXICO_CITY_MILESTONE) {
          newStartLabel = "Chihuahua";
          newEndLabel = "Mexico City";
          const segmentLength = MEXICO_CITY_MILESTONE - CHIHUAHUA_MILESTONE;
          const stepsInSegment = totalCommunitySteps - CHIHUAHUA_MILESTONE;
          calculatedProgress = segmentLength > 0 ? (stepsInSegment / segmentLength) * 100 : 0;
        } else { // Beyond Mexico City
          newStartLabel = "Chihuahua"; // Or "Mexico City"
          newEndLabel = "Mexico City";
          calculatedProgress = 100; // Journey completed
        }
      } else { // Fallback if totalCommunitySteps is undefined
        newStartLabel = "Mojave Desert";
        newEndLabel = "Mexico City";
        calculatedProgress = 0;
      }
    }

    setCurrentDescription({ start: newStartLabel, end: newEndLabel, title: newTitleLabel });
    setVisualProgress(Math.max(0, Math.min(100, calculatedProgress)));

  }, [type, userCurrentSteps, userStepGoal, totalCommunitySteps]);

  const isCompleted = visualProgress >= 99.99;

  return (
    <div className="p-4 rounded-lg bg-card border shadow-md">
      <h3 className="text-lg font-semibold mb-4 text-center font-headline">{currentDescription.title}</h3>
      <div className="relative w-full h-8 bg-muted rounded-full overflow-hidden">
        <div
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-yellow-300 via-orange-400 to-red-400 rounded-full"
          style={{ width: `${visualProgress}%`, transition: 'width 0.5s ease-in-out' }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 h-10 w-10 flex items-center justify-center"
          style={{
            left: `calc(${visualProgress}% - 20px)`, 
            transition: 'left 0.5s ease-in-out'
          }}
          data-ai-hint="butterfly monarch"
        >
          <Leaf className="h-7 w-7 text-primary animate-pulse" />
        </div>
      </div>
      <div className="flex justify-between text-xs text-muted-foreground mt-2 px-1">
        <span>{currentDescription.start}</span>
        <span>{currentDescription.end}</span>
      </div>
       {isCompleted && (
        <p className="text-center text-green-500 font-semibold mt-2">
          {type === 'user'
            ? "You've reached your destination!"
            : currentDescription.end === "Mexico City" && totalCommunitySteps && totalCommunitySteps >= MEXICO_CITY_MILESTONE
            ? "The community has completed the migration to Mexico City!"
            : `The community has reached ${currentDescription.end}!`}
        </p>
      )}
    </div>
  );
}

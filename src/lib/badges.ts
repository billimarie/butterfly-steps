
import React from 'react';
import { Footprints, Award, Star, MapPin, Sparkles, Anchor, Sun, Mountain, Crown, Users, Eye, Egg, Shell as ShellIconLucide, Bug, Compass } from 'lucide-react';
import { WormIcon as WormIconComponent } from '@/components/icons/WormIcon'; // Updated import

// Define WormIcon as a React Functional Component by re-exporting or using the imported component
export const WormIcon = WormIconComponent;

export type BadgeId =
  | 'first-step'
  | 'hundred-steps'
  | 'thousand-steps'
  | 'trailblazer-la'
  | 'explorer-disney'
  | 'voyager-sd'
  | 'nomad-sonoran'
  | 'adventurer-chihuahua'
  | 'monarch-champion-mexico'
  | 'team-player'
  | 'social-butterfly'
  | 'explorer-award' // New badge ID
  | 'streak-week-1'
  | 'streak-egg'          // 30 days
  | 'streak-caterpillar'  // 60 days
  | 'streak-chrysalis'    // 90 days
  | 'streak-butterfly';   // 133 days (Full challenge duration)

export interface BadgeData {
  id: BadgeId;
  name: string;
  milestone: number; // For step/streak, it's the count. For event, could be # of sub-events or just 1.
  description: string;
  icon: React.ElementType;
  type: 'step' | 'streak' | 'event';
}

export const ALL_BADGES: BadgeData[] = [
  // Step Badges
  { id: 'first-step', name: 'First Step', milestone: 1, description: 'You\'ve taken your first step on the journey!', icon: Footprints, type: 'step' },
  { id: 'hundred-steps', name: 'Pathfinder', milestone: 100, description: '100 steps recorded!', icon: Award, type: 'step' },
  { id: 'thousand-steps', name: 'Trail Mixer', milestone: 1000, description: '1,000 steps achieved!', icon: Star, type: 'step' },
  { id: 'trailblazer-la', name: 'Trailblazer (LA)', milestone: 139999, description: 'Reached the equivalent of Downtown LA!', icon: MapPin, type: 'step' },
  { id: 'explorer-disney', name: 'Explorer (Anaheim)', milestone: 180000, description: 'Stepped your way to "The Happiest Place on Earth"!', icon: Sparkles, type: 'step' },
  { id: 'voyager-sd', name: 'Voyager (San Diego)', milestone: 360000, description: 'You\'ve made it to sunny San Diego!', icon: Anchor, type: 'step' },
  { id: 'nomad-sonoran', name: 'Nomad (Sonoran Desert)', milestone: 900000, description: 'Crossed the vast Sonoran Desert!', icon: Sun, type: 'step' },
  { id: 'adventurer-chihuahua', name: 'Adventurer (Chihuahua)', milestone: 2200000, description: 'Ventured deep into Chihuahua, Mexico!', icon: Mountain, type: 'step' },
  { id: 'monarch-champion-mexico', name: 'Monarch Champion (Mexico City)', milestone: 3600000, description: 'Completed the migration to Mexico City!', icon: Crown, type: 'step' },

  // Event Badges
  { id: 'team-player', name: 'Team Player', milestone: 1, description: 'You\'ve joined or created a team!', icon: Users, type: 'event' },
  { id: 'social-butterfly', name: 'Social Butterfly', milestone: 1, description: 'You\'re exploring the community by viewing another user\'s profile!', icon: Eye, type: 'event' },
  { id: 'explorer-award', name: 'Site Explorer', milestone: 4, description: 'You\'ve explored all the main areas of Butterfly Steps!', icon: Compass, type: 'event' },


  // Streak Badges
  { id: 'streak-week-1', name: 'First Week Flourish', milestone: 7, description: 'You\'ve maintained a 7-day login streak!', icon: Award, type: 'streak' },
  { id: 'streak-egg', name: 'Persistent Egg', milestone: 30, description: 'Logged in for 30 consecutive days! Hatching potential!', icon: Egg, type: 'streak' },
  { id: 'streak-caterpillar', name: 'Curious Caterpillar', milestone: 60, description: '60 day streak! Munching through the days!', icon: WormIcon, type: 'streak' },
  { id: 'streak-chrysalis', name: 'Committed Chrysalis', milestone: 90, description: '90 days of consistency! Transformation is near.', icon: ShellIconLucide, type: 'streak' },
  { id: 'streak-butterfly', name: 'Monarch Dedication', milestone: 133, description: 'Logged in every day of the challenge until Halloween! True Monarch Spirit!', icon: Sparkles, type: 'streak' },
];

export function getBadgeDataById(id: BadgeId): BadgeData | undefined {
  return ALL_BADGES.find(badge => badge.id === id);
}

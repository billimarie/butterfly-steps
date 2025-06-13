
import type { Icon as LucideIconType } from 'lucide-react';
import { Footprints, Award, Star, MapPin, Sparkles, Anchor, Sun, Mountain, Crown, Users } from 'lucide-react';

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
  | 'team-player'; // New badge

export interface BadgeData {
  id: BadgeId;
  name: string;
  milestone: number; // For step-based badges. For event-based, can be 0 or 1.
  description: string;
  icon: LucideIconType;
}

export const ALL_BADGES: BadgeData[] = [
  { id: 'first-step', name: 'First Step', milestone: 1, description: 'You\'ve taken your first step on the journey!', icon: Footprints },
  { id: 'hundred-steps', name: 'Pathfinder', milestone: 100, description: 'You earned the Pathfinder badge!', icon: Award },
  { id: 'thousand-steps', name: 'Trail Mixer', milestone: 1000, description: '1,000 steps achieved!', icon: Star },
  { id: 'trailblazer-la', name: 'Trailblazer (LA)', milestone: 139999, description: 'Reached the equivalent of Downtown LA!', icon: MapPin },
  { id: 'explorer-disney', name: 'Explorer (Anaheim)', milestone: 180000, description: 'Stepped your way to "The Happiest Place on Earth"!', icon: Sparkles },
  { id: 'voyager-sd', name: 'Voyager (San Diego)', milestone: 360000, description: 'You\'ve made it to sunny San Diego!', icon: Anchor },
  { id: 'nomad-sonoran', name: 'Nomad (Sonoran Desert)', milestone: 900000, description: 'Crossed the vast Sonoran Desert!', icon: Sun },
  { id: 'adventurer-chihuahua', name: 'Adventurer (Chihuahua)', milestone: 2200000, description: 'Ventured deep into Chihuahua, Mexico!', icon: Mountain },
  { id: 'monarch-champion-mexico', name: 'Monarch Champion (Mexico City)', milestone: 3600000, description: 'Completed the migration to Mexico City!', icon: Crown },
  { id: 'team-player', name: 'Team Player', milestone: 1, description: 'You\'ve joined a team!', icon: Users },
];

export function getBadgeDataById(id: BadgeId): BadgeData | undefined {
  return ALL_BADGES.find(badge => badge.id === id);
}

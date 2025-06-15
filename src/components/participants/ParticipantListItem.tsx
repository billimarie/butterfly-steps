
'use client';

import type { UserProfile } from '@/types';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardHeader } from '@/components/ui/card';
import { Footprints, UserCircle, Flame, Shell as ShellIconLucide, Award } from 'lucide-react';
import { CHRYSALIS_AVATAR_IDENTIFIER } from '@/types';
import { getChrysalisVariantById, getChrysalisVariantByDay } from '@/lib/chrysalisVariants';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const getInitials = (name: string | null | undefined) => {
  if (!name) return 'U';
  const parts = name.split(' ').filter(Boolean).map(part => part[0]);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].toUpperCase();
  return (parts[0] + (parts.length > 1 ? parts[parts.length - 1] : '')).toUpperCase();
};

interface ParticipantListItemProps {
  participant: UserProfile;
}

export default function ParticipantListItem({ participant }: ParticipantListItemProps) {
  const renderAvatarContent = () => {
    if (participant.photoURL === CHRYSALIS_AVATAR_IDENTIFIER) {
      const activeVariantOrDefault = participant.activeChrysalisThemeId
        ? getChrysalisVariantById(participant.activeChrysalisThemeId) || getChrysalisVariantByDay(1)
        : getChrysalisVariantByDay(1);
      
      const IconComponent = activeVariantOrDefault.icon || ShellIconLucide;
      const iconStyle = activeVariantOrDefault.themePrimaryHSL ? { color: `hsl(${activeVariantOrDefault.themePrimaryHSL})` } : {};
      
      let hint = "icon nature";
      if (activeVariantOrDefault.name && activeVariantOrDefault.name.toLowerCase().includes("shell")) {
          hint = "chrysalis shell";
      }

      return <IconComponent className="h-full w-full p-1.5" style={iconStyle} data-ai-hint={hint} />;
    }
    return (
      <>
        <AvatarImage src={participant.photoURL || undefined} alt={participant.displayName || 'User'} />
        <AvatarFallback>{getInitials(participant.displayName)}</AvatarFallback>
      </>
    );
  };

  return (
    <Link
      href={`/profile/${participant.uid}`}
      className="block rounded-lg transition-shadow hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
      aria-label={`View profile for ${participant.displayName || 'Anonymous User'}`}
    >
      <Card className="shadow-md overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-x-3 p-4">
          <div className="flex items-center space-x-3 min-w-0">
            <Avatar className="h-12 w-12 border flex-shrink-0">
              {renderAvatarContent()}
            </Avatar>
            <div className="min-w-0">
              <p className="text-lg font-medium leading-tight truncate">
                {participant.displayName || 'Anonymous User'}
              </p>
              {participant.teamName && (
                <p className="text-xs text-muted-foreground flex items-center mt-0.5">
                 <UserCircle className="mr-1 h-3 w-3" /> Team: {participant.teamName}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end text-right flex-shrink-0">
            <div className="flex items-center text-primary text-lg font-semibold">
              {participant.currentSteps.toLocaleString()}
              <Footprints className="ml-1.5 h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex items-center space-x-3 mt-1 text-xs text-muted-foreground">
              <TooltipProvider delayDuration={100}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="flex items-center">
                      <Award className="mr-1 h-3 w-3" /> {(participant.badgesEarned?.length || 0)}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent><p>Badges Earned</p></TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="flex items-center">
                      <ShellIconLucide className="mr-1 h-3 w-3" /> {(participant.chrysalisCoinDates?.length || 0)}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent><p>Chrysalis Coins</p></TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="flex items-center">
                      <Flame className="mr-1 h-3 w-3" /> {(participant.currentStreak || 0)}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent><p>Login Streak</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </CardHeader>
      </Card>
    </Link>
  );
}


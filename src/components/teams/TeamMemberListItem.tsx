
'use client';

import type { UserProfile } from '@/types';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'; 
import { Card, CardHeader } from '@/components/ui/card';
import { Footprints, Crown as CreatorCrownIcon, Medal, Shell } from 'lucide-react'; 
import { CHRYSALIS_AVATAR_IDENTIFIER } from '@/types';
import { getChrysalisVariantById, getChrysalisVariantByDay } from '@/lib/chrysalisVariants';


const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    const parts = name.split(' ').filter(Boolean).map(part => part[0]);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].toUpperCase();
    return (parts[0] + parts[parts.length - 1]).toUpperCase();
};

interface TeamMemberListItemProps {
  member: UserProfile;
  isCreator: boolean;
  index: number; // Rank within the team
}

export default function TeamMemberListItem({ member, isCreator, index }: TeamMemberListItemProps) {
  let rankIcon = null;
  if (index === 0) {
    rankIcon = <CreatorCrownIcon className="h-5 w-5 text-yellow-400" title="1st Place" />;
  } else if (index === 1) {
    rankIcon = <Medal className="h-5 w-5 text-slate-400" title="2nd Place" />;
  } else if (index === 2) {
    rankIcon = <Medal className="h-5 w-5 text-orange-400" title="3rd Place" />;
  }

  const renderAvatarContent = () => {
    if (member.photoURL === CHRYSALIS_AVATAR_IDENTIFIER) {
      const activeVariant = member.activeChrysalisThemeId 
        ? getChrysalisVariantById(member.activeChrysalisThemeId) 
        : getChrysalisVariantByDay(1); // Default to Golden Chrysalis (Day 1)
      const IconComponent = activeVariant?.icon || Shell;
      const iconStyle = activeVariant?.themePrimaryHSL ? { color: `hsl(${activeVariant.themePrimaryHSL})` } : {};
      return <IconComponent className="h-full w-full p-1.5" style={iconStyle} data-ai-hint={activeVariant?.name.toLowerCase().includes("shell") ? "chrysalis shell" : "icon nature"} />;
    }
    return (
      <>
        <AvatarImage src={member.photoURL || undefined} alt={member.displayName || 'User'} />
        <AvatarFallback>{getInitials(member.displayName)}</AvatarFallback>
      </>
    );
  };

  return (
    <Link
      href={`/profile/${member.uid}`}
      className="block rounded-lg transition-shadow hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
      aria-label={`View profile for ${member.displayName || 'Anonymous User'}`}
    >
      <Card className="shadow-md">
        <CardHeader className="flex flex-row items-center justify-between space-x-4 py-3 px-4">
          <div className="flex items-center space-x-3 min-w-0">
            <Avatar className="h-10 w-10 border flex-shrink-0">
              {renderAvatarContent()}
            </Avatar>
            <div className="min-w-0">
              <p className="text-sm font-medium leading-none truncate flex items-center">
                {member.displayName || 'Anonymous User'}
              </p>
            </div>
          </div>
          <div className="flex items-center text-sm sm:text-base flex-shrink-0">
            {rankIcon && <span className="mr-1.5">{rankIcon}</span>}
            <span className="font-semibold text-primary">{member.currentSteps.toLocaleString()}</span>
            <Footprints className="ml-1 h-4 w-4 text-muted-foreground" />
          </div>
        </CardHeader>
      </Card>
    </Link>
  );
}

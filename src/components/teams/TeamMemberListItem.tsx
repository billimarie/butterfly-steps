
'use client';

import type { UserProfile } from '@/types';
import Link from 'next/link';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardHeader } from '@/components/ui/card';
import { Footprints, Crown as CreatorCrownIcon, Medal } from 'lucide-react';

const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    const parts = name.split(' ').filter(Boolean).map(part => part[0]);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].toUpperCase();
    return (parts[0] + parts[parts.length - 1]).toUpperCase();
};

interface TeamMemberListItemProps {
  member: UserProfile;
  isCreator: boolean; // Retained in case it's needed for other subtle UI in the future, but not for the crown here.
  index: number; // Rank within the team
}

export default function TeamMemberListItem({ member, isCreator, index }: TeamMemberListItemProps) {
  let rankIcon = null;
  if (index === 0) {
    // Use CreatorCrownIcon for 1st place, styled gold
    rankIcon = <CreatorCrownIcon className="h-5 w-5 text-yellow-400" title="1st Place" />;
  } else if (index === 1) {
    rankIcon = <Medal className="h-5 w-5 text-slate-400" title="2nd Place" />;
  } else if (index === 2) {
    rankIcon = <Medal className="h-5 w-5 text-orange-400" title="3rd Place" />;
  }

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
              <AvatarFallback>{getInitials(member.displayName)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="text-sm font-medium leading-none truncate flex items-center">
                {member.displayName || 'Anonymous User'}
                {/* Creator indicator next to name removed as per new requirement for crown */}
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

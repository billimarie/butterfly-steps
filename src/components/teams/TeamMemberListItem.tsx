
'use client';

import type { UserProfile } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Footprints, Crown } from 'lucide-react';

interface TeamMemberListItemProps {
  member: UserProfile;
  isCreator: boolean; // Retained in case a different creator visual cue is desired later
  isTopStepper: boolean;
}

const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    // Ensure that we only take the first letter of each part of the name
    const parts = name.split(' ').filter(Boolean).map(part => part[0]);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].toUpperCase();
    // For multiple parts, take the first letter of the first and last parts
    return (parts[0] + parts[parts.length - 1]).toUpperCase();
};

export default function TeamMemberListItem({ member, isCreator, isTopStepper }: TeamMemberListItemProps) {
  return (
    <li className="flex items-center justify-between py-3 bg-card rounded-md shadow-sm hover:bg-muted/50 transition-colors">
      <div className="flex items-center space-x-3">
        <Avatar className="h-10 w-10">
          {/* Add AvatarImage if user profiles have photoURLs later */}
          <AvatarFallback>{getInitials(member.displayName)}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold text-sm flex items-center">
            {member.displayName || 'Unnamed User'}
            {isTopStepper && <Crown className="ml-2 h-4 w-4 text-yellow-500" title="Top Stepper"/>}
            {/* Example: If you still want to show creator status differently: 
               isCreator && !isTopStepper && <UserCheck className="ml-2 h-4 w-4 text-blue-500" title="Team Creator" /> 
            */}
          </p>
        </div>
      </div>
      <div className="flex items-center text-sm">
        <Footprints className="mr-1 h-4 w-4 text-primary" />
        <span className="font-medium">{member.currentSteps.toLocaleString()}</span>
        <span className="text-muted-foreground ml-1">steps</span>
      </div>
    </li>
  );
}

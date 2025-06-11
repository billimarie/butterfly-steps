
'use client';

import type { UserProfile } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Footprints, User as UserIcon, Crown } from 'lucide-react';

interface TeamMemberListItemProps {
  member: UserProfile;
  isCreator: boolean;
}

const getInitials = (name: string | null | undefined) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
};

export default function TeamMemberListItem({ member, isCreator }: TeamMemberListItemProps) {
  return (
    <li className="flex items-center justify-between p-3 bg-card rounded-md shadow-sm hover:bg-muted/50 transition-colors">
      <div className="flex items-center space-x-3">
        <Avatar className="h-10 w-10">
          {/* Add AvatarImage if user profiles have photoURLs later */}
          <AvatarFallback>{getInitials(member.displayName)}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold text-sm flex items-center">
            {member.displayName || 'Unnamed User'}
            {isCreator && <Crown className="ml-2 h-4 w-4 text-yellow-500" titleAccess="Team Creator"/>}
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

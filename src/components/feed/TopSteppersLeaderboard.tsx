
'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Medal, Footprints, Users as TeamIcon, Shell } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getTopUsers } from '@/lib/firebaseService';
import type { UserProfile } from '@/types';
import { CHRYSALIS_AVATAR_IDENTIFIER } from '@/types';
import { getChrysalisVariantById, getChrysalisVariantByDay } from '@/lib/chrysalisVariants';


const getInitials = (name: string | null | undefined) => {
    if (!name) return '?';
    const parts = name.split(' ').filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

interface TopSteppersLeaderboardProps {
  count: number;
}

export default function TopSteppersLeaderboard({ count }: TopSteppersLeaderboardProps) {
  const [topUsers, setTopUsers] = useState<UserProfile[]>([]);
  const [loadingTopUsers, setLoadingTopUsers] = useState(true);

  const fetchTopUsersData = useCallback(async () => {
    setLoadingTopUsers(true);
    try {
      const users = await getTopUsers(count);
      setTopUsers(users);
    } catch (error) {
      console.error("Failed to fetch top users:", error);
      setTopUsers([]);
    } finally {
      setLoadingTopUsers(false);
    }
  }, [count]);

  useEffect(() => {
    fetchTopUsersData();
  }, [fetchTopUsersData]);

  const renderAvatarContent = (user: UserProfile) => {
    if (user.photoURL === CHRYSALIS_AVATAR_IDENTIFIER) {
      const activeVariant = user.activeChrysalisThemeId
        ? getChrysalisVariantById(user.activeChrysalisThemeId)
        : getChrysalisVariantByDay(1); // Default to Golden Chrysalis (Day 1)
      const IconComponent = activeVariant?.icon || Shell;
      const iconStyle = activeVariant?.themePrimaryHSL ? { color: `hsl(${activeVariant.themePrimaryHSL})` } : {};
      return <IconComponent className="h-full w-full p-1.5" style={iconStyle} data-ai-hint={activeVariant?.name.toLowerCase().includes("shell") ? "chrysalis shell" : "icon nature"} />;
    }
    return (
      <>
        <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'User'} />
        <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
      </>
    );
  };

  return (
    <div>
      {loadingTopUsers ? (
        <div className="space-y-4">
          {[...Array(Math.min(count, 3))].map((_, i) => (
            <Card key={`skeleton-${i}`} className="shadow-lg">
              <CardHeader className="flex flex-row items-center space-x-3 pb-2">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-6 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : topUsers.length > 0 ? (
        <div className="space-y-4">
          {topUsers.map((user, index) => (
            <Link
              key={user.uid}
              href={`/profile/${user.uid}`}
              className="block rounded-lg transition-shadow hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
            >
              <Card className="shadow-md">
                <CardHeader className="flex flex-row items-center justify-between space-x-4 pb-3 pt-4 px-4">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10 border">
                      {renderAvatarContent(user)}
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium leading-none">{user.displayName || 'Anonymous User'}</p>
                      {user.teamName && (
                        <p className="text-xs text-muted-foreground flex items-center mt-0.5">
                          <TeamIcon className="mr-1 h-3 w-3" /> {user.teamName}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center text-primary">
                    {index === 0 && <Medal className="mr-2 h-5 w-5 text-yellow-400" />}
                    {index === 1 && <Medal className="mr-2 h-5 w-5 text-slate-400" />}
                    {index === 2 && <Medal className="mr-2 h-5 w-5 text-orange-400" />}
                    <span className="text-lg font-semibold">{user.currentSteps.toLocaleString()}</span>
                    <Footprints className="ml-1 h-4 w-4 text-muted-foreground" />
                  </div>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-muted-foreground text-center">No top users to display yet. Be the first!</p>
      )}
    </div>
  );
}

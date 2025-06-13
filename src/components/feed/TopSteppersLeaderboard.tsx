
'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Medal, Footprints, Users as TeamIcon } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getTopUsers } from '@/lib/firebaseService';
import type { UserProfile } from '@/types';

const getInitials = (name: string | null | undefined) => {
    if (!name) return '?';
    const parts = name.split(' ').filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

interface TopSteppersLeaderboardProps {
  count: number;
  isPublicView?: boolean; // New prop
}

export default function TopSteppersLeaderboard({ count, isPublicView = false }: TopSteppersLeaderboardProps) {
  const [topUsers, setTopUsers] = useState<UserProfile[]>([]);
  const [loadingTopUsers, setLoadingTopUsers] = useState(true);

  const fetchTopUsersData = useCallback(async () => {
    setLoadingTopUsers(true);
    try {
      const users = await getTopUsers(count);
      setTopUsers(users);
    } catch (error) {
      console.error("Failed to fetch top users for leaderboard:", error);
      setTopUsers([]);
    } finally {
      setLoadingTopUsers(false);
    }
  }, [count]);

  useEffect(() => {
    fetchTopUsersData();
  }, [fetchTopUsersData]);

  return (
    <div className="mt-12">
      <h2 className="text-3xl font-headline text-primary mb-6 text-center">Top Steppers</h2>
      {loadingTopUsers ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
          {topUsers.map((user, index) => {
            const displayNameToShow = isPublicView 
              ? `Top Walker #${index + 1}` 
              : user.displayName || 'Anonymous User';
            
            const avatarFallbackContent = isPublicView 
              ? `#${index + 1}`.slice(0,2) // Ensure it's not too long for avatar
              : getInitials(user.displayName);

            return (
              <Card key={user.uid} className="shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-x-4 pb-3 pt-4 px-4">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10 border">
                      <AvatarFallback>{avatarFallbackContent}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium leading-none">{displayNameToShow}</p>
                      {user.teamName && !isPublicView && (
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
            );
          })}
        </div>
      ) : (
        <p className="text-muted-foreground text-center">No top users to display yet. Be the first!</p>
      )}
    </div>
  );
}

'use client';

import type { CommunityStats } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Users, TrendingUp } from 'lucide-react'; // Using Leaf for nature theme
import Image from 'next/image';

interface CommunityProgressCardProps {
  communityStats: CommunityStats | null;
}

const TOTAL_CHALLENGE_GOAL = 3_600_000; // 3.6 million steps

export default function CommunityProgressCard({ communityStats }: CommunityProgressCardProps) {
  const currentTotalSteps = communityStats?.totalSteps || 0;
  const totalParticipants = communityStats?.totalParticipants || 0;
  const progressPercentage = (currentTotalSteps / TOTAL_CHALLENGE_GOAL) * 100;

  return (
    <Card className="shadow-lg overflow-hidden">
      <div className="relative h-40">
        <Image 
          src="https://placehold.co/600x240.png" 
          alt="Monarch butterflies migrating" 
          layout="fill"
          objectFit="cover"
          data-ai-hint="monarch butterfly migration"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
        <div className="absolute bottom-0 left-0 p-4">
          <CardTitle className="font-headline text-3xl text-white flex items-center">
            <TrendingUp className="mr-2 h-7 w-7" />
            Community Migration
          </CardTitle>
          <CardDescription className="text-slate-200">
            Together, we're walking for the monarchs!
          </CardDescription>
        </div>
      </div>
      <CardContent className="pt-6 space-y-3">
        <div className="text-center">
          <p className="text-4xl font-bold text-primary">{currentTotalSteps.toLocaleString()}</p>
          <p className="text-sm text-muted-foreground">Total Steps Taken by Community</p>
        </div>
        
        <div className="flex justify-between items-baseline">
          <p className="text-sm text-muted-foreground">Goal: {TOTAL_CHALLENGE_GOAL.toLocaleString()} steps</p>
          <p className="text-sm font-semibold text-primary">{Math.min(100, Math.round(progressPercentage))}%</p>
        </div>
        <Progress value={progressPercentage} className="w-full h-3" />
        
        <div className="flex items-center justify-center text-muted-foreground pt-2">
            <Users className="mr-2 h-5 w-5" />
            <span>{totalParticipants.toLocaleString()} Participants</span>
        </div>
         {currentTotalSteps >= TOTAL_CHALLENGE_GOAL && (
             <p className="text-center text-green-600 font-semibold mt-2">Amazing! The community reached the migration goal!</p>
        )}
      </CardContent>
    </Card>
  );
}

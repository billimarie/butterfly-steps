
'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Gift, ArrowRight, Users } from 'lucide-react';

import CommunityProgressCard from '@/components/dashboard/CommunityProgressCard';
import ButterflyAnimation from '@/components/dashboard/ButterflyAnimation';
import TopSteppersLeaderboard from '@/components/feed/TopSteppersLeaderboard';
import DailyStepChart from '@/components/profile/DailyStepChart'; // Import DailyStepChart
import { getCommunityStats, getCommunityDailySteps } from '@/lib/firebaseService'; // Import getCommunityDailySteps
import type { CommunityStats, DailyStep } from '@/types';

export default function CommunityFeedTabContent() {
  const [communityStats, setCommunityStats] = useState<CommunityStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [communityDailyStepsData, setCommunityDailyStepsData] = useState<DailyStep[]>([]);
  const [isLoadingCommunityChart, setIsLoadingCommunityChart] = useState(true);


  const fetchFeedData = useCallback(async () => {
    setLoadingStats(true);
    setIsLoadingCommunityChart(true);
    try {
      const stats = await getCommunityStats();
      setCommunityStats(stats);

      const dailySteps = await getCommunityDailySteps(30); // Fetch last 30 days for community
      setCommunityDailyStepsData(dailySteps);

    } catch (error) {
      console.error("Failed to fetch community stats or daily steps for feed tab:", error);
      setCommunityStats(null);
      setCommunityDailyStepsData([]);
    } finally {
      setLoadingStats(false);
      setIsLoadingCommunityChart(false);
    }
  }, []);

  useEffect(() => {
    fetchFeedData();
  }, [fetchFeedData]);

  return (
    <div className="space-y-8 py-4">
      <h1 className="text-4xl font-headline text-center text-primary mb-6">
      </h1>

      {loadingStats ? (
        <Skeleton className="h-64 w-full rounded-lg" />
      ) : communityStats ? (
        <>
          <div className="mt-8">
            <ButterflyAnimation type="community" totalCommunitySteps={communityStats.totalSteps} />
          </div>
          {/* <CommunityProgressCard communityStats={communityStats} /> */}
          
        </>
      ) : (
        <Card className="mt-8 text-center">
          <CardHeader><CardTitle className="font-headline">Community Progress Unavailable</CardTitle></CardHeader>
          <CardContent><p className="text-muted-foreground">We couldn't load the community progress data at this moment. Please check back soon!</p></CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="shadow-lg">
          <CardHeader>
              <CardTitle className="font-semibold tracking-tight font-headline text-2xl flex items-center">
                <Users className="h-6 w-6 text-primary mr-2"/> Leaderboard
              </CardTitle>
          </CardHeader>
          <CardContent>
            <TopSteppersLeaderboard count={5} />
          </CardContent>
          <CardFooter>
            <a href="#" className="text-sm text-muted-foreground ml-auto order-2 underline">View All</a>
          </CardFooter>
        </Card>

        

        <DailyStepChart
          dailyStepsData={communityDailyStepsData}
          isLoading={isLoadingCommunityChart}
          chartType="community"
        />
      </div>

      

      

      

      

      

      <div className="grid md:grid-cols-2 gap-8 mt-12">
        <Card className="shadow-lg">
          <CardHeader>
              <CardTitle className="font-headline text-2xl">Support the Monarchs</CardTitle>
              <CardDescription>Make Every Step Count</CardDescription>
          </CardHeader>
          <CardContent>
              <p className="mb-4">
                  Our nonprofit ecofarm plants Butterfly Habitats in the Mojave Desert. You can help us plant native milkweed and turn desertified land into a thriving ecosystem!
              </p>
              <Button asChild size="lg">
                  <a href="https://foreverystaratree.org/donate.html" target="_blank" rel="noopener noreferrer">
                      <Gift className="mr-2 h-5 w-5"/> Donate to For Every Star, A Tree
                  </a>
              </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

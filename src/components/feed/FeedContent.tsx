
'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Gift, ArrowRight } from 'lucide-react';

import CommunityProgressCard from '@/components/dashboard/CommunityProgressCard';
import ButterflyAnimation from '@/components/dashboard/ButterflyAnimation';
import TopSteppersLeaderboard from '@/components/feed/TopSteppersLeaderboard';
import { getCommunityStats } from '@/lib/firebaseService';
import type { CommunityStats } from '@/types';

export default function FeedContent() {
  const [communityStats, setCommunityStats] = useState<CommunityStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  const fetchFeedData = useCallback(async () => {
    setLoadingStats(true);
    try {
      const stats = await getCommunityStats();
      setCommunityStats(stats);
    } catch (error) {
      console.error("Failed to fetch community stats for feed:", error);
      setCommunityStats(null);
    } finally {
      setLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    fetchFeedData();
  }, [fetchFeedData]);

  return (
    <>
      {loadingStats ? (
        <Skeleton className="h-64 w-full rounded-lg" />
      ) : communityStats ? (
        <>
          <CommunityProgressCard communityStats={communityStats} />
          <div className="mt-8">
            <ButterflyAnimation type="community" totalCommunitySteps={communityStats.totalSteps} />
          </div>
        </>
      ) : (
        <Card className="mt-8 text-center">
          <CardHeader><CardTitle className="font-headline">Community Progress Unavailable</CardTitle></CardHeader>
          <CardContent><p className="text-muted-foreground">We couldn't load the community progress data at this moment. Please check back soon!</p></CardContent>
        </Card>
      )}

      <TopSteppersLeaderboard count={5} />

      <div className="grid md:grid-cols-2 gap-8 mt-12">
        <Card className="shadow-lg text-center flex flex-col">
            <CardHeader>
                <CardTitle className="font-headline text-2xl">Join the Migration</CardTitle>
                <CardDescription>Become a part of the Butterfly Steps challenge and help us save the butterflies.</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col justify-center items-center">
                <p className="mb-6 max-w-sm">
                    Track your steps, set goals, and contribute to a great cause. Every step counts!
                </p>
            </CardContent>
            <CardFooter className="justify-center pt-0">
                 <Button asChild size="lg">
                    <Link href="/signup">
                        Sign Up Now <ArrowRight className="ml-2 h-5 w-5"/>
                    </Link>
                </Button>
            </CardFooter>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
              <CardTitle className="font-headline text-2xl">Support the Monarchs</CardTitle>
              <CardDescription>Every Step Count</CardDescription>
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
    </>
  );
}

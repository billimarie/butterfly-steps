
'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Gift, ArrowRight } from 'lucide-react';

import CommunityProgressCard from '@/components/dashboard/CommunityProgressCard';
import ButterflyAnimation from '@/components/dashboard/ButterflyAnimation';
import { getCommunityStats } from '@/lib/firebaseService';
import type { CommunityStats } from '@/types';

export default function FeedContent() {
  const [communityStats, setCommunityStats] = useState<CommunityStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCommunityData = useCallback(async () => {
    setLoading(true);
    try {
      const stats = await getCommunityStats();
      setCommunityStats(stats);
    } catch (error) {
      console.error("Failed to fetch community stats for feed:", error);
      setCommunityStats(null); // Set to null on error to show appropriate message
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCommunityData();
  }, [fetchCommunityData]);

  const communityProgressPercentage = communityStats ? (communityStats.totalSteps / 3_600_000) * 100 : 0;

  if (loading) {
    return (
      <>
        <Skeleton className="h-64 w-full rounded-lg" />
        <Skeleton className="h-24 w-full rounded-lg mt-8" />
        <div className="grid md:grid-cols-2 gap-8 mt-8">
            <Skeleton className="h-48 w-full rounded-lg" />
            <Skeleton className="h-48 w-full rounded-lg" />
        </div>
      </>
    );
  }

  return (
    <>
      {communityStats ? (
        <>
          <CommunityProgressCard communityStats={communityStats} />
          <div className="mt-8">
            <ButterflyAnimation progress={communityProgressPercentage} type="community" />
          </div>
        </>
      ) : (
        <Card className="mt-8 text-center">
          <CardHeader><CardTitle className="font-headline">Progress Currently Unavailable</CardTitle></CardHeader>
          <CardContent><p className="text-muted-foreground">We couldn't load the community progress data at this moment. Please check back soon!</p></CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-8 mt-12">
        <Card className="shadow-lg text-center flex flex-col">
            <CardHeader>
                <CardTitle className="font-headline text-2xl">Join the Migration!</CardTitle>
                <CardDescription>Become a part of Monarch Miles and help us save the butterflies.</CardDescription>
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

        <Card className="shadow-lg text-center flex flex-col">
            <CardHeader>
                <CardTitle className="font-headline text-2xl">Support the Monarchs</CardTitle>
                <CardDescription>Your contributions make a real difference for monarch butterfly conservation.</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col justify-center items-center">
                <p className="mb-6 max-w-sm">
                    Help ForEveryStarATree.org plant native milkweed and restore vital habitats for these beautiful creatures.
                </p>
            </CardContent>
             <CardFooter className="justify-center pt-0">
                <Button asChild size="lg">
                    <a href="https://foreveryStaratree.org/donate" target="_blank" rel="noopener noreferrer">
                        <Gift className="mr-2 h-5 w-5"/> Donate to ForEveryStarATree.org
                    </a>
                </Button>
            </CardFooter>
        </Card>
      </div>
    </>
  );
}

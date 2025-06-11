
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useAuthRedirect } from '@/hooks/useAuthRedirect';
import { useRouter, usePathname } from 'next/navigation';
import CountdownTimer from '@/components/dashboard/CountdownTimer';
import UserProgressCard from '@/components/dashboard/UserProgressCard';
import CommunityProgressCard from '@/components/dashboard/CommunityProgressCard';
import StepSubmissionForm from '@/components/dashboard/StepSubmissionForm';
import ButterflyAnimation from '@/components/dashboard/ButterflyAnimation';
import InteractiveMap from '@/components/dashboard/InteractiveMap';
// StreakDisplay is now a global modal, remove import and usage here
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { getCommunityStats } from '@/lib/firebaseService';
import type { CommunityStats, UserProfile } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Footprints, Users, Gift } from 'lucide-react';
import Logo from '@/components/ui/Logo';


function Dashboard({ userProfile, initialCommunityStats }: { userProfile: UserProfile, initialCommunityStats: CommunityStats | null }) {
  const [communityStats, setCommunityStats] = useState<CommunityStats | null>(initialCommunityStats);
  const { fetchUserProfile } = useAuth();

  const refreshDashboardData = useCallback(async () => {
    const stats = await getCommunityStats();
    setCommunityStats(stats);
    if (userProfile?.uid) {
      // Pass false for initialLogin to prevent re-triggering modal on manual refresh
      await fetchUserProfile(userProfile.uid, false); 
    }
  }, [userProfile?.uid, fetchUserProfile]);


  useEffect(() => {
    if (!initialCommunityStats) {
        refreshDashboardData();
    } else {
        setCommunityStats(initialCommunityStats);
    }
  }, [initialCommunityStats, refreshDashboardData]);

  return (
    <div className="space-y-8">
      <CountdownTimer />
      {/* StreakDisplay component removed from here, it's now a global modal */}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <CommunityProgressCard communityStats={communityStats} />
           {communityStats && <ButterflyAnimation type="community" totalCommunitySteps={communityStats.totalSteps} />}
           {communityStats && <InteractiveMap totalCommunitySteps={communityStats.totalSteps} className="mt-6" />}
        </div>
        <div className="space-y-6">
          <UserProgressCard userProfile={userProfile} />
          <StepSubmissionForm onStepSubmit={refreshDashboardData} />
        </div>
      </div>
      {userProfile.profileComplete && (userProfile.stepGoal || userProfile.currentSteps > 0) && (
        <ButterflyAnimation 
          type="user" 
          userCurrentSteps={userProfile.currentSteps} 
          userStepGoal={userProfile.stepGoal} 
        />
      )}
      
      <Card className="shadow-lg">
        <CardHeader>
            <CardTitle className="font-headline text-2xl">Support the Monarchs</CardTitle>
            <CardDescription>Your steps and sponsorships make a real difference for monarch butterfly conservation.</CardDescription>
        </CardHeader>
        <CardContent>
            <p className="mb-4">
                Help us plant native milkweed and restore habitats for these beautiful creatures. Every contribution counts!
            </p>
            <Button asChild size="lg">
                <a href="https://foreveryStaratree.org/donate" target="_blank" rel="noopener noreferrer">
                    <Gift className="mr-2 h-5 w-5"/> Donate to ForEveryStarATree.org
                </a>
            </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function LandingPage() {
  const [communityStats, setCommunityStats] = useState<CommunityStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const fetchLandingPageStats = useCallback(async () => {
    setStatsLoading(true);
    try {
      const stats = await getCommunityStats();
      setCommunityStats(stats);
    } catch (error) {
      console.error("Failed to fetch community stats for landing page:", error);
      setCommunityStats(null);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLandingPageStats();
  }, [fetchLandingPageStats]);

  return (
    <div className="text-center py-12 space-y-12">
      <div className="relative w-full h-72 md:h-96 rounded-xl overflow-hidden shadow-2xl">
        <Image
            src="https://placehold.co/1200x400.png"
            alt="Monarch butterflies on milkweed"
            layout="fill"
            objectFit="cover"
            data-ai-hint="monarch butterfly milkweed"
            priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col items-center justify-end p-8">
            <h1 className="font-headline text-5xl md:text-7xl font-bold text-white mb-4">
                Monarch Miles
            </h1>
            <p className="text-xl md:text-2xl text-slate-100 mb-8 max-w-3xl">
                Join the "Stepping For Monarchs" migration challenge. Track your steps, raise funds, and help save the monarch butterfly!
            </p>
        </div>
      </div>

      <div className="space-y-8 container mx-auto px-4">
        <h2 className="text-4xl font-headline text-primary">Our Community's Journey</h2>
        {statsLoading ? (
          <div className="space-y-6">
            <Skeleton className="h-56 w-full rounded-lg" />
            <Skeleton className="h-24 w-full rounded-lg" />
            <Skeleton className="h-64 w-full rounded-lg" /> 
          </div>
        ) : communityStats ? (
          <div className="space-y-6">
            <CommunityProgressCard communityStats={communityStats} />
            <ButterflyAnimation type="community" totalCommunitySteps={communityStats.totalSteps} />
            <InteractiveMap totalCommunitySteps={communityStats.totalSteps} className="mt-6" />
          </div>
        ) : (
          <Card className="text-center">
            <CardHeader><CardTitle className="font-headline">Community Progress Unavailable</CardTitle></CardHeader>
            <CardContent><p className="text-muted-foreground">Could not load community progress at this time. Please check back later.</p></CardContent>
          </Card>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-8 text-left container mx-auto px-4">
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
                <Footprints className="h-12 w-12 text-primary mb-3"/>
                <CardTitle className="font-headline">Track Your Steps</CardTitle>
            </CardHeader>
            <CardContent>
                <p>Log your daily steps and watch your progress towards your personal goal and the community's symbolic migration.</p>
            </CardContent>
        </Card>
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
                <Users className="h-12 w-12 text-primary mb-3"/>
                <CardTitle className="font-headline">Raise Awareness & Join Teams</CardTitle>
            </CardHeader>
            <CardContent>
                <p>Invite your network to sponsor your journey, join or create a team, and support ForEveryStarATree.org's conservation efforts.</p>
            </CardContent>
        </Card>
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
                <Gift className="h-12 w-12 text-primary mb-3"/>
                <CardTitle className="font-headline">Make a Difference</CardTitle>
            </CardHeader>
            <CardContent>
                <p>Funds raised help plant native milkweed, crucial for monarch survival. Your steps have a real impact!</p>
            </CardContent>
        </Card>
      </div>
      
      <Card className="shadow-lg container mx-auto px-4 py-8 bg-card">
        <CardHeader className="text-center">
            <CardTitle className="font-headline text-3xl">Support the Monarchs</CardTitle>
            <CardDescription>Your steps and sponsorships make a real difference for monarch butterfly conservation.</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
            <p className="mb-6 max-w-xl mx-auto">
                Help ForEveryStarATree.org plant native milkweed and restore vital habitats for these beautiful creatures. Every contribution counts towards their survival.
            </p>
            <Button asChild size="lg">
                <a href="https://foreveryStaratree.org/donate" target="_blank" rel="noopener noreferrer">
                    <Gift className="mr-2 h-5 w-5"/> Donate to ForEveryStarATree.org
                </a>
            </Button>
        </CardContent>
      </Card>

      <div className="space-x-4">
        <Button size="lg" asChild>
          <Link href="/signup">Get Started <ArrowRight className="ml-2 h-5 w-5"/></Link>
        </Button>
        <Button size="lg" variant="outline" asChild>
          <Link href="/login">Login</Link>
        </Button>
         <Button size="lg" variant="ghost" asChild>
          <Link href="/feed">View Full Community Feed</Link>
        </Button>
      </div>
      <p className="mt-8 text-muted-foreground">
        "Butterfly Steps" is a fundraising initiative by the nonprofit ecofarm, <a href="https://foreveryStaratree.org" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">For Every Star, A Tree</a>. It was inspired by Pollinator Partnership's Pollinator Week as well as Monarch Joint Venture's Miles for Monarchs.
      </p>
    </div>
  );
}

export default function HomePage() {
  const { user, userProfile, loading: authLoading } = useAuth();
  useAuthRedirect({ requireAuth: false });
  
  const [initialCommunityStats, setInitialCommunityStats] = useState<CommunityStats | null>(null);
  const [communityStatsLoading, setCommunityStatsLoading] = useState(true);

  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!authLoading && user && (!userProfile || !userProfile.profileComplete) && pathname !== '/profile') {
      router.push('/profile');
    }
  }, [user, userProfile, authLoading, router, pathname]);

  const fetchInitialCommunityData = useCallback(async () => {
    if (user && userProfile?.profileComplete) {
      setCommunityStatsLoading(true);
      try {
        const stats = await getCommunityStats();
        setInitialCommunityStats(stats);
      } catch (error) {
        console.error("Failed to fetch initial community stats:", error);
        setInitialCommunityStats(null);
      } finally {
        setCommunityStatsLoading(false);
      }
    } else {
      setCommunityStatsLoading(false); // No user or profile incomplete, so no specific dashboard stats to load
    }
  }, [user, userProfile?.profileComplete]);

  useEffect(() => {
    fetchInitialCommunityData();
  }, [fetchInitialCommunityData]);

  if (authLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-20rem)] text-center">
        <div className="mb-4"> <Logo /> </div>
        <p className="text-xl font-semibold text-foreground mb-2">Loading Application...</p>
        <Skeleton className="h-32 w-1/2 rounded-lg" />
      </div>
    );
  }

  if (user) {
    if (!userProfile || !userProfile.profileComplete) {
      return (
        <div className="flex flex-col justify-center items-center min-h-[calc(100vh-20rem)] text-center">
          <div className="mb-4"> <Logo /> </div>
          <p className="text-xl font-semibold text-foreground mb-2">Finalizing your setup...</p>
          <p className="text-muted-foreground">Redirecting to your profile to complete setup.</p>
          <Skeleton className="h-8 w-48 mt-4" />
        </div>
      );
    } else {
      if (communityStatsLoading && !initialCommunityStats) { 
        return (
          <div className="space-y-8">
            <CountdownTimer />
            {/* Skeleton for StreakDisplay removed as it's a modal now */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Skeleton className="h-56 w-full rounded-lg" /> 
                    <Skeleton className="h-24 w-full rounded-lg" /> 
                    <Skeleton className="h-64 w-full rounded-lg mt-6" /> 
                </div>
                <div className="space-y-6">
                    <Skeleton className="h-48 w-full rounded-lg" /> 
                    <Skeleton className="h-56 w-full rounded-lg" /> 
                </div>
            </div>
          </div>
        );
      }
      return <Dashboard userProfile={userProfile} initialCommunityStats={initialCommunityStats} />;
    }
  } else {
     return <LandingPage />;
  }
}

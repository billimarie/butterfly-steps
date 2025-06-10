'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useAuthRedirect } from '@/hooks/useAuthRedirect';
import CountdownTimer from '@/components/dashboard/CountdownTimer';
import UserProgressCard from '@/components/dashboard/UserProgressCard';
import CommunityProgressCard from '@/components/dashboard/CommunityProgressCard';
import StepSubmissionForm from '@/components/dashboard/StepSubmissionForm';
import ButterflyAnimation from '@/components/dashboard/ButterflyAnimation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { getCommunityStats } from '@/lib/firebaseService';
import type { CommunityStats, UserProfile } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Footprints, Users, Gift } from 'lucide-react';


function Dashboard({ userProfile, initialCommunityStats }: { userProfile: UserProfile, initialCommunityStats: CommunityStats | null }) {
  const [communityStats, setCommunityStats] = useState<CommunityStats | null>(initialCommunityStats);

  const refreshDashboardData = useCallback(async () => {
    // User profile is managed by AuthContext, this will refresh community stats
    // And could potentially re-fetch user profile if AuthContext's fetchUserProfile is called
    const stats = await getCommunityStats();
    setCommunityStats(stats);
    // To refresh user stats, you might need to call fetchUserProfile from useAuth() here if not automatically updated.
    // For now, AuthContext handles userProfile state, and this function updates community stats.
  }, []);

  useEffect(() => {
    refreshDashboardData(); // Initial fetch and for subsequent programmatic refreshes
  }, [refreshDashboardData]);

  const userProgress = userProfile.stepGoal ? (userProfile.currentSteps / userProfile.stepGoal) * 100 : 0;
  const communityProgress = communityStats ? (communityStats.totalSteps / 3_600_000) * 100 : 0;

  return (
    <div className="space-y-8">
      <CountdownTimer />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <CommunityProgressCard communityStats={communityStats} />
           {communityStats && <ButterflyAnimation progress={communityProgress} type="community" />}
        </div>
        <div className="space-y-6">
          <UserProgressCard userProfile={userProfile} />
          <StepSubmissionForm onStepSubmit={refreshDashboardData} />
        </div>
      </div>
      {userProfile.profileComplete && <ButterflyAnimation progress={userProgress} type="user" />}
      
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
  return (
    <div className="text-center py-12">
      <div className="relative w-full h-72 md:h-96 rounded-xl overflow-hidden shadow-2xl mb-12">
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

      <div className="grid md:grid-cols-3 gap-8 mb-12 text-left">
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
                <CardTitle className="font-headline">Raise Awareness</CardTitle>
            </CardHeader>
            <CardContent>
                <p>Invite your network to sponsor your journey and support ForEveryStarATree.org's conservation efforts.</p>
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

      <div className="space-x-4">
        <Button size="lg" asChild>
          <Link href="/signup">Get Started <ArrowRight className="ml-2 h-5 w-5"/></Link>
        </Button>
        <Button size="lg" variant="outline" asChild>
          <Link href="/login">Login</Link>
        </Button>
      </div>
      <p className="mt-8 text-muted-foreground">
        A fundraising initiative by <a href="https://foreveryStaratree.org" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">ForEveryStarATree.org</a>.
      </p>
    </div>
  );
}

export default function HomePage() {
  const { user, userProfile, loading } = useAuth();
  // This hook handles redirection logic
  useAuthRedirect({ requireAuth: false }); // Allow access for non-authed users to see LandingPage
  
  const [initialCommunityStats, setInitialCommunityStats] = useState<CommunityStats | null>(null);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    async function fetchInitialData() {
      try {
        const stats = await getCommunityStats();
        setInitialCommunityStats(stats);
      } catch (error) {
        console.error("Failed to fetch initial community stats:", error);
      } finally {
        setDataLoading(false);
      }
    }
    if (user && userProfile?.profileComplete) { // Only fetch if user is likely to see dashboard
        fetchInitialData();
    } else {
        setDataLoading(false); // No data needed for landing page
    }
  }, [user, userProfile?.profileComplete]);


  if (loading || (user && userProfile?.profileComplete && dataLoading)) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-40 w-full rounded-lg" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64 w-full rounded-lg" />
            <Skeleton className="h-32 w-full rounded-lg" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-48 w-full rounded-lg" />
            <Skeleton className="h-56 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (user && userProfile?.profileComplete) {
    return <Dashboard userProfile={userProfile} initialCommunityStats={initialCommunityStats} />;
  }

  // If user exists but profile is not complete, useAuthRedirect will handle redirection to /profile.
  // So, if we reach here and user is not null, it means redirection is about to happen or profile is incomplete.
  // The landing page should show if no user or if user exists but profile not complete (before redirect).
  // However, useAuthRedirect should have already pushed to /profile if needed.
  // This ensures LandingPage is shown only if truly not authenticated.
  if (!user) {
     return <LandingPage />;
  }
  
  // Fallback for cases where user exists, but profile might be in an intermediate state before redirect
  // or if logic in useAuthRedirect needs a cycle. Displaying a loader here is safer.
  return (
    <div className="flex justify-center items-center h-64">
        <Skeleton className="h-32 w-1/2 rounded-lg" />
    </div>
  );
}

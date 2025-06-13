
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
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { getCommunityStats, getUserDailySteps } from '@/lib/firebaseService';
import type { CommunityStats, UserProfile, DailyStep } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Footprints, Users, Gift } from 'lucide-react';
import Logo from '@/components/ui/Logo';
import DailyStepChart from '@/components/profile/DailyStepChart';


function Dashboard({ userProfile, initialCommunityStats }: { userProfile: UserProfile, initialCommunityStats: CommunityStats | null }) {
  const [communityStats, setCommunityStats] = useState<CommunityStats | null>(initialCommunityStats);
  const { fetchUserProfile: refreshAuthUserProfile } = useAuth(); // Renamed to avoid conflict
  const [dailyStepsData, setDailyStepsData] = useState<DailyStep[]>([]);
  const [isLoadingChart, setIsLoadingChart] = useState(true);

  const refreshDashboardData = useCallback(async () => {
    const stats = await getCommunityStats();
    setCommunityStats(stats);
    if (userProfile?.uid) {
      await refreshAuthUserProfile(userProfile.uid, false); 
    }
  }, [userProfile?.uid, refreshAuthUserProfile]);

  const fetchChartData = useCallback(async () => {
    if (userProfile?.uid) {
      setIsLoadingChart(true);
      try {
        const data = await getUserDailySteps(userProfile.uid, 30); // Get last 30 days
        setDailyStepsData(data);
      } catch (error) {
        console.error("Failed to fetch daily steps data for chart:", error);
      } finally {
        setIsLoadingChart(false);
      }
    } else {
      setDailyStepsData([]);
      setIsLoadingChart(false);
    }
  }, [userProfile?.uid]);

  useEffect(() => {
    fetchChartData();
  }, [fetchChartData]);

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
      
        
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

        <div className="space-y-6">
          <StepSubmissionForm onStepSubmit={refreshDashboardData} />
          <UserProgressCard userProfile={userProfile} />
        </div>

        <div className="">
          {userProfile && (
            <DailyStepChart 
              dailyStepsData={dailyStepsData} 
              isLoading={isLoadingChart} 
              userProfile={userProfile} 
            />
          )}
        </div>

      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-2">
          {userProfile.profileComplete && (userProfile.stepGoal || userProfile.currentSteps > 0) && (
            <ButterflyAnimation 
              type="user" 
              userCurrentSteps={userProfile.currentSteps} 
              userStepGoal={userProfile.stepGoal} 
            />
          )}

           {communityStats && <InteractiveMap totalCommunitySteps={communityStats.totalSteps} className="mt-6" />}
        </div>
        <div className="">
          <CommunityProgressCard communityStats={communityStats} />
        </div>
      </div>

      
      
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
    <div className="text-center pb-12 space-y-12">
      <div className="relative w-full h-auto justify-center items-center flex mb-12">
        <div className="mx-auto p-8 relative z-10 my-12 md:my-24">
            <h1 className="text-5xl p-4 text-center font-bold from-orange-700 to-amber-400 bg-gradient-to-r bg-clip-text text-transparent
             font-headline md:text-7xl font-bold my-4">
                Butterfly Steps
            </h1>
            <p className="text-xl md:text-2xl mb-16 max-w-3xl text-neutral-600 mx-auto">
                A "step challenge" to help save<br />the western Monarch Butterfly
            </p>
            <div className="space-y-4 md:space-y-0 md:space-x-8">
              <Button size="lg" asChild>
                <Link href="/signup">Join Us <ArrowRight className="ml-2 h-5 w-5"/></Link>
              </Button>
              <Button size="lg" variant="ghost" asChild>
                <Link href="/feed">See Our Migration Walk <img src="https://res.cloudinary.com/djrhjkkvm/image/upload/v1749691114/Cartoons/catti-the-caterpillar_b9skmk.png" className="w-12 ml-2" alt="Catti the Caterpillar" /></Link>
              </Button>
            </div>
        </div>

        <div className="stage absolute">
          <div className="mariposa">
            <div className="mariposa-turn">
              <div className="mariposa-flutter"></div>
            </div>
          </div>

          <div className="mariposa">
            <div className="mariposa-turn">
              <div className="mariposa-flutter"></div>
            </div>
          </div>

          <div className="mariposa">
            <div className="mariposa-turn">
              <div className="mariposa-flutter"></div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 -mt-8 mb-12"> {/* Adjusted margin for countdown */}
        <CountdownTimer />
      </div>

      <div className="gap-8 text-left container mx-auto px-4 pb-12 mb-6">
        <Card className="shadow-lg container mx-auto px-4 py-8 bg-card">
          <CardHeader>
              <CardTitle className="font-headline text-2xl">What is the "Butterfly Steps" challenge?</CardTitle>
              <CardDescription>Let's step it up for butterflies!</CardDescription>
          </CardHeader>
          <CardContent>
              <p className="mb-4">Since 2000, butterflies have declined by 22%.<sup>1</sup></p>
              <p className="mb-4">That's why we're hosting our first "Butterfly Steps" challenge: to "step" together and help grow desertified land into thriving Butterfly Habitats.</p>
              <p className="mb-4">Our goal is <strong>3,600,000</strong> steps. Here's why: our <a href="https://foreverystaratree.org" target="_blank" className="underline">nonprofit ecofarm</a> is located in the Mojave Desert&mdash;one of the hottest, most uninhabitable places on Earth.</p>
              <p className="mb-4"><strong>It would take you 3.6 million steps</strong> to walk from our ecofarm in the Mojave Desert to the lush, biodiverse Butterfly Sanctuaries near Mexico City.</p>
              <p className="mb-4">...and that's not even <em>half</em> of the western Monarch Butterfly's migration journey!</p>
              <p className="mb-4">In honor of their annual migration this October, we're matching the Monarch's journey over the summer&mdash;when school is out.</p>
              <p className="mb-4">Sign up, log your steps every day, and help us reach 3.6 million steps by Halloween!
              </p>
              <Button size="lg" className="mt-10 mx-auto text-center flex w-full md:w-auto">
                <Link href="/signup" className="inline-flex">Log Your Steps <Footprints className="ml-2 h-5 w-5" /></Link>
              </Button>
          </CardContent>
        </Card>
      </div>

      <div className="p-8 space-y-8 container mx-auto px-4">
        <CommunityProgressCard communityStats={communityStats} />
      </div>

      <div className="p-8 space-y-8 container mx-auto px-4">
        <h2 className="text-4xl font-headline text-primary">Our Migration</h2>
        {statsLoading ? (
          <div className="space-y-6">
            <Skeleton className="h-56 w-full rounded-lg" />
            <Skeleton className="h-24 w-full rounded-lg" />
            <Skeleton className="h-64 w-full rounded-lg" /> 
          </div>
        ) : communityStats ? (
          <div className="space-y-6">
            <InteractiveMap totalCommunitySteps={communityStats.totalSteps} className="mt-6" />
            <ButterflyAnimation type="community" totalCommunitySteps={communityStats.totalSteps} />
          </div>
        ) : (
          <Card className="text-center">
            <CardHeader><CardTitle className="font-headline">Community Progress Unavailable</CardTitle></CardHeader>
            <CardContent><p className="text-muted-foreground">Could not load community progress at this time. Please check back later.</p></CardContent>
          </Card>
        )}
      </div>
      
      <div className="grid md:grid-cols-3 gap-8 text-left container mx-auto px-4 pb-12 mb-6">
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
                <Footprints className="h-12 w-12 text-primary mb-3"/>
                <CardTitle className="font-headline">Track Your Steps</CardTitle>
            </CardHeader>
            <CardContent>
                <p>"Step" closer to your personal goal as we embark on a symbolic migration&mdash;together.</p>
            </CardContent>
        </Card>
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
                <Users className="h-12 w-12 text-primary mb-3"/>
                <CardTitle className="font-headline">Join A Team</CardTitle>
            </CardHeader>
            <CardContent>
                <p>Log your daily steps with your friends! You can create your own team, or join an existing one.</p>
            </CardContent>
        </Card>
        <Card className="shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
                <Gift className="h-12 w-12 text-primary mb-3"/>
                <CardTitle className="font-headline">1 Step Raises $1</CardTitle>
            </CardHeader>
            <CardContent>
                <p>Your steps have a <strong>real</strong> impact. In 2024, we raised enough funds to plant a quarter-acre Butterfly Garden!</p>
            </CardContent>
        </Card>
      </div>

      <div className="gap-8 text-left container mx-auto px-4 pb-12 mb-6">
        <Card className="shadow-lg container mx-auto px-4 py-8 bg-card">
          <CardHeader>
              <CardTitle className="font-headline text-2xl">Support the Monarchs</CardTitle>
              <CardDescription>Every Step Counts!</CardDescription>
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

      <p className="mt-8 text-muted-foreground">
        <sup>1</sup> <a href="https://www.xerces.org/press/study-finds-that-us-butterfly-populations-are-severely-declining" target="_blank">Since 2000, butterflies have declined by 22%.</a>
      </p>
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
    if (!authLoading && user && (!userProfile || !userProfile.profileComplete) && pathname !== '/profile' && !pathname.startsWith('/profile/')) { // Adjusted condition for dynamic profile routes
      router.push(`/profile/${user.uid}?setup=true`); // Redirect to specific profile page
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
      setCommunityStatsLoading(false); 
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
            <Skeleton className="h-56 w-full rounded-lg" />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Skeleton className="h-56 w-full rounded-lg" /> 
                    <Skeleton className="h-24 w-full rounded-lg" /> 
                    <Skeleton className="h-64 w-full rounded-lg mt-6" /> 
                </div>
                <div className="space-y-6">
                    <Skeleton className="h-48 w-full rounded-lg" /> 
                    <Skeleton className="h-80 w-full rounded-lg" /> {/* Placeholder for DailyStepChart */}
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

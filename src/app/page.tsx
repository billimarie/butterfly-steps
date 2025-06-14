
'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useAuthRedirect } from '@/hooks/useAuthRedirect';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { getCommunityStats } from '@/lib/firebaseService';
import type { CommunityStats, UserProfile } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';
import Logo from '@/components/ui/Logo';
import { ArrowRight, Footprints, Users, Gift } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import UserDashboardTabContent from '@/components/dashboard/UserDashboardTabContent';
import CommunityFeedTabContent from '@/components/feed/CommunityFeedTabContent';
import CountdownTimer from '@/components/dashboard/CountdownTimer';
import InteractiveMap from '@/components/dashboard/InteractiveMap';
import ButterflyAnimation from '@/components/dashboard/ButterflyAnimation';
import CommunityProgressCard from '@/components/dashboard/CommunityProgressCard';
import { auth } from '@/lib/firebase'; // Added auth import


function LandingPage() {
  const [communityStats, setCommunityStats] = useState<CommunityStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const fetchLandingPageStats = useCallback(async () => {
    setStatsLoading(true);
    if (auth.currentUser) {
        try {
            const stats = await getCommunityStats();
            setCommunityStats(stats);
        } catch (error) {
            console.error("Failed to fetch community stats for landing page:", error);
            setCommunityStats(null);
        } finally {
            setStatsLoading(false);
        }
    } else {
        setCommunityStats(null);
        setStatsLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(user => {
      fetchLandingPageStats();
    });
    fetchLandingPageStats();
    return () => unsubscribe();
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
                <Link href="/#community-landing">See Our Migration Walk <img src="https://res.cloudinary.com/djrhjkkvm/image/upload/v1749691114/Cartoons/catti-the-caterpillar_b9skmk.png" className="w-12 ml-2" alt="Catti the Caterpillar" /></Link>
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

      <div className="container mx-auto px-4 -mt-8 mb-12">
        <CountdownTimer />
      </div>

      <div className="gap-8 text-left container mx-auto px-4 mb-6">
        <Card className="shadow-lg container mx-auto px-4 py-8 bg-card">
          <CardHeader className="text-left">
              <CardTitle className="font-headline text-2xl">What's the "Butterfly Steps" challenge?</CardTitle>
              <CardDescription>An annual step-a-thon, mimicking the western Monarch butterfly's migration</CardDescription>
          </CardHeader>
          <CardContent className="text-left">
              <p className="mb-4">Since 2000, butterflies have declined by 22%.<sup>1</sup></p>
              <p className="mb-4">That's why we're hosting our first <strong>Butterfly Steps</strong> challenge:</p>
              <p className="mb-4">To help grow Butterfly Habitats and grow desertified land into thriving Butterfly Habitats.</p>
              <p className="mb-4 text-center">*</p>
              <p className="mb-4">Our goal is to reach <strong>3,600,000</strong> steps by Halloween. Here's why:</p>
              <p className="mb-4"><a href="https://foreverystaratree.org" target="_blank" className="underline">Our Butterfly Habitat</a> is located in the Mojave Desert&mdash;one of the hottest, most uninhabitable places on Earth.</p>
              <p className="mb-4"><strong>It would take you 3.6 million steps</strong> to walk from our ecofarm, all the way to the lush Butterfly Sanctuaries near Mexico City.</p>
              <p className="mb-4">...and that's not even <em>half</em> of the Monarch's annual journey!</p>
              <p className="mb-4">In honor of their annual migration in October, we're matching the Monarch's journey&mdash;and asking you to "step" with us!</p>
              <p className="mb-4">Sign up, log your steps, and help us complete our symbolic migration by Halloween.
              </p>
              <Button size="lg" className="mt-10 mx-auto text-center flex w-full md:w-auto">
                <Link href="/signup" className="inline-flex">Log Your Steps <Footprints className="ml-2 h-5 w-5" /></Link>
              </Button>
          </CardContent>
        </Card>
      </div>

    {communityStats && (
      <>
        <div id="community-landing" className="p-8 space-y-8 container mx-auto px-4">
          <CommunityProgressCard communityStats={communityStats} />
        </div>

        <div className="p-8 space-y-8 container mx-auto px-4">
          <h2 className="text-4xl font-headline text-primary text-center">Our Migration</h2>
          <div className="space-y-6">
            <InteractiveMap totalCommunitySteps={communityStats.totalSteps} className="mt-6" />
            <ButterflyAnimation type="community" totalCommunitySteps={communityStats.totalSteps} />
          </div>
        </div>
      </>
    )}

      <div className="grid md:grid-cols-3 gap-8 text-left container mx-auto px-4 pb-12 mb-6">
        <Link href="/signup" className="block h-full transition-all duration-200 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg">
          <Card className="shadow-lg hover:shadow-xl transition-shadow h-full cursor-pointer">
              <CardHeader className="text-left">
                  <Footprints className="h-12 w-12 text-primary mb-3"/>
                  <CardTitle className="font-headline">Track Your Steps</CardTitle>
              </CardHeader>
              <CardContent className="text-left">
                  <p>"Step" closer to your personal goal as we embark on a symbolic migration&mdash;together.</p>
              </CardContent>
          </Card>
        </Link>
        <Link href="/teams" className="block h-full transition-all duration-200 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg">
          <Card className="shadow-lg hover:shadow-xl transition-shadow h-full cursor-pointer">
              <CardHeader className="text-left">
                  <Users className="h-12 w-12 text-primary mb-3"/>
                  <CardTitle className="font-headline">Join A Team</CardTitle>
              </CardHeader>
              <CardContent className="text-left">
                  <p>Log your daily steps with your friends! You can create your own team, or join an existing one.</p>
              </CardContent>
          </Card>
        </Link>
        <Link href="/donate" className="block h-full transition-all duration-200 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg">
          <Card className="shadow-lg hover:shadow-xl transition-shadow h-full cursor-pointer">
              <CardHeader className="text-left">
                  <Gift className="h-12 w-12 text-primary mb-3"/>
                  <CardTitle className="font-headline">1 Step Raises $1</CardTitle>
              </CardHeader>
              <CardContent className="text-left">
                  <p>Your steps have a <strong>real</strong> impact. In 2024, we raised enough funds to plant a quarter-acre Butterfly Habitat! We're looking for corporate sponsors to turn your steps into dollars for our cause.</p>
              </CardContent>
          </Card>
        </Link>
      </div>

      <div className="container mx-auto px-4 pb-12 mb-6">
        <div className="rounded-xl p-8 md:p-12 text-center shadow-2xl text-white bg-slate-800">
          <Gift className="mx-auto h-16 w-16 mb-6 text-white" />
          <h2 className="text-4xl font-headline font-bold mb-4">
            Help Monarchs Take Flight
          </h2>
          <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto">
            Your donation directly helps us plant native milkweed at our nonprofit ecofarm. Let's grow desertified land into biodiverse Butterfly Habitats.
          </p>
          <Button
            asChild
            size="lg"
            className="bg-white text-orange-600 hover:bg-orange-50 px-4 py-2 py-3 px-8 transition-all duration-300 transform hover:scale-105"
          >
            <a href="https://foreverystaratree.org/donate.html" target="_blank" rel="noopener noreferrer">
              Make a Difference
            </a>
          </Button>
        </div>
      </div>

      <p className="mt-8 text-muted-foreground">
        <sup>1</sup> <a href="https://www.xerces.org/press/study-finds-that-us-butterfly-populations-are-severely-declining" target="_blank">Since 2000, butterflies have declined by 22%.</a>
      </p>
      <p className="mt-8 text-muted-foreground">
        "Butterfly Steps" is a fundraising initiative by the nonprofit ecofarm, <a href="https://foreveryStaratree.org" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">For Every Star, A Tree</a>. It was inspired by Pollinator Partnership's Pollinator Week as well as Monarch Joint Venture's Miles for Monarchs. Developed via vibe coding by <a href="https://linkedin.com/in/billimarie" target="_blank" className="text-primary hover:underline">Billimarie</a>.
      </p>
    </div>
  );
}


function AuthenticatedHomepageContent() {
  const { user, userProfile, loading: authLoading, recordSectionVisit } = useAuth();
  const [initialCommunityStats, setInitialCommunityStats] = useState<CommunityStats | null>(null);
  const [communityStatsLoading, setCommunityStatsLoading] = useState(true);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTabQueryParam = searchParams.get('tab');
  const initialTab = currentTabQueryParam === 'community' ? 'community' : 'dashboard';


  useEffect(() => {
    if (!authLoading && user && (!userProfile || !userProfile.profileComplete) && pathname !== '/profile' && !pathname.startsWith('/profile/')) {
      router.push(`/profile/${user.uid}?setup=true`);
    }
  }, [user, userProfile, authLoading, router, pathname]);

  const fetchDashboardCommunityData = useCallback(async () => {
    if (user && userProfile?.profileComplete) {
      setCommunityStatsLoading(true);
      try {
        const stats = await getCommunityStats();
        setInitialCommunityStats(stats);
      } catch (error) {
        console.error("Failed to fetch initial community stats for dashboard tab:", error);
        setInitialCommunityStats(null);
      } finally {
        setCommunityStatsLoading(false);
      }
    } else {
      setCommunityStatsLoading(false);
    }
  }, [user, userProfile?.profileComplete]);

  useEffect(() => {
    fetchDashboardCommunityData();
  }, [fetchDashboardCommunityData]);

  useEffect(() => {
    if (userProfile?.profileComplete) {
      if (initialTab === 'dashboard') {
        recordSectionVisit('dashboard');
      } else if (initialTab === 'community') {
        recordSectionVisit('community');
      }
    }
  }, [initialTab, userProfile, recordSectionVisit]);

  const handleTabChange = (tabValue: string) => {
    if (userProfile?.profileComplete) {
      if (tabValue === 'dashboard') {
        recordSectionVisit('dashboard');
      } else if (tabValue === 'community') {
        recordSectionVisit('community');
      }
    }
    // Update URL query param for tab persistence
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    current.set('tab', tabValue);
    const search = current.toString();
    const query = search ? `?${search}` : "";
    router.replace(`${pathname}${query}`, { scroll: false }); // Use replace to avoid pushing to history for tab changes
  };


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
      // Logged-in, profile complete view with TABS
      return (
        <Tabs key={initialTab} defaultValue={initialTab} onValueChange={handleTabChange} className="w-full space-y-4">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="community">Community</TabsTrigger>
          </TabsList>
          <TabsContent value="dashboard">
            {communityStatsLoading && !initialCommunityStats ? (
              <div className="space-y-8 mt-4">
                <Skeleton className="h-24 w-full rounded-lg" />
                <Skeleton className="h-56 w-full rounded-lg" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-6">
                    <Skeleton className="h-56 w-full rounded-lg" />
                    <Skeleton className="h-24 w-full rounded-lg" />
                    <Skeleton className="h-64 w-full rounded-lg mt-6" />
                  </div>
                  <div className="space-y-6">
                    <Skeleton className="h-48 w-full rounded-lg" />
                    <Skeleton className="h-80 w-full rounded-lg" />
                  </div>
                </div>
              </div>
            ) : (
              <UserDashboardTabContent userProfile={userProfile} initialCommunityStats={initialCommunityStats} />
            )}
          </TabsContent>
          <TabsContent value="community">
            <CommunityFeedTabContent />
          </TabsContent>
        </Tabs>
      );
    }
  } else {
     return <LandingPage />;
  }
}


export default function HomePage() {
  useAuthRedirect({ requireAuth: false });
  return (
    <Suspense fallback={
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-20rem)] text-center">
        <div className="mb-4"> <Logo /> </div>
        <p className="text-xl font-semibold text-foreground mb-2">Loading Page...</p>
        <Skeleton className="h-32 w-1/2 rounded-lg" />
      </div>
    }>
      <AuthenticatedHomepageContent />
    </Suspense>
  );
}


'use client';

import { useState, useEffect, useCallback } from 'react';
import type { UserProfile, CommunityStats, DailyStep } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { getUserDailySteps, getCommunityStats } from '@/lib/firebaseService';
import CountdownTimer from '@/components/dashboard/CountdownTimer';
import UserProgressCard from '@/components/dashboard/UserProgressCard';
import CommunityProgressCard from '@/components/dashboard/CommunityProgressCard';
import StepSubmissionForm from '@/components/dashboard/StepSubmissionForm';
import ButterflyAnimation from '@/components/dashboard/ButterflyAnimation';
import InteractiveMap from '@/components/dashboard/InteractiveMap';
import DailyStepChart from '@/components/profile/DailyStepChart';
import { Button } from '@/components/ui/button';
import { Gift } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';


interface UserDashboardTabContentProps {
  userProfile: UserProfile;
  initialCommunityStats: CommunityStats | null;
}

export default function UserDashboardTabContent({ userProfile, initialCommunityStats: propagatedCommunityStats }: UserDashboardTabContentProps) {
  const [dailyStepsData, setDailyStepsData] = useState<DailyStep[]>([]);
  const [isLoadingChart, setIsLoadingChart] = useState(true);
  const [currentCommunityStats, setCurrentCommunityStats] = useState<CommunityStats | null>(propagatedCommunityStats);
  const { fetchUserProfile: refreshAuthUserProfile } = useAuth();

  const refreshDashboardLocalData = useCallback(async () => {
    console.log('[UserDashboardTabContent] refreshDashboardLocalData called');
    const stats = await getCommunityStats();
    setCurrentCommunityStats(stats);
    if (userProfile?.uid) {
      // Requesting a refresh of the auth context's userProfile
      await refreshAuthUserProfile(userProfile.uid, false); 
    }
  }, [userProfile?.uid, refreshAuthUserProfile]);

  // Effect to fetch chart data when userProfile.uid or userProfile.currentSteps changes
  useEffect(() => {
    const doFetchChartData = async () => {
      if (userProfile?.uid) {
        setIsLoadingChart(true);
        console.log(`[UserDashboardTabContent] useEffect (for chart) triggered. Fetching chart data for UID: ${userProfile.uid}, currentSteps: ${userProfile.currentSteps}`);
        try {
          const data = await getUserDailySteps(userProfile.uid, 30);
          console.log('[UserDashboardTabContent] Data from getUserDailySteps:', JSON.stringify(data, null, 2));
          setDailyStepsData(data);
        } catch (error) {
          console.error("[UserDashboardTabContent] Failed to fetch daily steps data for chart:", error);
          setDailyStepsData([]); 
        } finally {
          setIsLoadingChart(false);
        }
      } else {
        console.log('[UserDashboardTabContent] useEffect (for chart) - no userProfile.uid, clearing chart data.');
        setDailyStepsData([]);
        setIsLoadingChart(false);
      }
    };

    doFetchChartData();
  }, [userProfile?.uid, userProfile?.currentSteps]); // Dependency on currentSteps to refetch after submission


  useEffect(() => {
    setCurrentCommunityStats(propagatedCommunityStats);
  }, [propagatedCommunityStats]);


  return (
    <div className="space-y-8 py-4">
      <CountdownTimer />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <StepSubmissionForm onStepSubmit={refreshDashboardLocalData} />
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
      
    </div>
  );
}

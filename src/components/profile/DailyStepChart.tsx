
'use client';

import { TrendingUp, Footprints, Target, Users } from 'lucide-react';
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import type { DailyStep, UserProfile } from '@/types';
import { useMemo } from 'react';
import { CHALLENGE_DURATION_DAYS } from '@/types';


interface DailyStepChartProps {
  dailyStepsData: DailyStep[];
  isLoading: boolean;
  userProfile?: UserProfile | null; // Optional for community chart
  chartType?: 'user' | 'community'; // To differentiate chart purpose
}

const baseChartConfig = {
  loggedSteps: {
    label: 'Logged Steps',
    icon: Footprints,
  },
} satisfies ChartConfig;


export default function DailyStepChart({
  dailyStepsData,
  isLoading,
  userProfile,
  chartType = 'user',
}: DailyStepChartProps) {
  console.log(`[DailyStepChart] Rendering. Type: ${chartType}. Received dailyStepsData prop:`, JSON.stringify(dailyStepsData, null, 2).substring(0, 200) + "...");
  console.log(`[DailyStepChart] isLoading: ${isLoading}, userProfile UID: ${userProfile?.uid}`);

  const chartConfig = useMemo(() => {
    const config: ChartConfig = {
        loggedSteps: {
            ...baseChartConfig.loggedSteps,
            color: chartType === 'user' ? 'hsl(var(--primary))' : 'hsl(var(--accent))', // Different color for community
        }
    };
    if (chartType === 'user' && userProfile?.stepGoal && userProfile.stepGoal > 0) {
      config.remainingToGoal = {
        label: 'Remaining to Daily Goal',
        color: 'hsl(var(--muted))',
        icon: Target,
      };
    }
    return config;
  }, [chartType, userProfile?.stepGoal]);


  const formattedData = useMemo(() => {
    console.log(`[DailyStepChart useMemo ${chartType}] Calculating formattedData. Input dailyStepsData:`, JSON.stringify(dailyStepsData, null, 2).substring(0, 200) + "...");
    
    const dailyCalculatedGoal = (chartType === 'user' && userProfile?.stepGoal && userProfile.stepGoal > 0)
      ? userProfile.stepGoal / CHALLENGE_DURATION_DAYS
      : 0;

    const result = dailyStepsData.map((item, index) => {
      const logged = item.steps;
      let remaining = 0;
      if (chartType === 'user' && dailyCalculatedGoal > 0) {
        remaining = dailyCalculatedGoal > logged ? Math.max(0, dailyCalculatedGoal - logged) : 0;
      }
      
      const dateParts = item.date.split('-'); 
      const displayDateObj = new Date(Number(dateParts[0]), Number(dateParts[1]) - 1, Number(dateParts[2]));
      const displayDateStr = displayDateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      
      console.log(`[DailyStepChart useMemo ${chartType} item ${index}] original date: ${item.date}, displayDateStr: ${displayDateStr}, logged: ${logged}, remaining: ${Math.round(remaining)}, dailyCalculatedGoal: ${Math.round(dailyCalculatedGoal)}`);

      return {
        date: item.date, 
        displayDate: displayDateStr,
        loggedSteps: logged,
        remainingToGoal: chartType === 'user' ? Math.round(remaining) : undefined, // Only for user chart
        dailyCalculatedGoal: chartType === 'user' ? Math.round(dailyCalculatedGoal) : undefined, // Only for user chart
      };
    });
    console.log(`[DailyStepChart useMemo ${chartType}] Output formattedData:`, JSON.stringify(result, null, 2).substring(0,200) + "...");
    return result;
  }, [dailyStepsData, userProfile?.stepGoal, chartType]);

  const dailyGoalValueForTitle = (chartType === 'user' && userProfile?.stepGoal && userProfile.stepGoal > 0)
    ? Math.round(userProfile.stepGoal / CHALLENGE_DURATION_DAYS)
    : 0;
    
  const cardTitle = chartType === 'user' ? 'Your Daily Steps' : 'Community Daily Steps';
  const CardIcon = chartType === 'user' ? TrendingUp : Users;
  const cardDescription = chartType === 'user' 
    ? `Visualize your daily steps.${dailyGoalValueForTitle > 0 ? ` Your calculated daily target is approx. ${dailyGoalValueForTitle.toLocaleString()} steps.` : ''}`
    : 'See the collective daily steps of our community.';


  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-xl flex items-center">
            <CardIcon className="mr-2 h-5 w-5 text-primary" />
            {cardTitle}
          </CardTitle>
          <CardDescription>Loading step history...</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  if (!dailyStepsData || dailyStepsData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-xl flex items-center">
            <CardIcon className="mr-2 h-5 w-5 text-primary" />
            {cardTitle}
          </CardTitle>
          <CardDescription>
            {chartType === 'user' ? 'Keep logging steps to see your progress here!' : 'No community step data recorded yet.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">
            {chartType === 'user' ? 'No step data recorded yet.' : 'Community steps will appear here as they are logged.'}
          </p>
        </CardContent>
      </Card>
    );
  }


  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-xl flex items-center">
          <CardIcon className="mr-2 h-5 w-5 text-primary" />
          {cardTitle}
        </CardTitle>
        <CardDescription>
          {cardDescription}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={formattedData}
              margin={{
                top: 5,
                right: 20,
                left: -10, 
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="displayDate"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                fontSize={12}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                fontSize={12}
                width={50} 
                tickFormatter={(value) => (value >= 1000 ? `${value / 1000}k` : value.toString())}
              />
              <ChartTooltip
                cursor={true}
                content={
                  <ChartTooltipContent
                    indicator="dot" 
                    labelFormatter={(label, entries) => {
                       if (!entries || entries.length === 0) return label; 
                       const originalPayload = entries[0].payload;
                       const dateStr = originalPayload.date; 
                       const dailyGoal = originalPayload.dailyCalculatedGoal; // Only present for user chart

                       const dateParts = dateStr.split('-');
                       const tempDate = new Date(Number(dateParts[0]), Number(dateParts[1]) - 1, Number(dateParts[2]));
                       const formattedDate = tempDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });

                       if (chartType === 'user' && dailyGoal && dailyGoal > 0) {
                         return `${formattedDate} (Target: ${dailyGoal.toLocaleString()})`;
                       }
                       return formattedDate;
                    }}
                  />
                }
              />
              <Legend />
              <Bar dataKey="loggedSteps" stackId="a" name={chartConfig.loggedSteps.label} fill={`var(--color-loggedSteps)`} radius={[0, 0, 0, 0]} />
              { chartType === 'user' && dailyGoalValueForTitle > 0 && chartConfig.remainingToGoal && (
                <Bar dataKey="remainingToGoal" stackId="a" name={chartConfig.remainingToGoal.label} fill="var(--color-remainingToGoal)" radius={[4, 4, 0, 0]} />
              )}
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

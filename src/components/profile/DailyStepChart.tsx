
'use client';

import { TrendingUp, Footprints, Target } from 'lucide-react';
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import type { DailyStep, UserProfile } from '@/types';
import { useMemo } from 'react';

interface DailyStepChartProps {
  dailyStepsData: DailyStep[];
  isLoading: boolean;
  userProfile: UserProfile | null;
}

const CHALLENGE_DURATION_DAYS = 133; // June 21 to Oct 31

const chartConfig = {
  loggedSteps: {
    label: 'Logged Steps',
    color: 'hsl(var(--primary))',
    icon: Footprints,
  },
  remainingToGoal: {
    label: 'Remaining to Daily Goal',
    color: 'hsl(var(--muted))',
    icon: Target,
  },
} satisfies ChartConfig;

export default function DailyStepChart({ dailyStepsData, isLoading, userProfile }: DailyStepChartProps) {
  const formattedData = useMemo(() => {
    const dailyCalculatedGoal = (userProfile?.stepGoal && userProfile.stepGoal > 0)
      ? userProfile.stepGoal / CHALLENGE_DURATION_DAYS
      : 0;

    return dailyStepsData.map(item => {
      const logged = item.steps;
      const remaining = dailyCalculatedGoal > logged ? Math.max(0, dailyCalculatedGoal - logged) : 0;
      
      return {
        date: item.date, // Original date "YYYY-MM-DD"
        displayDate: new Date(item.date + 'T00:00:00Z').toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        loggedSteps: logged,
        remainingToGoal: remaining,
        dailyCalculatedGoal: Math.round(dailyCalculatedGoal), // For tooltip
      };
    });
  }, [dailyStepsData, userProfile?.stepGoal]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-xl flex items-center">
            <TrendingUp className="mr-2 h-5 w-5 text-primary" />
            Your Daily Steps
          </CardTitle>
          <CardDescription>Loading your step history...</CardDescription>
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
            <TrendingUp className="mr-2 h-5 w-5 text-primary" />
            Your Daily Steps
          </CardTitle>
          <CardDescription>Keep logging steps to see your progress here!</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center">
          <p className="text-muted-foreground">No step data recorded yet.</p>
        </CardContent>
      </Card>
    );
  }

  const dailyGoalValueForTitle = (userProfile?.stepGoal && userProfile.stepGoal > 0) 
    ? Math.round(userProfile.stepGoal / CHALLENGE_DURATION_DAYS) 
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-xl flex items-center">
          <TrendingUp className="mr-2 h-5 w-5 text-primary" />
          Your Daily Steps
        </CardTitle>
        <CardDescription>
          Visualize your daily steps.
          {dailyGoalValueForTitle > 0 && ` Your calculated daily target is approx. ${dailyGoalValueForTitle.toLocaleString()} steps.`}
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
                tickFormatter={(value) => (value > 1000 ? `${value / 1000}k` : value.toString())}
              />
              <ChartTooltip
                cursor={true}
                content={
                  <ChartTooltipContent
                    indicator="dot" // Or "rectangle" for bars
                    labelFormatter={(label, entries) => {
                       if (!entries || entries.length === 0) return label; // label is displayDate here by default
                       const originalPayload = entries[0].payload;
                       const dateStr = originalPayload.date; 
                       const dailyGoal = originalPayload.dailyCalculatedGoal;
                       const formattedDate = new Date(dateStr + 'T00:00:00Z').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
                       if (dailyGoal && dailyGoal > 0) {
                         return `${formattedDate} (Target: ${dailyGoal.toLocaleString()})`;
                       }
                       return formattedDate;
                    }}
                  />
                }
              />
              <Legend />
              <Bar dataKey="loggedSteps" stackId="a" name={chartConfig.loggedSteps.label} fill="var(--color-loggedSteps)" radius={[0, 0, 0, 0]} />
              <Bar dataKey="remainingToGoal" stackId="a" name={chartConfig.remainingToGoal.label} fill="var(--color-remainingToGoal)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}


'use client';

import { TrendingUp, Footprints } from 'lucide-react';
import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import type { DailyStep } from '@/types';
import { useMemo } from 'react';

interface DailyStepChartProps {
  dailyStepsData: DailyStep[];
  isLoading: boolean;
}

const chartConfig = {
  steps: {
    label: 'Steps',
    color: 'hsl(var(--primary))',
    icon: Footprints,
  },
} satisfies ChartConfig;

export default function DailyStepChart({ dailyStepsData, isLoading }: DailyStepChartProps) {
  const formattedData = useMemo(() => {
    return dailyStepsData.map(item => ({
      ...item,
      // Format date for display on X-axis (e.g., "Mon 01" or "07/01")
      // Assuming item.date is "YYYY-MM-DD"
      displayDate: new Date(item.date + 'T00:00:00Z').toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    }));
  }, [dailyStepsData]);

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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-xl flex items-center">
          <TrendingUp className="mr-2 h-5 w-5 text-primary" />
          Your Daily Steps (Last {formattedData.length} Days)
        </CardTitle>
        <CardDescription>
          Visualize your daily step progress over time.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={formattedData}
              margin={{
                top: 5,
                right: 20,
                left: -10, // Adjust to make Y-axis labels more visible
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
                width={50} // Give Y-axis more space
                tickFormatter={(value) => (value > 1000 ? `${value / 1000}k` : value.toString())}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    indicator="line"
                    labelFormatter={(label, payload) => {
                      if (payload && payload.length > 0 && payload[0].payload.date) {
                        return new Date(payload[0].payload.date + 'T00:00:00Z').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
                      }
                      return label;
                    }}
                  />
                }
              />
              <Legend content={null} />
              <Line
                dataKey="steps"
                type="monotone"
                stroke="var(--color-steps)"
                strokeWidth={2}
                dot={{
                  fill: "var(--color-steps)",
                  r: 4,
                }}
                activeDot={{
                  r: 6,
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

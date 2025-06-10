'use client';

import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Progress } from '@/components/ui/progress';
import { User, Activity, Target, Footprints, ExternalLink, Mail, Edit3, Share2 } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

export default function ProfileDisplay() {
  const { userProfile } = useAuth();
  const { toast } = useToast();

  if (!userProfile) {
    return (
      <Card className="w-full max-w-lg mx-auto">
        <CardHeader>
          <CardTitle>Profile Not Found</CardTitle>
        </CardHeader>
        <CardContent>
          <p>User profile could not be loaded. Please try again or contact support.</p>
        </CardContent>
      </Card>
    );
  }

  const progressPercentage = userProfile.stepGoal ? (userProfile.currentSteps / userProfile.stepGoal) * 100 : 0;

  const handleShare = () => {
    if (userProfile.inviteLink) {
      navigator.clipboard.writeText(userProfile.inviteLink)
        .then(() => {
          toast({ title: "Link Copied!", description: "Your profile link is copied to clipboard." });
        })
        .catch(err => {
          toast({ title: "Copy Failed", description: "Could not copy link. Please try manually.", variant: "destructive" });
        });
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-xl">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="font-headline text-3xl flex items-center">
              <User className="mr-3 h-8 w-8 text-primary" />
              {userProfile.displayName || 'Your Profile'}
            </CardTitle>
            <CardDescription className="flex items-center mt-1">
              <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
              {userProfile.email}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/profile?edit=true">
              <Edit3 className="mr-2 h-4 w-4" /> Edit Profile
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <h3 className="text-lg font-semibold flex items-center"><Activity className="mr-2 h-5 w-5 text-primary" />Activity Status</h3>
          <p className="text-muted-foreground">{userProfile.activityStatus || 'Not set'}</p>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-lg font-semibold flex items-center"><Target className="mr-2 h-5 w-5 text-primary" />Step Goal</h3>
          <p className="text-2xl font-bold text-primary">{userProfile.stepGoal?.toLocaleString() || 'Not set'} steps</p>
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-semibold flex items-center"><Footprints className="mr-2 h-5 w-5 text-primary" />Current Steps</h3>
          <p className="text-4xl font-bold text-accent">{userProfile.currentSteps.toLocaleString()} steps</p>
          {userProfile.stepGoal && (
            <>
              <Progress value={progressPercentage} className="w-full h-3 mt-2" />
              <p className="text-sm text-muted-foreground text-right">{Math.min(100, Math.round(progressPercentage))}% of your goal</p>
            </>
          )}
        </div>
        
        {userProfile.inviteLink && (
          <div className="space-y-2">
            <h3 className="text-lg font-semibold flex items-center"><Share2 className="mr-2 h-5 w-5 text-primary" />Share Your Progress</h3>
            <div className="flex items-center space-x-2">
              <Input type="text" readOnly value={userProfile.inviteLink} className="flex-grow" />
              <Button onClick={handleShare} variant="outline" size="icon" aria-label="Copy link">
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Share this link with friends and family to show your progress!</p>
          </div>
        )}

      </CardContent>
      <CardFooter className="flex justify-end">
        <Button asChild>
          <Link href="/invite">
             Generate Sponsorship Invite
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

'use client';

import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { generateInviteMessage, type GenerateInviteMessageInput } from '@/ai/flows/generate-invite-message';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Wand2, Copy, Send, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const inviteFormSchema = z.object({
  // No inputs needed from user for this specific implementation, data comes from profile
  // Add custom message field if user wants to add personalization context later
});
type InviteFormInputs = z.infer<typeof inviteFormSchema>;

export default function InviteMessageGenerator() {
  const { user, userProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [inviteMessage, setInviteMessage] = useState('');
  const { toast } = useToast();

  const { handleSubmit, formState: { errors } } = useForm<InviteFormInputs>({
    resolver: zodResolver(inviteFormSchema),
  });

  const onSubmit: SubmitHandler<InviteFormInputs> = async () => {
    if (!user || !userProfile || !userProfile.profileComplete || !userProfile.activityStatus || !userProfile.stepGoal) {
      toast({
        title: 'Profile Incomplete',
        description: 'Please complete your profile (including activity status and step goal) to generate an invite message.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    setInviteMessage(''); // Clear previous message

    const input: GenerateInviteMessageInput = {
      userName: userProfile.displayName || user.email || 'A challenger',
      stepGoal: userProfile.stepGoal,
      activityStatus: userProfile.activityStatus,
      challengeName: 'Butterfly Steps',
      nonprofitName: 'For Every Star A Tree',
      donationLink: 'https://foreveryStaratree.org/donate.html', // General donation link
    };

    try {
      const result = await generateInviteMessage(input);
      setInviteMessage(result.inviteMessage);
      toast({ title: 'Invite Message Generated!', description: 'Your personalized message is ready.' });
    } catch (error) {
      console.error('Invite message generation error:', error);
      toast({ title: 'Generation Failed', description: 'Could not generate invite message. Please try again.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteMessage)
      .then(() => toast({ title: 'Copied!', description: 'Invite message copied to clipboard.' }))
      .catch(() => toast({ title: 'Copy Failed', description: 'Could not copy message.', variant: 'destructive' }));
  };

  return (
    <Card className="w-full max-w-xl mx-auto shadow-xl">
      <CardHeader>
        <CardTitle className="font-headline text-3xl flex items-center">
          <Wand2 className="mr-2 h-7 w-7 text-primary" />
          Generate Invite Message
        </CardTitle>
        <CardDescription>
          Create a personalized message to share with your network and invite them to sponsor your challenge!
          The message will include a general donation link to ForEveryStarATree.org.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-6">
          {!userProfile?.profileComplete || !userProfile?.activityStatus || !userProfile?.stepGoal ? (
             <p className="text-destructive">
                Please complete your profile, including activity status and step goal, before generating an invite message.
                <Button variant="link" asChild><a href="/profile">Go to Profile</a></Button>
            </p>
          ) : (
            <div className="flex justify-center">
                 <Button type="submit" disabled={loading} size="lg">
                    {loading ? <><RefreshCw className="mr-2 h-5 w-5 animate-spin" /> Generating...</> : <><Wand2 className="mr-2 h-5 w-5" /> Generate Message</>}
                </Button>
            </div>
          )}

          {loading && !inviteMessage && (
            <div className="space-y-2">
              <Skeleton className="h-6 w-1/4" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-10 w-24 ml-auto" />
            </div>
          )}

          {inviteMessage && !loading && (
            <div className="space-y-3">
              <Label htmlFor="generatedMessage" className="text-base">Your Generated Message:</Label>
              <Textarea
                id="generatedMessage"
                value={inviteMessage}
                readOnly
                rows={5}
                className="bg-muted/50"
              />
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={handleCopy} disabled={!inviteMessage}>
                  <Copy className="mr-2 h-4 w-4" /> Copy
                </Button>
                <Button type="button" variant="default" onClick={() => {
                     const mailtoLink = `mailto:?subject=Sponsor My Butterfly Steps Challenge!&body=${encodeURIComponent(inviteMessage + "\n\nLearn more and support ForEveryStarATree.org: https://foreveryStaratree.org/donate" + (userProfile?.inviteLink ? `\n\nSee my progress: ${userProfile.inviteLink}` : ""))}`;
                     window.location.href = mailtoLink;
                }} disabled={!inviteMessage}>
                  <Send className="mr-2 h-4 w-4" /> Share via Email
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </form>
    </Card>
  );
}

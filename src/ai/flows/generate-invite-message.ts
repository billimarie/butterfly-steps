'use server';

/**
 * @fileOverview AI agent that generates personalized invite messages for users to share with their network to solicit sponsorships for their participation in the Butterfly Steps challenge.
 *
 * - generateInviteMessage - A function that generates personalized invite messages.
 * - GenerateInviteMessageInput - The input type for the generateInviteMessage function.
 * - GenerateInviteMessageOutput - The return type for the generateInviteMessage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateInviteMessageInputSchema = z.object({
  userName: z.string().describe('The name of the user participating in the challenge.'),
  stepGoal: z.number().describe('The user selected step goal.'),
  activityStatus: z
    .enum(['Sedentary', 'Moderately Active', 'Very Active'])
    .describe('The activity status of the user.'),
  challengeName: z.string().describe('The name of the challenge.'),
  nonprofitName: z.string().describe('The name of the nonprofit.'),
  donationLink: z.string().describe('The donation link for the nonprofit.'),
});

export type GenerateInviteMessageInput = z.infer<typeof GenerateInviteMessageInputSchema>;

const GenerateInviteMessageOutputSchema = z.object({
  inviteMessage: z.string().describe('The personalized invite message.'),
});

export type GenerateInviteMessageOutput = z.infer<typeof GenerateInviteMessageOutputSchema>;

export async function generateInviteMessage(
  input: GenerateInviteMessageInput
): Promise<GenerateInviteMessageOutput> {
  return generateInviteMessageFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateInviteMessagePrompt',
  input: {schema: GenerateInviteMessageInputSchema},
  output: {schema: GenerateInviteMessageOutputSchema},
  prompt: `You are an expert fundraising copywriter for environmental nonprofits.

You will use the following information to generate a personalized invite message for the user to share with their network to solicit sponsorships for their participation in the Butterfly Steps challenge.

User Name: {{{userName}}}
Step Goal: {{{stepGoal}}}
Activity Status: {{{activityStatus}}}
Challenge Name: {{{challengeName}}}
Nonprofit Name: {{{nonprofitName}}}
Donation Link: {{{donationLink}}}

Generate a personalized invite message that is no more than 200 characters long. The message should be enthusiastic and encourage people to sponsor the user's participation in the challenge. It should also include a call to action to donate to the nonprofit.
`,
});

const generateInviteMessageFlow = ai.defineFlow(
  {
    name: 'generateInviteMessageFlow',
    inputSchema: GenerateInviteMessageInputSchema,
    outputSchema: GenerateInviteMessageOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);


'use client'; // Mark as client component

import DonationTierCard from '@/components/donate/DonationTierCard';
import { HeartHandshake } from 'lucide-react';
import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

// Metadata for this page should be handled in a parent layout or server component
// as exporting it from a client component is not allowed.

interface DonationTier {
  id: string;
  name: string;
  description: string;
  amount?: number; // Optional for "Employer Match"
  imageUrl: string;
  dataAiHint: string;
  buttonText: string;
  actionLink: string;
}

const donationTiers: DonationTier[] = [
  {
    id: 'tier-11',
    name: '$11 Sponsorship',
    description: 'Activate 1 missed day in your Butterfly Steps journey. Your support helps plant vital milkweed for Monarch caterpillars.',
    amount: 11,
    imageUrl: 'https://placehold.co/600x400.png',
    dataAiHint: 'milkweed plant donation',
    buttonText: 'Sponsor $11',
    actionLink: '#donate-tier-11',
  },
  {
    id: 'tier-50',
    name: '$50 Sponsorship',
    description: 'Activate up to 5 missed days. Help us expand butterfly habitats by planting more nectar flowers and shelter plants.',
    amount: 50,
    imageUrl: 'https://placehold.co/600x400.png',
    dataAiHint: 'butterfly garden donation',
    buttonText: 'Sponsor $50',
    actionLink: '#donate-tier-50',
  },
  {
    id: 'tier-100',
    name: '$100 Sponsorship',
    description: "Activate up to 10 missed days and receive the exclusive 'Pollinator Hero' digital badge. Your generosity fuels major eco-restoration projects.",
    amount: 100,
    imageUrl: 'https://placehold.co/600x400.png',
    dataAiHint: 'eco restoration hero',
    buttonText: 'Sponsor $100',
    actionLink: '#donate-tier-100',
  },
  {
    id: 'tier-match',
    name: 'Employer Match Program',
    description: "Double your impact! Check if your employer offers a matching gift program. Employer matches can lead to unlimited streak forgiveness (allowing you to log steps for past missed days).",
    imageUrl: 'https://placehold.co/600x400.png',
    dataAiHint: 'employer match gift',
    buttonText: 'Learn About Matching',
    actionLink: '#employer-match-info',
  },
];

export default function DonatePage() {
  const { userProfile, recordSectionVisit } = useAuth();

  useEffect(() => {
    if (userProfile?.profileComplete) {
      recordSectionVisit('donate');
    }
  }, [userProfile, recordSectionVisit]);

  return (
    <div className="container mx-auto py-8 space-y-10">
      <div className="text-center">
        <h1 className="text-4xl md:text-5xl font-headline text-primary mb-4 flex items-center justify-center">
          <HeartHandshake className="mr-3 h-10 w-10" />
          Donate to Conserve Butterfly Habitats
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          When you sponsor our real-life Butterfly Habitat, we celebrate your impact by activating a missed day in your Butterfly Steps journey.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {donationTiers.map((tier) => (
          <DonationTierCard key={tier.id} tier={tier} />
        ))}
      </div>

       <div className="text-center mt-12 p-6 bg-muted/30 rounded-lg">
          <h2 className="text-2xl font-headline text-primary mb-3">Your Support Makes a Difference</h2>
          <p className="text-muted-foreground">
            Every contribution, big or small, helps us create and maintain thriving ecosystems for Monarch butterflies and other pollinators through <a href="https://foreverystaratree.org" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">For Every Star, A Tree</a>. Thank you for your generosity!
          </p>
        </div>
    </div>
  );
}

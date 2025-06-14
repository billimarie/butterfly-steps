
'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Gift } from 'lucide-react'; // Using Gift icon

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

interface DonationTierCardProps {
  tier: DonationTier;
}

export default function DonationTierCard({ tier }: DonationTierCardProps) {
  return (
    <Card className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="p-0">
        <div className="relative w-full h-56">
          <Image
            src={tier.imageUrl}
            alt={tier.name}
            layout="fill"
            objectFit="cover"
            data-ai-hint={tier.dataAiHint}
          />
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <CardTitle className="text-xl font-headline mb-1">{tier.name}</CardTitle>
        {tier.amount != null && ( // Check for null or undefined to allow $0 display if explicitly set (though not used here)
          <p className="text-lg font-semibold text-primary mb-2">${tier.amount.toFixed(2)}</p>
        )}
        <CardDescription className="text-sm text-muted-foreground min-h-[60px]"> {/* Added min-height for consistency */}
          {tier.description}
        </CardDescription>
      </CardContent>
      <CardFooter className="p-4 border-t">
        <Button 
          asChild 
          className="w-full"
          variant={tier.amount === undefined ? "outline" : "default"} // Style "Learn More" differently
        >
          <a 
            href={tier.actionLink} 
            target={tier.actionLink.startsWith('#') || tier.actionLink.startsWith('/') ? '_self' : '_blank'} 
            rel={tier.actionLink.startsWith('#') || tier.actionLink.startsWith('/') ? undefined : 'noopener noreferrer'}
          >
            <Gift className="mr-2 h-5 w-5" /> {tier.buttonText}
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
}


import type { Metadata } from 'next';
import FeedContent from '@/components/feed/FeedContent';

export const metadata: Metadata = {
  title: 'Community Feed | The Butterfly Walk',
  description: 'See the collective progress of the Butterfly Walk community in the Butterfly Steps challenge. Track total steps and support monarch conservation.',
  keywords: ['Butterfly Walk', 'community feed', 'monarch butterfly', 'conservation', 'step challenge', 'fundraising', 'foreveryStaratree'],
};

export default function FeedPage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <h1 className="text-4xl font-headline text-center text-primary mb-10">
        Our Migration Walk
      </h1>
      <FeedContent />
    </div>
  );
}

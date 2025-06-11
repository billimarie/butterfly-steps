
import type { Metadata } from 'next';
import FeedContent from '@/components/feed/FeedContent';

export const metadata: Metadata = {
  title: 'Community Feed | Monarch Miles',
  description: 'See the collective progress of the Monarch Miles community in the Stepping For Monarchs challenge. Track total steps and support monarch conservation.',
  keywords: ['monarch miles', 'community feed', 'monarch butterfly', 'conservation', 'step challenge', 'fundraising', 'foreveryStaratree'],
};

export default function FeedPage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <h1 className="text-4xl font-headline text-center text-primary mb-10">
        Our Community's Journey
      </h1>
      <FeedContent />
    </div>
  );
}

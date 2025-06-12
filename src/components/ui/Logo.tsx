import Link from 'next/link';
import { Leaf } from 'lucide-react';

export default function Logo() {
  return (
    <Link href="/" className="flex flex-grow items-center space-x-2 text-2xl font-headline font-bold text-primary hover:text-primary/90 transition-colors">
      <Leaf className="h-7 w-7" data-ai-hint="butterfly" />
      <span>Butterfly Steps</span>
    </Link>
  );
}

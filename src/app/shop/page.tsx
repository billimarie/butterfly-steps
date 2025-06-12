
import type { Metadata } from 'next';
import ProductCard from '@/components/shop/ProductCard';
import { ShoppingBag } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Shop | Butterfly Steps',
  description: 'Support the Monarchs by purchasing fun and educational products. All proceeds help fund our conservation efforts.',
  keywords: ['shop', 'merchandise', 'butterfly products', 'coloring pages', 'pamphlets', 'fundraising'],
};

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  dataAiHint: string;
  learnMoreLink?: string;
}

const products: Product[] = [
  {
    id: '1',
    name: 'Butterfly Step Coloring Pages',
    description: 'Fun and educational coloring pages featuring Monarchs and other butterflies. Perfect for all ages!',
    price: 5.99,
    imageUrl: 'https://placehold.co/600x400.png',
    dataAiHint: 'coloring pages butterfly',
    learnMoreLink: '#',
  },
  {
    id: '2',
    name: 'Butterfly ID Pamphlet',
    description: 'A handy, foldable guide to help you identify common butterflies in your area.',
    price: 3.49,
    imageUrl: 'https://placehold.co/600x400.png',
    dataAiHint: 'pamphlet nature guide',
    learnMoreLink: '#',
  },
  {
    id: '3',
    name: 'Catti the Caterpillar Plushie',
    description: 'Adopt your very own Catti the Caterpillar! Soft, cuddly, and ready for adventure.',
    price: 15.00,
    imageUrl: 'https://res.cloudinary.com/djrhjkkvm/image/upload/v1749691114/Cartoons/catti-the-caterpillar_b9skmk.png',
    dataAiHint: 'caterpillar plush toy',
    learnMoreLink: '#',
  },
  {
    id: '4',
    name: 'Milkweed Seed Packet',
    description: 'Grow your own Monarch habitat! Contains native milkweed seeds.',
    price: 4.00,
    imageUrl: 'https://placehold.co/600x400.png',
    dataAiHint: 'seed packet milkweed',
    learnMoreLink: 'https://foreverystaratree.org/milkweed.html',
  },
];

export default function ShopPage() {
  return (
    <div className="container mx-auto py-8 space-y-10">
      <div className="text-center">
        <h1 className="text-4xl md:text-5xl font-headline text-primary mb-4 flex items-center justify-center">
          <ShoppingBag className="mr-3 h-10 w-10" />
          Our Little Shop
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Support our conservation efforts by purchasing these delightful items. Every purchase helps us plant more Butterfly Habitats!
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

       <div className="text-center mt-12 p-6 bg-muted/30 rounded-lg">
          <h2 className="text-2xl font-headline text-primary mb-3">All Proceeds Support Monarch Conservation</h2>
          <p className="text-muted-foreground">
            Your purchase directly contributes to planting native milkweed and creating thriving ecosystems for Monarch butterflies through <a href="https://foreverystaratree.org" target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">For Every Star, A Tree</a>.
          </p>
        </div>
    </div>
  );
}


'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingCart, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  dataAiHint: string;
  learnMoreLink?: string;
}

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { toast } = useToast();

  const handleAddToCart = () => {
    // For now, this is a placeholder.
    // In a real app, this would dispatch an action to add the item to a cart state.
    toast({
      title: `${product.name} Added to Cart!`,
      description: "Well, not really... but this is where it would happen! 😉",
    });
    console.log(`Product ${product.id} added to cart (simulated).`);
  };

  return (
    <Card className="flex flex-col overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="p-0">
        <div className="relative w-full h-56">
          <Image
            src={product.imageUrl}
            alt={product.name}
            layout="fill"
            objectFit="cover"
            data-ai-hint={product.dataAiHint}
          />
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <CardTitle className="text-xl font-headline mb-1">{product.name}</CardTitle>
        <p className="text-lg font-semibold text-primary mb-2">${product.price.toFixed(2)}</p>
        <CardDescription className="text-sm text-muted-foreground line-clamp-3">
          {product.description}
        </CardDescription>
      </CardContent>
      <CardFooter className="p-4 border-t flex flex-col sm:flex-row gap-2">
        <Button onClick={handleAddToCart} className="w-full sm:flex-1">
          <ShoppingCart className="mr-2 h-5 w-5" /> Add to Cart
        </Button>
        {product.learnMoreLink && (
          <Button variant="outline" asChild className="w-full sm:flex-1">
            <a href={product.learnMoreLink} target="_blank" rel="noopener noreferrer">
              Learn More <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

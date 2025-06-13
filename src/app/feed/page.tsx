
// This file is no longer needed as the feed content is merged into the main page (src/app/page.tsx)
// You can safely delete this file.
// To prevent Next.js from trying to render it, we'll make it an empty component that redirects.
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function FeedPageRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/');
  }, [router]);
  return null;
}

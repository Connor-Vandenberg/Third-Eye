'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

// Default platform route redirects to COP
export default function PlatformIndex() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/cop');
  }, [router]);
  return null;
}

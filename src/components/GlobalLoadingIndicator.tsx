// src/components/GlobalLoadingIndicator.tsx
"use client";

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useLoading } from '@/context/LoadingContext';
import LoadingSpinner from './LoadingSpinner';

const GlobalLoadingIndicator = () => {
  const { isLoading, setIsLoading } = useLoading();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    setIsLoading(false);
  }, [pathname, searchParams, setIsLoading]);

  return isLoading ? <LoadingSpinner /> : null;
};

export default GlobalLoadingIndicator;

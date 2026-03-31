"use client"

import Link from 'next/link';
import { cn } from '@/lib/utils';
import Image from 'next/image';

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center space-x-4", className)}>
      <Image src="/logo.png" alt="CBTIS 294 Logo" width={64} height={64} className="rounded-full" />
      <span className="font-bold text-2xl">CBTIS 294</span>
    </Link>
  );
}

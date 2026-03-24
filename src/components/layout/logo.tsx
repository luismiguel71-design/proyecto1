import Link from 'next/link';
import { cn } from '@/lib/utils';
import Image from 'next/image';

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center space-x-3", className)}>
      <Image src="/logo.png" alt="CBTIS 294 Logo" width={56} height={56} className="rounded-full" />
      <span className="font-bold text-xl">CBTIS 294</span>
    </Link>
  );
}

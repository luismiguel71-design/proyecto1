import Link from 'next/link';
import { GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center space-x-2", className)}>
      <GraduationCap className="h-6 w-6 text-primary" />
      <span className="font-bold">CBTIS 294</span>
    </Link>
  );
}

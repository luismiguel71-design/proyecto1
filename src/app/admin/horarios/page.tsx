'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function DeprecatedSchedulePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/horarios');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p>Esta página ha sido movida. Redirigiendo al nuevo generador de horarios...</p>
        </div>
    </div>
  );
}

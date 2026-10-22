'use client';

import { Suspense } from 'react';
import { AuthPage } from '@/features/auth/AuthPage';

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F7F8F5]" />}>
      <AuthPage pathname="SIGN_UP" />
    </Suspense>
  );
}


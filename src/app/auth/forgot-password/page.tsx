'use client';

import { Suspense } from 'react';
import { AuthPage } from '@/features/auth/AuthPage';

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="h-screen h-[100dvh] bg-[#f6f7f8]" />}>
      <AuthPage pathname="FORGOT_PASSWORD" />
    </Suspense>
  );
}


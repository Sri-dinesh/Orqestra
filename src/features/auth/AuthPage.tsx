import { FormEvent, useEffect, useState } from 'react';
import { useNavigate, useLocation, Link, useSearchParams } from 'react-router-dom';
import {
  Mail,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Check,
  Sparkles,
} from 'lucide-react';
import { authClient } from '@/auth/client';
import { useAuthSession, notifyAuthChange } from '@/auth/session';
import { syncCurrentUser } from '@/auth/server-api';

interface AuthPageProps {
  pathname: 'SIGN_IN' | 'SIGN_UP' | 'FORGOT_PASSWORD' | 'RESET_PASSWORD';
}

function safeRedirectPath(target: unknown): string {
  if (typeof target === 'string' && target.startsWith('/') && !target.startsWith('//')) {
    return target;
  }
  return '/departments';
}

export function AuthPage({ pathname }: AuthPageProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { data: sessionData, isPending: isSessionPending } = useAuthSession();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [capsLockActive, setCapsLockActive] = useState(false);
  const [status, setStatus] = useState<{ kind: 'error' | 'success'; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isSignIn = pathname === 'SIGN_IN';
  const isSignUp = pathname === 'SIGN_UP';
  const isForgotPassword = pathname === 'FORGOT_PASSWORD';
  const isResetPassword = pathname === 'RESET_PASSWORD';

  const resetToken = searchParams.get('token');

  // If user is already authenticated and visits sign-in or sign-up, redirect immediately
  useEffect(() => {
    if (!isSessionPending && sessionData?.session && sessionData.user && (isSignIn || isSignUp)) {
      navigate(safeRedirectPath(location.state?.from), { replace: true });
    }
  }, [isSessionPending, sessionData, isSignIn, isSignUp, navigate, location.state]);

  // Reset form status when route changes
  useEffect(() => {
    setStatus(null);
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
  }, [pathname]);

  // Track Caps Lock status on key events
  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.getModifierState) {
      setCapsLockActive(event.getModifierState('CapsLock'));
    }
  }

  // Password requirement checks for sign up / reset
  const hasMinLength = password.length >= 8;
  const hasNumberOrSymbol = /[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus(null);

    const trimmedEmail = email.trim();
    const trimmedName = name.trim();

    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setStatus({ kind: 'error', message: 'Please enter a valid academic or organizational email address.' });
      return;
    }

    if (isSignUp && !trimmedName) {
      setStatus({ kind: 'error', message: 'Please enter your full name.' });
      return;
    }

    if ((isSignUp || isResetPassword) && !hasMinLength) {
      setStatus({ kind: 'error', message: 'Password must be at least 8 characters long.' });
      return;
    }

    if ((isSignUp || isResetPassword) && password !== confirmPassword) {
      setStatus({ kind: 'error', message: 'Passwords do not match. Please verify both fields.' });
      return;
    }

    setIsSubmitting(true);
    try {
      if (isForgotPassword) {
        const result = await authClient.requestPasswordReset({
          email: trimmedEmail,
          redirectTo: `${window.location.origin}/auth/reset-password`,
        });

        if (result.error) {
          setStatus({ kind: 'error', message: result.error.message || 'Failed to request password reset.' });
          return;
        }

        setStatus({
          kind: 'success',
          message: `If an account exists for ${trimmedEmail}, password reset instructions have been sent.`,
        });
        return;
      }

      if (isResetPassword) {
        if (!resetToken) {
          setStatus({
            kind: 'error',
            message: 'Reset token is missing or has expired. Please request a new password reset link.',
          });
          return;
        }

        const result = await authClient.resetPassword({
          newPassword: password,
          token: resetToken,
        });

        if (result.error) {
          setStatus({ kind: 'error', message: result.error.message || 'Password reset request failed.' });
          return;
        }

        setStatus({
          kind: 'success',
          message: 'Your password has been successfully updated. You can now sign in with your new credentials.',
        });
        setPassword('');
        setConfirmPassword('');
        return;
      }

      if (isSignUp) {
        const result = await authClient.signUp.email({
          name: trimmedName,
          email: trimmedEmail,
          password,
        });

        if (result.error) {
          setStatus({ kind: 'error', message: result.error.message || 'Account registration failed.' });
          return;
        }

        void syncCurrentUser().catch((err) => {
          console.warn('Initial user profile sync scheduled for workspace bootstrap:', err);
        });

        notifyAuthChange();
        navigate('/departments', { replace: true });
        return;
      }

      // Default: Sign In
      const result = await authClient.signIn.email({
        email: trimmedEmail,
        password,
      });

      if (result.error) {
        setStatus({
          kind: 'error',
          message: result.error.message || 'Invalid email or password. Please verify your credentials.',
        });
        return;
      }

      void syncCurrentUser().catch((err) => {
        console.warn('Initial user profile sync scheduled for workspace bootstrap:', err);
      });

      notifyAuthChange();
      navigate(safeRedirectPath(location.state?.from), { replace: true });
    } catch (error) {
      setStatus({
        kind: 'error',
        message: error instanceof Error ? error.message : 'An unexpected authentication error occurred.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  // Titles & copy
  const pageTitle = isForgotPassword
    ? 'Reset your password'
    : isResetPassword
      ? 'Set a new password'
      : isSignUp
        ? 'Create your workspace account'
        : 'Welcome back';

  const pageSubtitle = isForgotPassword
    ? 'Enter your institutional email address and we will send you secure recovery instructions.'
    : isResetPassword
      ? 'Choose a strong, unique password for your Orqestra account.'
      : isSignUp
        ? 'Deploy institutional academic timetabling with automated constraint solving.'
        : 'Sign in to access your departments, faculty schedules, and solver workspace.';

  return (
    <div className="h-screen h-[100dvh] w-full overflow-hidden bg-[#f6f7f8] text-[#121417]">
      <div className="grid h-full w-full lg:grid-cols-12 overflow-hidden">
        {/* Left Form Section */}
        <div className="flex flex-col justify-between p-4 sm:p-6 lg:px-8 lg:py-5 xl:px-12 xl:py-6 lg:col-span-6 xl:col-span-5 bg-white border-r border-[#e1e4e8] h-full overflow-hidden">
          {/* Top Brand Nav */}
          <div className="flex items-center justify-between shrink-0">
            <Link
              to="/"
              className="flex items-center gap-2.5 text-base font-bold tracking-tight text-[#121417] hover:opacity-90 transition-opacity"
            >
              <span className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-md bg-[#121417] text-white text-xs font-bold shadow-none">
                O
              </span>
              <span className="font-['Geist',ui-sans-serif,sans-serif] text-lg sm:text-xl font-bold tracking-tight text-[#121417]">Orqestra</span>
            </Link>

            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#5b616b] hover:text-[#121417] transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to home</span>
            </Link>
          </div>

          {/* Center Form Container */}
          <div className="my-auto mx-auto w-full max-w-md flex flex-col justify-center py-1 sm:py-2 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            {/* Segmented Mode Switcher (Sign In vs Sign Up) */}
            {(isSignIn || isSignUp) && (
              <div className="mb-2.5 sm:mb-3 p-1 bg-[#eef0f2] rounded-md flex items-center shrink-0">
                <button
                  type="button"
                  onClick={() => navigate('/auth/sign-in')}
                  className={`flex-1 py-1.5 sm:py-2 text-xs font-medium rounded-sm transition-all text-center cursor-pointer ${
                    isSignIn
                      ? 'bg-white text-[#121417] shadow-none'
                      : 'text-[#5b616b] hover:text-[#121417]'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/auth/sign-up')}
                  className={`flex-1 py-1.5 sm:py-2 text-xs font-medium rounded-sm transition-all text-center cursor-pointer ${
                    isSignUp
                      ? 'bg-white text-[#121417] shadow-none'
                      : 'text-[#5b616b] hover:text-[#121417]'
                  }`}
                >
                  Create Account
                </button>
              </div>
            )}

            {/* Header Titles */}
            <div className="text-left mb-2.5 sm:mb-3 shrink-0">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#121417]">
                {pageTitle}
              </h1>
              <p className="mt-0.5 sm:mt-1 text-xs text-[#5b616b] leading-normal line-clamp-2">
                {pageSubtitle}
              </p>
            </div>

            {/* Reset Password Missing Token Notice */}
            {isResetPassword && !resetToken && (
              <div
                role="alert"
                className="mb-3 rounded-md border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900"
              >
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                  <div>
                    <p className="font-semibold">Missing recovery token</p>
                    <p className="mt-1 text-amber-800">
                      This password reset link is invalid or incomplete. Please request a new password reset email.
                    </p>
                    <Link
                      to="/auth/forgot-password"
                      className="mt-2.5 inline-flex items-center gap-1.5 font-medium text-[#3b6fe0] hover:underline"
                    >
                      <span>Request a new link</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-2 sm:space-y-2.5" noValidate>
              {/* Name Field (Sign Up only) */}
              {isSignUp && (
                <div>
                  <label htmlFor="name" className="block text-[11px] sm:text-xs font-medium text-[#121417]">
                    Full name
                  </label>
                  <div className="relative mt-1">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5 text-[#5b616b]">
                      <UserIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </div>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      autoComplete="name"
                      enterKeyHint="next"
                      placeholder="Prof. Alan Turing"
                      className="w-full rounded-md border border-[#e1e4e8] bg-white py-1.5 sm:py-2 pl-8 sm:pl-9 pr-3 text-xs sm:text-sm text-[#121417] placeholder:text-[#5b616b]/50 transition-all focus:border-[#3b6fe0] focus:outline-none focus:ring-2 focus:ring-[#3b6fe0]/15"
                    />
                  </div>
                </div>
              )}

              {/* Email Field */}
              {!isResetPassword && (
                <div>
                  <label htmlFor="email" className="block text-[11px] sm:text-xs font-medium text-[#121417]">
                    Institutional email address
                  </label>
                  <div className="relative mt-1">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5 text-[#5b616b]">
                      <Mail className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="username"
                      spellCheck={false}
                      enterKeyHint={isForgotPassword ? 'done' : 'next'}
                      placeholder="dean.scheduling@university.edu"
                      className="w-full rounded-md border border-[#e1e4e8] bg-white py-1.5 sm:py-2 pl-8 sm:pl-9 pr-3 text-xs sm:text-sm text-[#121417] placeholder:text-[#5b616b]/50 transition-all focus:border-[#3b6fe0] focus:outline-none focus:ring-2 focus:ring-[#3b6fe0]/15"
                    />
                  </div>
                </div>
              )}

              {/* Password Field */}
              {!isForgotPassword && (
                <div>
                  <div className="flex items-center justify-between">
                    <label htmlFor="password" className="block text-[11px] sm:text-xs font-medium text-[#121417]">
                      {isResetPassword ? 'New password' : 'Password'}
                    </label>
                    {isSignIn && (
                      <Link
                        to="/auth/forgot-password"
                        className="text-[11px] font-medium text-[#3b6fe0] hover:underline"
                      >
                        Forgot password?
                      </Link>
                    )}
                  </div>

                  <div className="relative mt-1">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5 text-[#5b616b]">
                      <Lock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyDown={handleKeyDown}
                      onKeyUp={handleKeyDown}
                      required
                      minLength={8}
                      autoComplete={isSignUp || isResetPassword ? 'new-password' : 'current-password'}
                      enterKeyHint={isSignUp || isResetPassword ? 'next' : 'done'}
                      placeholder={isSignUp || isResetPassword ? 'At least 8 characters' : 'Enter your password'}
                      className="w-full rounded-md border border-[#e1e4e8] bg-white py-1.5 sm:py-2 pl-8 sm:pl-9 pr-9 text-xs sm:text-sm text-[#121417] placeholder:text-[#5b616b]/50 transition-all focus:border-[#3b6fe0] focus:outline-none focus:ring-2 focus:ring-[#3b6fe0]/15"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-[#5b616b] hover:text-[#121417] transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Confirm Password Field (Sign Up & Reset) */}
              {(isSignUp || isResetPassword) && (
                <div>
                  <label htmlFor="confirm-password" className="block text-[11px] sm:text-xs font-semibold text-[#121417]">
                    Confirm password
                  </label>
                  <div className="relative mt-1">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5 text-[#5b616b]">
                      <Lock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </div>
                    <input
                      id="confirm-password"
                      name="confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      onKeyDown={handleKeyDown}
                      onKeyUp={handleKeyDown}
                      required
                      minLength={8}
                      autoComplete="new-password"
                      enterKeyHint="done"
                      placeholder="Re-type your password"
                      className="w-full rounded-md border border-[#e1e4e8] bg-white py-1.5 sm:py-2 pl-8 sm:pl-9 pr-9 text-xs sm:text-sm text-[#121417] placeholder:text-[#5b616b]/50 transition-all focus:border-[#3b6fe0] focus:outline-none focus:ring-2 focus:ring-[#3b6fe0]/15"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                      className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-[#5b616b] hover:text-[#121417] transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                    </button>
                  </div>

                  {/* Password Checklist Criteria */}
                  <div className="mt-1.5 rounded-md bg-[#f6f7f8] px-2.5 py-1.5 text-[10.5px] text-[#5b616b] grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-1.5">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full text-[9px] ${
                          hasMinLength ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-500'
                        }`}
                      >
                        <Check className="h-2.5 w-2.5" />
                      </span>
                      <span className="truncate">At least 8 characters long</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full text-[9px] ${
                          hasNumberOrSymbol ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-500'
                        }`}
                      >
                        <Check className="h-2.5 w-2.5" />
                      </span>
                      <span className="truncate">Contains a number or special character</span>
                    </div>

                    {confirmPassword.length > 0 && (
                      <div className="flex items-center gap-1.5 sm:col-span-2">
                        <span
                          className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full text-[9px] ${
                            passwordsMatch ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          <Check className="h-2.5 w-2.5" />
                        </span>
                        <span className={passwordsMatch ? 'text-emerald-700 font-medium' : 'text-rose-700'}>
                          {passwordsMatch ? 'Passwords match' : 'Passwords do not match'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Caps Lock Warning */}
              {capsLockActive && (
                <div
                  role="status"
                  aria-live="polite"
                  className="flex items-center gap-1.5 rounded-md bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-800 border border-amber-200"
                >
                  <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                  <span>Caps Lock is ON</span>
                </div>
              )}

              {/* Status Alert Banner */}
              {status && (
                <div
                  role="alert"
                  aria-live="polite"
                  className={`flex items-start gap-2 rounded-md border p-2 text-[11px] leading-snug ${
                    status.kind === 'error'
                      ? 'border-rose-200 bg-rose-50 text-rose-800'
                      : 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  }`}
                >
                  {status.kind === 'error' ? (
                    <AlertCircle className="h-3.5 w-3.5 shrink-0 text-rose-600 mt-0.5" />
                  ) : (
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-600 mt-0.5" />
                  )}
                  <span className="flex-1">{status.message}</span>
                </div>
              )}

              {/* Primary Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || (isResetPassword && !resetToken)}
                aria-busy={isSubmitting}
                className="group relative flex w-full items-center justify-center gap-2 rounded-md bg-[#3b6fe0] hover:bg-[#2e5ccb] active:bg-[#3b6fe0] px-4 py-2 sm:py-2.5 text-xs font-medium text-white shadow-none transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Please wait…</span>
                  </>
                ) : (
                  <>
                    <span>
                      {isForgotPassword
                        ? 'Send recovery instructions'
                        : isResetPassword
                          ? 'Update password'
                          : isSignUp
                            ? 'Create institutional account'
                            : 'Sign in to workspace'}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </form>

            {/* Sub-Actions / Alternate Links */}
            <div className="mt-2.5 sm:mt-3 text-center text-xs text-[#5b616b]">
              {isForgotPassword && (
                <Link
                  to="/auth/sign-in"
                  className="inline-flex items-center gap-1.5 font-medium text-[#3b6fe0] hover:underline"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Back to Sign In</span>
                </Link>
              )}

              {isResetPassword && (
                <Link
                  to="/auth/sign-in"
                  className="inline-flex items-center gap-1.5 font-medium text-[#3b6fe0] hover:underline"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Return to Sign In</span>
                </Link>
              )}

              {isSignIn && (
                <p>
                  Don't have an institutional account?{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/auth/sign-up')}
                    className="font-medium text-[#3b6fe0] hover:underline cursor-pointer"
                  >
                    Create one
                  </button>
                </p>
              )}

              {isSignUp && (
                <p>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/auth/sign-in')}
                    className="font-medium text-[#3b6fe0] hover:underline cursor-pointer"
                  >
                    Sign in
                  </button>
                </p>
              )}
            </div>
          </div>

          {/* Bottom Security Footer */}
          <div className="pt-2.5 sm:pt-3 border-t border-[#e1e4e8] flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#5b616b] shrink-0">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>256-bit TLS Encrypted</span>
            </div>
            <span>Neon Auth Protected</span>
          </div>
        </div>

        {/* Right Institutional Showcase Panel (Desktop) */}
        <div className="hidden lg:flex lg:col-span-6 xl:col-span-7 flex-col justify-between p-6 lg:p-8 xl:p-10 bg-[#111112] text-[#ececec] border-l border-[#2a2a2d] relative overflow-hidden h-full">
          {/* Subtle background glow */}
          <div className="pointer-events-none absolute -top-40 -right-40 h-96 w-96 rounded-full bg-[#3b6fe0]/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-[#3b6fe0]/5 blur-3xl" />

          {/* Top Badge */}
          <div className="relative z-10 flex items-center gap-2 shrink-0">
            <span className="inline-flex items-center gap-1.5 rounded-md border border-[#2a2a2d] bg-[#18181a] px-3 py-1 text-xs font-mono font-medium text-blue-300">
              <Sparkles className="h-3.5 w-3.5 text-[#3b6fe0]" />
              <span>Academic Timetable Engine v2.4</span>
            </span>
          </div>

          {/* Center Showcase Card */}
          <div className="relative z-10 my-auto max-w-lg space-y-3 xl:space-y-4">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white xl:text-2xl font-['Geist',ui-sans-serif,sans-serif]">
                Intelligent Academic Scheduling &amp; Constraint Satisfaction.
              </h2>
              <p className="mt-1.5 text-xs xl:text-sm text-[#a1a1a6] leading-relaxed line-clamp-2">
                Orqestra orchestrates complex departmental requirements, faculty teaching preferences, and physical room constraints into conflict-free institutional timetables.
              </p>
            </div>

            {/* Interactive Timetable Matrix Mockup */}
            <div className="rounded-lg border border-[#2a2a2d] bg-[#18181a] p-3.5 xl:p-4 shadow-none">
              <div className="flex items-center justify-between border-b border-[#2a2a2d] pb-2">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#2f9e44] animate-pulse" />
                  <span className="text-xs font-semibold text-white">
                    Computer Science &amp; Engineering — Fall Term
                  </span>
                </div>
                <span className="rounded-sm bg-emerald-950/60 px-2 py-0.5 text-[10px] font-mono font-semibold text-[#51cf66] border border-emerald-500/20">
                  0 Hard Conflicts
                </span>
              </div>

              {/* Solver Key Metrics */}
              <div className="mt-2.5 grid grid-cols-3 gap-2">
                <div className="rounded-md bg-white/5 p-2 text-center border border-[#2a2a2d]">
                  <p className="text-[10px] text-[#a1a1a6]">Sections</p>
                  <p className="mt-0.5 text-xs xl:text-sm font-bold font-mono text-white tabular">32</p>
                </div>
                <div className="rounded-md bg-white/5 p-2 text-center border border-[#2a2a2d]">
                  <p className="text-[10px] text-[#a1a1a6]">Faculty</p>
                  <p className="mt-0.5 text-xs xl:text-sm font-bold font-mono text-white tabular">48</p>
                </div>
                <div className="rounded-md bg-white/5 p-2 text-center border border-[#2a2a2d]">
                  <p className="text-[10px] text-[#a1a1a6]">Preference Met</p>
                  <p className="mt-0.5 text-xs xl:text-sm font-bold font-mono text-[#51cf66] tabular">99.4%</p>
                </div>
              </div>

              {/* Mock Schedule Rows */}
              <div className="mt-2.5 space-y-1.5 font-mono text-[10.5px]">
                <div className="flex items-center justify-between rounded-md bg-white/5 px-2.5 py-1.5 border border-[#2a2a2d]">
                  <span className="text-[#a1a1a6]">Mon 09:00</span>
                  <span className="font-semibold text-blue-300">CS101 Intro to Computing</span>
                  <span className="text-xs text-[#a1a1a6]">Hall A (Turing)</span>
                </div>
                <div className="flex items-center justify-between rounded-md bg-white/5 px-2.5 py-1.5 border border-[#2a2a2d]">
                  <span className="text-[#a1a1a6]">Mon 10:00</span>
                  <span className="font-semibold text-purple-300">CS102 Data Structures Lab</span>
                  <span className="text-xs text-[#a1a1a6]">Lab 3 (Lovelace)</span>
                </div>
                <div className="flex items-center justify-between rounded-md bg-white/5 px-2.5 py-1.5 border border-[#2a2a2d]">
                  <span className="text-[#a1a1a6]">Tue 11:00</span>
                  <span className="font-semibold text-emerald-300">CS201 Algorithm Design</span>
                  <span className="text-xs text-[#a1a1a6]">Hall B (Knuth)</span>
                </div>
              </div>
            </div>

            {/* Testimonial Quote */}
            <div className="rounded-md border border-[#2a2a2d] bg-[#18181a] p-2.5 xl:p-3 text-xs text-[#ececec] leading-relaxed">
              <p className="italic">
                &ldquo;Orqestra transformed our institutional scheduling from an agonizing two-week manual struggle into a verified 90-second automated run.&rdquo;
              </p>
              <p className="mt-1.5 text-[11px] font-semibold text-white">
                — Head of Academic Administration &amp; Timetabling
              </p>
            </div>
          </div>

          {/* Bottom Reassurance Feature Badges */}
          <div className="relative z-10 flex flex-wrap items-center gap-3 xl:gap-4 text-xs text-[#a1a1a6] shrink-0 pt-2">
            <span className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-[#3b6fe0]" />
              <span>Independent Authoritative Validator</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-[#3b6fe0]" />
              <span>Isolated Local Persistence</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5 text-[#3b6fe0]" />
              <span>Official Notice-board PDF Export</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

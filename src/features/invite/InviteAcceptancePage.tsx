'use client';

import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from '@/lib/navigation';
import {
  Building2,
  ShieldAlert,
  ArrowRight,
  LogIn,
  UserPlus,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { useAuthSession } from '@/auth/session';
import { useWorkspaceStore } from '@/state/stores/workspace-store';
import { useEditorStore } from '@/state/stores/editor-store';
import {
  fetchInvitationByToken,
  acceptInvitation,
  type InvitationDetailsDto,
} from '@/features/settings/member-service';

export function InviteAcceptancePage() {
  const params = useParams<{ token?: string }>();
  const token = params?.token || '';
  const navigate = useNavigate();
  const { data: authData } = useAuthSession();
  const showToast = useEditorStore((s) => s.showToast);
  const setMembership = useWorkspaceStore((s) => s.setMembership);

  const [loading, setLoading] = useState(true);
  const [invitation, setInvitation] = useState<InvitationDetailsDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);
  const [acceptedSuccess, setAcceptedSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing invitation link.');
      setLoading(false);
      return;
    }

    let active = true;
    void fetchInvitationByToken(token)
      .then((res) => {
        if (!active) return;
        if (!res.valid || !res.invitation) {
          setError(res.error || 'This invitation is no longer active.');
        } else {
          setInvitation(res.invitation);
        }
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : 'Failed to retrieve invitation.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [token]);

  async function handleAccept() {
    if (!token) return;
    setIsAccepting(true);
    try {
      const res = await acceptInvitation(token);
      setMembership(res.membership);
      setAcceptedSuccess(true);
      showToast('success', res.message || 'Successfully joined institution workspace!');

      // Redirect after brief visual feedback
      setTimeout(() => {
        navigate('/dashboard', { replace: true });
      }, 1000);
    } catch (err) {
      showToast('error', err instanceof Error ? err.message : 'Failed to accept invitation.');
      setIsAccepting(false);
    }
  }

  const currentUser = authData?.user;

  return (
    <div className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-[#F7F8F5] px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Loading State */}
        {loading && (
          <div className="rounded-3xl border border-[#E5E8E0] bg-white p-8 text-center shadow-lg shadow-black/5">
            <div className="relative mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#111315] text-xl font-bold text-white shadow-md">
              <span>O</span>
              <span className="absolute -inset-1.5 -z-10 animate-ping rounded-2xl bg-[#0047FF]/20" />
            </div>
            <h2 className="text-base font-bold text-[#111315]">Verifying invitation link…</h2>
            <p className="mt-1.5 text-xs text-[#71767B]">
              Connecting to institutional workspace…
            </p>
            <div className="mx-auto mt-6 h-1 w-48 overflow-hidden rounded-full bg-[#E5E8E0]">
              <div className="h-full w-24 animate-[shimmer_1.5s_infinite] rounded-full bg-[#0047FF]" />
            </div>
          </div>
        )}

        {/* Error / Inactive Invitation State */}
        {!loading && error && (
          <div className="rounded-3xl border border-rose-200 bg-white p-8 text-center shadow-xl shadow-rose-500/5">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <h1 className="mt-4 text-lg font-bold text-[#111315]">Invitation Unavailable</h1>
            <p className="mt-2 text-xs leading-relaxed text-[#71767B]">{error}</p>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Link
                to="/dashboard"
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#111315] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-black"
              >
                <span>Go to Dashboard</span>
              </Link>
              <Link
                to="/auth/sign-in"
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#D0D5DD] bg-white px-4 py-2.5 text-xs font-semibold text-[#111315] transition hover:bg-black/5"
              >
                <span>Sign In</span>
              </Link>
            </div>
          </div>
        )}

        {/* Successful Accepted State */}
        {!loading && acceptedSuccess && (
          <div className="rounded-3xl border border-emerald-200 bg-white p-8 text-center shadow-xl shadow-emerald-500/5">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h2 className="mt-4 text-lg font-bold text-[#111315]">Welcome to the Team!</h2>
            <p className="mt-1.5 text-xs text-[#71767B]">
              You have successfully joined {invitation?.institutionName}. Redirecting to your workspace…
            </p>
            <div className="mx-auto mt-5 h-1 w-32 overflow-hidden rounded-full bg-emerald-100">
              <div className="h-full w-full animate-pulse bg-emerald-600" />
            </div>
          </div>
        )}

        {/* Valid Invitation State */}
        {!loading && !error && !acceptedSuccess && invitation && (
          <div className="rounded-3xl border border-[#E5E8E0] bg-white p-7 sm:p-9 shadow-xl shadow-black/5">
            {/* Institution Brand */}
            <div className="flex items-center gap-3.5 pb-6 border-b border-[#E5E8E0]">
              {invitation.logoDataUrl ? (
                <img
                  src={invitation.logoDataUrl}
                  alt={invitation.institutionName}
                  className="h-12 w-12 rounded-2xl border border-[#E5E8E0] bg-white object-contain p-1 shadow-xs"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#0047FF] shadow-xs">
                  <Building2 className="h-6 w-6" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <span className="inline-block rounded-md bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-blue-700 uppercase tracking-wider">
                  Institutional Invitation
                </span>
                <h1 className="mt-0.5 truncate text-base font-bold text-[#111315]" title={invitation.institutionName}>
                  {invitation.institutionName}
                </h1>
                {invitation.institutionCode && (
                  <p className="text-[11px] text-[#71767B]">{invitation.institutionCode}</p>
                )}
              </div>
            </div>

            {/* Invite Details */}
            <div className="mt-6 space-y-4">
              <div className="rounded-2xl bg-[#F7F8F5] p-4 text-left border border-[#E5E8E0]/70">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-[#71767B]">Assigned Role</span>
                  <span
                    className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
                      invitation.role === 'ADMIN'
                        ? 'bg-amber-500/10 text-amber-800 border border-amber-500/20'
                        : invitation.role === 'HOD'
                        ? 'bg-blue-500/10 text-blue-800 border border-blue-500/20'
                        : 'bg-emerald-500/10 text-emerald-800 border border-emerald-500/20'
                    }`}
                  >
                    {invitation.role === 'ADMIN'
                      ? '👑 Institution Admin'
                      : invitation.role === 'HOD'
                      ? '🏛️ Head of Department'
                      : '📚 Teaching Faculty (Read-Only)'}
                  </span>
                </div>

                {invitation.departmentName && (
                  <div className="mt-3 flex items-center justify-between text-xs border-t border-[#E5E8E0] pt-2.5">
                    <span className="font-medium text-[#71767B]">Department Scope</span>
                    <span className="font-semibold text-[#111315]">{invitation.departmentName}</span>
                  </div>
                )}

                <div className="mt-3 flex items-center justify-between text-xs border-t border-[#E5E8E0] pt-2.5">
                  <span className="font-medium text-[#71767B]">Invited Email</span>
                  <span className="font-mono text-[11px] text-[#111315]">{invitation.email}</span>
                </div>
              </div>

              {/* Role Permissions Description */}
              <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4 text-xs text-blue-900 leading-relaxed">
                <p className="font-bold flex items-center gap-1.5 text-blue-800">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>
                    {invitation.role === 'FACULTY'
                      ? 'What you can do as Teaching Faculty:'
                      : invitation.role === 'HOD'
                      ? 'What you can do as Head of Department:'
                      : 'What you can do as Administrator:'}
                  </span>
                </p>
                <ul className="mt-2 space-y-1 text-[11px] text-blue-800/90 list-disc list-inside">
                  {invitation.role === 'FACULTY' ? (
                    <>
                      <li>View all published section and master timetables in real-time.</li>
                      <li>Inspect your personal teaching workload and scheduled lecture slots.</li>
                      <li>Export or download official schedules to high-resolution PDF & Excel.</li>
                      <li>Safe read-only experience with zero risk of altering curriculum.</li>
                    </>
                  ) : invitation.role === 'HOD' ? (
                    <>
                      <li>Configure your assigned department’s subjects, faculty, and room allocations.</li>
                      <li>Generate conflict-free timetables for your department sections.</li>
                      <li>Assign substitute teachers during unexpected faculty absences.</li>
                    </>
                  ) : (
                    <>
                      <li>Full institutional CRUD access across all departments and college settings.</li>
                      <li>Generate, edit, and publish timetables across the entire institution.</li>
                      <li>Manage team access and invite other faculty members.</li>
                    </>
                  )}
                </ul>
              </div>

              {/* Auth / Action Area */}
              {currentUser ? (
                <div className="mt-6 space-y-3">
                  <div className="flex items-center justify-between rounded-xl bg-black/5 px-3.5 py-2 text-xs">
                    <span className="text-[#71767B]">Signed in as:</span>
                    <span className="font-semibold text-[#111315]">
                      {currentUser.name ? `${currentUser.name} (${currentUser.email})` : currentUser.email}
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={isAccepting}
                    onClick={() => void handleAccept()}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0047FF] px-4 py-3 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition hover:bg-blue-600 disabled:opacity-50"
                  >
                    {isAccepting ? (
                      <>
                        <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        <span>Joining Institution…</span>
                      </>
                    ) : (
                      <>
                        <span>Accept Invitation & Enter Workspace</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </>
                    )}
                  </button>

                  <p className="text-center text-[11px] text-[#71767B]">
                    Want to use another account?{' '}
                    <Link
                      to={`/auth/sign-in?returnTo=/invite/${token}`}
                      className="font-semibold text-[#0047FF] hover:underline"
                    >
                      Sign in with a different email
                    </Link>
                  </p>
                </div>
              ) : (
                <div className="mt-6 space-y-3">
                  <p className="text-center text-xs text-[#71767B]">
                    Please sign in or create an account to accept this invitation.
                  </p>

                  <div className="flex flex-col gap-2.5 sm:flex-row">
                    <Link
                      to={`/auth/sign-in?returnTo=/invite/${token}`}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#111315] px-4 py-2.5 text-xs font-semibold text-white shadow-xs transition hover:bg-black"
                    >
                      <LogIn className="h-3.5 w-3.5" />
                      <span>Sign In</span>
                    </Link>

                    <Link
                      to={`/auth/sign-up?returnTo=/invite/${token}`}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#D0D5DD] bg-white px-4 py-2.5 text-xs font-semibold text-[#111315] shadow-xs transition hover:bg-black/5"
                    >
                      <UserPlus className="h-3.5 w-3.5 text-[#71767B]" />
                      <span>Create Account</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

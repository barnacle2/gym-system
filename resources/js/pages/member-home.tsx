import { Member } from '@/components/gym/member-form';
import { Head, useForm } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';

interface User {
    id: number;
    name: string;
    balance: number;
    live_balance: number;
    formatted_balance: string;
    formatted_live_balance: string;
}

interface TimeSession {
    id: number;
    time_in: string;
    time_out?: string;
    duration: string;
    credits_used: number;
    is_active: boolean;
}

interface TimeTracking {
    active_session: TimeSession | null;
    todays_sessions: TimeSession[];
    next_action: 'time_in' | 'time_out';
}

interface BalanceLogEntry {
    id: number;
    createdAt: string;
    type: string;
    description?: string | null;
    amount: number;
    balanceAfter: number;
}

interface Props {
    member: Member | null;
    user: User;
    timeTracking: TimeTracking;
    balanceLogs: BalanceLogEntry[];
}

export default function MemberHome({ member, user, timeTracking, balanceLogs }: Props) {
    const { post } = useForm();
    const [showQRModal, setShowQRModal] = useState(false);
    const [toggling, setToggling] = useState(false);
    const toggleFormRef = useRef<HTMLFormElement | null>(null);
    const balanceLogsRef = useRef<HTMLDivElement | null>(null);
    const csrf = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';
    // Live-updated state
    const [liveBalance, setLiveBalance] = useState<number>(user.live_balance);
    const [formattedLiveBalance, setFormattedLiveBalance] = useState<string>(user.formatted_live_balance);
    const [activeSession, setActiveSession] = useState<TimeSession | null>(timeTracking.active_session);
    // Using props directly since we don't need dynamic updates anymore

    const handleLogout = (e: React.FormEvent) => {
        e.preventDefault();
        post('/logout');
    };    if (!member) {
        return (
            <>
                <Head title="Member Home" />
                <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-950 to-slate-900 text-gray-200">
                    <div className="text-center">
                        <h1 className="mb-4 text-3xl font-bold">
                            Welcome to Fitness Point
                        </h1>
                        <p className="text-gray-400">
                            Your membership is being processed. Please contact
                            the gym for more information.
                        </p>
                    </div>
                </div>
            </>
        );
    }

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const getStatus = () => {
        if (member.inactive) {
            return {
                label: 'Inactive',
                className: 'bg-gray-500/10 text-gray-300 border-gray-500/35',
            };
        }

        const now = new Date();
        const end = new Date(member.endDate);
        const diffTime = end.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return {
                label: 'Expired',
                className: 'bg-red-500/10 text-red-300 border-red-500/35',
            };
        }
        if (diffDays <= 7) {
            return {
                label: `Expiring in ${diffDays} days`,
                className: 'bg-amber-500/10 text-amber-300 border-amber-500/35',
            };
        }
        return {
            label: 'Active',
            className: 'bg-green-500/10 text-green-300 border-green-500/35',
        };
    };

    const status = getStatus();

    // Build simple alert list for notifications section (balance + subscription)
    const alerts: { id: string; type: 'warning' | 'danger' | 'info'; message: string }[] = [];

    // Monthly plan: show notification 1 week before expiry
    const nowForExpiry = new Date();
    const endForExpiry = new Date(member.endDate);
    const diffTimeExpiry = endForExpiry.getTime() - nowForExpiry.getTime();
    const daysUntilExpiry = Math.ceil(diffTimeExpiry / (1000 * 60 * 60 * 24));

    const expiryPlans = ['Monthly', 'Quarterly', 'Annual'];

    if (!member.inactive && expiryPlans.includes(member.plan as any) && daysUntilExpiry >= 0 && daysUntilExpiry <= 7) {
        alerts.push({
            id: 'expiry',
            type: 'warning',
            message: `Your ${member.plan.toLowerCase()} membership will expire in ${daysUntilExpiry} day(s). Please renew soon to avoid interruption of access.`,
        });
    }

    // Try to get the most recent balance log as the reason/description
    const latestBalanceLog = balanceLogs.length > 0 ? balanceLogs[0] : null;
    const latestReason = latestBalanceLog?.description
        || (latestBalanceLog?.type ? latestBalanceLog.type.replace(/_/g, ' ') : null);

    // Outstanding / active balance alert (e.g. utang sa products or fees)
    if (user.balance && Number(user.balance) > 0) {
        const baseMessage = `You have an outstanding balance of ${user.formatted_balance}.`;
        const reasonMessage = latestReason
            ? ` Reason: ${latestReason}.`
            : '';

        alerts.push({
            id: 'balance',
            type: 'warning',
            message: `${baseMessage}${reasonMessage} Please settle this with the gym staff.`,
        });
    }

    // Poll active session status every 15s
    useEffect(() => {
        let mounted = true;
        const fetchStatus = async () => {
            try {
                const res = await fetch('/api/time-tracking/status', { credentials: 'same-origin' });
                if (!res.ok) return;
                const data = await res.json();
                if (!mounted) return;
                setLiveBalance(data.user?.live_balance ?? liveBalance);
                setFormattedLiveBalance(data.user?.formatted_live_balance ?? formattedLiveBalance);
                if (data.active_session) {
                    setActiveSession({
                        id: data.active_session.id,
                        time_in: data.active_session.time_in,
                        duration: data.active_session.duration,
                        credits_used: data.active_session.credits_used ?? 0,
                        is_active: true,
                    } as any);
                } else {
                    setActiveSession(null);
                }
            } catch {}
        };

        // initial fetch and interval
        fetchStatus();
        const timer = setInterval(fetchStatus, 15000);
        return () => {
            mounted = false;
            clearInterval(timer);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleToggleTimeTracking = () => {
        if (!member) return;
        setToggling(true);
        // Submit classic POST form so Laravel CSRF middleware accepts it reliably
        toggleFormRef.current?.submit();
        // Fallback reload in case of success (server responds JSON or redirect)
        setTimeout(() => window.location.reload(), 600);
    };

    return (
        <>
            <Head title="Member Home" />

            <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-gray-200">
                {/* Header */}
                <header className="sticky top-0 z-10 border-b border-gray-700 bg-slate-900/80 p-4 backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                        <h1 className="text-xl font-bold tracking-wide">
                            🏋️ Fitness Point
                        </h1>
                        <div className="flex items-center gap-2">
                            <a
                                href="/member/profile"
                                className="cursor-pointer rounded-lg bg-gray-700 px-4 py-2 text-sm text-gray-200 hover:bg-gray-600"
                            >
                                Profile
                            </a>
                            <a
                                href="/member/balance-logs"
                                className="cursor-pointer rounded-lg bg-emerald-700 px-4 py-2 text-sm text-gray-100 hover:bg-emerald-600"
                            >
                                Balance Logs
                            </a>
                            <button
                                onClick={handleLogout}
                                className="cursor-pointer rounded-lg bg-gray-700 px-4 py-2 text-sm text-gray-200 hover:bg-gray-600"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </header>

                <div className="container mx-auto max-w-4xl p-5">
                    {/* Welcome Section */}
                    <div className="mb-6">
                        <h2 className="mb-2 text-2xl font-bold">
                            Welcome back, {member.fullName}!
                        </h2>
                        <p className="text-gray-400">
                            Here's your membership information
                        </p>
                    </div>

                    {/* Notifications / Alerts */}
                    {alerts.length > 0 && (
                        <div className="mb-6 space-y-3">
                            {alerts.map((alert) => (
                                <div
                                    key={alert.id}
                                    className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm shadow-sm
                                        ${alert.type === 'danger'
                                            ? 'border-red-700/60 bg-red-900/40 text-red-100'
                                            : alert.type === 'warning'
                                            ? 'border-amber-600/60 bg-amber-900/30 text-amber-100'
                                            : 'border-blue-700/60 bg-blue-900/40 text-blue-100'
                                        }`}
                                >
                                    <span className="mt-0.5 text-lg">
                                        {alert.type === 'danger' && '⚠️'}
                                        {alert.type === 'warning' && '🔔'}
                                        {alert.type === 'info' && 'ℹ️'}
                                    </span>
                                    <p className="leading-snug">
                                        {alert.message}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Membership Card */}
                    <div className="mb-6 rounded-2xl border border-gray-700 bg-gray-800/80 p-6">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-semibold">
                                Membership Status
                            </h3>
                            <span
                                className={`rounded-full border px-3 py-1 text-sm ${status.className}`}
                            >
                                {status.label}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <div>
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-xs text-gray-400">
                                            Plan
                                        </label>
                                        <div className="text-sm font-medium">
                                            {member.plan}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-400">
                                            Start Date
                                        </label>
                                        <div className="text-sm">
                                            {formatDate(member.startDate)}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-400">
                                            End Date
                                        </label>
                                        <div className="text-sm">
                                            {member.plan === 'Daily'
                                                ? 'Present (Daily)'
                                                : formatDate(member.endDate)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-xs text-gray-400">
                                            Email
                                        </label>
                                        <div className="text-sm">
                                            {member.email || 'Not provided'}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-400">
                                            Phone
                                        </label>
                                        <div className="text-sm">
                                            {member.phone || 'Not provided'}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-400">
                                            Renewals
                                        </label>
                                        <div className="text-sm">
                                            {member.renewals} times
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {member.notes && (
                            <div className="mt-4 border-t border-gray-700 pt-4">
                                <label className="text-xs text-gray-400">
                                    Notes
                                </label>
                                <div className="mt-1 text-sm">
                                    {member.notes}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Session Tracker */}
                    <section className="bg-gray-800/80 border border-gray-700 rounded-2xl overflow-hidden mb-6">
                        <div className="p-6">
                            {/* Hidden form for CSRF-safe toggle */}
                            <form ref={toggleFormRef} method="post" action="/api/time-tracking/toggle" className="hidden">
                                <input type="hidden" name="_token" value={csrf} />
                            </form>
                            <div className="mb-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`flex h-10 w-10 items-center justify-center rounded-full border ${
                                        'bg-green-500/10 border-green-500/20'
                                    }`}>
                                        <span className={`text-lg text-green-400`}>⏱️</span>
                                    </div>
                                    <h3 className="text-lg font-semibold text-gray-200">Session Tracker</h3>
                                </div>
                                {/* no right-side balance in subscription model */}
                            </div>



                            {/* Time Tracking Status */}
                            {activeSession && (
                                <div className="mb-4 rounded-lg bg-blue-500/10 border border-blue-500/20 p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
                                            <span className="text-blue-300 font-medium">Session Active</span>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-blue-300 font-bold">
                                                {activeSession.duration}
                                            </div>
                                            <div className="text-xs text-blue-400">
                                                Started at {activeSession.time_in}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-3">
                                        <button
                                            onClick={handleToggleTimeTracking}
                                            disabled={toggling}
                                            className="cursor-pointer px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50"
                                        >
                                            {toggling ? 'Timing out…' : 'Time Out Now'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Time In button when no active session */}
                            {!activeSession && (
                                <div className="mb-4 rounded-lg bg-green-500/10 border border-green-500/20 p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="text-green-300 font-medium">Ready to start a session?</div>
                                        <button
                                            onClick={handleToggleTimeTracking}
                                            disabled={toggling}
                                            className="cursor-pointer px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 disabled:opacity-50"
                                        >
                                            {toggling ? 'Timing in…' : 'Time In Now'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* No balance widget in subscription model */}

                            {/* Today's Sessions */}
                            {timeTracking.todays_sessions.length > 0 && (
                                <div className="mt-4">
                                    <h4 className="text-sm font-medium text-gray-300 mb-2">Today's Sessions</h4>
                                    <div className="space-y-2">
                                        {timeTracking.todays_sessions.map((session: TimeSession) => (
                                            <div key={session.id} className="bg-slate-900/50 border border-gray-700/50 rounded p-3 text-sm">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-gray-300">
                                                        {session.time_in} - {session.time_out || 'Active'}
                                                    </span>
                                                    <div className="text-right text-gray-200">{session.duration}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </section>

                    {/* QR Code Section */}
                    {member.qrCode && (
                        <div className="mb-6 rounded-2xl border border-gray-700 bg-gray-800/80 p-6">
                            <div className="flex flex-col items-center gap-6 md:flex-row">
                                <div className="flex-1">
                                    <h3 className="mb-2 text-lg font-semibold">
                                        Time Tracking QR Code
                                    </h3>
                                    <p className="mb-3 text-sm text-gray-400">
                                        {timeTracking.active_session
                                            ? 'Scan this QR code to time out at the gym scanner.'
                                            : 'Scan this QR code to time in at the gym scanner.'}
                                    </p>
                                    <div className="space-y-2 text-xs text-gray-500">
                                        <div>
                                            • {timeTracking.active_session
                                                ? '🔴 Ready to TIME OUT - End your session'
                                                : '🟢 Ready to TIME IN - Start your session'}
                                            
                                        </div>
                                        
                                        <div>
                                            • Valid until{' '}
                                            {formatDate(member.endDate)}
                                        </div>
                                        <div>
                                            • Keep this private - do not share
                                            with others
                                        </div>
                                        <div>
                                            •{' '}
                                            <span className="text-blue-400">
                                                Click to enlarge
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-shrink-0">
                                    <div
                                        className="cursor-pointer rounded-xl border border-gray-600 bg-white/90 p-4 transition-colors hover:bg-white/95"
                                        onClick={() => setShowQRModal(true)}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(e) =>
                                            e.key === 'Enter' &&
                                            setShowQRModal(true)
                                        }
                                    >
                                        <div
                                            dangerouslySetInnerHTML={{
                                                __html: member.qrCode,
                                            }}
                                            className="flex h-48 w-48 items-center justify-center"
                                        />
                                        <div className="mt-2 flex flex-col items-center gap-1 font-mono text-xs text-gray-600">
                                            <span>ID: {member.id}</span>
                                            <button
                                                type="button"
                                                className="mt-1 rounded bg-blue-600 px-3 py-1 text-[11px] font-medium text-white hover:bg-blue-700 cursor-pointer"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setShowQRModal(true);
                                                    // Give React a moment to render the modal before printing
                                                    setTimeout(() => window.print(), 300);
                                                }}
                                            >
                                                Print QR ID
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    

                    {/* Quick Actions */}
                    <div className="rounded-2xl border border-gray-700 bg-gray-800/80 p-6">
                        <h3 className="mb-4 text-lg font-semibold">
                            Quick Actions
                        </h3>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <a
                                href="/member/classes"
                                className="cursor-pointer rounded-lg border border-gray-600 bg-slate-950/50 p-4 text-center hover:border-blue-500 hover:bg-slate-900/70 transition-colors"
                            >
                                <div className="mb-2 text-2xl">📅</div>
                                <div className="text-sm font-medium">
                                    Book Classes
                                </div>
                                <div className="mt-1 text-xs text-gray-400">
                                    Preview screen
                                </div>
                            </a>
                            <a
                                href="/member/workout-plans"
                                className="cursor-pointer rounded-lg border border-gray-600 bg-slate-950/50 p-4 text-center hover:border-emerald-500 hover:bg-slate-900/70 transition-colors"
                            >
                                <div className="mb-2 text-2xl">💪</div>
                                <div className="text-sm font-medium">
                                    Workout Plans
                                </div>
                                <div className="mt-1 text-xs text-gray-400">
                                    Preview screen
                                </div>
                            </a>
                            <a
                                href="/member/progress"
                                className="cursor-pointer rounded-lg border border-gray-600 bg-slate-950/50 p-4 text-center hover:border-purple-500 hover:bg-slate-900/70 transition-colors"
                            >
                                <div className="mb-2 text-2xl">📊</div>
                                <div className="text-sm font-medium">
                                    Progress Tracking
                                </div>
                                <div className="mt-1 text-xs text-gray-400">
                                    Preview screen
                                </div>
                            </a>
                        </div>
                    </div>

                    {/* Balance History moved to dedicated /member/balance-logs page */}
                </div>
            </div>

            {/* QR Code Modal / ID Card for printing */}
            {showQRModal && member?.qrCode && (
                <div
                    id="member-id-modal"
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 print:bg-transparent"
                    onClick={() => setShowQRModal(false)}
                >
                    <div
                        id="member-id-card"
                        className="mx-auto w-full max-w-sm rounded-2xl bg-gradient-to-br from-blue-50 via-white to-blue-50 p-6 shadow-2xl print:shadow-none print:border print:border-gray-300 relative overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Decorative background pattern */}
                        <div className="absolute inset-0 opacity-5 pointer-events-none">
                            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-200 to-transparent"></div>
                            <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-blue-300 to-transparent rounded-full"></div>
                            <div className="absolute top-4 right-4 w-16 h-16 bg-gradient-to-bl from-blue-400 to-transparent rounded-full"></div>
                        </div>

                        {/* Gym header with logo */}
                        <div className="mb-4 text-center relative z-10">
                            <div className="inline-flex items-center gap-2 mb-2">
                                <div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center">
                                    <span className="text-white text-xs font-bold">🏋️</span>
                                </div>
                                <div className="text-sm font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                                    Fitness Point
                                </div>
                            </div>
                            <div className="text-[10px] text-gray-500 bg-gray-100 px-2 py-1 rounded-full inline-block">
                                Premium Gym Membership
                            </div>
                        </div>

                        {/* Avatar + Name + Plan */}
                        <div className="mb-4 flex items-center gap-3 relative z-10">
                            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-2 border-blue-200 bg-gradient-to-br from-blue-100 to-blue-200 text-2xl font-semibold text-blue-800 shadow-lg">
                                {member.avatarUrl ? (
                                    // eslint-disable-next-line jsx-a11y/alt-text, @next/next/no-img-element
                                    <img src={member.avatarUrl} className="h-full w-full object-cover" />
                                ) : (
                                    (member.fullName || '?').charAt(0)
                                )}
                            </div>
                            <div>
                                <div className="text-sm font-bold text-gray-900">
                                    {member.fullName}
                                </div>
                                <div className="text-[11px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full inline-block font-medium">
                                    ID: {member.id}
                                </div>
                                <div className="text-[11px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full inline-block font-medium mt-1">
                                    {member.plan}
                                </div>
                            </div>
                        </div>

                        {/* Member contact info */}
                        <div className="mb-3 space-y-0.5 text-[10px] text-gray-600">
                            <div>Phone: {member.phone || 'N/A'}</div>
                            <div>Email: {member.email || 'N/A'}</div>
                            <div>Valid until: {formatDate(member.endDate)}</div>
                        </div>

                        {/* QR block */}
                        <div className="mb-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
                            <div className="mb-2 text-center text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                                Time Tracking QR
                            </div>
                            <div className="flex justify-center mb-1">
                                <div
                                    dangerouslySetInnerHTML={{ __html: member.qrCode }}
                                    className="flex h-32 w-32 items-center justify-center"
                                />
                            </div>
                        </div>

                        {/* Footer notes */}
                        <div className="space-y-0.5 text-center text-[10px] text-gray-600">
                            <div>Scan at gym scanner to time in / time out.</div>
                            <div>Keep this card private. Do not share with others.</div>
                            <div>Membership valid until {formatDate(member.endDate)}.</div>
                            <div className="mt-1 text-[9px] uppercase tracking-wide text-gray-500">For internal use only</div>
                        </div>

                        <style>{`
@media print {
  @page {
    size: auto;
    margin: 10mm;
  }
  html, body {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    background: #ffffff !important;
  }
  #app {
    background: #ffffff !important;
  }
  #app > *:not(#member-id-modal) {
    display: none !important;
  }
  #member-id-modal {
    position: static !important;
    inset: auto !important;
    background: transparent !important;
    padding: 0 !important;
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    min-height: 100vh !important;
  }
  #member-id-card {
    position: relative !important;
    margin: 0 auto !important;
    width: 85mm !important;
    max-width: 85mm !important;
    height: auto !important;
    padding: 5mm !important;
    box-sizing: border-box !important;
    page-break-inside: avoid !important;
  }
}
                        `}</style>

                        <button
                            type="button"
                            onClick={() => setShowQRModal(false)}
                            className="cursor-pointer mt-4 w-full rounded-lg bg-gray-800 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-700 print:hidden"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}

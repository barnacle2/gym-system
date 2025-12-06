import { Head, Link, router, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { Calendar, Filter, LogIn, LogOut, Search, Timer, User, ArrowLeft } from 'lucide-react';

interface PaginatorLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface PaginatorMeta {
    current_page: number;
    last_page: number;
    per_page: number;
    from: number | null;
    to: number | null;
    total: number;
    links: PaginatorLink[];
}

interface SessionItem {
    id: number;
    user: { id: number; name: string; email: string };
    plan?: string | null;
    time_in: string | null;
    time_out: string | null;
    duration: string;
    credits_used: number;
    is_active: boolean;
    notes?: string | null;
}

interface Props {
    sessions: {
        data: SessionItem[];
        // Some apps return paginator info at top-level, others under meta
        meta?: PaginatorMeta;
        total?: number;
        from?: number | null;
        to?: number | null;
        links?: PaginatorLink[];
    };
    filters: {
        date_from?: string | null;
        date_to?: string | null;
        user_id?: number | null;
        active?: '0' | '1' | null;
        per_page?: number;
    };
    users: { id: number; name: string }[];
}

export default function AdminTimeLogs({ sessions, filters, users }: Props) {
    const [local, setLocal] = useState({
        date_from: filters.date_from || '',
        date_to: filters.date_to || '',
        user_id: String(filters.user_id ?? ''),
        active: filters.active ?? '',
        per_page: String(filters.per_page ?? 20),
        q: '',
    });

    const [rows, setRows] = useState<SessionItem[]>(sessions.data);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [lastForcedUser, setLastForcedUser] = useState<string | null>(null);

    const csrf = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';

    const filtered = useMemo(() => {
        if (!local.q) return rows;
        const q = local.q.toLowerCase();
        return rows.filter((s) =>
            [s.user.name, s.user.email].some((v) => v.toLowerCase().includes(q))
        );
    }, [local.q, rows]);

    const handleForceTimeOut = async (session: SessionItem) => {
        if (!session.is_active) return;

        const ok = window.confirm(
            `Force time out this session for ${session.user.name}?\nTime in: ${session.time_in || '-'} `
        );
        if (!ok) return;

        try {
            const res = await fetch('/api/time-tracking/toggle', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrf,
                },
                body: JSON.stringify({
                    user_id: session.user.id,
                    action: 'time_out',
                }),
                credentials: 'same-origin',
            });

            if (!res.ok) {
                console.error('Failed to force time out session');
                return;
            }

            // Update row locally so the status changes to Closed
            setRows((current) =>
                current.map((s) =>
                    s.id === session.id
                        ? {
                              ...s,
                              is_active: false,
                              time_out: s.time_out ?? new Date().toISOString(),
                          }
                        : s
                )
            );

            setLastForcedUser(session.user.name);
            setShowSuccessModal(true);
        } catch (e) {
            console.error('Error while forcing time out', e);
        }
    };

    const applyFilters = (e?: React.FormEvent) => {
        e?.preventDefault?.();
        router.get(
            '/admin/time-logs',
            {
                date_from: local.date_from || undefined,
                date_to: local.date_to || undefined,
                user_id: local.user_id || undefined,
                active: local.active || undefined,
                per_page: local.per_page,
            },
            { preserveState: true, preserveScroll: true }
        );
    };

    const resetFilters = () => {
        setLocal({ date_from: '', date_to: '', user_id: '', active: '', per_page: '20', q: '' });
        router.get('/admin/time-logs', {}, { preserveState: true, preserveScroll: true });
    };

    // Normalize paginator shape (support both top-level and meta-nested)
    const meta = (sessions as any)?.meta ?? sessions ?? {};
    const total = (meta as any)?.total ?? 0;
    const from = (meta as any)?.from ?? 0;
    const to = (meta as any)?.to ?? 0;
    const pageLinks: PaginatorLink[] = (meta as any)?.links ?? (sessions as any)?.links ?? [];

    return (
        <>
            <Head title="Time Logs" />
            <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-gray-200">
                <header className="sticky top-0 z-10 border-b border-gray-700 bg-slate-900/80 p-4 backdrop-blur-sm">
                    <div className="flex items-center justify-between max-w-7xl mx-auto">
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-2">
                                <img
                                    src="/fp-logo.png"
                                    alt="Fitness Point logo"
                                    className="h-9 w-9 object-contain"
                                />
                                <h1 className="text-lg font-semibold tracking-wide">Fitness Point</h1>
                            </div>
                            <span className="text-gray-400">|</span>
                            <h2 className="text-lg font-semibold tracking-wide">⏱️ Time Logs</h2>
                        </div>
                        <a href="/dashboard" className="cursor-pointer rounded-lg bg-gray-800 px-3 py-1 text-xs text-gray-200 hover:bg-gray-700">
                            ← Back to Dashboard
                        </a>
                    </div>
                </header>

                <main className="mx-auto p-5">
                    <section className="bg-gray-800/80 border border-gray-700 rounded-2xl overflow-hidden mb-5">
                        <form onSubmit={applyFilters} className="p-4 grid gap-4 md:grid-cols-5">
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">From</label>
                                <div className="relative">
                                    <input 
                                        type="date" 
                                        value={local.date_from} 
                                        onChange={(e) => setLocal((s) => ({ ...s, date_from: e.target.value }))} 
                                        className="w-full px-3 py-2 bg-slate-900/50 border border-gray-700 rounded-lg [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-100"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">To</label>
                                <div className="relative">
                                    <input 
                                        type="date" 
                                        value={local.date_to} 
                                        onChange={(e) => setLocal((s) => ({ ...s, date_to: e.target.value }))} 
                                        className="w-full px-3 py-2 bg-slate-900/50 border border-gray-700 rounded-lg [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-100"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Member</label>
                                <select value={local.user_id} onChange={(e) => setLocal((s) => ({ ...s, user_id: e.target.value }))} className="w-full px-3 py-2 bg-slate-900/50 border border-gray-700 rounded-lg">
                                    <option value="">All</option>
                                    {users.map((u) => (
                                        <option key={u.id} value={u.id}>{u.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Status</label>
                                <select value={local.active} onChange={(e) => setLocal((s) => ({ ...s, active: e.target.value as any }))} className="w-full px-3 py-2 bg-slate-900/50 border border-gray-700 rounded-lg">
                                    <option value="">All</option>
                                    <option value="1">Active</option>
                                    <option value="0">Closed</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Per Page</label>
                                <select value={local.per_page} onChange={(e) => setLocal((s) => ({ ...s, per_page: e.target.value }))} className="w-full px-3 py-2 bg-slate-900/50 border border-gray-700 rounded-lg">
                                    {[10, 20, 50, 100].map((n) => (
                                        <option key={n} value={n}>{n}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="md:col-span-5 flex items-center gap-3">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input value={local.q} onChange={(e) => setLocal((s) => ({ ...s, q: e.target.value }))} placeholder="Search by name or email..." className="w-full pl-10 pr-4 py-2 bg-slate-900/50 border border-gray-700 rounded-lg" />
                                </div>
                                <button type="submit" className="cursor-pointer px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg">Apply</button>
                                <button type="button" onClick={resetFilters} className="cursor-pointer px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg">Reset</button>
                            </div>
                        </form>
                    </section>

                    <section className="bg-gray-800/80 border border-gray-700 rounded-2xl overflow-hidden">
                        <div className="p-4 overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead className="text-gray-400">
                                    <tr className="text-left">
                                        <th className="px-3 py-2">Member</th>
                                        <th className="px-3 py-2">Time In</th>
                                        <th className="px-3 py-2">Time Out</th>
                                        <th className="px-3 py-2">Duration</th>
                                        <th className="px-3 py-2">Credits</th>
                                        <th className="px-3 py-2">Status</th>
                                        <th className="px-3 py-2">Notes</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((s) => (
                                        <tr key={s.id} className="border-t border-gray-700/60">
                                            <td className="px-3 py-2">
                                                <div className="flex items-center gap-2">
                                                    <User className="h-4 w-4 text-gray-400" />
                                                    <div>
                                                        <div className="text-gray-200">{s.user.name}</div>
                                                        <div className="text-xs text-gray-400">{s.user.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-3 py-2 whitespace-nowrap">{s.time_in ?? '-'}</td>
                                            <td className="px-3 py-2 whitespace-nowrap">{s.time_out ?? '-'}</td>
                                            <td className="px-3 py-2">{s.duration}</td>
                                            <td className="px-3 py-2">
                                                {s.plan === 'Daily' ? Number(s.credits_used).toFixed(2) : '-'}
                                            </td>
                                            <td className="px-3 py-2">
                                                {s.is_active ? (
                                                    <div className="flex items-center gap-2">
                                                        <span className="px-2 py-1 rounded bg-yellow-500/10 text-yellow-300 border border-yellow-500/20 inline-flex items-center gap-1 text-xs">
                                                            <Timer className="h-3 w-3" /> Active
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleForceTimeOut(s)}
                                                            className="cursor-pointer rounded bg-red-600 px-2 py-1 text-[11px] font-medium text-white hover:bg-red-700"
                                                        >
                                                            Force Time Out
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="px-2 py-1 rounded bg-green-500/10 text-green-300 border border-green-500/20 inline-flex items-center gap-1 text-xs">
                                                        <LogOut className="h-3 w-3" /> Closed
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-3 py-2 text-gray-300">{s.notes || '-'}</td>
                                        </tr>
                                    ))}
                                    {filtered.length === 0 && (
                                        <tr>
                                            <td className="px-3 py-8 text-center text-gray-400" colSpan={7}>
                                                No sessions found.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="p-4 flex flex-wrap gap-2 items-center border-t border-gray-700/60">
                            <div className="text-xs text-gray-400 mr-auto">
                                {total > 0 && (
                                    <span>
                                        Showing {from} - {to} of {total}
                                    </span>
                                )}
                            </div>
                            {pageLinks && pageLinks.length > 0 && pageLinks.map((l, idx) => (
                                <button
                                    key={idx}
                                    disabled={!l.url}
                                    onClick={() => l.url && router.visit(l.url, { preserveScroll: true, preserveState: true })}
                                    className={`cursor-pointer px-3 py-1.5 rounded border text-sm ${
                                        l.active
                                            ? 'bg-blue-600 border-blue-500'
                                            : 'bg-slate-900/50 border-gray-700 hover:border-gray-600'
                                    } ${!l.url ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    dangerouslySetInnerHTML={{ __html: l.label }}
                                />
                            ))}
                        </div>
                    </section>
                </main>
            </div>

            {showSuccessModal && (
                <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="relative w-full max-w-md rounded-2xl border border-emerald-500/30 bg-slate-950/95 p-6 shadow-2xl">
                        <div className="absolute inset-x-10 -top-6 flex justify-center">
                            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/90 text-slate-950 shadow-lg">
                                <span className="text-2xl">✓</span>
                            </div>
                        </div>
                        <div className="mt-4 text-center space-y-2">
                            <h2 className="text-lg font-semibold text-gray-100">Session closed successfully</h2>
                            <p className="text-sm text-gray-400">
                                {lastForcedUser ? (
                                    <>The active session for <span className="font-medium text-gray-200">{lastForcedUser}</span> has been forced to time out.</>
                                ) : (
                                    <>The selected session has been forced to time out.</>
                                )}
                            </p>
                        </div>
                        <div className="mt-5 flex items-center justify-center gap-3">
                            <button
                                type="button"
                                onClick={() => setShowSuccessModal(false)}
                                className="cursor-pointer px-4 py-2 rounded-lg bg-emerald-600 text-sm font-medium text-white hover:bg-emerald-500"
                            >
                                Got it
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

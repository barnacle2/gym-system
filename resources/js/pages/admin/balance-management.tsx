import { Head, useForm, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { DollarSign, Edit, UserCheck, Search, ArrowLeft } from 'lucide-react';

interface User {
    id: number;
    name: string;
    email: string;
    balance: number;
    formattedBalance: string;
    isAdmin: boolean;
}

interface Props {
    users: User[];
    openUserId?: number | null;
}

interface BalanceLogOption {
    id: number;
    amount: number;
    balance_after: number;
    type: string;
    description: string | null;
    created_at: string;
}

export default function BalanceManagement({ users, openUserId }: Props) {
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSummaryOpen, setIsSummaryOpen] = useState(false);
    const [summaryLoading, setSummaryLoading] = useState(false);
    const [summary, setSummary] = useState<{
        user: { id: number; name: string; email: string };
        subscription: {
            plan: string;
            start_date: string | null;
            end_date: string | null;
            notes: string | null;
            status: { code: string; label: string; className?: string; daysLeft: number | null };
            renewals: number;
        } | null;
        recent_sessions: Array<{ id: number; time_in: string | null; time_out: string | null; duration: string; is_active: boolean }>;
        purchases: any[];
    } | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [transactions, setTransactions] = useState<BalanceLogOption[]>([]);
    const [selectedTransactionIds, setSelectedTransactionIds] = useState<number[]>([]);
    const [transactionsLoading, setTransactionsLoading] = useState(false);
    const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
    const [lastPaidUserName, setLastPaidUserName] = useState('');

    const { data, setData, processing, errors, reset } = useForm({
        description: '',
    });

    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Auto-open payment modal when redirected from Transactions page
    useEffect(() => {
        if (!openUserId) return;
        const user = users.find((u) => u.id === openUserId);
        if (user && user.balance > 0) {
            handleOpenModal(user);
        }
        // We only want this to run once on mount for initial openUserId
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleOpenModal = (user: User) => {
        if (user.balance <= 0) return;
        setSelectedUser(user);
        setData({
            description: '',
        });
        setTransactions([]);
        setSelectedTransactionIds([]);
        setIsModalOpen(true);
        setTransactionsLoading(true);

        fetch(`/admin/users/${user.id}/balance-logs`, { credentials: 'same-origin' })
            .then(async (res) => {
                if (!res.ok) {
                    throw new Error('Failed to load balance logs');
                }
                const json = await res.json();
                if (!Array.isArray(json)) {
                    throw new Error('Unexpected balance logs response');
                }
                return (json as any[]).map((item) => ({
                    ...item,
                    amount: Number(item.amount) || 0,
                    balance_after: Number(item.balance_after) || 0,
                })) as BalanceLogOption[];
            })
            .then((logs) => {
                setTransactions(logs);
            })
            .catch(() => {
                setTransactions([]);
            })
            .finally(() => {
                setTransactionsLoading(false);
            });
    };

    const openSummary = async (user: User) => {
        setSelectedUser(user);
        setIsSummaryOpen(true);
        setSummaryLoading(true);
        try {
            const res = await fetch(`/admin/users/${user.id}/summary`, { credentials: 'same-origin' });
            const data = await res.json();
            setSummary(data);
        } catch (e) {
            setSummary(null);
        } finally {
            setSummaryLoading(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedUser) return;

        const totalSelected = transactions
            .filter((t) => selectedTransactionIds.includes(t.id))
            .reduce((sum, t) => sum + Number(t.amount || 0), 0);

        if (totalSelected <= 0) {
            return;
        }

        const paidUserName = selectedUser.name;

        router.post(`/admin/users/${selectedUser.id}/balance`, {
            balance: totalSelected,
            action: 'subtract',
            description: data.description,
            log_type: 'mark_paid',
        }, {
            onSuccess: () => {
                setIsModalOpen(false);
                reset();
                setSelectedUser(null);
                setTransactions([]);
                setSelectedTransactionIds([]);
                setLastPaidUserName(paidUserName);
                setShowPaymentSuccess(true);
            },
        });
    };

    const handleLogout = (e: React.FormEvent) => {
        e.preventDefault();
        router.post('/logout');
    };



    return (
        <>
            <Head title="Balance Management" />

            <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-gray-200">
                {/* Header */}
                <header className="sticky top-0 z-10 border-b border-gray-700 bg-slate-900/80 p-4 backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                        <h1 className="text-xl font-bold tracking-wide">💰 Balance Management</h1>
                        <a
                            href="/dashboard"
                            className="cursor-pointer rounded-lg bg-gray-800 px-3 py-1 text-xs text-gray-200 hover:bg-gray-700"
                        >
                            ← Back to Dashboard
                        </a>
                    </div>
                </header>

                <div className="mx-auto p-5">
                    {/* Search Section */}
                    <section className="bg-gray-800/80 border border-gray-700 rounded-2xl overflow-hidden mb-5">
                        <div className="p-4">
                            <div className="flex items-center gap-4">
                                <div className="flex-1">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <input
                                            type="search"
                                            placeholder="Search users by name or email..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 bg-slate-900/50 border border-gray-700 rounded-lg text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>
                                <div className="text-sm text-gray-400">
                                    {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} found
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Users Grid */}
                    <section className="bg-gray-800/80 border border-gray-700 rounded-2xl overflow-hidden">
                        <div className="p-4">
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {filteredUsers.map((user) => (
                                    <div
                                        key={user.id}
                                        className="bg-slate-900/50 border border-gray-700 rounded-lg p-4 cursor-pointer hover:border-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                                        onClick={() => openSummary(user)}
                                        role="button"
                                        tabIndex={0}
                                        aria-label={`Open summary for ${user.name}`}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                openSummary(user);
                                            }
                                        }}
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-gray-200">{user.name}</h3>
                                                <p className="text-sm text-gray-400">{user.email}</p>
                                            </div>
                                            {user.isAdmin ? (
                                                <span className="bg-blue-500/10 text-blue-300 border border-blue-500/20 px-2 py-1 rounded text-xs flex items-center gap-1">
                                                    <UserCheck className="h-3 w-3" />
                                                    Admin
                                                </span>
                                            ) : (
                                                <span className="bg-gray-500/10 text-gray-300 border border-gray-500/20 px-2 py-1 rounded text-xs">
                                                    User
                                                </span>
                                            )}
                                        </div>
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-gray-400">Status:</span>
                                                <span className="text-sm font-medium text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded">
                                                    Included (subscription)
                                                </span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleOpenModal(user);
                                                }}
                                                disabled={user.balance <= 0}
                                                className={`w-full px-3 py-2 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors ${
                                                    user.balance > 0
                                                        ? 'bg-blue-600 text-white hover:bg-blue-700 cursor-pointer'
                                                        : 'bg-gray-700/60 text-gray-400 cursor-not-allowed'
                                                }`}
                                                title={user.balance > 0 ? 'Record a payment for this user\'s outstanding transactions' : 'No outstanding balance to pay'}
                                            >
                                                <Edit className="h-3 w-3" />
                                                {user.balance > 0 ? 'Record Payment' : 'No Balance to Pay'}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            {filteredUsers.length === 0 && (
                                <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                                    <Search className="h-12 w-12 text-gray-500 mb-3" />
                                    <p className="text-gray-400">
                                        No users found matching your search.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </section>
            </div>

            {/* User Summary Modal */}
            {isSummaryOpen && summary && (
                <div className="fixed inset-0 z-40 flex items-center justify-center">
                    <div
                        className="fixed inset-0 bg-black/50"
                        onClick={() => {
                            setIsSummaryOpen(false);
                            setSummary(null);
                        }}
                    />
                    <div className="relative bg-slate-900 border border-gray-700 rounded-2xl p-6 w-full max-w-lg mx-4">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <UserCheck className="h-5 w-5 text-blue-400" />
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-200">Member Summary</h2>
                                    <p className="text-sm text-gray-400">{summary.user.name} • {summary.user.email}</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsSummaryOpen(false);
                                    setSummary(null);
                                }}
                                className="cursor-pointer text-gray-400 hover:text-gray-200 text-sm"
                            >
                                Close
                            </button>
                        </div>

                        <div className="space-y-4 text-sm">
                            <div className="rounded-lg border border-gray-700/70 bg-slate-900/60 p-3">
                                <h3 className="font-medium text-gray-200 mb-2">Subscription</h3>
                                {summary.subscription ? (
                                    <div className="space-y-1 text-xs text-gray-300">
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Plan:</span>
                                            <span className="font-medium">{summary.subscription.plan}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">Start:</span>
                                            <span>{summary.subscription.start_date || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-400">End:</span>
                                            <span>{summary.subscription.end_date || 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-400">Status:</span>
                                            <span className={summary.subscription.status.className || 'text-gray-300'}>
                                                {summary.subscription.status.label}
                                            </span>
                                        </div>
                                        {summary.subscription.notes && (
                                            <div className="mt-2 text-gray-400">Notes: {summary.subscription.notes}</div>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-xs text-gray-400">No active subscription information.</p>
                                )}
                            </div>

                            <div className="rounded-lg border border-gray-700/70 bg-slate-900/60 p-3">
                                <h3 className="font-medium text-gray-200 mb-2">Recent Sessions</h3>
                                {summary.recent_sessions.length === 0 ? (
                                    <p className="text-xs text-gray-400">No recent sessions found.</p>
                                ) : (
                                    <div className="max-h-40 overflow-y-auto text-xs text-gray-300 space-y-2">
                                        {summary.recent_sessions.map((s) => (
                                            <div
                                                key={s.id}
                                                className="flex justify-between items-center border-b border-gray-800/80 pb-1 last:border-b-0 last:pb-0"
                                            >
                                                <div>
                                                    <div>In: {s.time_in || 'N/A'}</div>
                                                    <div>Out: {s.time_out || 'N/A'}</div>
                                                </div>
                                                <div className="text-right">
                                                    <div>{s.duration}</div>
                                                    <div className={s.is_active ? 'text-emerald-400' : 'text-gray-500'}>
                                                        {s.is_active ? 'Active' : 'Completed'}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Mark as Paid Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="fixed inset-0 bg-black/50" onClick={() => setIsModalOpen(false)} />
                    <div className="relative bg-slate-900 border border-gray-700 rounded-2xl p-6 w-full max-w-md mx-4">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10 border border-blue-500/20">
                                <DollarSign className="h-5 w-5 text-blue-400" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-gray-200">Record Payment</h2>
                                <p className="text-sm text-gray-400">{selectedUser?.name}</p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {selectedUser && (
                                <div className="rounded-lg bg-gray-800/50 border border-gray-700/50 p-3 text-sm">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-400">Current balance:</span>
                                        <span className="font-mono font-medium text-gray-200">
                                            {selectedUser.formattedBalance}
                                        </span>
                                    </div>
                                    <div className="mt-2 text-xs text-gray-400">
                                        Select which transactions you are marking as paid. The total selected amount
                                        will be deducted from the member's outstanding balance.
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="block text-sm font-medium text-gray-300">
                                        Select transactions to mark as paid
                                    </label>
                                    <span className="text-xs text-gray-400">
                                        Total selected:{' '}
                                        <span className="font-semibold text-emerald-300">
                                            ₱
                                            {transactions
                                                .filter((t) => selectedTransactionIds.includes(t.id))
                                                .reduce((sum, t) => sum + Number(t.amount || 0), 0)
                                                .toFixed(2)}
                                        </span>
                                    </span>
                                </div>

                                <div className="max-h-56 overflow-y-auto rounded-lg border border-gray-700/60 bg-slate-900/60">
                                    {transactionsLoading && (
                                        <div className="p-3 text-sm text-gray-400 text-center">Loading transactions...</div>
                                    )}
                                    {!transactionsLoading && transactions.length === 0 && (
                                        <div className="p-3 text-sm text-gray-400 text-center">
                                            No balance transactions are available to mark as paid for this member.
                                        </div>
                                    )}
                                    {!transactionsLoading && transactions.length > 0 && (
                                        <ul className="divide-y divide-gray-800 text-sm">
                                            {transactions.map((t) => {
                                                const isChecked = selectedTransactionIds.includes(t.id);
                                                return (
                                                    <li
                                                        key={t.id}
                                                        className="flex items-start gap-3 px-3 py-2 hover:bg-slate-800/60"
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={isChecked}
                                                            onChange={() => {
                                                                setSelectedTransactionIds((prev) =>
                                                                    prev.includes(t.id)
                                                                        ? prev.filter((id) => id !== t.id)
                                                                        : [...prev, t.id]
                                                                );
                                                            }}
                                                            className="mt-1 h-4 w-4 rounded border-gray-600 bg-slate-900 text-blue-500 focus:ring-blue-500"
                                                        />
                                                        <div className="flex-1">
                                                            <div className="flex justify-between items-center">
                                                                <span className="font-medium text-gray-200">
                                                                    ₱{Number(t.amount || 0).toFixed(2)}
                                                                </span>
                                                                <span className="text-xs text-gray-400">
                                                                    {new Date(t.created_at).toLocaleString()}
                                                                </span>
                                                            </div>
                                                            <div className="mt-1 text-xs text-gray-400">
                                                                {t.description || 'No description provided'}
                                                            </div>
                                                            <div className="mt-1 text-[11px] text-gray-500">
                                                                Type: {t.type} • Balance after: ₱
                                                                {Number(t.balance_after || 0).toFixed(2)}
                                                            </div>
                                                        </div>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-300" htmlFor="mark-paid-notes">
                                    Reason / notes (optional)
                                </label>
                                <textarea
                                    id="mark-paid-notes"
                                    rows={3}
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    className="w-full rounded-lg border border-gray-700 bg-slate-900/60 px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="e.g., Paid in cash at front desk for protein shake and towel"
                                />
                                {errors.description && (
                                    <p className="text-sm text-red-400">{errors.description}</p>
                                )}
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="cursor-pointer flex-1 px-4 py-2 bg-gray-700 text-gray-200 rounded-lg hover:bg-gray-600 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="cursor-pointer flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                >
                                    {processing ? 'Saving...' : 'Save Payment'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showPaymentSuccess && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="relative w-full max-w-md rounded-2xl border border-emerald-500/30 bg-slate-950/95 p-6 shadow-2xl">
                        <div className="absolute inset-x-10 -top-6 flex justify-center">
                            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/90 text-slate-950 shadow-lg">
                                <span className="text-2xl">✓</span>
                            </div>
                        </div>
                        <div className="mt-4 text-center space-y-2">
                            <h2 className="text-lg font-semibold text-gray-100">Payment recorded successfully</h2>
                            <p className="text-sm text-gray-400">
                                {lastPaidUserName ? (
                                    <>
                                        Payment for <span className="font-medium text-gray-200">{lastPaidUserName}</span> has been recorded and their balance updated.
                                    </>
                                ) : (
                                    <>The payment has been recorded and the member's balance has been updated.</>
                                )}
                            </p>
                        </div>
                        <div className="mt-5 flex items-center justify-center gap-3">
                            <button
                                type="button"
                                onClick={() => setShowPaymentSuccess(false)}
                                className="cursor-pointer px-4 py-2 rounded-lg bg-emerald-600 text-sm font-medium text-white hover:bg-emerald-500"
                            >
                                Got it
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
        </>
    );
}

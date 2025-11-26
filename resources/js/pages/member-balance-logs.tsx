import { Head } from '@inertiajs/react';
import React from 'react';

interface BalanceLogEntry {
    id: number;
    createdAt: string;
    type: string;
    description?: string | null;
    amount: number;
    balanceAfter: number;
}

interface UserInfo {
    id: number;
    name: string;
}

interface Props {
    user: UserInfo;
    balanceLogs: BalanceLogEntry[];
}

export default function MemberBalanceLogs({ user, balanceLogs }: Props) {
    return (
        <>
            <Head title="Balance Logs" />
            <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-gray-200">
                {/* Header */}
                <header className="sticky top-0 z-10 border-b border-gray-700 bg-slate-900/80 p-4 backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                        <h1 className="text-xl font-bold tracking-wide">
                            🏋️ Fitness Point
                        </h1>
                        <div className="flex items-center gap-2">
                            <a
                                href="/member/home"
                                className="cursor-pointer rounded-lg bg-gray-700 px-4 py-2 text-sm text-gray-200 hover:bg-gray-600"
                            >
                                Back to Home
                            </a>
                        </div>
                    </div>
                </header>

                <div className="container mx-auto max-w-4xl p-5">
                    <div className="mb-6">
                        <h2 className="mb-1 text-2xl font-bold">Balance Logs</h2>
                        <p className="text-sm text-gray-400">
                            History of your recent balance changes and transactions.
                        </p>
                    </div>

                    <div className="rounded-2xl border border-gray-700 bg-gray-800/80 p-6">
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-semibold">Balance History</h3>
                            <span className="text-xs text-gray-400">
                                Last {Math.min(balanceLogs.length, 100)} entries
                            </span>
                        </div>

                        {balanceLogs.length === 0 ? (
                            <p className="text-sm text-gray-400">No balance activity yet.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-left text-sm">
                                    <thead>
                                        <tr className="border-b border-gray-700 text-xs uppercase text-gray-400">
                                            <th className="py-2 pr-4">Date</th>
                                            <th className="py-2 pr-4">Type</th>
                                            <th className="py-2 pr-4 text-right">Amount</th>
                                            <th className="py-2 pr-4 text-right">Balance After</th>
                                            <th className="py-2 pr-4">Details</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {balanceLogs.map((log) => (
                                            <tr key={log.id} className="border-b border-gray-800 last:border-0">
                                                <td className="py-2 pr-4 text-gray-300 text-xs md:text-sm">{log.createdAt}</td>
                                                <td className="py-2 pr-4 text-gray-300 text-xs md:text-sm">
                                                    {log.type.replace(/_/g, ' ')}
                                                </td>
                                                <td className="py-2 pr-4 text-right text-xs md:text-sm">
                                                    <span className={log.amount >= 0 ? 'text-emerald-300' : 'text-red-300'}>
                                                        {log.amount >= 0 ? '+' : ''}₱{Math.abs(log.amount).toFixed(2)}
                                                    </span>
                                                </td>
                                                <td className="py-2 pr-4 text-right text-gray-300 text-xs md:text-sm">
                                                    ₱{log.balanceAfter.toFixed(2)}
                                                </td>
                                                <td
                                                    className="py-2 pr-4 text-gray-400 text-xs md:text-sm max-w-xs truncate"
                                                    title={log.description || ''}
                                                >
                                                    {log.description || '—'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

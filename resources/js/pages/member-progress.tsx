import React from 'react';
import { Head } from '@inertiajs/react';

interface MonthlyCheckIn {
    label: string;
    count: number;
    ratio: number; // 0–1 for bar height
}

interface ProgressProps {
    monthlyCheckIns: MonthlyCheckIn[];
    estimatedHours: number;
    bestStreakWeeks: number;
}

export default function MemberProgress({ monthlyCheckIns, estimatedHours, bestStreakWeeks }: ProgressProps) {
    return (
        <>
            <Head title="Progress Tracking" />
            <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-gray-200">
                <header className="sticky top-0 z-10 border-b border-gray-700 bg-slate-900/80 p-4 backdrop-blur-sm">
                    <div className="flex items-center justify-between max-w-4xl mx-auto">
                        <h1 className="text-lg font-semibold tracking-wide">Progress Tracking</h1>
                        <a
                            href="/member/home"
                            className="cursor-pointer rounded-lg bg-gray-800 px-3 py-1 text-xs text-gray-200 hover:bg-gray-700"
                        >
                            ← Back to Home
                        </a>
                    </div>
                </header>

                <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
                    <section className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5 shadow-lg shadow-slate-950/40">
                        <h2 className="text-base font-semibold mb-1">Your fitness progress</h2>
                        <p className="text-xs text-gray-400 mb-4">
                            Based on your actual gym check-ins and time sessions.
                        </p>

                        <div className="grid gap-4 md:grid-cols-3">
                            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
                                <div className="text-xs font-medium text-gray-400 mb-1">Monthly check-ins</div>
                                <div className="h-24 rounded-lg bg-gradient-to-tr from-emerald-600/10 via-emerald-400/5 to-transparent flex items-end justify-between px-3 pb-2 text-[10px] text-emerald-100 overflow-hidden">
                                    {monthlyCheckIns.map((m) => {
                                        // Height in pixels, clamped so it looks balanced inside the container
                                        const base = m.count > 0 ? 10 : 0; // minimum height when there is at least 1 check-in
                                        const extra = m.ratio * 40;        // scale up with more check-ins
                                        const barHeight = Math.min(base + extra, 60); // keep well inside ~96px container

                                        return (
                                            <div key={m.label} className="flex flex-col items-center gap-1 flex-1">
                                                <div className="flex items-end justify-center h-full w-full">
                                                    <div
                                                        className="w-3 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.6)]"
                                                        style={{ height: `${barHeight}px` }}
                                                    />
                                                </div>
                                                <span>{m.label}</span>
                                                <span className="text-[9px] text-emerald-200">{m.count}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
                                <div className="text-xs font-medium text-gray-400 mb-1">Estimated time spent</div>
                                <p className="text-2xl font-semibold text-gray-100">{estimatedHours.toFixed(1)}h</p>
                                <p className="text-[11px] text-gray-400 mt-1">Total gym time based on your sessions.</p>
                            </div>

                            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
                                <div className="text-xs font-medium text-gray-400 mb-1">Consistency streak</div>
                                <p className="text-2xl font-semibold text-emerald-400">{bestStreakWeeks} weeks</p>
                                <p className="text-[11px] text-gray-400 mt-1">Best streak of weekly check-ins.</p>
                            </div>
                        </div>

                        <p className="mt-4 text-[11px] text-gray-500">
                            These numbers are calculated from your actual time logs. Keep checking in weekly to grow your streak.
                        </p>
                    </section>
                </main>
            </div>
        </>
    );
}

import React from 'react';
import { Head } from '@inertiajs/react';

export default function MemberClasses() {
    return (
        <>
            <Head title="Book Classes" />
            <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-gray-200">
                <header className="sticky top-0 z-10 border-b border-gray-700 bg-slate-900/80 p-4 backdrop-blur-sm">
                    <div className="flex items-center justify-between max-w-4xl mx-auto">
                        <h1 className="text-lg font-semibold tracking-wide">Book Classes</h1>
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
                        <h2 className="text-base font-semibold mb-1">Class booking (preview)</h2>
                        <p className="text-xs text-gray-400 mb-4">
                            This is a preview of where you&apos;ll be able to book group classes and special sessions.
                        </p>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg">🔥</span>
                                        <div>
                                            <div className="text-sm font-semibold text-gray-100">HIIT Blast</div>
                                            <div className="text-[11px] text-gray-400">Mon / Wed / Fri · 6:00 PM</div>
                                        </div>
                                    </div>
                                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-300 border border-emerald-500/40">Popular</span>
                                </div>
                                <p className="text-xs text-gray-400 mb-3">
                                    High intensity class focused on fat burning and conditioning.
                                </p>
                                <button
                                    type="button"
                                    disabled
                                    className="cursor-not-allowed w-full rounded-lg bg-slate-800 px-3 py-2 text-xs font-medium text-gray-400 border border-slate-700"
                                >
                                    Booking coming soon
                                </button>
                            </div>

                            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg">🧘</span>
                                        <div>
                                            <div className="text-sm font-semibold text-gray-100">Relax Yoga</div>
                                            <div className="text-[11px] text-gray-400">Tue / Thu · 7:30 PM</div>
                                        </div>
                                    </div>
                                    <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] text-blue-300 border border-blue-500/40">New</span>
                                </div>
                                <p className="text-xs text-gray-400 mb-3">
                                    Slow flow yoga to help you recover and improve mobility.
                                </p>
                                <button
                                    type="button"
                                    disabled
                                    className="cursor-not-allowed w-full rounded-lg bg-slate-800 px-3 py-2 text-xs font-medium text-gray-400 border border-slate-700"
                                >
                                    Booking coming soon
                                </button>
                            </div>
                        </div>

                        <p className="mt-4 text-[11px] text-gray-500">
                            Once this feature is live, you&apos;ll be able to choose a schedule and confirm your slot with one tap.
                        </p>
                    </section>
                </main>
            </div>
        </>
    );
}

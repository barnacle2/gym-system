import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';

interface MemberProps {
    member: {
        id: number;
        full_name: string;
        email: string | null;
    };
}

export default function AdminMemberResetPassword({ member }: MemberProps) {
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (submitting) return;
        setSubmitting(true);

        router.post(`/admin/members/${member.id}/reset-password`, {
            password,
            password_confirmation: passwordConfirmation,
        }, {
            onFinish: () => setSubmitting(false),
        });
    };

    return (
        <>
            <Head title="Reset Member Password" />
            <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-gray-200">
                <header className="sticky top-0 z-10 border-b border-gray-700 bg-slate-900/80 p-4 backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-3">
                                <a
                                    href="/dashboard"
                                    className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs font-medium text-gray-200 shadow-sm hover:bg-slate-800 hover:text-white cursor-pointer"
                                >
                                    <span className="text-sm">←</span>
                                    <span>Back to Dashboard</span>
                                </a>
                                <span className="inline-flex items-center rounded-full bg-slate-800 px-3 py-0.5 text-xs font-medium text-gray-300 border border-slate-700">
                                    Admin tool
                                </span>
                            </div>
                            <h1 className="text-lg font-semibold tracking-wide">Reset member password</h1>
                            <p className="text-xs text-gray-500">
                                Set a new login password for this member. They will use it the next time they sign in.
                            </p>
                        </div>
                    </div>
                </header>

                <main className="mx-auto max-w-xl px-4 py-8">
                    <section className="rounded-2xl border border-slate-800 bg-slate-950/80 p-6 shadow-lg shadow-slate-950/40">
                        <div className="mb-5 space-y-1">
                            <h2 className="text-sm font-semibold text-gray-100">Member</h2>
                            <p className="text-sm text-gray-300">{member.full_name}</p>
                            {member.email && (
                                <p className="text-xs text-gray-400">{member.email}</p>
                            )}
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">New Password</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={8}
                                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-gray-700 text-sm text-gray-100 focus:outline-none focus:border-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-400 mb-1">Confirm Password</label>
                                <input
                                    type="password"
                                    value={passwordConfirmation}
                                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                                    required
                                    minLength={8}
                                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-gray-700 text-sm text-gray-100 focus:outline-none focus:border-blue-500"
                                />
                            </div>
                            <p className="text-[11px] text-gray-500">
                                Tip: Share this new password with the member securely. They can change it later from their profile page.
                            </p>
                            <div className="mt-4 flex items-center justify-end gap-3">
                                <a
                                    href="/dashboard"
                                    className="cursor-pointer px-4 py-2 rounded-lg border border-slate-700 bg-slate-900 text-sm text-gray-300 hover:bg-slate-800"
                                >
                                    Cancel
                                </a>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="cursor-pointer px-4 py-2 rounded-lg bg-blue-600 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {submitting ? 'Saving...' : 'Save New Password'}
                                </button>
                            </div>
                        </form>
                    </section>
                </main>
            </div>
        </>
    );
}

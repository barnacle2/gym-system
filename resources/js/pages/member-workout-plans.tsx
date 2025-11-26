import React from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';

interface MemberData {
    id: number;
    full_name: string;
    workout_plans?: { name?: string | null; content?: string | null }[];
    active_workout_plan?: number | null;
}

interface PageProps {
    member: MemberData | null;
}

export default function MemberWorkoutPlans({ member }: PageProps) {
    const { props } = usePage<{ flash?: { success?: string } }>();
    const flashSuccess = props.flash?.success;

    const basePlans = member?.workout_plans ?? [];
    const initialPlans = [0, 1, 2].map((i) => ({
        name: (basePlans[i]?.name as string | undefined) ?? (member ? `Plan ${i + 1}` : ''),
        content: (basePlans[i]?.content as string | undefined) ?? '',
    }));

    const initialActive = member?.active_workout_plan && member.active_workout_plan >= 1 && member.active_workout_plan <= 3
        ? member.active_workout_plan
        : 1;

    const { data, setData, post, processing } = useForm({
        workout_plans: initialPlans,
        active_workout_plan: initialActive,
        current_content: (initialPlans[initialActive - 1]?.content as string) || '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const updatedPlans = data.workout_plans.map((p, idx) =>
            idx === data.active_workout_plan - 1
                ? { ...p, content: data.current_content }
                : p
        );

        // Update local state so the Plan 1/2/3 previews refresh immediately
        setData((prev) => ({
            ...prev,
            workout_plans: updatedPlans,
        }));

        post('/member/workout-plans', {
            data: {
                workout_plans: updatedPlans,
                active_workout_plan: data.active_workout_plan,
            },
        } as any);
    };
    return (
        <>
            <Head title="Workout Plans" />
            <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-gray-200">
                <header className="sticky top-0 z-10 border-b border-gray-700 bg-slate-900/80 p-4 backdrop-blur-sm">
                    <div className="flex items-center justify-between max-w-4xl mx-auto">
                        <h1 className="text-lg font-semibold tracking-wide">Workout Plans</h1>
                        <a
                            href="/member/home"
                            className="cursor-pointer rounded-lg bg-gray-800 px-3 py-1 text-xs text-gray-200 hover:bg-gray-700"
                        >
                            ← Back to Home
                        </a>
                    </div>
                </header>

                <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
                    <section className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5 shadow-lg shadow-slate-950/40 space-y-5">
                        <div>
                            <h2 className="text-base font-semibold mb-1">Your workout plan</h2>
                            <p className="text-xs text-gray-400 mb-3">
                                Write your own routine here so it&apos;s easy to review every time you visit the gym.
                            </p>

                            {flashSuccess && (
                                <div className="mb-3 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200">
                                    {flashSuccess}
                                </div>
                            )}

                            {/* Slots selector */}
                            <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                                {data.workout_plans.map((slot, index) => {
                                    const slotNumber = index + 1;
                                    const isActive = data.active_workout_plan === slotNumber;
                                    const hasContent = !!slot.content && slot.content.trim().length > 0;

                                    return (
                                        <button
                                            key={slotNumber}
                                            type="button"
                                            onClick={() => {
                                                // save current text into previously active slot
                                                setData((prev) => {
                                                    const plansCopy = [...prev.workout_plans];
                                                    const prevIndex = prev.active_workout_plan - 1;
                                                    plansCopy[prevIndex] = {
                                                        ...plansCopy[prevIndex],
                                                        content: prev.current_content,
                                                    };

                                                    return {
                                                        ...prev,
                                                        workout_plans: plansCopy,
                                                        active_workout_plan: slotNumber,
                                                        current_content: (plansCopy[slotNumber - 1]?.content as string) || '',
                                                    };
                                                });
                                            }}
                                            className={`cursor-pointer rounded-lg border px-3 py-2 text-left text-xs transition-colors ${
                                                isActive
                                                    ? 'border-blue-500 bg-blue-500/10 text-blue-100'
                                                    : 'border-slate-700 bg-slate-900/60 text-gray-200 hover:border-slate-500'
                                            }`}
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="font-semibold">Plan {slotNumber}</span>
                                                {isActive && (
                                                    <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] text-blue-200 border border-blue-500/40">Active</span>
                                                )}
                                            </div>
                                            <div className="mt-1 text-[11px] text-gray-400 line-clamp-2 min-h-[1.5rem]">
                                                {hasContent ? slot.content : 'No plan saved yet'}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-3">
                                <textarea
                                    value={data.current_content}
                                    onChange={(e) => setData('current_content', e.target.value)}
                                    rows={6}
                                    placeholder="Example: \nDay 1 – Chest & Triceps\nDay 2 – Back & Biceps\nDay 3 – Legs & Shoulders\n+ 10–15 minutes of light cardio each session."
                                    className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:border-blue-500 focus:outline-none"
                                />
                                <div className="flex items-center justify-end gap-3">
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="cursor-pointer rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        {processing ? 'Saving...' : 'Save Plan'}
                                    </button>
                                </div>
                            </form>
                        </div>

                        <div>
                            <h2 className="text-base font-semibold mb-1">Suggested templates</h2>
                            <p className="text-xs text-gray-400 mb-4">
                                These sample plans can give you ideas. Feel free to copy any parts you like into your own plan above.
                            </p>

                            <div className="grid gap-4 md:grid-cols-3">
                            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 flex flex-col">
                                <h3 className="text-sm font-semibold text-gray-100 mb-1">Strength Focus</h3>
                                <p className="text-[11px] text-gray-400 mb-2">3 days / week · Compound lifts</p>
                                <ul className="mb-3 space-y-1 text-[11px] text-gray-400 list-disc list-inside">
                                    <li>Squats &amp; deadlifts</li>
                                    <li>Bench &amp; overhead press</li>
                                </ul>
                                <span className="mt-auto inline-flex w-max rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-300 border border-emerald-500/40">Recommended</span>
                            </div>

                            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 flex flex-col">
                                <h3 className="text-sm font-semibold text-gray-100 mb-1">Fat Loss</h3>
                                <p className="text-[11px] text-gray-400 mb-2">4 days / week · Mix of weights &amp; cardio</p>
                                <ul className="mb-3 space-y-1 text-[11px] text-gray-400 list-disc list-inside">
                                    <li>Full-body circuits</li>
                                    <li>Interval bike / treadmill</li>
                                </ul>
                                <span className="mt-auto inline-flex w-max rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-300 border border-amber-500/40">Popular</span>
                            </div>

                            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 flex flex-col">
                                <h3 className="text-sm font-semibold text-gray-100 mb-1">Beginner Friendly</h3>
                                <p className="text-[11px] text-gray-400 mb-2">2–3 days / week · Machine based</p>
                                <ul className="mb-3 space-y-1 text-[11px] text-gray-400 list-disc list-inside">
                                    <li>Guided machines only</li>
                                    <li>Focus on form and safety</li>
                                </ul>
                                <span className="mt-auto inline-flex w-max rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] text-blue-300 border border-blue-500/40">Great for new members</span>
                            </div>
                            </div>

                            <p className="mt-4 text-[11px] text-gray-500">
                                In the future, this page can also track completed workouts and adapt suggestions based on your activity.
                            </p>
                        </div>
                    </section>
                </main>
            </div>
        </>
    );
}

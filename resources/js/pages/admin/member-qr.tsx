import { Head } from '@inertiajs/react';
import React from 'react';

interface MemberProps {
    id: number;
    fullName: string;
    email?: string | null;
    phone?: string | null;
    plan?: string;
    endDate: string;
    qrCode: string;
    avatarUrl?: string | null;
}

interface Props {
    member: MemberProps;
}

export default function AdminMemberQR({ member }: Props) {
    const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const handlePrint = (e: React.MouseEvent) => {
        e.preventDefault();
        window.print();
    };

    return (
        <>
            <Head title="Member QR ID" />
            <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-gray-200 flex items-center justify-center p-4">
                <div className="w-full max-w-sm">
                    <div className="mb-4 flex justify-between items-center print:hidden">
                        <div>
                            <h1 className="text-lg font-semibold">Member QR ID</h1>
                            <p className="text-xs text-gray-400">Use this card to print and give to the member.</p>
                        </div>
                        <button
                            type="button"
                            onClick={handlePrint}
                            className="cursor-pointer inline-flex items-center px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs hover:bg-blue-700"
                        >
                            Print QR ID
                        </button>
                    </div>

                    <div
                        id="member-id-card"
                        className="mx-auto w-full max-w-sm rounded-2xl bg-gradient-to-br from-blue-50 via-white to-blue-50 p-6 shadow-2xl print:shadow-none print:border print:border-gray-300 relative overflow-hidden"
                    >
                        {/* Decorative background pattern */}
                        <div className="absolute inset-0 opacity-5">
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
                                <div className="text-[11px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full inline-block font-medium mt-1">
                                    ID: {member.id}
                                </div>
                                {member.plan && (
                                    <div className="text-[11px] text-green-600 bg-green-50 px-2 py-0.5 rounded-full inline-block font-medium mt-1">
                                        {member.plan}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Member contact info */}
                        <div className="mb-3 space-y-0.5 text-[10px] text-gray-600 relative z-10">
                            <div>Phone: {member.phone || 'N/A'}</div>
                            <div>Email: {member.email || 'N/A'}</div>
                            <div>Valid until: {formatDate(member.endDate)}</div>
                        </div>

                        {/* QR block */}
                        <div className="mb-3 rounded-xl border border-gray-200 bg-gray-50 p-4 relative z-10">
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
                        <div className="space-y-0.5 text-center text-[10px] text-gray-600 relative z-10">
                            <div>Scan at gym scanner to time in / time out.</div>
                            <div>Keep this card private. Do not share with others.</div>
                            <div>Membership valid until {formatDate(member.endDate)}.</div>
                            <div className="mt-1 text-[9px] uppercase tracking-wide text-gray-500">For internal use only</div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

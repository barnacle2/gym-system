import { Head, router, useForm } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
import MemberForm, { FormData as FormDataType, Member as MemberType } from '@/components/gym/member-form';
import KPIs from '@/components/gym/kpis';
import Filters from '@/components/gym/filters';
import MembersTable from '@/components/gym/members-table';

interface Member {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    plan: 'Daily' | 'Monthly' | 'Quarterly' | 'Semi-Annual' | 'Annual';
    startDate: string;
    endDate: string;
    notes: string;
    inactive: boolean;
    createdAt: string;
    updatedAt: string;
    renewals: number;
    hasUserAccount: boolean;
    userId: string | null;
    qrCode?: string;
}

interface MemberStatus {
    code: 'ACTIVE' | 'EXPIRING' | 'EXPIRED' | 'INACTIVE';
    label: string;
    className: string;
    daysLeft: number | null;
}

interface RecentSession {
    id: number;
    user: { id: number; name: string; email: string };
    time_in: string | null;
    time_out: string | null;
    duration: string;
    is_active: boolean;
}

interface Props {
    members: Member[];
    recentSessions?: RecentSession[];
    activeSessionsToday?: number;
}

export default function GymDashboard({ members: initialMembers, recentSessions = [], activeSessionsToday = 0 }: Props) {
    const { post } = useForm();
    const [members, setMembers] = useState<MemberType[]>(initialMembers as MemberType[]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [filterPlan, setFilterPlan] = useState('ALL');
    const [filterDays, setFilterDays] = useState(0);
    const [formData, setFormData] = useState<FormDataType>({
        id: '',
        fullName: '',
        email: '',
        phone: '',
        plan: 'Monthly',
        startDate: new Date().toISOString().slice(0, 10),
        endDate: '',
        notes: '',
    });
    const [isEditing, setIsEditing] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showEditSuccess, setShowEditSuccess] = useState(false);
    const [showRenewSuccess, setShowRenewSuccess] = useState(false);
    const [showDeactivateSuccess, setShowDeactivateSuccess] = useState(false);
    const [lastMemberName, setLastMemberName] = useState('');
    const [editingMemberName, setEditingMemberName] = useState('');
    const [renewedMemberName, setRenewedMemberName] = useState('');
    const [deactivatedMemberName, setDeactivatedMemberName] = useState('');
    const [isDeactivating, setIsDeactivating] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showDeleteSuccess, setShowDeleteSuccess] = useState(false);
    const [memberToDelete, setMemberToDelete] = useState<{id: string, name: string} | null>(null);
    const [deletedMemberName, setDeletedMemberName] = useState('');
    const [lastEditedId, setLastEditedId] = useState<string | null>(null);
    const [pendingScrollToNew, setPendingScrollToNew] = useState(false);
    const formRef = useRef<HTMLDivElement>(null);
    const memberRowRefs = useRef<Record<string, HTMLTableRowElement | null>>({});

    const handleLogout = (e: React.FormEvent) => {
        e.preventDefault();
        post('/logout');
    };

    // Utility functions
    const formatDate = (dateStr: string) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: '2-digit'
        });
    };

    const addMonths = (date: Date, months: number) => {
        const d = new Date(date);
        const day = d.getDate();
        d.setMonth(d.getMonth() + months);
        if (d.getDate() < day) d.setDate(0);
        return d;
    };

    const autoEndDate = (plan: string, startDate: string) => {
        const start = new Date(startDate);
        const monthsMap: Record<string, number> = {
            'Daily': 0,
            'Monthly': 1,
            'Quarterly': 3,
            'Semi-Annual': 6,
            'Annual': 12
        };
        const months = monthsMap[plan] || 1;
        if (months === 0) {
            return start.toISOString().slice(0, 10);
        }
        const endDate = addMonths(start, months);
        return endDate.toISOString().slice(0, 10);
    };

    const computeStatus = (member: Member): MemberStatus => {
        if (member.inactive) {
            return { code: 'INACTIVE', label: 'Inactive', className: 'inactive', daysLeft: null };
        }

        const now = new Date();
        const end = new Date(member.endDate);
        const diffTime = end.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return { code: 'EXPIRED', label: 'Expired', className: 'expired', daysLeft: diffDays };
        }
        if (diffDays <= 7) {
            return { code: 'EXPIRING', label: `Expiring (${diffDays}d)`, className: 'expiring', daysLeft: diffDays };
        }
        return { code: 'ACTIVE', label: 'Active', className: 'active', daysLeft: diffDays };
    };

    // Update members when props change
    useEffect(() => {
        setMembers(initialMembers);
    }, [initialMembers]);

    // After creating a new member, find the newest one and remember its ID for scrolling
    useEffect(() => {
        if (!pendingScrollToNew || members.length === 0) return;

        const newest = [...members].sort((a, b) => {
            const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return bDate - aDate;
        })[0];

        if (newest) {
            setLastEditedId(newest.id);
        }

        setPendingScrollToNew(false);
    }, [pendingScrollToNew, members]);

    // Filter members based on current filters
    const filteredMembers = members
        .filter(member => {
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch = searchTerm === '' ||
                member.fullName.toLowerCase().includes(searchLower) ||
                member.email.toLowerCase().includes(searchLower) ||
                member.phone.toLowerCase().includes(searchLower);

            const status = computeStatus(member);
            const matchesStatus = filterStatus === 'ALL' || status.code === filterStatus;
            const matchesPlan = filterPlan === 'ALL' || member.plan === filterPlan;

            let matchesDays = true;
            if (filterDays > 0) {
                const now = new Date();
                const end = new Date(member.endDate);
                const diffDays = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                matchesDays = diffDays >= 0 && diffDays <= filterDays;
            }

            return matchesSearch && matchesStatus && matchesPlan && matchesDays;
        });

    // Calculate KPIs
    const membersWithStatus = members.map(member => ({
        ...member,
        status: computeStatus(member)
    }));

    const kpis = {
        active: membersWithStatus.filter(m => m.status.code === 'ACTIVE').length,
        expiring: membersWithStatus.filter(m => m.status.code === 'EXPIRING').length,
        expired: membersWithStatus.filter(m => m.status.code === 'EXPIRED').length,
        total: members.length
    };

    // Form handlers
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const data = {
            full_name: formData.fullName,
            email: formData.email,
            phone: formData.phone,
            plan: formData.plan,
            start_date: formData.startDate,
            end_date: formData.endDate || autoEndDate(formData.plan, formData.startDate),
            notes: formData.notes,
        };

        if (formData.id) {
            router.put(`/members/${formData.id}`, data, {
                onSuccess: () => {
                    setShowEditSuccess(true);
                    resetForm();
                }
            });
        } else {
            router.post('/members', data, {
                preserveScroll: true,
                onSuccess: () => {
                    setLastMemberName(formData.fullName || 'New member');
                    setShowSuccessModal(true);
                    setPendingScrollToNew(true);
                    resetForm();
                }
            });
        }
    };

    const resetForm = () => {
        setFormData({
            id: '',
            fullName: '',
            email: '',
            phone: '',
            plan: 'Monthly',
            startDate: new Date().toISOString().slice(0, 10),
            endDate: '',
            notes: '',
        });
        setIsEditing(false);
    };

    const editMember = (member: Member) => {
        setFormData({
            id: member.id,
            fullName: member.fullName,
            email: member.email,
            phone: member.phone,
            plan: member.plan,
            startDate: member.startDate,
            endDate: member.endDate,
            notes: member.notes,
        });
        setEditingMemberName(member.fullName);
        setLastEditedId(member.id);
        setIsEditing(true);

        // Scroll to the form after a short delay to allow the state to update
        setTimeout(() => {
            formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    };

    const scrollToMember = (id: string) => {
        // Wait for the next tick to ensure the DOM is updated
        setTimeout(() => {
            const row = memberRowRefs.current?.[id];
            if (row) {
                // First, scroll to the top of the page to ensure we can scroll down to the member
                window.scrollTo({ top: 0, behavior: 'smooth' });
                
                // Then scroll to the member row
                setTimeout(() => {
                    row.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    
                    // Add a highlight effect
                    row.classList.add('bg-blue-500/10', 'transition-colors', 'duration-1000');
                    
                    // Remove the highlight after 2 seconds
                    setTimeout(() => {
                        row.classList.remove('bg-blue-500/10');
                    }, 2000);
                }, 300);
            }
        }, 100);
    };

    const toggleMemberStatus = (id: string) => {
        const member = members.find(m => m.id === id);
        if (member) {
            setDeactivatedMemberName(member.fullName);
            setLastEditedId(id);
            setIsDeactivating(!member.inactive);
            
            router.patch(`/members/${id}/toggle-status`, {}, { 
                preserveScroll: true,
                onSuccess: () => {
                    setShowDeactivateSuccess(true);
                    router.reload({ only: ['members'] });
                }
            });
        }
    };

    const sendPasswordReset = (id: string) => {
        // Navigate admin to the dedicated reset password page
        router.visit(`/admin/members/${id}/reset-password`);
    };

    const renewMember = (id: string) => {
        const member = members.find(m => m.id === id);
        if (member) {
            setRenewedMemberName(member.fullName);
            setLastEditedId(id); // Store the member ID for scrolling
            router.patch(`/members/${id}/renew`, {}, {
                onSuccess: () => {
                    setShowRenewSuccess(true);
                    // Refresh members data
                    router.reload({ only: ['members'] });
                }
            });
        }
    };

    const deleteMember = (id: string) => {
        const member = members.find(m => m.id === id);
        if (member) {
            setMemberToDelete({ id, name: member.fullName });
            setShowDeleteConfirm(true);
        }
    };

    const confirmDelete = () => {
        if (!memberToDelete) return;
        
        setDeletedMemberName(memberToDelete.name);
        
        router.delete(`/members/${memberToDelete.id}`, {
            onSuccess: () => {
                setShowDeleteConfirm(false);
                setShowDeleteSuccess(true);
                // We'll handle the refresh after showing success
            },
            onError: () => {
                setShowDeleteConfirm(false);
            },
            preserveScroll: true
        });
    };
    
    const handleDeleteSuccessClose = () => {
        // Just close the success modal; the members list has already been
        // updated by the Inertia delete response (with preserveScroll)
        setShowDeleteSuccess(false);
    };

    return (
        <>
            <Head title="Gym Dashboard" />

            <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-gray-200">
                {/* Header */}
                <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/80 px-6 py-3 backdrop-blur-sm">
                    <div className="mx-auto flex max-w-7xl items-center justify-between">
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-3">
                                <h1 className="text-xl font-semibold tracking-wide">Fitness Point Dashboard</h1>
                                <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-3 py-0.5 text-xs font-medium text-emerald-300 border border-emerald-500/25">
                                    Admin View
                                </span>
                            </div>
                            <p className="text-xs text-gray-500">
                                Manage memberships, monitor sessions, and keep your gym running smoothly.
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <a
                                href="/admin/balances"
                                className="cursor-pointer px-4 py-2 rounded-full bg-blue-600 text-white text-sm shadow-sm hover:bg-blue-500"
                            >
                                Balance Management
                            </a>
                            <a
                                href="/admin/time-logs"
                                className="cursor-pointer px-4 py-2 rounded-full bg-purple-600 text-white text-sm shadow-sm hover:bg-purple-500"
                            >
                                View Time Logs
                            </a>
                            <a
                                href="/admin/transactions"
                                className="cursor-pointer px-4 py-2 rounded-full bg-emerald-600 text-white text-sm shadow-sm hover:bg-emerald-500"
                            >
                                Transactions
                            </a>
                            <a
                                href="/admin/reports"
                                className="cursor-pointer px-4 py-2 rounded-full bg-orange-600 text-white text-sm shadow-sm hover:bg-orange-500"
                            >
                                Reports
                            </a>
                            <button
                                onClick={handleLogout}
                                className="cursor-pointer px-4 py-2 rounded-full bg-slate-800 text-gray-200 text-sm hover:bg-slate-700"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </header>

                {/* Main content */}
                <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px,minmax(0,1fr)]">
                        {/* Left Panel - Member form card */}
                        <aside ref={formRef} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 shadow-lg shadow-slate-950/40">
                            <div className="mb-4 flex items-start justify-between gap-2">
                                <div>
                                    <h2 className="text-sm font-semibold text-gray-100">Member form</h2>
                                    <p className="mt-1 text-xs text-gray-500">
                                        Create a new member or select one from the list to edit their details.
                                    </p>
                                </div>
                                <span className="rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-medium text-gray-400 border border-slate-700">
                                    {isEditing ? 'Editing' : 'New member'}
                                </span>
                            </div>

                            <MemberForm
                                formData={formData}
                                setFormData={setFormData}
                                isEditing={isEditing}
                                resetForm={resetForm}
                                handleSubmit={handleSubmit}
                                toggleMemberStatus={toggleMemberStatus}
                                members={members as MemberType[]}
                            />
                        </aside>

                        {/* Right Panel - Dashboard */}
                        <section className="rounded-2xl border border-slate-800 bg-slate-950/70 shadow-lg shadow-slate-950/40 overflow-hidden">
                            <Filters
                                searchTerm={searchTerm}
                                setSearchTerm={setSearchTerm}
                                filterStatus={filterStatus}
                                setFilterStatus={setFilterStatus}
                                filterPlan={filterPlan}
                                setFilterPlan={setFilterPlan}
                                filterDays={filterDays}
                                setFilterDays={setFilterDays}
                            />

                            <div className="p-4 sm:p-5 lg:p-6">
                                <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                    <div className="flex flex-col gap-1">
                                        <h2 className="text-sm font-semibold text-gray-100">Members overview</h2>
                                        <p className="text-xs text-gray-500">Track active subscriptions and quickly jump into recent sessions.</p>
                                    </div>
                                    <a
                                        href="/admin/time-logs?active=1"
                                        className="cursor-pointer inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-medium text-emerald-300 hover:bg-emerald-500/15"
                                        title="View today's active sessions"
                                    >
                                        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                                        Active sessions today: <span className="font-semibold">{activeSessionsToday}</span>
                                    </a>
                                </div>

                                <div className="flex flex-col gap-4 lg:flex-row">
                                    <div className="flex-1 min-w-0">
                                        <KPIs members={members as MemberType[]} kpis={kpis} />
                                    </div>
                                </div>

                                {/* Members list + Recent Activity */}
                                <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2.4fr),minmax(0,1fr)]">
                                    <div className="rounded-xl border border-slate-800 bg-slate-950/60">
                                        <MembersTable
                                            members={members}
                                            filteredMembers={filteredMembers}
                                            computeStatus={computeStatus}
                                            editMember={editMember}
                                            renewMember={renewMember}
                                            toggleMemberStatus={toggleMemberStatus}
                                            sendPasswordReset={sendPasswordReset}
                                            formatDate={formatDate}
                                            deleteMember={deleteMember}
                                            memberRowRefs={memberRowRefs}
                                        />
                                    </div>
                                    <aside className="flex flex-col rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                                        <div className="mb-3 flex items-center justify-between">
                                            <h3 className="text-sm font-semibold text-gray-100">Recent Activity</h3>
                                            <a
                                                href="/admin/time-logs"
                                                className="text-[11px] font-medium text-blue-400 hover:text-blue-300"
                                            >
                                                View all
                                            </a>
                                        </div>
                                        <ul className="flex-1 space-y-3 overflow-y-auto text-sm max-h-72 pr-1">
                                            {recentSessions.length === 0 && (
                                                <li className="text-xs text-gray-500">No recent sessions.</li>
                                            )}
                                            {recentSessions.map((s) => (
                                                <li
                                                    key={s.id}
                                                    className="flex items-start justify-between gap-3 rounded-lg bg-slate-900/80 px-3 py-2"
                                                >
                                                    <div>
                                                        <div className="text-gray-100 text-xs font-medium">{s.user.name}</div>
                                                        <div className="mt-0.5 text-[11px] text-gray-400">
                                                            {s.time_in ? new Date(s.time_in).toLocaleString() : '-'}
                                                            {s.time_out && (
                                                                <>
                                                                    {' '}→ {new Date(s.time_out).toLocaleTimeString()}
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div
                                                        className={`text-[10px] px-2 py-1 rounded-full border ${
                                                            s.is_active
                                                                ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                                                                : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                                                        }`}
                                                    >
                                                        {s.is_active ? 'Active' : 'Closed'} · {s.duration}
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </aside>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
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
                            <h2 className="text-lg font-semibold text-gray-100">Member registered successfully</h2>
                            <p className="text-sm text-gray-400">
                                {lastMemberName ? (
                                    <>You just added <span className="font-medium text-gray-200">{lastMemberName}</span> to the gym members list.</>
                                ) : (
                                    <>A new member has been added to the gym members list.</>
                                )}
                            </p>
                        </div>
                        <div className="mt-5 flex items-center justify-center gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowSuccessModal(false);
                                    if (lastEditedId) {
                                        setTimeout(() => {
                                            scrollToMember(lastEditedId);
                                        }, 100);
                                    }
                                }}
                                className="cursor-pointer px-4 py-2 rounded-lg bg-emerald-600 text-sm font-medium text-white hover:bg-emerald-500"
                            >
                                Got it
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showEditSuccess && (
                <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="relative w-full max-w-md rounded-2xl border border-emerald-500/30 bg-slate-950/95 p-6 shadow-2xl">
                        <div className="absolute inset-x-10 -top-6 flex justify-center">
                            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/90 text-slate-950 shadow-lg">
                                <span className="text-2xl">✓</span>
                            </div>
                        </div>
                        <div className="mt-4 text-center space-y-2">
                            <h2 className="text-lg font-semibold text-gray-100">Member updated successfully</h2>
                            <p className="text-sm text-gray-400">
                                {editingMemberName ? (
                                    <>Details for <span className="font-medium text-gray-200">{editingMemberName}</span> have been updated.</>
                                ) : (
                                    <>Member details have been successfully updated.</>
                                )}
                            </p>
                        </div>
                        <div className="mt-5 flex items-center justify-center gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowEditSuccess(false);
                                    if (lastEditedId) {
                                        setTimeout(() => {
                                            scrollToMember(lastEditedId);
                                        }, 100);
                                    }
                                }}
                                className="cursor-pointer px-4 py-2 rounded-lg bg-emerald-600 text-sm font-medium text-white hover:bg-emerald-500"
                            >
                                Got it
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showRenewSuccess && (
                <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="relative w-full max-w-md rounded-2xl border border-emerald-500/30 bg-slate-950/95 p-6 shadow-2xl">
                        <div className="absolute inset-x-10 -top-6 flex justify-center">
                            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/90 text-slate-950 shadow-lg">
                                <span className="text-2xl">✓</span>
                            </div>
                        </div>
                        <div className="mt-4 text-center space-y-2">
                            <h2 className="text-lg font-semibold text-gray-100">Membership Renewed</h2>
                            <p className="text-sm text-gray-400">
                                {renewedMemberName ? (
                                    <><span className="font-medium text-gray-200">{renewedMemberName}</span>'s membership has been successfully renewed.</>
                                ) : (
                                    <>Membership has been successfully renewed.</>
                                )}
                            </p>
                        </div>
                        <div className="mt-5 flex items-center justify-center gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowRenewSuccess(false);
                                    if (lastEditedId) {
                                        // Scroll to the renewed member after a short delay
                                        setTimeout(() => {
                                            scrollToMember(lastEditedId);
                                        }, 100);
                                    }
                                }}
                                className="cursor-pointer px-4 py-2 rounded-lg bg-emerald-600 text-sm font-medium text-white hover:bg-emerald-500"
                            >
                                Got it
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showDeactivateSuccess && ( // Modal for deactivate success
                <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="relative w-full max-w-md rounded-2xl border border-emerald-500/30 bg-slate-950/95 p-6 shadow-2xl">
                        <div className="absolute inset-x-10 -top-6 flex justify-center">
                            <div className={`inline-flex h-12 w-12 items-center justify-center rounded-full ${isDeactivating ? 'bg-amber-500/90' : 'bg-emerald-500/90'} text-slate-950 shadow-lg`}>
                                <span className="text-2xl">✓</span>
                            </div>
                        </div>
                        <div className="mt-4 text-center space-y-2">
                            <h2 className="text-lg font-semibold text-gray-100">
                                {isDeactivating ? 'Account Deactivated' : 'Account Activated'}
                            </h2>
                            <p className="text-sm text-gray-400">
                                {deactivatedMemberName ? (
                                    <>
                                        <span className="font-medium text-gray-200">{deactivatedMemberName}</span>'s account has been {isDeactivating ? 'deactivated' : 'activated'} successfully.
                                    </>
                                ) : (
                                    <>Account has been {isDeactivating ? 'deactivated' : 'activated'} successfully.</>
                                )}
                            </p>
                        </div>
                        <div className="mt-5 flex items-center justify-center gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowDeactivateSuccess(false);
                                    if (lastEditedId) {
                                        setTimeout(() => {
                                            scrollToMember(lastEditedId);
                                        }, 100);
                                    }
                                }}
                                className="cursor-pointer px-4 py-2 rounded-lg bg-emerald-600 text-sm font-medium text-white hover:bg-emerald-500"
                            >
                                Got it
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showDeleteConfirm && memberToDelete && ( // Modal for delete confirmation
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="relative w-full max-w-md rounded-2xl border border-red-500/30 bg-slate-950/95 p-6 shadow-2xl">
                        <div className="absolute inset-x-10 -top-6 flex justify-center">
                            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-500/90 text-slate-950 shadow-lg">
                                <span className="text-2xl">!</span>
                            </div>
                        </div>
                        <div className="mt-4 text-center space-y-2">
                            <h2 className="text-lg font-semibold text-gray-100">
                                Delete Member Account
                            </h2>
                            <p className="text-sm text-gray-400">
                                Are you sure you want to delete <span className="font-medium text-gray-200">{memberToDelete.name}</span>'s account? This action cannot be undone.
                            </p>
                        </div>
                        <div className="mt-5 flex items-center justify-center gap-3">
                            <button
                                type="button"
                                onClick={() => setShowDeleteConfirm(false)}
                                className="cursor-pointer px-4 py-2 rounded-lg bg-gray-600 text-sm font-medium text-white hover:bg-gray-500"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={confirmDelete}
                                className="cursor-pointer px-4 py-2 rounded-lg bg-red-600 text-sm font-medium text-white hover:bg-red-500"
                            >
                                Yes, Delete Account
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showDeleteSuccess && ( // Modal for delete success
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                    <div className="relative w-full max-w-md rounded-2xl border border-emerald-500/30 bg-slate-950/95 p-6 shadow-2xl">
                        <div className="absolute inset-x-10 -top-6 flex justify-center">
                            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/90 text-slate-950 shadow-lg">
                                <span className="text-2xl">✓</span>
                            </div>
                        </div>
                        <div className="mt-4 text-center space-y-2">
                            <h2 className="text-lg font-semibold text-gray-100">
                                Account Deleted Successfully
                            </h2>
                            <p className="text-sm text-gray-400">
                                <span className="font-medium text-gray-200">{deletedMemberName}</span>'s account has been permanently deleted.
                            </p>
                        </div>
                        <div className="mt-5 flex items-center justify-center gap-3">
                            <button
                                type="button"
                                onClick={handleDeleteSuccessClose}
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

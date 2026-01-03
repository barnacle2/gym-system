import React, { useState, useMemo, useEffect } from 'react';
import type { Member } from './member-form';

type MemberStatus = {
  code: 'ACTIVE' | 'EXPIRING' | 'EXPIRED' | 'INACTIVE';
  label: string;
  className: string;
  daysLeft: number | null;
};

type Props = {
  members: Member[];
  filteredMembers: Member[];
  computeStatus: (m: Member) => MemberStatus;
  editMember: (m: Member) => void;
  renewMember: (id: string) => void;
  toggleMemberStatus: (id: string) => void;
  sendPasswordReset: (id: string) => void;
  formatDate: (s: string) => string;
  deleteMember: (id: string) => void;
  memberRowRefs: React.RefObject<Record<string, HTMLTableRowElement | null>>;
  filterStatus: string;
  setFilterStatus: (v: string) => void;
  filterPlan: string;
  setFilterPlan: (v: string) => void;
  filterDays: number;
  setFilterDays: (v: number) => void;
};

export default function MembersTable({ members, filteredMembers, computeStatus, editMember, renewMember, toggleMemberStatus, sendPasswordReset, formatDate, deleteMember, memberRowRefs, filterStatus, setFilterStatus, filterPlan, setFilterPlan, filterDays, setFilterDays }: Props) {
  const [searchTerm, setSearchTerm] = useState('');

  const displayedMembers = useMemo(() => {
    if (!searchTerm) return filteredMembers;
    const lower = searchTerm.toLowerCase();
    return filteredMembers.filter(m =>
      m.fullName?.toLowerCase().includes(lower) ||
      m.email?.toLowerCase().includes(lower)
    );
  }, [filteredMembers, searchTerm]);

  // Initialize refs for member rows
  useEffect(() => {
    // Initialize the refs object if it doesn't exist
    if (memberRowRefs.current === null) {
      memberRowRefs.current = {};
    }

    // Ensure all displayed members have a ref
    displayedMembers.forEach(member => {
      if (!memberRowRefs.current[member.id]) {
        memberRowRefs.current[member.id] = null;
      }
    });
  }, [displayedMembers, memberRowRefs]);

  return (
    <div className="p-4">
      <div className="mb-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-100">Member Overview</h3>
          <span className="md:hidden text-[10px] text-gray-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
            {displayedMembers.length} members
          </span>
        </div>

        <div className="flex flex-col gap-3">
          {/* Search Bar - Full width on mobile */}
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900 border border-slate-700 rounded-xl text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all"
            />
            <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Filters Grid - 2x2 on mobile, single row on desktop */}
          <div className="grid grid-cols-2 lg:flex lg:flex-row gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full lg:w-auto px-3 py-2 bg-slate-950 border border-gray-700 rounded-xl text-[11px] text-gray-200 focus:outline-none focus:border-blue-500 transition-all cursor-pointer"
            >
              <option value="ALL">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="EXPIRING">Expiring soon</option>
              <option value="EXPIRED">Expired</option>
              <option value="INACTIVE">Inactive</option>
            </select>
            <select
              value={filterPlan}
              onChange={(e) => setFilterPlan(e.target.value)}
              className="w-full lg:w-auto px-3 py-2 bg-slate-950 border border-gray-700 rounded-xl text-[11px] text-gray-200 focus:outline-none focus:border-blue-500 transition-all cursor-pointer"
            >
              <option value="ALL">All plans</option>
              <option value="Daily">Daily</option>
              <option value="Monthly">Monthly</option>
            </select>
            <select
              value={filterDays}
              onChange={(e) => setFilterDays(parseInt(e.target.value))}
              className="w-full lg:w-auto col-span-2 lg:col-span-1 px-3 py-2 bg-slate-950 border border-gray-700 rounded-xl text-[11px] text-gray-200 focus:outline-none focus:border-blue-500 transition-all cursor-pointer"
            >
              <option value={0}>All dates</option>
              <option value={7}>Expiring in 7 days</option>
              <option value={14}>Expiring in 14 days</option>
              <option value={30}>Expiring in 30 days</option>
            </select>
          </div>
        </div>
      </div>
      <div className="overflow-x-auto hidden md:block">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left text-xs font-bold text-gray-400 p-3">Member</th>
              <th className="text-left text-xs font-bold text-gray-400 p-3">Plan</th>
              <th className="text-left text-xs font-bold text-gray-400 p-3">Start</th>
              <th className="text-left text-xs font-bold text-gray-400 p-3">End</th>
              <th className="text-left text-xs font-bold text-gray-400 p-3">Status</th>
              <th className="text-left text-xs font-bold text-gray-400 p-3">Notes</th>
              <th className="text-right text-xs font-bold text-gray-400 p-3">Actions</th>
            </tr>
          </thead>
          <tbody className="space-y-2">
            {displayedMembers.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center text-gray-500 p-8">No members found. Add a member or adjust filters.</td>
              </tr>
            ) : (
              displayedMembers.map(member => {
                const status = computeStatus(member);
                return (
                  <tr
                    key={member.id}
                    ref={el => {
                      if (memberRowRefs.current) {
                        memberRowRefs.current[member.id] = el;
                      }
                    }}
                    className="bg-slate-950/80 border border-gray-700"
                  >
                    <td className="p-3 border-l border-gray-700 rounded-l-xl align-top">
                      <div className="space-y-1">
                        <div className="text-sm font-semibold text-gray-100 truncate max-w-[220px]">
                          {member.fullName || '(No name)'}
                        </div>
                        {(member.email || member.phone) && (
                          <div className="text-[11px] leading-snug text-gray-400 space-y-0.5 max-w-[260px]">
                            {member.email && (
                              <div className="truncate" title={member.email}>
                                {member.email}
                              </div>
                            )}
                            {member.phone && (
                              <div className="truncate" title={member.phone}>
                                {member.phone}
                              </div>
                            )}
                          </div>
                        )}
                        {member.email && (
                          <div className="pt-0.5">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] ${member.hasUserAccount
                                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/40'
                                : 'bg-slate-800 text-gray-300 border-slate-600'
                                }`}
                            >
                              <span className="text-xs">
                                {member.hasUserAccount ? '✓' : '✗'}
                              </span>
                              <span>{member.hasUserAccount ? 'Login access' : 'No login'}</span>
                            </span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="bg-slate-950 border border-gray-600 text-gray-400 px-2 py-1 rounded-full text-xs">{member.plan}</span>
                    </td>
                    <td className="p-3 text-sm">{formatDate(member.startDate)}</td>
                    <td className="p-3 text-sm">
                      {member.plan === 'Daily' ? 'Present (Daily)' : formatDate(member.endDate)}
                    </td>
                    <td className="p-3 whitespace-nowrap min-w-[120px]">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs border whitespace-nowrap ${status.className === 'active' ? 'bg-green-500/10 text-green-300 border-green-500/35' :
                        status.className === 'expiring' ? 'bg-amber-500/10 text-amber-300 border-amber-500/35' :
                          status.className === 'expired' ? 'bg-red-500/10 text-red-300 border-red-500/35' :
                            'bg-gray-500/10 text-gray-300 border-gray-500/35'
                        }`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="p-3 text-sm">{member.notes}</td>
                    <td className="p-3 border-r border-gray-700 rounded-r-xl">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => editMember(member)}
                          className="cursor-pointer px-3 py-1 bg-slate-950 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => renewMember(member.id)}
                          disabled={status.code !== 'EXPIRED'}
                          className={`cursor-pointer px-3 py-1 rounded-lg text-sm ${status.code === 'EXPIRED'
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-slate-800 text-gray-500 cursor-not-allowed opacity-50'
                            }`}
                        >
                          Renew
                        </button>
                        {member.hasUserAccount && member.userId && (
                          <a
                            href={`/admin/members/${member.userId}/qr`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="cursor-pointer px-3 py-1 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm flex items-center justify-center"
                          >
                            QR ID
                          </a>
                        )}
                        {member.hasUserAccount && member.email && (
                          <button
                            onClick={() => sendPasswordReset(member.id)}
                            className="cursor-pointer px-3 py-1 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
                          >
                            Reset Password
                          </button>
                        )}
                        <button
                          onClick={() => deleteMember(member.id)}
                          className="cursor-pointer px-3 py-1 bg-red-600/20 text-red-300 border border-red-500/30 rounded-lg hover:bg-red-600 hover:text-white text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {displayedMembers.length === 0 ? (
          <div className="text-center text-gray-500 p-8 border border-dashed border-slate-800 rounded-xl">
            No members found.
          </div>
        ) : (
          displayedMembers.map(member => {
            const status = computeStatus(member);
            return (
              <div
                key={member.id}
                ref={el => {
                  if (memberRowRefs.current) {
                    memberRowRefs.current[member.id] = el as any;
                  }
                }}
                className="bg-slate-950/80 border border-gray-700 rounded-xl p-4 space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-base font-semibold text-gray-100 truncate">
                      {member.fullName || '(No name)'}
                    </div>
                    <div className="mt-1 text-xs text-gray-400 space-y-0.5">
                      {member.email && <div className="truncate">{member.email}</div>}
                      {member.phone && <div>{member.phone}</div>}
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-medium border whitespace-nowrap ${status.className === 'active' ? 'bg-green-500/10 text-green-300 border-green-500/35' :
                    status.className === 'expiring' ? 'bg-amber-500/10 text-amber-300 border-amber-500/35' :
                      status.className === 'expired' ? 'bg-red-500/10 text-red-300 border-red-500/35' :
                        'bg-gray-500/10 text-gray-300 border-gray-500/35'
                    }`}>
                    {status.label}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-800">
                    <div className="text-gray-500 mb-1 caps tracking-wider">PLAN</div>
                    <div className="text-gray-200 font-medium">{member.plan}</div>
                  </div>
                  <div className="bg-slate-900/50 p-2 rounded-lg border border-slate-800">
                    <div className="text-gray-500 mb-1 caps tracking-wider">EXPIRES</div>
                    <div className="text-gray-200 font-medium truncate">
                      {member.plan === 'Daily' ? 'Today' : formatDate(member.endDate)}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800">
                  <button
                    onClick={() => editMember(member)}
                    className="flex-1 min-w-[80px] px-3 py-2 bg-slate-900 border border-slate-700 text-gray-300 rounded-lg hover:bg-slate-800 text-xs font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => renewMember(member.id)}
                    disabled={status.code !== 'EXPIRED'}
                    className={`flex-1 min-w-[80px] px-3 py-2 rounded-lg text-xs font-medium ${status.code === 'EXPIRED'
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-slate-800 text-gray-500 cursor-not-allowed opacity-50'
                      }`}
                  >
                    Renew
                  </button>
                  {member.hasUserAccount && member.userId && (
                    <a
                      href={`/admin/members/${member.userId}/qr`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 min-w-[80px] px-3 py-2 bg-teal-600/20 text-teal-300 border border-teal-500/30 rounded-lg text-xs font-medium text-center"
                    >
                      QR ID
                    </a>
                  )}
                  <button
                    onClick={() => deleteMember(member.id)}
                    className="px-3 py-2 bg-red-600/10 text-red-400 border border-red-500/20 rounded-lg text-xs"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

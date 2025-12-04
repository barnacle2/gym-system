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
      <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <h3 className="text-sm font-semibold text-gray-100">Member Overview</h3>
        <div className="flex flex-wrap items-center gap-2 justify-end">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-56 pl-9 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-700 rounded-lg text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
            <svg className="absolute left-2.5 top-2 w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-2 py-1.5 bg-slate-950 border border-gray-600 rounded-lg text-[11px] text-gray-200 focus:outline-none focus:border-blue-500"
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
            className="px-2 py-1.5 bg-slate-950 border border-gray-600 rounded-lg text-[11px] text-gray-200 focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All plans</option>
            <option value="Daily">Daily</option>
            <option value="Monthly">Monthly</option>
            <option value="Quarterly">Quarterly</option>
            <option value="Semi-Annual">Semi-Annual</option>
            <option value="Annual">Annual</option>
          </select>
          <select
            value={filterDays}
            onChange={(e) => setFilterDays(parseInt(e.target.value))}
            className="px-2 py-1.5 bg-slate-950 border border-gray-600 rounded-lg text-[11px] text-gray-200 focus:outline-none focus:border-blue-500"
          >
            <option value={0}>All dates</option>
            <option value={7}>Expiring in 7 days</option>
            <option value={14}>Expiring in 14 days</option>
            <option value={30}>Expiring in 30 days</option>
          </select>
        </div>
      </div>
      <div className="overflow-x-auto">
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
                            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] ${
                              member.hasUserAccount
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
                    <span className={`inline-block px-3 py-1 rounded-full text-xs border whitespace-nowrap ${
                      status.className === 'active' ? 'bg-green-500/10 text-green-300 border-green-500/35' :
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
                        className="cursor-pointer px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
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
                        onClick={() => toggleMemberStatus(member.id)}
                        className="cursor-pointer px-3 py-1 bg-amber-600 text-black rounded-lg hover:bg-amber-700 text-sm"
                      >
                        {member.inactive ? 'Activate' : 'Deactivate'}
                      </button>
                      <button
                        onClick={() => deleteMember(member.id)}
                        className="cursor-pointer px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
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
    </div>
  );
}

import React from 'react';
import type { Member } from './member-form';

type Props = { members: Member[]; kpis: { active: number; expiring: number; expired: number; total: number } };

export default function KPIs({ members, kpis }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">
      <div className="bg-gradient-to-b from-slate-800/90 to-gray-800/90 border border-gray-700 rounded-2xl p-4">
        <h3 className="text-xs text-gray-400 mb-2">Active Members</h3>
        <div className="text-2xl font-bold">{kpis.active}</div>
        <div className="text-xs text-gray-500">{members.filter(m => { const thisMonth = new Date(); thisMonth.setDate(1); return new Date(m.createdAt) >= thisMonth; }).length} new registrations this month</div>
      </div>
      <div className="bg-gradient-to-b from-slate-800/90 to-gray-800/90 border border-gray-700 rounded-2xl p-4">
        <h3 className="text-xs text-gray-400 mb-2">Expiring Soon</h3>
        <div className="text-2xl font-bold">{kpis.expiring}</div>
        <div className="text-xs text-gray-500">Within 7 days</div>
      </div>
      <div className="bg-gradient-to-b from-slate-800/90 to-gray-800/90 border border-gray-700 rounded-2xl p-4">
        <h3 className="text-xs text-gray-400 mb-2">Expired</h3>
        <div className="text-2xl font-bold">{kpis.expired}</div>
        <div className="text-xs text-gray-500">{kpis.total} total members</div>
      </div>
    </div>
  );
}

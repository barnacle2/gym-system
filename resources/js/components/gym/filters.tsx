import React from 'react';

type Props = {
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  filterStatus: string;
  setFilterStatus: (v: string) => void;
  filterPlan: string;
  setFilterPlan: (v: string) => void;
  filterDays: number;
  setFilterDays: (v: number) => void;
};

export default function Filters({ searchTerm, setSearchTerm, filterStatus, setFilterStatus, filterPlan, setFilterPlan, filterDays, setFilterDays }: Props) {
  return (
    <div className="border-b border-gray-700 p-4 flex items-center justify-between flex-wrap gap-4">
      <span className="font-semibold">Dashboard</span>
      <div className="flex gap-2 flex-wrap">
        <input
          type="text"
          placeholder="Search name, email, phone..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-64 p-2 bg-slate-950 border border-gray-600 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm"
        />
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="p-2 bg-slate-950 border border-gray-600 rounded-lg text-gray-200 focus:outline-none focus:border-blue-500 text-sm">
          <option value="ALL">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="EXPIRING">Expiring soon</option>
          <option value="EXPIRED">Expired</option>
          <option value="INACTIVE">Inactive</option>
        </select>
        <select value={filterPlan} onChange={(e) => setFilterPlan(e.target.value)} className="p-2 bg-slate-950 border border-gray-600 rounded-lg text-gray-200 focus:outline-none focus:border-blue-500 text-sm">
          <option value="ALL">All plans</option>
          <option value="Daily">Daily</option>
          <option value="Monthly">Monthly</option>
          <option value="Quarterly">Quarterly</option>
          <option value="Semi-Annual">Semi-Annual</option>
          <option value="Annual">Annual</option>
        </select>
        <select value={filterDays} onChange={(e) => setFilterDays(parseInt(e.target.value))} className="p-2 bg-slate-950 border border-gray-600 rounded-lg text-gray-200 focus:outline-none focus:border-blue-500 text-sm">
          <option value={0}>All dates</option>
          <option value={7}>Expiring in 7 days</option>
          <option value={14}>Expiring in 14 days</option>
          <option value={30}>Expiring in 30 days</option>
        </select>
      </div>
    </div>
  );
}

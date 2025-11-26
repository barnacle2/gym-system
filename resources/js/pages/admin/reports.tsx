import React, { useState, useEffect } from 'react';
import { Head, usePage } from '@inertiajs/react';

interface Transaction {
  time: string;
  type: string;
  description: string;
  amount: number;
  balance_after: number;
}

interface DailyTotal {
  date: string;
  total: number;
  count: number;
}

interface TimeLog {
  id: number;
  member: string;
  time_in: string | null;
  time_out: string | null;
  duration: string;
  credits_used: number;
  is_active: boolean;
}

interface DailySession {
  date: string;
  sessions: number;
  hours: number;
}

interface MonthlySession {
  month: string;
  sessions: number;
  hours: number;
  members?: number;
}

interface TopMember {
  name: string;
  sessions: number;
  hours: number;
}

type TabType = 'sales-daily' | 'sales-monthly' | 'sales-annual' | 'time-daily' | 'time-monthly' | 'time-annual';

interface PageProps {
  activeTab: TabType;
  salesDaily?: {
    date: string;
    totalRevenue: number;
    dailyEarnings: number;
    transactionCount: number;
    transactions: Transaction[];
  };
  salesMonthly?: {
    month: string;
    totalRevenue: number;
    monthlyEarnings: number;
    transactionCount: number;
    dailyTotals: DailyTotal[];
  };
  salesAnnual?: {
    year: string;
    totalRevenue: number;
    annualEarnings: number;
    transactionCount: number;
    monthlyTotals: DailyTotal[];
  };
  timeDaily?: {
    date: string;
    totalSessions: number;
    activeSessions: number;
    totalHours: number;
    timeLogs: TimeLog[];
  };
  timeMonthly?: {
    month: string;
    totalSessions: number;
    totalHours: number;
    uniqueMembers: number;
    dailySessions: DailySession[];
  };
  timeAnnual?: {
    year: string;
    totalSessions: number;
    totalHours: number;
    uniqueMembers: number;
    monthlySessions: MonthlySession[];
    topMembers: TopMember[];
  };
  [key: string]: any; // Index signature for Inertia.js compatibility
}

export default function Reports() {
  const { props } = usePage<PageProps>();
  const [activeTab, setActiveTab] = useState<TabType>(props.activeTab || 'sales-daily');

  useEffect(() => {
    if (props.activeTab && props.activeTab !== activeTab) {
      setActiveTab(props.activeTab);
    }
  }, [props.activeTab]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    window.location.search = `?tab=${tab}`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'sales-daily':
        return (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-100">Daily Sales Report</h3>
            <p className="text-xs text-gray-400">Revenue from transactions and daily member earnings for {props.salesDaily?.date}.</p>
            
            {props.salesDaily && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
                    <div className="text-xs text-gray-400 mb-1">Total Revenue</div>
                    <div className="text-lg font-bold text-emerald-300">{formatCurrency(props.salesDaily.totalRevenue)}</div>
                  </div>
                  <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
                    <div className="text-xs text-gray-400 mb-1">Daily Member Earnings</div>
                    <div className="text-lg font-bold text-blue-300">{formatCurrency(props.salesDaily.dailyEarnings)}</div>
                  </div>
                  <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
                    <div className="text-xs text-gray-400 mb-1">Transactions</div>
                    <div className="text-lg font-bold text-purple-300">{props.salesDaily.transactionCount}</div>
                  </div>
                </div>

                <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
                  <h4 className="text-sm font-medium text-gray-200 mb-3">Recent Transactions</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-slate-700">
                          <th className="text-left p-2 text-gray-400">Time</th>
                          <th className="text-left p-2 text-gray-400">Description</th>
                          <th className="text-right p-2 text-gray-400">Amount</th>
                          <th className="text-right p-2 text-gray-400">Balance After</th>
                        </tr>
                      </thead>
                      <tbody>
                        {props.salesDaily.transactions.map((tx, i) => (
                          <tr key={i} className="border-b border-slate-800">
                            <td className="p-2">{tx.time}</td>
                            <td className="p-2">{tx.description}</td>
                            <td className="p-2 text-right">{formatCurrency(tx.amount)}</td>
                            <td className="p-2 text-right">{formatCurrency(tx.balance_after)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        );
      case 'sales-monthly':
        return (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-100">Monthly Sales Report</h3>
            <p className="text-xs text-gray-400">Revenue and transactions for {props.salesMonthly?.month}.</p>
            
            {props.salesMonthly && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
                    <div className="text-xs text-gray-400 mb-1">Total Revenue</div>
                    <div className="text-lg font-bold text-emerald-300">{formatCurrency(props.salesMonthly.totalRevenue)}</div>
                  </div>
                  <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
                    <div className="text-xs text-gray-400 mb-1">Member Earnings</div>
                    <div className="text-lg font-bold text-blue-300">{formatCurrency(props.salesMonthly.monthlyEarnings)}</div>
                  </div>
                  <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
                    <div className="text-xs text-gray-400 mb-1">Transactions</div>
                    <div className="text-lg font-bold text-purple-300">{props.salesMonthly.transactionCount}</div>
                  </div>
                </div>

                <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
                  <h4 className="text-sm font-medium text-gray-200 mb-3">Daily Breakdown</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {props.salesMonthly.dailyTotals.map((day, i) => (
                      <div key={i} className="flex justify-between items-center p-2 bg-slate-800/50 rounded">
                        <span className="text-xs text-gray-300">{day.date}</span>
                        <div className="text-right">
                          <div className="text-xs font-medium text-emerald-300">{formatCurrency(day.total)}</div>
                          <div className="text-[10px] text-gray-500">{day.count} tx</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        );
      case 'sales-annual':
        return (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-100">Annual Sales Report</h3>
            <p className="text-xs text-gray-400">Revenue and transactions for {props.salesAnnual?.year}.</p>
            
            {props.salesAnnual && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
                    <div className="text-xs text-gray-400 mb-1">Total Revenue</div>
                    <div className="text-lg font-bold text-emerald-300">{formatCurrency(props.salesAnnual.totalRevenue)}</div>
                  </div>
                  <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
                    <div className="text-xs text-gray-400 mb-1">Member Earnings</div>
                    <div className="text-lg font-bold text-blue-300">{formatCurrency(props.salesAnnual.annualEarnings)}</div>
                  </div>
                  <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
                    <div className="text-xs text-gray-400 mb-1">Transactions</div>
                    <div className="text-lg font-bold text-purple-300">{props.salesAnnual.transactionCount}</div>
                  </div>
                </div>

                <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
                  <h4 className="text-sm font-medium text-gray-200 mb-3">Monthly Breakdown</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {props.salesAnnual.monthlyTotals.map((month, i) => (
                      <div key={i} className="flex justify-between items-center p-2 bg-slate-800/50 rounded">
                        <span className="text-xs text-gray-300">{month.date}</span>
                        <div className="text-right">
                          <div className="text-xs font-medium text-emerald-300">{formatCurrency(month.total)}</div>
                          <div className="text-[10px] text-gray-500">{month.count} tx</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        );
      case 'time-daily':
        return (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-100">Daily Time Logs Report</h3>
            <p className="text-xs text-gray-400">Member check-ins and usage for {props.timeDaily?.date}.</p>
            
            {props.timeDaily && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
                    <div className="text-xs text-gray-400 mb-1">Total Sessions</div>
                    <div className="text-lg font-bold text-blue-300">{props.timeDaily.totalSessions}</div>
                  </div>
                  <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
                    <div className="text-xs text-gray-400 mb-1">Active Now</div>
                    <div className="text-lg font-bold text-amber-300">{props.timeDaily.activeSessions}</div>
                  </div>
                  <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
                    <div className="text-xs text-gray-400 mb-1">Total Hours</div>
                    <div className="text-lg font-bold text-purple-300">{props.timeDaily.totalHours}</div>
                  </div>
                </div>

                <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
                  <h4 className="text-sm font-medium text-gray-200 mb-3">Time Logs</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-slate-700">
                          <th className="text-left p-2 text-gray-400">Member</th>
                          <th className="text-left p-2 text-gray-400">Time In</th>
                          <th className="text-left p-2 text-gray-400">Time Out</th>
                          <th className="text-left p-2 text-gray-400">Duration</th>
                          <th className="text-right p-2 text-gray-400">Credits</th>
                          <th className="text-center p-2 text-gray-400">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {props.timeDaily.timeLogs.map((log, i) => (
                          <tr key={i} className="border-b border-slate-800">
                            <td className="p-2">{log.member}</td>
                            <td className="p-2">{log.time_in}</td>
                            <td className="p-2">{log.time_out}</td>
                            <td className="p-2">{log.duration}</td>
                            <td className="p-2 text-right">{log.credits_used}</td>
                            <td className="p-2 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                                log.is_active 
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              }`}>
                                {log.is_active ? 'Active' : 'Closed'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        );
      case 'time-monthly':
        return (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-100">Monthly Time Logs Report</h3>
            <p className="text-xs text-gray-400">Member activity and usage for {props.timeMonthly?.month}.</p>
            
            {props.timeMonthly && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
                    <div className="text-xs text-gray-400 mb-1">Total Sessions</div>
                    <div className="text-lg font-bold text-blue-300">{props.timeMonthly.totalSessions}</div>
                  </div>
                  <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
                    <div className="text-xs text-gray-400 mb-1">Total Hours</div>
                    <div className="text-lg font-bold text-purple-300">{props.timeMonthly.totalHours}</div>
                  </div>
                  <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
                    <div className="text-xs text-gray-400 mb-1">Unique Members</div>
                    <div className="text-lg font-bold text-emerald-300">{props.timeMonthly.uniqueMembers}</div>
                  </div>
                </div>

                <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
                  <h4 className="text-sm font-medium text-gray-200 mb-3">Daily Breakdown</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {props.timeMonthly.dailySessions.map((day, i) => (
                      <div key={i} className="flex justify-between items-center p-2 bg-slate-800/50 rounded">
                        <span className="text-xs text-gray-300">{day.date}</span>
                        <div className="text-right">
                          <div className="text-xs font-medium text-blue-300">{day.sessions} sessions</div>
                          <div className="text-[10px] text-gray-500">{day.hours} hours</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        );
      case 'time-annual':
        return (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-100">Annual Time Logs Report</h3>
            <p className="text-xs text-gray-400">Member activity and usage for {props.timeAnnual?.year}.</p>
            
            {props.timeAnnual && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
                    <div className="text-xs text-gray-400 mb-1">Total Sessions</div>
                    <div className="text-lg font-bold text-blue-300">{props.timeAnnual.totalSessions}</div>
                  </div>
                  <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
                    <div className="text-xs text-gray-400 mb-1">Total Hours</div>
                    <div className="text-lg font-bold text-purple-300">{props.timeAnnual.totalHours}</div>
                  </div>
                  <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
                    <div className="text-xs text-gray-400 mb-1">Unique Members</div>
                    <div className="text-lg font-bold text-emerald-300">{props.timeAnnual.uniqueMembers}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
                    <h4 className="text-sm font-medium text-gray-200 mb-3">Monthly Breakdown</h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {props.timeAnnual.monthlySessions.map((month, i) => (
                        <div key={i} className="flex justify-between items-center p-2 bg-slate-800/50 rounded">
                          <span className="text-xs text-gray-300">{month.month}</span>
                          <div className="text-right">
                            <div className="text-xs font-medium text-blue-300">{month.sessions} sessions</div>
                            <div className="text-[10px] text-gray-500">{month.hours} hours</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
                    <h4 className="text-sm font-medium text-gray-200 mb-3">Top Members</h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {props.timeAnnual.topMembers.map((member, i) => (
                        <div key={i} className="flex justify-between items-center p-2 bg-slate-800/50 rounded">
                          <span className="text-xs text-gray-300">{member.name}</span>
                          <div className="text-right">
                            <div className="text-xs font-medium text-blue-300">{member.sessions} sessions</div>
                            <div className="text-[10px] text-gray-500">{member.hours} hours</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Head title="Reports" />
      <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-gray-200">
        <header className="sticky top-0 z-10 border-b border-gray-700 bg-slate-900/80 p-4 backdrop-blur-sm">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <h1 className="text-lg font-semibold tracking-wide">Reports</h1>
            <a
              href="/dashboard"
              className="cursor-pointer rounded-lg bg-gray-800 px-3 py-1 text-xs text-gray-200 hover:bg-gray-700"
            >
              ← Back to Dashboard
            </a>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-6">
          {/* Tab Navigation */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-2 border-b border-slate-700 pb-2">
              {[
                { id: 'sales-daily' as TabType, label: 'Sales - Daily' },
                { id: 'sales-monthly' as TabType, label: 'Sales - Monthly' },
                { id: 'sales-annual' as TabType, label: 'Sales - Annual' },
                { id: 'time-daily' as TabType, label: 'Time Logs - Daily' },
                { id: 'time-monthly' as TabType, label: 'Time Logs - Monthly' },
                { id: 'time-annual' as TabType, label: 'Time Logs - Annual' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`px-4 py-2 text-xs font-medium rounded-t-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-slate-800 text-blue-300 border border-slate-600 border-b-0'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-slate-800/60'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-6 shadow-lg shadow-slate-950/40">
            {renderContent()}
          </div>
        </main>
      </div>
    </>
  );
}

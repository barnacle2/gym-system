import React, { useState, useEffect } from 'react';
import { Head, usePage } from '@inertiajs/react';

interface Transaction {
  time: string;
  type: string;
  description: string;
  member?: string | null;
  amount: number;
  balance_after: number;
}

interface DailyTotal {
  date: string;
  total: number;
  count: number;
}

interface MonthlyTotalWithTransactions {
  month: string; // e.g. "Nov"
  year: string;  // e.g. "2025"
  total: number;
  count: number;
  transactions: Transaction[];
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

interface MonthlyTimeLogGroup {
  month: string; // e.g. "Dec"
  year: string;  // e.g. "2025"
  sessions: number;
  hours: number;
  members: number;
  logs: TimeLog[];
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
  days?: number;
  members?: number;
  logs?: TimeLog[];
}

interface TopMember {
  name: string;
  sessions: number;
  hours: number;
}

type TabType = 'sales-daily' | 'sales-monthly' | 'sales-annual' | 'time-daily' | 'time-monthly' | 'time-annual';

interface AnnualTotalWithTransactions {
  year: string;
  total: number;
  count: number;
  transactions: Transaction[];
}

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
    year: string;
    totalRevenue: number;
    monthlyEarnings: number;
    transactionCount: number;
    monthlyTotals: MonthlyTotalWithTransactions[];
  };
  salesAnnual?: {
    totalRevenue: number;
    transactionCount: number;
    annualTotals: AnnualTotalWithTransactions[];
  };
  timeDaily?: {
    date: string;
    totalSessions: number;
    activeSessions: number;
    totalHours: number;
    timeLogs: TimeLog[];
  };
  timeMonthly?: {
    year: string;
    totalSessions: number;
    totalHours: number;
    uniqueMembers: number;
    monthlyTotals: MonthlyTimeLogGroup[];
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
  const [printMode, setPrintMode] = useState<'all' | 'sales' | 'time'>('all');
  const [expandedYearIndex, setExpandedYearIndex] = useState<number | null>(null);
  const [expandedMonthIndex, setExpandedMonthIndex] = useState<number | null>(null);
  const [expandedTimeYearIndex, setExpandedTimeYearIndex] = useState<number | null>(null);

  useEffect(() => {
    if (props.activeTab && props.activeTab !== activeTab) {
      setActiveTab(props.activeTab);
    }
  }, [props.activeTab]);

  useEffect(() => {
    const handleAfterPrint = () => {
      setPrintMode('all');
    };

    // Browser afterprint event
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).addEventListener('afterprint', handleAfterPrint);

    return () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).removeEventListener('afterprint', handleAfterPrint);
    };
  }, []);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    window.location.search = `?tab=${tab}`;
  };

  const handlePrintSales = () => {
    setPrintMode('sales');
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const handlePrintTimeLogs = () => {
    setPrintMode('time');
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const getReportTitle = () => {
    switch (activeTab) {
      case 'sales-daily':
        return 'Daily Sales Report';
      case 'sales-monthly':
        return 'Monthly Sales Report';
      case 'sales-annual':
        return 'Annual Sales Report';
      case 'time-daily':
        return 'Daily Time Logs Report';
      case 'time-monthly':
        return 'Monthly Time Logs Report';
      case 'time-annual':
        return 'Annual Time Logs Report';
      default:
        return 'Reports';
    }
  };

  const getReportSubtitle = () => {
    switch (activeTab) {
      case 'sales-daily':
        return props.salesDaily?.date ? `Date: ${props.salesDaily.date}` : '';
      case 'sales-monthly':
        return props.salesMonthly?.year ? `Year: ${props.salesMonthly.year}` : '';
      case 'sales-annual':
        return 'Annual Sales Overview';
      case 'time-daily':
        return props.timeDaily?.date ? `Date: ${props.timeDaily.date}` : '';
      case 'time-monthly':
        return props.timeMonthly?.year ? `Year: ${props.timeMonthly.year}` : '';
      case 'time-annual':
        return props.timeAnnual?.year ? `Year: ${props.timeAnnual.year}` : '';
      default:
        return '';
    }
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
                    <div className="text-xs text-gray-400 mb-1">Time In Earnings (for daily subscription customers)</div>
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
                          <th className="text-left p-2 text-gray-400">Date & Time</th>
                          <th className="text-left p-2 text-gray-400">Member</th>
                          <th className="text-left p-2 text-gray-400">Description</th>
                          <th className="text-right p-2 text-gray-400">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Array.isArray(props.salesDaily.transactions) &&
                          props.salesDaily.transactions.map((tx, i) => (
                          <tr key={i} className="border-b border-slate-800">
                            <td className="p-2 whitespace-nowrap">
                              {props.salesDaily?.date
                                ? `${props.salesDaily.date} ${formatDateTime(tx.time)}`
                                : formatDateTime(tx.time)}
                            </td>
                            <td className="p-2">{tx.member ?? '—'}</td>
                            <td className="p-2">{tx.description}</td>
                            <td className="p-2 text-right">{formatCurrency(tx.amount)}</td>
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
            <p className="text-xs text-gray-400">Revenue and transactions for {props.salesMonthly?.year}.</p>
            
            {props.salesMonthly && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
                    <div className="text-xs text-gray-400 mb-1">Total Revenue</div>
                    <div className="text-lg font-bold text-emerald-300">{formatCurrency(props.salesMonthly.totalRevenue)}</div>
                  </div>
                  <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
                    <div className="text-xs text-gray-400 mb-1">Time In Earnings (for daily subscription customers)</div>
                    <div className="text-lg font-bold text-blue-300">{formatCurrency(props.salesMonthly.monthlyEarnings)}</div>
                  </div>
                  <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
                    <div className="text-xs text-gray-400 mb-1">Transactions</div>
                    <div className="text-lg font-bold text-purple-300">{props.salesMonthly.transactionCount}</div>
                  </div>
                </div>

                <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
                  <h4 className="text-sm font-medium text-gray-200 mb-3">Monthly Breakdown</h4>
                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {props.salesMonthly.monthlyTotals.map((monthTotal, index) => (
                      <div key={`${monthTotal.year}-${monthTotal.month}`} className="bg-slate-800/50 rounded">
                        <button
                          type="button"
                          className="w-full flex justify-between items-center p-2 text-left hover:bg-slate-800/80"
                          onClick={() =>
                            setExpandedMonthIndex(expandedMonthIndex === index ? null : index)
                          }
                        >
                          <span className="text-xs text-gray-300">
                            {monthTotal.month} {monthTotal.year}
                          </span>
                          <div className="text-right">
                            <div className="text-xs font-medium text-emerald-300">
                              {formatCurrency(monthTotal.total)}
                            </div>
                            <div className="text-[10px] text-gray-500">{monthTotal.count} tx</div>
                          </div>
                        </button>

                        {expandedMonthIndex === index && monthTotal.transactions.length > 0 && (
                          <div className="border-t border-slate-700 bg-slate-900/80">
                            <div className="overflow-x-auto">
                              <table className="w-full text-[11px]">
                                <thead>
                                  <tr className="border-b border-slate-700">
                                    <th className="text-left p-2 text-gray-400">Date &amp; Time</th>
                                    <th className="text-left p-2 text-gray-400">Member</th>
                                    <th className="text-left p-2 text-gray-400">Description</th>
                                    <th className="text-right p-2 text-gray-400">Amount</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {monthTotal.transactions.map((tx, i) => (
                                    <tr key={i} className="border-b border-slate-800">
                                      <td className="p-2 whitespace-nowrap">{tx.time}</td>
                                      <td className="p-2">{tx.member ?? '—'}</td>
                                      <td className="p-2">{tx.description}</td>
                                      <td className="p-2 text-right">{formatCurrency(tx.amount)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
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
            <p className="text-xs text-gray-400">Revenue and transactions by year.</p>

            {props.salesAnnual && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
                    <div className="text-xs text-gray-400 mb-1">Total Revenue</div>
                    <div className="text-lg font-bold text-emerald-300">
                      {formatCurrency(props.salesAnnual.totalRevenue)}
                    </div>
                  </div>
                  <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
                    <div className="text-xs text-gray-400 mb-1">Total Transactions</div>
                    <div className="text-lg font-bold text-purple-300">
                      {props.salesAnnual.transactionCount}
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
                  <h4 className="text-sm font-medium text-gray-200 mb-3">Annual Breakdown</h4>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {props.salesAnnual.annualTotals.map((yearData, index) => (
                      <div key={yearData.year} className="bg-slate-800/50 rounded">
                        <button
                          type="button"
                          className="w-full flex justify-between items-center p-3 text-left hover:bg-slate-800/80"
                          onClick={() => setExpandedYearIndex(expandedYearIndex === index ? null : index)}
                        >
                          <span className="text-sm font-medium text-gray-200">
                            {yearData.year}
                          </span>
                          <div className="text-right">
                            <div className="text-sm font-bold text-emerald-300">
                              {formatCurrency(yearData.total)}
                            </div>
                            <div className="text-xs text-gray-400">
                              {yearData.count} transactions
                            </div>
                          </div>
                        </button>

                        {expandedYearIndex === index && yearData.transactions.length > 0 && (
                          <div className="border-t border-slate-700 bg-slate-900/80">
                            <div className="overflow-x-auto">
                              <table className="w-full text-xs">
                                <thead>
                                  <tr className="border-b border-slate-700">
                                    <th className="text-left p-2 text-gray-400">Date & Time</th>
                                    <th className="text-left p-2 text-gray-400">Member</th>
                                    <th className="text-left p-2 text-gray-400">Description</th>
                                    <th className="text-right p-2 text-gray-400">Amount</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {yearData.transactions.map((tx, i) => (
                                    <tr key={i} className="border-b border-slate-800">
                                      <td className="p-2 whitespace-nowrap">{tx.time}</td>
                                      <td className="p-2">{tx.member || '—'}</td>
                                      <td className="p-2">{tx.description}</td>
                                      <td className="p-2 text-right">{formatCurrency(tx.amount)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
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
            <p className="text-xs text-gray-400">Member activity and usage for {props.timeMonthly?.year}.</p>

            {props.timeMonthly && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
                    <div className="text-xs text-gray-400 mb-1">Total Sessions (Year)</div>
                    <div className="text-lg font-bold text-blue-300">{props.timeMonthly.totalSessions}</div>
                  </div>
                  <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
                    <div className="text-xs text-gray-400 mb-1">Total Hours (Year)</div>
                    <div className="text-lg font-bold text-purple-300">{props.timeMonthly.totalHours}</div>
                  </div>
                  <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
                    <div className="text-xs text-gray-400 mb-1">Unique Members (Year)</div>
                    <div className="text-lg font-bold text-emerald-300">{props.timeMonthly.uniqueMembers}</div>
                  </div>
                </div>

                <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-4">
                  <h4 className="text-sm font-medium text-gray-200 mb-3">Monthly Breakdown</h4>
                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {props.timeMonthly.monthlyTotals.map((monthGroup: MonthlyTimeLogGroup, index: number) => (
                      <div
                        key={`${monthGroup.year}-${monthGroup.month}`}
                        className="bg-slate-800/50 rounded"
                      >
                        <button
                          type="button"
                          className="w-full flex justify-between items-center p-2 text-left hover:bg-slate-800/80"
                          onClick={() =>
                            setExpandedMonthIndex(expandedMonthIndex === index ? null : index)
                          }
                        >
                          <span className="text-xs text-gray-300">
                            {monthGroup.month} {monthGroup.year}
                          </span>
                          <div className="text-right">
                            <div className="text-xs font-medium text-blue-300">
                              {monthGroup.sessions} sessions
                            </div>
                            <div className="text-[10px] text-gray-500">
                              {monthGroup.hours} hours • {monthGroup.members} members
                            </div>
                          </div>
                        </button>

                        {expandedMonthIndex === index && monthGroup.logs.length > 0 && (
                          <div className="border-t border-slate-700 bg-slate-900/80">
                            <div className="overflow-x-auto">
                              <table className="w-full text-[11px]">
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
                                  {monthGroup.logs.map((log: TimeLog, i: number) => (
                                    <tr key={i} className="border-b border-slate-800">
                                      <td className="p-2">{log.member}</td>
                                      <td className="p-2">{log.time_in}</td>
                                      <td className="p-2">{log.time_out}</td>
                                      <td className="p-2">{log.duration}</td>
                                      <td className="p-2 text-right">{log.credits_used}</td>
                                      <td className="p-2 text-center">
                                        <span
                                          className={`px-2 py-0.5 rounded-full text-[10px] ${
                                            log.is_active
                                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                          }`}
                                        >
                                          {log.is_active ? 'Active' : 'Closed'}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
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
                    <h4 className="text-sm font-medium text-gray-200 mb-3">Yearly Breakdown</h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {props.timeAnnual.monthlySessions.map((yearData: MonthlySession, index: number) => (
                        <div key={index} className="bg-slate-800/50 rounded">
                          <button
                            type="button"
                            className="w-full flex justify-between items-center p-2 text-left hover:bg-slate-800/80"
                            onClick={() =>
                              setExpandedTimeYearIndex(
                                expandedTimeYearIndex === index ? null : index,
                              )
                            }
                          >
                            <span className="text-xs text-gray-300">{yearData.month}</span>
                            <div className="text-right">
                              <div className="text-xs font-medium text-blue-300">
                                {yearData.sessions} sessions
                              </div>
                              <div className="text-[10px] text-gray-500">{yearData.hours} hours</div>
                            </div>
                          </button>

                          {expandedTimeYearIndex === index && yearData.logs && yearData.logs.length > 0 && (
                            <div className="border-t border-slate-700 bg-slate-900/80">
                              <div className="overflow-x-auto">
                                <table className="w-full text-[11px]">
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
                                    {yearData.logs.map((log: TimeLog, i: number) => (
                                      <tr key={i} className="border-b border-slate-800">
                                        <td className="p-2">{log.member}</td>
                                        <td className="p-2">{log.time_in}</td>
                                        <td className="p-2">{log.time_out}</td>
                                        <td className="p-2">{log.duration}</td>
                                        <td className="p-2 text-right">{log.credits_used}</td>
                                        <td className="p-2 text-center">
                                          <span
                                            className={`px-2 py-0.5 rounded-full text-[10px] ${
                                              log.is_active
                                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                            }`}
                                          >
                                            {log.is_active ? 'Active' : 'Closed'}
                                          </span>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}
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

  // Format time string to 12-hour format with AM/PM
  const formatDateTime = (timeString: string | undefined) => {
    if (!timeString) return 'N/A';
    
    try {
      // If it's already in HH:MM:SS format
      const timeParts = timeString.split(':');
      if (timeParts.length >= 2) {
        let hours = parseInt(timeParts[0], 10);
        const minutes = timeParts[1];
        const ampm = hours >= 12 ? 'PM' : 'AM';
        
        // Convert to 12-hour format
        hours = hours % 12;
        hours = hours ? hours : 12; // Convert 0 to 12 for 12 AM
        
        return `${hours}:${minutes} ${ampm}`;
      }
      
      return timeString; // Return original if format doesn't match
    
    } catch (error) {
      console.error('Error formatting time:', error);
      return timeString; // Return original string if parsing fails
    }
  };

  return (
    <>
      <Head title="Reports" />
      <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-gray-200">
        <header className="sticky top-0 z-10 border-b border-gray-700 bg-slate-900/80 p-4 backdrop-blur-sm print-hidden">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center gap-6">
              <h1 className="text-lg font-semibold tracking-wide">Fitness Point</h1>
              <span className="text-gray-400">|</span>
              <h2 className="text-lg font-semibold tracking-wide">Reports</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrintSales}
                className="cursor-pointer rounded-lg bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-500"
              >
                Print Sales
              </button>
              <button
                type="button"
                onClick={handlePrintTimeLogs}
                className="cursor-pointer rounded-lg bg-emerald-600 px-3 py-1 text-xs text-white hover:bg-emerald-500"
              >
                Print Time Logs
              </button>
              <a
                href="/dashboard"
                className="cursor-pointer rounded-lg bg-gray-800 px-3 py-1 text-xs text-gray-200 hover:bg-gray-700"
              >
                ← Back to Dashboard
              </a>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-6 print-container">
          {/* Print Header */}
          <div className="mb-6 print-only">
            <div className="text-center">
              <div className="text-xl font-bold text-gray-900">Fitness Point</div>
              <div className="text-xs text-gray-600 mb-1">4th Floor, RCBC Building, San Nicolas Street corner Burgos Street,<br />Surigao City, Surigao del Norte</div>
              <div className="mt-1 text-sm font-semibold text-gray-800">Reports</div>
              {getReportSubtitle() && (
                <div className="text-xs text-gray-600">{getReportSubtitle()}</div>
              )}
            </div>
          </div>

          {/* Tab Navigation (screen only) */}
          <div className="mb-6 print-hidden">
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

          {/* Tab Content (screen only) */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-6 shadow-lg shadow-slate-950/40 print-hidden">
            {renderContent()}
          </div>

          {/* Full Report Layout (print only) */}
          <div className="space-y-8 print-only">
            {/* Sales Reports (Daily / Monthly / Annual) */}
            {printMode !== 'time' && props.salesAnnual && (
              <section>
                <h2 className="mb-2 text-base font-semibold text-gray-900">All-Time Sales Report</h2>
                <table className="mb-3 w-full border-collapse text-[11px]">
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 px-2 py-1 font-medium text-gray-700">Total Revenue</td>
                      <td className="border border-gray-300 px-2 py-1">{formatCurrency(props.salesAnnual.totalRevenue)}</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-2 py-1 font-medium text-gray-700">Total Transactions</td>
                      <td className="border border-gray-300 px-2 py-1">{props.salesAnnual.transactionCount}</td>
                    </tr>
                  </tbody>
                </table>

                {props.salesAnnual.annualTotals.flatMap(year => year.transactions).length > 0 && (
                  <div className="mt-2">
                    <h3 className="mb-1 text-[11px] font-semibold text-gray-800">All Transactions</h3>
                    <table className="w-full border-collapse text-[10px]">
                      <thead>
                        <tr>
                          <th className="border border-gray-300 px-1 py-1 text-left text-gray-700">Date & Time</th>
                          <th className="border border-gray-300 px-1 py-1 text-left text-gray-700">Member</th>
                          <th className="border border-gray-300 px-1 py-1 text-left text-gray-700">Description</th>
                          <th className="border border-gray-300 px-1 py-1 text-right text-gray-700">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {props.salesAnnual.annualTotals.flatMap(year => 
                          year.transactions.map((tx, i) => (
                            <tr key={`${year.year}-${i}`}>
                              <td className="border border-gray-300 px-1 py-0.5 align-top">{tx.time}</td>
                              <td className="border border-gray-300 px-1 py-0.5 align-top">{tx.member ?? '—'}</td>
                              <td className="border border-gray-300 px-1 py-0.5 align-top">{tx.description}</td>
                              <td className="border border-gray-300 px-1 py-0.5 text-right align-top">{formatCurrency(tx.amount)}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )}

            {printMode !== 'time' && props.salesMonthly && (
              <section>
                <h2 className="mb-2 text-base font-semibold text-gray-900">Monthly Sales Report</h2>
                <table className="mb-3 w-full border-collapse text-[11px]">
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 px-2 py-1 font-medium text-gray-700">Year</td>
                      <td className="border border-gray-300 px-2 py-1">{props.salesMonthly.year}</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-2 py-1 font-medium text-gray-700">Total Revenue</td>
                      <td className="border border-gray-300 px-2 py-1">{formatCurrency(props.salesMonthly.totalRevenue)}</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-2 py-1 font-medium text-gray-700">Time In Earnings (for daily subscription customers)</td>
                      <td className="border border-gray-300 px-2 py-1">{formatCurrency(props.salesMonthly.monthlyEarnings)}</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-2 py-1 font-medium text-gray-700">Transactions</td>
                      <td className="border border-gray-300 px-2 py-1">{props.salesMonthly.transactionCount}</td>
                    </tr>
                  </tbody>
                </table>
              </section>
            )}

            {printMode !== 'time' && props.salesAnnual && (
              <section>
                <h2 className="mb-2 text-base font-semibold text-gray-900">Annual Sales Report</h2>
                <table className="mb-3 w-full border-collapse text-[11px]">
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 px-2 py-1 font-medium text-gray-700">Total Revenue</td>
                      <td className="border border-gray-300 px-2 py-1">{formatCurrency(props.salesAnnual.totalRevenue)}</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-2 py-1 font-medium text-gray-700">Total Transactions</td>
                      <td className="border border-gray-300 px-2 py-1">{props.salesAnnual.transactionCount}</td>
                    </tr>
                  </tbody>
                </table>

                <h3 className="mb-1 text-sm font-semibold text-gray-900">Annual Breakdown</h3>
                <table className="w-full border-collapse text-[11px] mb-4">
                  <thead>
                    <tr>
                      <th className="border border-gray-300 px-2 py-1 bg-gray-100 text-left">Year</th>
                      <th className="border border-gray-300 px-2 py-1 bg-gray-100 text-right">Total</th>
                      <th className="border border-gray-300 px-2 py-1 bg-gray-100 text-right">Transactions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {props.salesAnnual.annualTotals.map((yearData, i) => (
                      <tr key={i}>
                        <td className="border border-gray-300 px-2 py-1">{yearData.year}</td>
                        <td className="border border-gray-300 px-2 py-1 text-right">{formatCurrency(yearData.total)}</td>
                        <td className="border border-gray-300 px-2 py-1 text-right">{yearData.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            )}

            {/* Time Logs Reports (Daily / Monthly / Annual) */}
            {printMode === 'time' && props.timeAnnual && (
              <section className="space-y-6">
                <div>
                  <h2 className="mb-2 text-base font-semibold text-gray-900">Gym Usage Summary</h2>
                  <table className="mb-3 w-full border-collapse text-[11px]">
                    <tbody>
                      <tr>
                        <td className="border border-gray-300 px-2 py-1 font-medium text-gray-700">Total Sessions (All Time)</td>
                        <td className="border border-gray-300 px-2 py-1">{props.timeAnnual.totalSessions}</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 px-2 py-1 font-medium text-gray-700">Total Hours Logged</td>
                        <td className="border border-gray-300 px-2 py-1">{props.timeAnnual.totalHours} hours</td>
                      </tr>
                      <tr>
                        <td className="border border-gray-300 px-2 py-1 font-medium text-gray-700">Unique Members</td>
                        <td className="border border-gray-300 px-2 py-1">{props.timeAnnual.uniqueMembers}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div>
                  <h3 className="mb-2 text-sm font-semibold text-gray-900">Top Members by Usage</h3>
                  <table className="w-full border-collapse text-[11px] mb-6">
                    <thead>
                      <tr>
                        <th className="border border-gray-300 px-2 py-1 bg-gray-100 text-left">Member</th>
                        <th className="border border-gray-300 px-2 py-1 bg-gray-100 text-right">Sessions</th>
                        <th className="border border-gray-300 px-2 py-1 bg-gray-100 text-right">Hours</th>
                      </tr>
                    </thead>
                    <tbody>
                      {props.timeAnnual.topMembers.map((member, i) => (
                        <tr key={i}>
                          <td className="border border-gray-300 px-2 py-1">{member.name}</td>
                          <td className="border border-gray-300 px-2 py-1 text-right">{member.sessions}</td>
                          <td className="border border-gray-300 px-2 py-1 text-right">{member.hours}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div>
                  <h3 className="mb-2 text-sm font-semibold text-gray-900">Monthly Activity</h3>
                  <table className="w-full border-collapse text-[11px] mb-6">
                    <thead>
                      <tr>
                        <th className="border border-gray-300 px-2 py-1 bg-gray-100 text-left">Month</th>
                        <th className="border border-gray-300 px-2 py-1 bg-gray-100 text-right">Sessions</th>
                        <th className="border border-gray-300 px-2 py-1 bg-gray-100 text-right">Hours</th>
                        <th className="border border-gray-300 px-2 py-1 bg-gray-100 text-right">Avg. Daily</th>
                      </tr>
                    </thead>
                    <tbody>
                      {props.timeAnnual.monthlySessions.map((month, i) => (
                        <tr key={i}>
                          <td className="border border-gray-300 px-2 py-1">{month.month}</td>
                          <td className="border border-gray-300 px-2 py-1 text-right">{month.sessions}</td>
                          <td className="border border-gray-300 px-2 py-1 text-right">{month.hours}</td>
                          <td className="border border-gray-300 px-2 py-1 text-right">
                            {month.days ? (month.sessions / month.days).toFixed(1) : '0.0'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {printMode === 'time' && props.timeDaily && (
              <section>
                <h2 className="mb-2 text-base font-semibold text-gray-900">Daily Time Logs Report</h2>
                <table className="mb-3 w-full border-collapse text-[11px]">
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 px-2 py-1 font-medium text-gray-700">Date</td>
                      <td className="border border-gray-300 px-2 py-1">{props.timeDaily.date}</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-2 py-1 font-medium text-gray-700">Total Sessions</td>
                      <td className="border border-gray-300 px-2 py-1">{props.timeDaily.totalSessions}</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-2 py-1 font-medium text-gray-700">Active Sessions</td>
                      <td className="border border-gray-300 px-2 py-1">{props.timeDaily.activeSessions}</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-2 py-1 font-medium text-gray-700">Total Hours</td>
                      <td className="border border-gray-300 px-2 py-1">{props.timeDaily.totalHours}</td>
                    </tr>
                  </tbody>
                </table>

                {props.timeDaily.timeLogs.length > 0 && (
                  <div className="mt-2">
                    <h3 className="mb-1 text-[11px] font-semibold text-gray-800">Time Log Details</h3>
                    <table className="w-full border-collapse text-[10px]">
                      <thead>
                        <tr>
                          <th className="border border-gray-300 px-1 py-1 text-left text-gray-700">Member</th>
                          <th className="border border-gray-300 px-1 py-1 text-left text-gray-700">Time In</th>
                          <th className="border border-gray-300 px-1 py-1 text-left text-gray-700">Time Out</th>
                          <th className="border border-gray-300 px-1 py-1 text-left text-gray-700">Duration</th>
                        </tr>
                      </thead>
                      <tbody>
                        {props.timeDaily.timeLogs.map((log, i) => (
                          <tr key={i}>
                            <td className="border border-gray-300 px-1 py-0.5 align-top">{log.member}</td>
                            <td className="border border-gray-300 px-1 py-0.5 align-top">{log.time_in}</td>
                            <td className="border border-gray-300 px-1 py-0.5 align-top">{log.time_out}</td>
                            <td className="border border-gray-300 px-1 py-0.5 align-top">{log.duration}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )}

            {printMode !== 'sales' && props.timeMonthly && (
              <section>
                <h2 className="mb-2 text-base font-semibold text-gray-900">Monthly Time Logs Report</h2>
                <table className="mb-3 w-full border-collapse text-[11px]">
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 px-2 py-1 font-medium text-gray-700">Year</td>
                      <td className="border border-gray-300 px-2 py-1">{props.timeMonthly.year}</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-2 py-1 font-medium text-gray-700">Total Sessions</td>
                      <td className="border border-gray-300 px-2 py-1">{props.timeMonthly.totalSessions}</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-2 py-1 font-medium text-gray-700">Total Hours</td>
                      <td className="border border-gray-300 px-2 py-1">{props.timeMonthly.totalHours}</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-2 py-1 font-medium text-gray-700">Unique Members</td>
                      <td className="border border-gray-300 px-2 py-1">{props.timeMonthly.uniqueMembers}</td>
                    </tr>
                  </tbody>
                </table>
              </section>
            )}

            {printMode !== 'sales' && props.timeAnnual && (
              <section>
                <h2 className="mb-2 text-base font-semibold text-gray-900">Annual Time Logs Report</h2>
                <table className="mb-3 w-full border-collapse text-[11px]">
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 px-2 py-1 font-medium text-gray-700">Year</td>
                      <td className="border border-gray-300 px-2 py-1">{props.timeAnnual.year}</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-2 py-1 font-medium text-gray-700">Total Sessions</td>
                      <td className="border border-gray-300 px-2 py-1">{props.timeAnnual.totalSessions}</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-2 py-1 font-medium text-gray-700">Total Hours</td>
                      <td className="border border-gray-300 px-2 py-1">{props.timeAnnual.totalHours}</td>
                    </tr>
                    <tr>
                      <td className="border border-gray-300 px-2 py-1 font-medium text-gray-700">Unique Members</td>
                      <td className="border border-gray-300 px-2 py-1">{props.timeAnnual.uniqueMembers}</td>
                    </tr>
                  </tbody>
                </table>
              </section>
            )}
          </div>
        </main>
      </div>
    </>
  );
}

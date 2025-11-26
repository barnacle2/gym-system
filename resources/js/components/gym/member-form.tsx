import React from 'react';

type Plan = 'Daily' | 'Monthly' | 'Quarterly' | 'Semi-Annual' | 'Annual';

export interface Member {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  plan: Plan;
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
  avatarUrl?: string;
}

export interface FormData {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  plan: Plan;
  startDate: string;
  endDate: string;
  notes: string;
}

type Props = {
  formData: FormData;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  isEditing: boolean;
  resetForm: () => void;
  handleSubmit: (e: React.FormEvent) => void;
  toggleMemberStatus: (id: string) => void;
  members: Member[];
};

export default function MemberForm({ formData, setFormData, isEditing, resetForm, handleSubmit, toggleMemberStatus, members }: Props) {
  return (
    <section className="bg-gray-800/80 border border-gray-700 rounded-2xl overflow-hidden">
      <div className="border-b border-gray-700 p-4 flex items-center justify-between">
        <span className="font-semibold">{isEditing ? `Edit: ${formData.fullName}` : 'Register New Member'}</span>
        <button
          type="button"
          onClick={resetForm}
          className="cursor-pointer px-3 py-2 bg-transparent border border-dashed border-gray-600 text-gray-400 rounded-lg hover:bg-gray-700 text-sm"
        >
          Reset
        </button>
      </div>

      <div className="p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-2">Full Name</label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
              placeholder="Jane Doe"
              required
              className="w-full p-3 bg-slate-950 border border-gray-600 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="jane@example.com"
                className="w-full p-3 bg-slate-950 border border-gray-600 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-2">Phone</label>
              <input
                type="tel"
                inputMode="numeric"
                value={formData.phone}
                onChange={(e) => {
                  // Get the raw input value
                  let input = e.target.value;
                  
                  // If the user is deleting characters, allow it without reformatting
                  if (input.length < formData.phone.length) {
                    setFormData(prev => ({ ...prev, phone: input }));
                    return;
                  }
                  
                  // Remove all non-digit characters
                  const digits = input.replace(/\D/g, '');
                  
                  // Only format if we have a valid length
                  if (digits.length === 0) {
                    setFormData(prev => ({ ...prev, phone: '' }));
                  } else if (digits.startsWith('639') && digits.length <= 12) {
                    // Already in +639 format
                    setFormData(prev => ({ ...prev, phone: `+${digits}` }));
                  } else if (digits.startsWith('09') && digits.length <= 11) {
                    // Convert 09 to +639
                    setFormData(prev => ({ ...prev, phone: `+639${digits.slice(2)}` }));
                  } else if (digits.startsWith('9') && digits.length <= 10) {
                    // Convert 9 to +639
                    setFormData(prev => ({ ...prev, phone: `+639${digits.slice(1)}` }));
                  } else if (digits.startsWith('63') && digits.length <= 12) {
                    // Convert 63 to +63
                    setFormData(prev => ({ ...prev, phone: `+${digits}` }));
                  } else if (digits.startsWith('0') && digits.length <= 11) {
                    // Convert 0 to +63
                    setFormData(prev => ({ ...prev, phone: `+63${digits.slice(1)}` }));
                  } else {
                    // Fallback to just the digits
                    setFormData(prev => ({ ...prev, phone: `+${digits}` }));
                  }
                }}
                placeholder="+639XXXXXXXXX"
                pattern="^\+639\d{9}$"
                title="Enter a Philippine mobile number in the format +639XXXXXXXXX"
                maxLength={13}
                className="w-full p-3 bg-slate-950 border border-gray-600 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-2">Plan</label>
              <select
                value={formData.plan}
                onChange={(e) => {
                  const plan = e.target.value as FormData['plan'];
                  setFormData(prev => ({ ...prev, plan, endDate: prev.startDate ? prev.endDate : prev.endDate }));
                }}
                className="w-full p-3 bg-slate-950 border border-gray-600 rounded-lg text-gray-200 focus:outline-none focus:border-blue-500"
              >
                <option value="Daily">Daily</option>
                <option value="Monthly">Monthly</option>
                <option value="Quarterly">Quarterly</option>
                <option value="Semi-Annual">Semi-Annual</option>
                <option value="Annual">Annual</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-2">Start Date</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                required
                className="w-full p-3 bg-slate-950 border border-gray-600 rounded-lg text-gray-200 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-2">End Date (auto if blank)</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full p-3 bg-slate-950 border border-gray-600 rounded-lg text-gray-200 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-2">Notes</label>
              <input
                type="text"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="e.g., Student discount"
                className="w-full p-3 bg-slate-950 border border-gray-600 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="border-t border-gray-600 pt-4">
            <div className="flex gap-2 flex-wrap">
              <button type="submit" className="cursor-pointer px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold">Save Member</button>
              <button type="button" onClick={(e) => { handleSubmit(e as any); resetForm(); }} className="cursor-pointer px-4 py-2 bg-slate-950 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700">Save & New</button>
              {isEditing && (
                <button type="button" onClick={() => toggleMemberStatus(formData.id)} className="cursor-pointer px-4 py-2 bg-amber-600 text-black rounded-lg hover:bg-amber-700 font-semibold">
                  {members.find(m => m.id === formData.id)?.inactive ? 'Activate' : 'Deactivate'}
                </button>
              )}
            </div>
            <div className="text-xs text-gray-500 mt-3">End Date auto-calculates from Plan if left empty. Status updates in real time.</div>
          </div>
        </form>
      </div>
    </section>
  );
}

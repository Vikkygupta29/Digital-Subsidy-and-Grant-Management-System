import React, { useEffect, useState } from 'react';
import { ShieldPlus, Users } from 'lucide-react';
import { authAPI } from '../services/api';
import { toast } from '../context/ToastContext';

const OFFICER_ROLES = [
  ['FIELD_OFFICER', 'Field Officer'],
  ['DISTRICT_OFFICER', 'District Officer'],
  ['FINANCE_APPROVER', 'Finance Approver'],
];

export default function OfficerAccountsView({ currentUser }) {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({
    fullName: '', username: '', password: '', email: '',
    role: 'FIELD_OFFICER', region: 'North Region',
  });
  const [saving, setSaving] = useState(false);

  const loadUsers = async () => {
    const response = await authAPI.getUsers();
    setUsers(response.data.filter((user) => user.role !== 'BENEFICIARY'));
  };

  useEffect(() => {
    loadUsers().catch((error) => {
      console.error('Unable to load officer accounts:', error);
      toast.error('Unable to load officer accounts.');
    });
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await authAPI.createOfficer(form, currentUser.id);
      setForm({ fullName: '', username: '', password: '', email: '', role: 'FIELD_OFFICER', region: 'North Region' });
      await loadUsers();
      toast.success('Officer account created successfully.');
    } catch (error) {
      toast.error(error.response?.data || 'Unable to create officer account.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pt-2 pb-12">
      <div>
        <h2 className="text-xl font-bold font-display text-[#00142f]">Officer Accounts</h2>
        <p className="text-xs text-slate-500">Only administrators can create officer login accounts.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form onSubmit={handleSubmit} className="stitch-card p-6 space-y-4">
          <h3 className="font-bold text-[#00142f] flex items-center gap-2"><ShieldPlus className="w-4 h-4 text-emerald-600" /> Create Officer</h3>
          <input required placeholder="Full name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
          <input required placeholder="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
          <input required type="password" placeholder="Temporary password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
          <input required type="email" placeholder="Official email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm" />
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm">
            {OFFICER_ROLES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <select value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} className="w-full border rounded-lg px-3 py-2 text-sm">
            {['North Region', 'West Region', 'South Region', 'East Region', 'National HQ'].map((region) => <option key={region}>{region}</option>)}
          </select>
          <button disabled={saving} className="w-full rounded-lg bg-[#00142f] text-white px-4 py-2 text-sm font-semibold disabled:opacity-60">
            {saving ? 'Creating...' : 'Create Officer Account'}
          </button>
        </form>

        <div className="stitch-card p-6">
          <h3 className="font-bold text-[#00142f] flex items-center gap-2 mb-4"><Users className="w-4 h-4 text-[#46617c]" /> Existing Staff Accounts</h3>
          <div className="space-y-2">
            {users.map((user) => (
              <div key={user.id} className="border rounded-lg p-3 flex justify-between gap-3 text-sm">
                <div><strong className="text-[#00142f]">{user.fullName || user.username}</strong><div className="text-xs text-slate-500">{user.username} · {user.region}</div></div>
                <span className="text-xs font-semibold text-slate-600">{user.role.replace('_', ' ')}</span>
              </div>
            ))}
            {users.length === 0 && <p className="text-sm text-slate-500">No staff accounts found.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

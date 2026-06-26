
import React, { useEffect, useState } from 'react';
import { ICONS } from '../constants.tsx';
import { User, UserRole, UserAccount } from '../types.ts';

interface AdminPanelProps {
  user: User;
  theme?: 'light' | 'dark';
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ user, theme = 'light' }) => {
  const [accounts, setAccounts] = useState<UserAccount[]>([]);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [showProvisionPassword, setShowProvisionPassword] = useState(false);
  
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    role: 'OFFICER' as UserRole
  });

  const [editUser, setEditUser] = useState({
    name: '',
    email: '',
    role: 'OFFICER' as UserRole
  });

  const loadUsers = () => {
    const vaultRaw = localStorage.getItem('ngo_user_vault');
    if (vaultRaw) {
      setAccounts(JSON.parse(vaultRaw));
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    const account: UserAccount = {
      id: Math.random().toString(36).substr(2, 9),
      name: newUser.name,
      email: newUser.email,
      passwordHash: newUser.password,
      role: newUser.role,
      createdAt: new Date().toISOString()
    };

    const existingVaultRaw = localStorage.getItem('ngo_user_vault');
    const existingVault = existingVaultRaw ? JSON.parse(existingVaultRaw) : [];
    const updated = [...existingVault, account];
    
    localStorage.setItem('ngo_user_vault', JSON.stringify(updated));
    setAccounts(updated);
    setIsAddingUser(false);
    setNewUser({ name: '', email: '', password: '', role: 'OFFICER' });
  };

  const startEditing = (acc: UserAccount) => {
    setEditingUserId(acc.id);
    setEditUser({
      name: acc.name,
      email: acc.email,
      role: acc.role
    });
  };

  const handleUpdateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUserId) return;

    const existingVaultRaw = localStorage.getItem('ngo_user_vault');
    const existingVault: UserAccount[] = existingVaultRaw ? JSON.parse(existingVaultRaw) : [];
    
    const updated = existingVault.map(acc => {
      if (acc.id === editingUserId) {
        return { ...acc, ...editUser };
      }
      return acc;
    });

    localStorage.setItem('ngo_user_vault', JSON.stringify(updated));
    setAccounts(updated);
    setEditingUserId(null);
  };

  const handleDeleteUser = (id: string) => {
    if (id === user.id) {
      alert("Security Protocol: You cannot delete your own administrative account while logged in.");
      return;
    }
    
    if (confirm("DANGER: This will permanently revoke system access for this identity. Proceed?")) {
      const existingVaultRaw = localStorage.getItem('ngo_user_vault');
      const existingVault: UserAccount[] = existingVaultRaw ? JSON.parse(existingVaultRaw) : [];
      const updated = existingVault.filter(acc => acc.id !== id);
      
      localStorage.setItem('ngo_user_vault', JSON.stringify(updated));
      setAccounts(updated);
    }
  };

  const t = (light: string, dark: string) => theme === 'dark' ? dark : light;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 h-full flex flex-col min-h-0 overflow-y-auto sm:overflow-hidden lg:h-full pr-1 scrollbar-thin scroll-smooth">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 flex-shrink-0 gap-4">
        <div>
          <h3 className={`text-xl font-bold tracking-tight ${t('text-slate-800', 'text-slate-100')}`}>Access Management</h3>
          <p className={`text-sm font-medium mt-1 ${t('text-slate-500', 'text-slate-400')}`}>Provision and manage authorized system identities.</p>
        </div>
        
        {!isAddingUser && !editingUserId && (
          <button 
            onClick={() => setIsAddingUser(true)}
            className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center gap-2 active:scale-95"
          >
            <ICONS.Users className="w-4 h-4" /> Provision Account
          </button>
        )}
      </div>

      <div className="flex-grow min-h-0 sm:overflow-y-auto pr-0 sm:pr-1 scrollbar-thin">
        <div className="space-y-6">
          {isAddingUser && (
            <div className={`p-4 sm:p-6 rounded-2xl border animate-in slide-in-from-top-4 flex-shrink-0 mb-6 ${t('bg-white border-blue-100', 'bg-slate-800 border-slate-700')}`}>
              <h4 className={`text-[10px] font-bold uppercase tracking-[0.2em] mb-4 ${t('text-blue-600', 'text-blue-400')}`}>New Credential Provisioning</h4>
              <form onSubmit={handleAddUser} className="grid grid-cols-1 gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { label: 'Full Name', type: 'text', val: newUser.name, onChange: (v: string) => setNewUser({...newUser, name: v}) },
                    { label: 'Email', type: 'email', val: newUser.email, onChange: (v: string) => setNewUser({...newUser, email: v}) },
                  ].map(f => (
                    <div key={f.label} className="space-y-1.5">
                      <label className={`text-[10px] font-bold uppercase tracking-wider ml-1 ${t('text-slate-500', 'text-slate-400')}`}>{f.label}</label>
                      <input required type={f.type} value={f.val} onChange={e => f.onChange(e.target.value)}
                        className={`w-full border rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${t('bg-slate-50 border-slate-200 text-slate-800', 'bg-slate-900 border-slate-600 text-slate-100')}`} />
                    </div>
                  ))}
                  <div className="space-y-1.5">
                    <label className={`text-[10px] font-bold uppercase tracking-wider ml-1 ${t('text-slate-500', 'text-slate-400')}`}>Password</label>
                    <div className="relative">
                      <input required type={showProvisionPassword ? "text" : "password"} value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})}
                        className={`w-full border rounded-xl px-4 py-3 pr-10 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${t('bg-slate-50 border-slate-200 text-slate-800', 'bg-slate-900 border-slate-600 text-slate-100')}`} />
                      <button type="button" onClick={() => setShowProvisionPassword(!showProvisionPassword)} className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${t('text-slate-400 hover:text-slate-600', 'text-slate-500 hover:text-slate-300')}`}>
                        {showProvisionPassword ? <ICONS.EyeOff className="w-4 h-4" /> : <ICONS.Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className={`text-[10px] font-bold uppercase tracking-wider ml-1 ${t('text-slate-500', 'text-slate-400')}`}>Role</label>
                    <div className="relative">
                      <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value as UserRole})}
                        className={`w-full border rounded-xl pl-4 pr-10 py-3 text-xs focus:outline-none cursor-pointer appearance-none ${t('bg-slate-50 border-slate-200 text-slate-800', 'bg-slate-900 border-slate-600 text-slate-100')}`}>
                        <option value="OFFICER">Officer</option>
                        <option value="MANAGER">Manager</option>
                        <option value="DIRECTOR">Director</option>
                        <option value="AUDITOR">Internal Auditor</option>
                        <option value="SYSADMIN">System Admin</option>
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <ICONS.ChevronDown className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-blue-700 transition-all">Provision</button>
                  <button type="button" onClick={() => setIsAddingUser(false)} className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase transition-colors ${t('bg-slate-100 text-slate-500 hover:bg-slate-200', 'bg-slate-700 text-slate-400 hover:bg-slate-600')}`}>Cancel</button>
                </div>
              </form>
            </div>
          )}

          {editingUserId && (
            <div className={`p-4 sm:p-6 rounded-2xl border animate-in slide-in-from-top-4 flex-shrink-0 mb-6 ${t('bg-white border-blue-100', 'bg-slate-800 border-slate-700')}`}>
              <h4 className={`text-[10px] font-bold uppercase tracking-[0.2em] mb-4 ${t('text-blue-600', 'text-blue-400')}`}>Edit Identity Context</h4>
              <form onSubmit={handleUpdateUser} className="grid grid-cols-1 gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { label: 'Full Name', type: 'text', val: editUser.name, onChange: (v: string) => setEditUser({...editUser, name: v}) },
                    { label: 'Email', type: 'email', val: editUser.email, onChange: (v: string) => setEditUser({...editUser, email: v}) },
                  ].map(f => (
                    <div key={f.label} className="space-y-1.5">
                      <label className={`text-[10px] font-bold uppercase tracking-wider ml-1 ${t('text-slate-500', 'text-slate-400')}`}>{f.label}</label>
                      <input required type={f.type} value={f.val} onChange={e => f.onChange(e.target.value)}
                        className={`w-full border rounded-xl px-4 py-3 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${t('bg-slate-50 border-slate-200 text-slate-800', 'bg-slate-900 border-slate-600 text-slate-100')}`} />
                    </div>
                  ))}
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className={`text-[10px] font-bold uppercase tracking-wider ml-1 ${t('text-slate-500', 'text-slate-400')}`}>Role</label>
                    <div className="relative">
                      <select value={editUser.role} onChange={e => setEditUser({...editUser, role: e.target.value as UserRole})}
                        className={`w-full border rounded-xl pl-4 pr-10 py-3 text-xs focus:outline-none cursor-pointer appearance-none ${t('bg-slate-50 border-slate-200 text-slate-800', 'bg-slate-900 border-slate-600 text-slate-100')}`}>
                        <option value="OFFICER">Officer</option>
                        <option value="MANAGER">Manager</option>
                        <option value="DIRECTOR">Director</option>
                        <option value="AUDITOR">Internal Auditor</option>
                        <option value="SYSADMIN">System Admin</option>
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                        <ICONS.ChevronDown className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-blue-700 transition-all">Update</button>
                  <button type="button" onClick={() => setEditingUserId(null)} className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase transition-colors ${t('bg-slate-100 text-slate-500 hover:bg-slate-200', 'bg-slate-700 text-slate-400 hover:bg-slate-600')}`}>Cancel</button>
                </div>
              </form>
            </div>
          )}

          {/* Mobile cards */}
          <div className="block sm:hidden space-y-3">
            {accounts.map((acc) => (
              <div key={acc.id} className={`rounded-2xl border p-4 ${t('bg-white border-slate-200', 'bg-slate-800 border-slate-700')}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${t('bg-slate-100', 'bg-slate-700')}`}>
                      <ICONS.UserIcon className="w-4 h-4 text-slate-400" />
                    </div>
                    <div>
                      <p className={`text-xs font-bold ${t('text-slate-800', 'text-slate-100')}`}>{acc.name}</p>
                      <p className={`text-[10px] ${t('text-slate-500', 'text-slate-400')}`}>{acc.email}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${acc.role === 'SYSADMIN' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{acc.role}</span>
                </div>
                <div className={`flex items-center justify-between border-t pt-2 ${t('border-slate-100', 'border-slate-700')}`}>
                  <p className={`text-[10px] ${t('text-slate-400', 'text-slate-500')}`}>{new Date(acc.createdAt).toLocaleDateString()}</p>
                  <div className="flex gap-1">
                    <button onClick={() => startEditing(acc)} className="p-2 text-slate-400 hover:text-blue-600 transition-all"><ICONS.Edit className="w-4 h-4" /></button>
                    {acc.id !== user.id && (
                      <button onClick={() => handleDeleteUser(acc.id)} className="p-2 text-slate-400 hover:text-red-500 transition-all"><ICONS.Trash className="w-4 h-4" /></button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className={`hidden sm:block rounded-2xl border overflow-x-auto no-scrollbar ${t('border-slate-200 bg-white/60', 'border-slate-700 bg-slate-900/50')}`}>
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead className={`sticky top-0 z-10 ${t('bg-slate-50', 'bg-slate-800')}`}>
                <tr>
                  {['Identity','Access','Role','Date','Actions'].map((h, i) => (
                    <th key={h} className={`px-4 py-3 text-[10px] font-bold uppercase tracking-widest border-b ${t('text-slate-400 border-slate-200', 'text-slate-400 border-slate-700')} ${i === 4 ? 'text-right' : ''}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className={`divide-y ${t('divide-slate-100', 'divide-slate-700')}`}>
                {accounts.map((acc) => (
                  <tr key={acc.id} className={`transition-colors ${t('hover:bg-slate-50', 'hover:bg-slate-800/60')}`}>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center ${t('bg-slate-100', 'bg-slate-700')}`}><ICONS.UserIcon className="w-4 h-4 text-slate-400" /></div>
                        <div className={`text-[11px] font-bold ${t('text-slate-800', 'text-slate-100')}`}>{acc.name}</div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className={`text-[11px] ${t('text-slate-600', 'text-slate-300')}`}>{acc.email}</div>
                      <div className={`text-[9px] font-mono ${t('text-slate-400', 'text-slate-500')}`}>ID: {acc.id}</div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${acc.role === 'SYSADMIN' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{acc.role}</span>
                    </td>
                    <td className={`px-4 py-4 text-[11px] whitespace-nowrap ${t('text-slate-500', 'text-slate-400')}`}>{new Date(acc.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => startEditing(acc)} className="p-2 text-slate-400 hover:text-blue-600 transition-all"><ICONS.Edit className="w-4 h-4" /></button>
                        {acc.id !== user.id && (
                          <button onClick={() => handleDeleteUser(acc.id)} className="p-2 text-slate-400 hover:text-red-500 transition-all"><ICONS.Trash className="w-4 h-4" /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

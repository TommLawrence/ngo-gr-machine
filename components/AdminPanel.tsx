
import React, { useEffect, useState } from 'react';
import { ICONS } from '../constants.tsx';
import { User, UserRole, UserAccount } from '../types.ts';

interface AdminPanelProps {
  user: User;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ user }) => {
  const [accounts, setAccounts] = useState<UserAccount[]>([]);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  
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

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 h-full flex flex-col min-h-0 overflow-y-auto sm:overflow-hidden lg:h-full pr-1 scrollbar-thin scroll-smooth">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 flex-shrink-0 gap-4">
        <div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">Access Management</h3>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-300 mt-1">Provision and manage authorized system identities.</p>
        </div>
        
        {!isAddingUser && !editingUserId && (
          <button 
            onClick={() => setIsAddingUser(true)}
            className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-blue-700 shadow-sm transition-all flex items-center gap-2 active:scale-95"
          >
            <ICONS.Users className="w-4 h-4" /> Provision Account
          </button>
        )}
      </div>

      <div className="flex-grow min-h-0 sm:overflow-y-auto pr-0 sm:pr-1 scrollbar-thin">
        <div className="space-y-6">
          {isAddingUser && (
            <div className="glass bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-2xl border border-blue-100 dark:border-slate-700 animate-in slide-in-from-top-4 flex-shrink-0 mb-6">
              <h4 className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em] mb-4">New Credential Provisioning</h4>
              <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-200 uppercase tracking-wider ml-1">Full Name</label>
                  <input required type="text" value={newUser.name} onChange={(e) => setNewUser({...newUser, name: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-xs dark:text-slate-100" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-200 uppercase tracking-wider ml-1">Email</label>
                  <input required type="email" value={newUser.email} onChange={(e) => setNewUser({...newUser, email: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-xs dark:text-slate-100" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-200 uppercase tracking-wider ml-1">Password</label>
                  <input required type="password" value={newUser.password} onChange={(e) => setNewUser({...newUser, password: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-xs dark:text-slate-100" />
                </div>
                <div className="flex gap-2 lg:col-span-2">
                  <select value={newUser.role} onChange={(e) => setNewUser({...newUser, role: e.target.value as UserRole})} className="flex-grow bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-xs dark:text-slate-100">
                    <option value="OFFICER">Officer</option>
                    <option value="MANAGER">Manager</option>
                    <option value="DIRECTOR">Director</option>
                    <option value="AUDITOR">Internal Auditor</option>
                    <option value="SYSADMIN">System Admin</option>
                  </select>
                  <button type="submit" className="p-3.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center justify-center"><ICONS.Check className="w-5 h-5" /></button>
                  <button type="button" onClick={() => setIsAddingUser(false)} className="p-3.5 bg-slate-100 dark:bg-slate-700 text-slate-400 rounded-xl hover:bg-slate-200 transition-colors flex items-center justify-center"><ICONS.X className="w-5 h-5" /></button>
                </div>
              </form>
            </div>
          )}

          {/* Edit User Form */}
          {editingUserId && (
            <div className="glass bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-2xl border border-blue-100 dark:border-slate-700 animate-in slide-in-from-top-4 flex-shrink-0 mb-6">
              <h4 className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em] mb-4">Edit Identity Context</h4>
              <form onSubmit={handleUpdateUser} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-200 uppercase tracking-wider ml-1">Full Name</label>
                  <input required type="text" value={editUser.name} onChange={(e) => setEditUser({...editUser, name: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-xs dark:text-slate-100" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-200 uppercase tracking-wider ml-1">Email</label>
                  <input required type="email" value={editUser.email} onChange={(e) => setEditUser({...editUser, email: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-xs dark:text-slate-100" />
                </div>
                <div className="flex gap-2 lg:col-span-2">
                  <select value={editUser.role} onChange={(e) => setEditUser({...editUser, role: e.target.value as UserRole})} className="flex-grow bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-xs dark:text-slate-100">
                    <option value="OFFICER">Officer</option>
                    <option value="MANAGER">Manager</option>
                    <option value="DIRECTOR">Director</option>
                    <option value="AUDITOR">Internal Auditor</option>
                    <option value="SYSADMIN">System Admin</option>
                  </select>
                  <button type="submit" className="px-6 py-3 bg-blue-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 whitespace-nowrap">Update</button>
                  <button type="button" onClick={() => setEditingUserId(null)} className="px-6 py-3 bg-slate-100 dark:bg-slate-700 text-slate-400 rounded-xl hover:bg-slate-200 transition-colors whitespace-nowrap">Cancel</button>
                </div>
              </form>
            </div>
          )}

          <div className="rounded-2xl border border-slate-100 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 overflow-x-auto no-scrollbar">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="bg-slate-50/80 dark:bg-slate-800 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-400 dark:text-slate-100 uppercase tracking-widest border-b dark:border-slate-700">Identity</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-400 dark:text-slate-100 uppercase tracking-widest border-b dark:border-slate-700">Access</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-400 dark:text-slate-100 uppercase tracking-widest border-b dark:border-slate-700">Role</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-400 dark:text-slate-100 uppercase tracking-widest border-b dark:border-slate-700">Date</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-400 dark:text-slate-100 uppercase tracking-widest border-b dark:border-slate-700">Time</th>
                  <th className="px-4 py-3 text-[10px] font-bold text-slate-400 dark:text-slate-100 uppercase tracking-widest border-b dark:border-slate-700 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {accounts.map((acc) => (
                  <tr key={acc.id} className="hover:bg-white/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400"><ICONS.UserIcon className="w-4 h-4" /></div>
                        <div className="text-[11px] font-bold text-slate-800 dark:text-slate-100">{acc.name}</div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-[11px] text-slate-500 dark:text-slate-300">{acc.email}</div>
                      <div className="text-[9px] text-slate-300 dark:text-slate-500 font-mono">ID: {acc.id}</div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${acc.role === 'SYSADMIN' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{acc.role}</span>
                    </td>
                    <td className="px-4 py-4 text-[11px] text-slate-500 dark:text-slate-300 whitespace-nowrap">
                      {new Date(acc.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4 text-[11px] text-slate-500 dark:text-slate-300 whitespace-nowrap">
                      {new Date(acc.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => startEditing(acc)} className="p-2 text-slate-300 hover:text-blue-600 transition-all" title="Edit"><ICONS.Edit className="w-4 h-4" /></button>
                        {acc.id !== user.id && (
                          <button onClick={() => handleDeleteUser(acc.id)} className="p-2 text-slate-300 hover:text-red-500 transition-all" title="Delete"><ICONS.Trash className="w-4 h-4" /></button>
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

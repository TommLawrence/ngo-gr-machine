import React, { useState } from 'react';
import { ICONS } from '../constants.tsx';
import { User, UserRole } from '../types.ts';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../convex/_generated/api';
import { Id } from '../convex/_generated/dataModel';

interface AdminPanelProps {
  user: User;
  theme?: 'light' | 'dark';
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ user, theme = 'light' }) => {
  const users = useQuery(api.users.getAllUsers) || [];
  const updateUserRole = useMutation(api.users.updateUserRole);
  const deleteUser = useMutation(api.users.deleteUser);

  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editUserRole, setEditUserRole] = useState<UserRole>('OFFICER');
  
  const startEditing = (acc: any) => {
    setEditingUserId(acc._id);
    setEditUserRole(acc.role as UserRole);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUserId) return;
    await updateUserRole({ userId: editingUserId as Id<"users">, role: editUserRole });
    setEditingUserId(null);
  };

  const handleDeleteUser = async (id: string, clerkId: string) => {
    if (clerkId === user.id) {
      alert("Security Protocol: You cannot delete your own administrative account while logged in.");
      return;
    }
    
    if (confirm("DANGER: This will permanently revoke system access for this identity. Proceed?")) {
      await deleteUser({ userId: id as Id<"users"> });
    }
  };

  const t = (light: string, dark: string) => theme === 'dark' ? dark : light;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 h-full flex flex-col min-h-0 overflow-y-auto sm:overflow-hidden lg:h-full pr-1 scrollbar-thin scroll-smooth">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 flex-shrink-0 gap-4">
        <div>
          <h3 className={`text-xl font-bold tracking-tight ${t('text-slate-800', 'text-slate-100')}`}>Access Management</h3>
          <p className={`text-sm font-medium mt-1 ${t('text-slate-500', 'text-slate-400')}`}>Manage roles for identities invited via Clerk.</p>
        </div>
      </div>

      <div className="flex-grow min-h-0 sm:overflow-y-auto pr-0 sm:pr-1 scrollbar-thin">
        <div className="space-y-6">
          {editingUserId && (
            <div className={`p-4 sm:p-6 rounded-2xl border animate-in slide-in-from-top-4 flex-shrink-0 mb-6 ${t('bg-white border-blue-100', 'bg-slate-800 border-slate-700')}`}>
              <h4 className={`text-[10px] font-bold uppercase tracking-[0.2em] mb-4 ${t('text-blue-600', 'text-blue-400')}`}>Edit Identity Role</h4>
              <form onSubmit={handleUpdateUser} className="grid grid-cols-1 gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className={`text-[10px] font-bold uppercase tracking-wider ml-1 ${t('text-slate-500', 'text-slate-400')}`}>Role</label>
                    <div className="relative">
                      <select value={editUserRole} onChange={e => setEditUserRole(e.target.value as UserRole)}
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
                  <button type="submit" className="flex-1 py-3 bg-blue-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-blue-700 transition-all">Update Role</button>
                  <button type="button" onClick={() => setEditingUserId(null)} className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase transition-colors ${t('bg-slate-100 text-slate-500 hover:bg-slate-200', 'bg-slate-700 text-slate-400 hover:bg-slate-600')}`}>Cancel</button>
                </div>
              </form>
            </div>
          )}

          {/* Mobile cards */}
          <div className="block sm:hidden space-y-3">
            {users.map((acc) => (
              <div key={acc._id} className={`rounded-2xl border p-4 ${t('bg-white border-slate-200', 'bg-slate-800 border-slate-700')}`}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center overflow-hidden ${t('bg-slate-100', 'bg-slate-700')}`}>
                      {acc.imageUrl ? (
                        <img src={acc.imageUrl} alt={acc.name} className="w-full h-full object-cover" />
                      ) : (
                        <ICONS.UserIcon className="w-4 h-4 text-slate-400" />
                      )}
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
                    {acc.clerkId !== user.id && (
                      <button onClick={() => handleDeleteUser(acc._id, acc.clerkId)} className="p-2 text-slate-400 hover:text-red-500 transition-all"><ICONS.Trash className="w-4 h-4" /></button>
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
                {users.map((acc) => (
                  <tr key={acc._id} className={`transition-colors ${t('hover:bg-slate-50', 'hover:bg-slate-800/60')}`}>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center overflow-hidden ${t('bg-slate-100', 'bg-slate-700')}`}>
                          {acc.imageUrl ? (
                            <img src={acc.imageUrl} alt={acc.name} className="w-full h-full object-cover" />
                          ) : (
                            <ICONS.UserIcon className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                        <div className={`text-[11px] font-bold ${t('text-slate-800', 'text-slate-100')}`}>{acc.name}</div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className={`text-[11px] ${t('text-slate-600', 'text-slate-300')}`}>{acc.email}</div>
                      <div className={`text-[9px] font-mono ${t('text-slate-400', 'text-slate-500')}`}>ID: {acc.clerkId}</div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${acc.role === 'SYSADMIN' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{acc.role}</span>
                    </td>
                    <td className={`px-4 py-4 text-[11px] whitespace-nowrap ${t('text-slate-500', 'text-slate-400')}`}>{new Date(acc.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => startEditing(acc)} className="p-2 text-slate-400 hover:text-blue-600 transition-all"><ICONS.Edit className="w-4 h-4" /></button>
                        {acc.clerkId !== user.id && (
                          <button onClick={() => handleDeleteUser(acc._id, acc.clerkId)} className="p-2 text-slate-400 hover:text-red-500 transition-all"><ICONS.Trash className="w-4 h-4" /></button>
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

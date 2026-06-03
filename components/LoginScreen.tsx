
import React, { useState, useEffect } from 'react';
import { ICONS, APP_NAME } from '../constants.tsx';
import { UserRole, User, UserAccount } from '../types.ts';

interface LoginScreenProps {
  onLogin: (user: User) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize the user vault with defaults if it doesn't exist
  useEffect(() => {
    const existing = localStorage.getItem('ngo_user_vault');
    if (!existing) {
      const defaultUsers: UserAccount[] = [
        {
          id: 'sysadmin-0',
          name: 'Tom Lawrence',
          email: 'admin@ngo.org',
          passwordHash: 'Admin@1234567',
          role: 'SYSADMIN',
          createdAt: new Date().toISOString()
        },
        {
          id: 'staff-0',
          name: 'John Field-Officer',
          email: 'john@ngo.org',
          passwordHash: 'Staff@123',
          role: 'OFFICER',
          createdAt: new Date().toISOString()
        },
        {
          id: 'staff-1',
          name: 'Miriam Hope A',
          email: 'miriam@ngo.org',
          passwordHash: 'Staff@123',
          role: 'OFFICER',
          createdAt: new Date().toISOString()
        },
        {
          id: 'manager-0',
          name: 'Nankunda Mercy',
          email: 'nankunda@ngo.org',
          passwordHash: 'Manager@123',
          role: 'MANAGER',
          createdAt: new Date().toISOString()
        },
        {
          id: 'auditor-0',
          name: 'Sarah Auditor',
          email: 'sarah@ngo.org',
          passwordHash: 'Auditor@123',
          role: 'AUDITOR',
          createdAt: new Date().toISOString()
        },
        {
          id: 'director-0',
          name: 'Blair Freedom',
          email: 'blair@ngo.org',
          passwordHash: 'Director@123',
          role: 'DIRECTOR',
          createdAt: new Date().toISOString()
        }
      ];
      localStorage.setItem('ngo_user_vault', JSON.stringify(defaultUsers));
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    setTimeout(() => {
      const vaultRaw = localStorage.getItem('ngo_user_vault');
      const vault: UserAccount[] = vaultRaw ? JSON.parse(vaultRaw) : [];
      
      const account = vault.find(acc => 
        acc.email.toLowerCase() === email.toLowerCase() && 
        acc.passwordHash === password
      );

      if (account) {
        const user: User = {
          id: account.id,
          name: account.name,
          email: account.email,
          role: account.role
        };
        onLogin(user);
      } else {
        setError("Invalid credentials. Please contact your system administrator to verify your account status.");
        setIsSubmitting(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 relative overflow-hidden text-slate-900">
      {/* Background Orbs */}
      <div className="absolute top-0 -left-20 w-96 h-96 bg-blue-200/40 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-0 -right-20 w-96 h-96 bg-sky-100/40 rounded-full blur-3xl animate-pulse delay-1000"></div>

      <div className="w-full max-w-[440px] z-10">
        <div className="text-center mb-10">
          <div className="inline-flex p-2 bg-white rounded-3xl shadow-2xl shadow-blue-200 mb-6 animate-float border border-slate-100">
            <img src="/web_icon.png" alt="Logo" className="w-12 h-12 object-contain" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 mb-2 tracking-tight">{APP_NAME}</h1>
          <p className="text-slate-500 font-light px-8 text-sm italic">High-performance Intelligence Dashboard</p>
        </div>

        <div className="glass rounded-3xl p-10 shadow-2xl shadow-blue-900/5 space-y-8 border border-white/60">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-slate-800">Welcome back</h2>
            <p className="text-slate-400 text-sm">Enter your credentials to access the system</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-widest ml-1">Email</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                  <ICONS.UserIcon className="w-5 h-5" />
                </div>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="w-full bg-white/50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all text-slate-700"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-widest ml-1">Password</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                  <ICONS.Lock className="w-5 h-5" />
                </div>
                <input 
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full bg-white/50 border border-slate-200 rounded-2xl py-4 pl-12 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500/50 transition-all text-slate-700"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <ICONS.EyeOff className="w-5 h-5" /> : <ICONS.Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-xs font-medium animate-in fade-in slide-in-from-top-2">
                {error}
              </div>
            )}

            <button 
              type="submit" 
              disabled={isSubmitting}
              className={`w-full py-4 bg-blue-600 text-white rounded-2xl font-bold uppercase tracking-widest text-sm shadow-xl shadow-blue-500/20 hover:bg-blue-700 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 ${isSubmitting ? 'opacity-70 pointer-events-none' : ''}`}
            >
              {isSubmitting ? <><ICONS.Loader className="w-5 h-5" /> Authorizing...</> : 'Sign In'}
            </button>
          </form>

          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-100"></span></div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-[0.2em]"><span className="bg-white/80 backdrop-blur-md px-4 text-slate-400">Secure Access Only</span></div>
          </div>
        </div>

        <p className="text-[10px] text-center text-slate-400 mt-8 leading-relaxed italic uppercase tracking-wider">
          Authorized personnel only • NGO-SECURE v4.2
        </p>
      </div>
    </div>
  );
};


import React from 'react';
import { ICONS, APP_NAME } from '../constants.tsx';
import { SignInButton, SignUpButton } from '@clerk/clerk-react';

export const LoginScreen: React.FC = () => {



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
          <h1 className="text-3xl text-slate-800 mb-2 tracking-tight" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>{APP_NAME}</h1>
          <p className="text-slate-500 font-light px-8 text-sm italic">High-performance Intelligence Dashboard</p>
        </div>

        <div className="glass rounded-3xl p-10 shadow-2xl shadow-blue-900/5 space-y-8 border border-white/60">
          <div className="text-center space-y-2">
            <h2 className="text-2xl text-slate-800" style={{ fontFamily: "'Playfair Display', serif", fontWeight: 700 }}>Welcome back</h2>
            <p className="text-slate-400 text-sm">Enter your credentials to access the system</p>
          </div>

          <div className="flex flex-col gap-4 pt-4">
            <SignInButton forceRedirectUrl="/">
              <button className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold uppercase tracking-widest text-sm shadow-xl shadow-blue-500/20 hover:bg-blue-700 hover:scale-[1.02] active:scale-95 transition-all">
                Sign In
              </button>
            </SignInButton>
            <SignUpButton forceRedirectUrl="/">
              <button className="w-full py-4 bg-white text-blue-600 border border-blue-200 rounded-2xl font-bold uppercase tracking-widest text-sm shadow-sm hover:bg-slate-50 hover:scale-[1.02] active:scale-95 transition-all">
                Create Account
              </button>
            </SignUpButton>
          </div>

          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-100"></span></div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-[0.2em]"><span className="bg-white/80 backdrop-blur-md px-4 text-slate-400">Secure Access Only</span></div>
          </div>
        </div>

        <p className="text-[10px] text-center text-slate-400 mt-8 leading-relaxed uppercase tracking-wider">
          Authorized personnel only
        </p>
        <p className="text-[11px] text-center text-slate-400 mt-2 flex items-center justify-center gap-1">
          Built by{' '}
          <a
            href="https://crane-systems.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-700 font-semibold transition-colors underline underline-offset-2 flex items-center gap-0.5"
          >
            Crane Systems
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </p>
      </div>
    </div>
  );
};

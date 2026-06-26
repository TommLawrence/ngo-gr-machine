
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { DonorType, WorkflowInputs, AppState, User, HistoryItem, ReportStyle } from './types.ts';
import { runGrantWorkflow } from './services/difyService.ts';
import { ICONS, APP_NAME, DISCLAIMER_TEXT } from './constants.tsx';
import { GlassCard } from './components/GlassCard.tsx';
import { ProcessingState } from './components/ProcessingState.tsx';
import { LoginScreen } from './components/LoginScreen.tsx';
import { HistorySection } from './components/HistorySection.tsx';
import { AudioVisualizer } from './components/AudioVisualizer.tsx';
import { ExportPanel } from './components/ExportPanel.tsx';
import { ContextualFeedbackWidget } from './components/ContextualFeedbackWidget.tsx';
import { AdminPanel } from './components/AdminPanel.tsx';
import { AdminFeedbackReview } from './components/AdminFeedbackReview.tsx';
import { MyProfile } from './components/MyProfile.tsx';
import { marked } from 'marked';

const App: React.FC = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('app_theme');
    return (saved as 'light' | 'dark') || 'light';
  });

  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Restore user session from localStorage on mount
  const savedUser = (() => {
    try { const u = localStorage.getItem('ngo_session_user'); return u ? JSON.parse(u) : null; } catch { return null; }
  })();

  const [state, setState] = useState<AppState & { currentTaskId?: string | null }>(() => {
    const savedHistory = localStorage.getItem('grant_machine_history');
    return {
      user: savedUser,
      isProcessing: false,
      isRecording: false,
      liveTranscription: '',
      step: 'input',
      progressMessage: '',
      error: null,
      report: null,
      downloadUrl: null,
      complianceChecked: false,
      history: savedHistory ? JSON.parse(savedHistory) : [],
      currentTaskId: null
    };
  });

  const [inputs, setInputs] = useState<WorkflowInputs>(() => {
    const savedDraft = localStorage.getItem('grant_machine_draft');
    if (savedDraft) {
      const parsed = JSON.parse(savedDraft);
      return { ...parsed, field_notes_voice: null, field_notes_file: null }; 
    }
    return {
      field_notes_text: '',
      field_notes_voice: null,
      field_notes_file: null,
      donor_type: DonorType.USAID,
      language: 'English',
      style: 'executive'
    };
  });

  const [showInfoModal, setShowInfoModal] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isEditingReport, setIsEditingReport] = useState(false);

  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem('app_theme', theme);
  }, [theme]);

  // Persist user session
  useEffect(() => {
    if (state.user) {
      localStorage.setItem('ngo_session_user', JSON.stringify(state.user));
    } else {
      localStorage.removeItem('ngo_session_user');
    }
  }, [state.user]);

  // Close mobile menu on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };
    if (isMobileMenuOpen) document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isMobileMenuOpen]);

  // Time-based greeting
  const getGreeting = useCallback(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  useEffect(() => {
    const draftToSave = { ...inputs };
    delete (draftToSave as any).field_notes_voice;
    delete (draftToSave as any).field_notes_file;
    localStorage.setItem('grant_machine_draft', JSON.stringify(draftToSave));
  }, [inputs]);

  useEffect(() => {
    localStorage.setItem('grant_machine_history', JSON.stringify(state.history));
  }, [state.history]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setInputs(prev => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setInputs(prev => ({ ...prev, field_notes_file: file }));
      setUploadSuccess("File Uploaded Successfully");
      setTimeout(() => setUploadSuccess(null), 3000);
    }
  };

  const removeUploadedFile = () => {
    setInputs(prev => ({ ...prev, field_notes_file: null }));
    if (fileInputRef.current) fileInputRef.current.value = '';
    setUploadSuccess(null);
  };

  const copyToClipboard = () => {
    if (state.report) {
      navigator.clipboard.writeText(state.report);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    }
  };

  const deleteHistoryItem = (id: string) => {
    if (confirm("Permanently remove this draft from archives?")) {
      setState(prev => ({
        ...prev,
        history: prev.history.filter(item => item.id !== id)
      }));
    }
  };

  const startRecording = async () => {
    setState(prev => ({ ...prev, error: null }));
    setAudioPreviewUrl(null); 
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setState(prev => ({ ...prev, error: "Recording is not supported in this environment (requires HTTPS)." }));
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } 
      });
      setMediaStream(stream);
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/wav' });
        const previewUrl = URL.createObjectURL(audioBlob);
        setAudioPreviewUrl(previewUrl);
        const file = new File([audioBlob], `field_voice_${Date.now()}.wav`, { type: 'audio/wav' });
        setInputs(prev => ({ ...prev, field_notes_voice: file }));
        setMediaStream(null);
      };
      recorder.start();
      setState(prev => ({ ...prev, isRecording: true, liveTranscription: 'Listening for field data...' }));
    } catch (err: any) {
      setState(prev => ({ ...prev, error: "Microphone access failed.", isRecording: false }));
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && state.isRecording) {
      mediaRecorderRef.current.stop();
      mediaStream?.getTracks().forEach(track => track.stop());
      setState(prev => ({ ...prev, isRecording: false }));
    }
  };

  const handleExport = (format: string) => {
    alert(`Generating ${format.toUpperCase()} export... Your document will be ready shortly.`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.complianceChecked || !isInputValid || state.isProcessing || !state.user) return;

    setState(prev => ({ 
      ...prev, 
      isProcessing: true, 
      step: 'processing', 
      error: null,
      report: "",
      currentTaskId: null
    }));

    try {
      const result = await runGrantWorkflow(
        inputs, 
        state.user.id, 
        (msg) => setState(prev => ({ ...prev, progressMessage: msg })),
        (chunk) => {
          setState(prev => {
            const newReport = (prev.report || "") + chunk;
            return {
              ...prev,
              step: 'result',
              isProcessing: true, 
              report: newReport
            };
          });
        }
      );

      const newHistoryItem: HistoryItem = {
        id: result.task_id || Math.random().toString(36).substr(2, 9),
        userId: state.user.id,
        userName: state.user.name,
        timestamp: Date.now(),
        donorType: inputs.donor_type,
        summary: result.outputs.executive_summary || `Draft for ${inputs.donor_type}`,
        report: result.outputs.markdown_report,
        downloadUrl: result.outputs.download_url || '#'
      };

      setState(prev => ({
        ...prev,
        isProcessing: false,
        step: 'result',
        report: result.outputs.markdown_report,
        downloadUrl: result.outputs.download_url || null,
        history: [newHistoryItem, ...prev.history],
        currentTaskId: result.task_id
      }));
      
      setInputs(prev => ({ ...prev, field_notes_text: '', field_notes_voice: null, field_notes_file: null }));
      setAudioPreviewUrl(null);
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        isProcessing: false,
        step: 'input',
        error: err.message
      }));
    }
  };

  const handleSelectHistoryItem = (item: HistoryItem) => {
    setState(prev => ({
      ...prev,
      step: 'result',
      report: item.report,
      downloadUrl: item.downloadUrl,
      complianceChecked: true,
      currentTaskId: item.id
    }));
    setInputs(prev => ({ ...prev, donor_type: item.donorType }));
  };

  const resetForm = () => {
    setAudioPreviewUrl(null);
    setState(prev => ({
      ...prev,
      isProcessing: false,
      isRecording: false,
      liveTranscription: '',
      step: 'input',
      progressMessage: '',
      error: null,
      report: null,
      downloadUrl: null,
      complianceChecked: false,
      currentTaskId: null
    }));
    setIsEditingReport(false);
  };

  const handleLogin = (user: any) => {
    localStorage.setItem('ngo_session_user', JSON.stringify(user));
    setState(prev => ({ ...prev, user }));
  };

  const handleLogout = () => {
    localStorage.removeItem('ngo_session_user');
    setState(prev => ({ ...prev, user: null }));
  };

  if (!state.user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  const isInputValid = inputs.field_notes_text.trim().length > 0 || inputs.field_notes_voice !== null || inputs.field_notes_file !== null;

  const isSysAdmin = state.user.role === 'SYSADMIN';
  const canViewAudit = ['MANAGER', 'DIRECTOR', 'AUDITOR', 'SYSADMIN'].includes(state.user.role);
  const isReportingActive = state.step !== 'history' && state.step !== 'admin' && state.step !== 'audit' && state.step !== 'profile';

  return (
    <div className={`h-[100dvh] w-full flex flex-col transition-colors duration-300 ${theme === 'dark' ? 'bg-slate-900 text-slate-100 dark' : 'bg-slate-50 text-slate-900'} overflow-hidden`}
      style={{ overscrollBehavior: 'none', backgroundColor: theme === 'dark' ? '#0f172a' : '#f8fafc' }}
    >
      {/* Universal Header */}
      <header className={`flex-shrink-0 px-4 sm:px-6 py-3 backdrop-blur-lg border-b ${theme === 'dark' ? 'bg-slate-800/60 border-slate-700' : 'bg-white/60 border-slate-200'} flex justify-between items-center z-20 transition-all`}>
        <button
          onClick={() => setState(prev => ({ ...prev, step: 'input' }))}
          className="flex items-center gap-2 sm:gap-3 cursor-pointer hover:opacity-80 transition-opacity"
        >
          <div className="p-1.5 sm:p-2 bg-blue-600 rounded-lg flex-shrink-0">
            <img src="/web_icon.png" alt="Logo" className="w-5 h-5 sm:w-6 sm:h-6 object-contain" style={{ filter: 'brightness(0) invert(1)' }} />
          </div>
          <div className="text-left">
            <h1 className={`hidden sm:block text-lg sm:text-xl font-bold ${theme === 'dark' ? 'text-slate-100' : 'text-slate-800'} tracking-tight leading-none mb-0.5`}>{APP_NAME}</h1>
            <p className={`sm:hidden text-xs font-bold ${theme === 'dark' ? 'text-slate-100' : 'text-slate-800'} leading-none`}>{getGreeting()}, {state.user.name.split(' ')[0]}!</p>
            <span className="text-[8px] sm:text-[9px] text-blue-500 font-bold uppercase tracking-widest">Enterprise Reporting Hub</span>
          </div>
        </button>
        
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden sm:flex flex-col text-right">
            <span className={`text-xs font-bold ${theme === 'dark' ? 'text-slate-100' : 'text-slate-800'}`}>{state.user.name}</span>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest">{state.user.role}</span>
          </div>
          <div className={`hidden sm:flex w-9 h-9 rounded-full border ${theme === 'dark' ? 'border-slate-700 bg-slate-700' : 'border-slate-200 bg-slate-100'} overflow-hidden items-center justify-center flex-shrink-0`}>
            {state.user.avatar
              ? <img src={state.user.avatar} alt="avatar" className="w-full h-full object-cover" />
              : <ICONS.Users className="w-5 h-5 text-slate-400" />}
          </div>
          <div className="flex items-center gap-1">
            {/* Desktop: theme + logout */}
            <button 
              onClick={toggleTheme} 
              className={`hidden sm:block p-1.5 sm:p-2 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-slate-700 text-yellow-400' : 'hover:bg-slate-200 text-slate-500'}`}
              title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
            >
              {theme === 'light' ? <ICONS.Moon className="w-4 h-4 sm:w-5 sm:h-5" /> : <ICONS.Sun className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>
            <button 
              onClick={handleLogout} 
              className={`hidden sm:block p-1.5 sm:p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors rounded-lg`}
              title="Logout"
            >
              <ICONS.LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            {/* Mobile: hamburger */}
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
              className={`sm:hidden p-1.5 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-slate-700 text-slate-300' : 'hover:bg-slate-100 text-slate-500'}`}
              title="Menu"
            >
              <ICONS.Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div ref={mobileMenuRef} className={`sm:hidden absolute top-[56px] right-2 w-56 rounded-2xl shadow-2xl z-[60] overflow-hidden animate-in slide-in-from-top-2 border ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <div className="flex flex-col py-2">
            {/* User info row */}
            <div className={`px-4 py-3 border-b ${theme === 'dark' ? 'border-slate-700' : 'border-slate-100'}`}>
              <p className={`text-xs font-bold ${theme === 'dark' ? 'text-slate-100' : 'text-slate-800'}`}>{state.user.name}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">{state.user.role}</p>
            </div>

            {/* Nav items */}
            {[
              { label: 'Archives', icon: <ICONS.History className="w-4 h-4" />, step: 'history', show: true },
              { label: 'Audit', icon: <ICONS.MessageSquare className="w-4 h-4" />, step: 'audit', show: canViewAudit },
              { label: 'My Profile', icon: <ICONS.UserIcon className="w-4 h-4" />, step: 'profile', show: true },
              { label: 'Identity', icon: <ICONS.Lock className="w-4 h-4" />, step: 'admin', show: isSysAdmin },
            ].filter(i => i.show).map(item => (
              <button
                key={item.label}
                onClick={() => { setState(prev => ({ ...prev, step: item.step as any })); setIsMobileMenuOpen(false); }}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-bold transition-colors ${
                  state.step === item.step
                    ? 'text-blue-600 bg-blue-50'
                    : theme === 'dark' ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {item.icon} {item.label}
              </button>
            ))}

            <button 
              onClick={() => { document.getElementById('feedback-toggle-btn')?.click(); setIsMobileMenuOpen(false); }} 
              className={`flex items-center gap-3 px-4 py-3 text-sm font-bold transition-colors ${theme === 'dark' ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <ICONS.MessageSquare className="w-4 h-4" /> Feedback
            </button>

            {/* Dark mode toggle */}
            <div className={`flex items-center justify-between px-4 py-3 border-t ${theme === 'dark' ? 'border-slate-700' : 'border-slate-100'}`}>
              <span className={`text-sm font-bold ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                {theme === 'dark' ? '🌙 Dark Mode' : '☀️ Light Mode'}
              </span>
              <button
                onClick={toggleTheme}
                className={`relative w-10 h-5 rounded-full transition-colors duration-300 ${theme === 'dark' ? 'bg-blue-600' : 'bg-slate-300'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-300 ${theme === 'dark' ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </div>

            <div className={`border-t my-1 ${theme === 'dark' ? 'border-slate-700' : 'border-slate-100'}`}></div>
            <button 
              onClick={() => { setIsMobileMenuOpen(false); handleLogout(); }} 
              className={`flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-600 ${theme === 'dark' ? 'hover:bg-red-900/20' : 'hover:bg-red-50'}`}
            >
              <ICONS.LogOut className="w-4 h-4" /> Log out
            </button>
          </div>
        </div>
      )}

      <main className="flex-grow flex flex-col lg:flex-row overflow-hidden relative">
        {/* Sidebar: hidden on mobile when browsing sub-pages */}
        <aside className={`${
          !isReportingActive ? 'hidden lg:flex'
          : state.step === 'input' ? 'flex flex-grow lg:flex-grow-0'
          : 'flex'
        } w-full lg:w-[34rem] flex-shrink-0 flex-col p-4 gap-4 ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-100/50 border-slate-200'} border-r overflow-y-auto ${state.step === 'input' ? 'max-h-none' : 'max-h-[40vh]'} lg:max-h-none lg:h-full scrollbar-thin`}>
          <div className={`rounded-2xl p-1 shadow-sm border ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200/60'} flex-shrink-0`}>
            <button 
              onClick={() => setState(prev => ({ ...prev, step: 'input' }))} 
              className={`w-full py-2.5 px-4 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${isReportingActive ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-blue-600 hover:bg-slate-50'}`}
            >
              <ICONS.FileText className="w-4 h-4" /> Reporting
            </button>
          </div>

          <div className={`transition-all duration-300 ${!isReportingActive ? 'opacity-40 grayscale pointer-events-none' : 'opacity-100'}`}>
            <GlassCard className={`!p-4 sm:!p-5 space-y-4 sm:space-y-5 ${theme === 'dark' ? '!bg-slate-800/80 border-slate-700' : ''}`}>
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className={`block text-[10px] font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'} uppercase tracking-widest mb-1.5 ml-1`}>Donor Specification</label>
                  <select name="donor_type" value={inputs.donor_type} onChange={handleInputChange} className={`w-full border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/10 text-sm cursor-pointer appearance-none ${theme === 'dark' ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-700'}`}>
                    <option value={DonorType.USAID}>USAID Standard Reporting</option>
                    <option value={DonorType.EU}>EU / ECHO Guidelines</option>
                    <option value={DonorType.UN}>UN Multi-Agency Format</option>
                    <option value={DonorType.LOCAL_GOV}>Local Gov (Regional Auth.)</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-[10px] font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'} uppercase tracking-widest mb-1.5 ml-1`}>Language</label>
                    <select name="language" value={inputs.language} onChange={handleInputChange} className={`w-full border rounded-xl px-3 py-2.5 focus:outline-none text-sm ${theme === 'dark' ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-600'}`}>
                      <option value="English">English</option>
                      <option value="French">French</option>
                      <option value="Swahili">Swahili</option>
                      <option value="Arabic">Arabic</option>
                    </select>
                  </div>
                  <div>
                    <label className={`block text-[10px] font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'} uppercase tracking-widest mb-1.5 ml-1`}>Report Style</label>
                    <select name="style" value={inputs.style} onChange={handleInputChange} className={`w-full border rounded-xl px-3 py-2.5 focus:outline-none text-sm ${theme === 'dark' ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-600'}`}>
                      <option value="executive">Executive</option>
                      <option value="auditor">Auditor</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className={`p-3 border rounded-2xl ${theme === 'dark' ? 'bg-slate-900/80 border-slate-700' : 'bg-slate-50/80 border-slate-100'}`}>
                <div className="flex items-center justify-between mb-2">
                  <label className={`text-[10px] font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'} uppercase tracking-widest flex items-center gap-2`}>
                    <ICONS.Mic className="w-3.5 h-3.5" /> Voice Capture
                  </label>
                  {state.isRecording && <span className="flex items-center gap-1.5 animate-pulse"><span className="w-1.5 h-1.5 rounded-full bg-red-500"></span><span className="text-[8px] font-bold text-red-600 uppercase">Live</span></span>}
                </div>
                <AudioVisualizer stream={mediaStream} isActive={state.isRecording} />
                
                {audioPreviewUrl && !state.isRecording && (
                  <div className={`mt-2 p-1 border rounded-lg animate-in fade-in slide-in-from-top-1 duration-200 ${theme === 'dark' ? 'bg-blue-900/30 border-blue-900' : 'bg-blue-100/30 border-blue-100'}`}>
                    <audio src={audioPreviewUrl} controls className="w-full h-8 rounded-lg accent-blue-600" />
                  </div>
                )}

                <div className="mt-3 flex gap-2">
                  {!state.isRecording ? (
                    <button type="button" onClick={startRecording} className="flex-1 py-2.5 px-3 bg-blue-600 text-white rounded-xl text-[9px] font-bold uppercase tracking-widest hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-sm">
                      <ICONS.Mic className="w-3.5 h-3.5" /> {inputs.field_notes_voice ? 'Retake' : 'Capture'}
                    </button>
                  ) : (
                    <button type="button" onClick={stopRecording} className="flex-1 py-2.5 px-3 bg-red-600 text-white rounded-xl text-[9px] font-bold uppercase tracking-widest hover:bg-red-700 transition-all flex items-center justify-center gap-2">
                      <ICONS.Stop className="w-3.5 h-3.5" /> Stop
                    </button>
                  )}
                  
                  <div className="relative">
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".pdf,.doc,.docx,.txt" />
                    <button type="button" onClick={() => fileInputRef.current?.click()} className={`p-2.5 border rounded-xl hover:bg-slate-50 transition-all flex items-center justify-center shadow-sm ${theme === 'dark' ? 'bg-slate-900 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-600'}`} title="Upload Docs">
                      <ICONS.Word className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* File Upload Status & Remove Option */}
                {inputs.field_notes_file && (
                  <div className={`mt-2 p-2 border rounded-xl flex items-center justify-between animate-in fade-in slide-in-from-top-1 ${theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-slate-100/50 border-slate-200'}`}>
                    <div className="flex items-center gap-2 overflow-hidden">
                      <ICONS.Word className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      <span className="text-[10px] font-medium truncate text-slate-500">{inputs.field_notes_file.name}</span>
                    </div>
                    <button type="button" onClick={removeUploadedFile} className="p-1 hover:bg-red-50 hover:text-red-500 text-slate-400 rounded-lg transition-colors">
                      <ICONS.X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {uploadSuccess && (
                  <div className="mt-2 text-center">
                    <span className="text-[9px] font-bold text-green-600 uppercase tracking-tighter animate-in fade-in">{uploadSuccess}</span>
                  </div>
                )}
              </div>

              <div>
                <label className={`block text-[10px] font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-900'} uppercase tracking-widest mb-1.5 ml-1`}>Field Observations</label>
                <textarea name="field_notes_text" value={inputs.field_notes_text} onChange={handleInputChange} placeholder="Summarize key activities and outcomes..." className={`w-full h-24 border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500/10 resize-none text-sm leading-relaxed ${theme === 'dark' ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-700'}`} />
              </div>

              <div className="flex items-start gap-2.5 pt-1">
                <input type="checkbox" id="compliance" checked={state.complianceChecked} onChange={(e) => setState(prev => ({ ...prev, complianceChecked: e.target.checked }))} className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer mt-0.5" />
                <label htmlFor="compliance" className={`text-xs ${theme === 'dark' ? 'text-slate-100' : 'text-slate-800'} leading-tight cursor-pointer select-none font-bold`}>
                  Manual verification confirmed. User accepts responsibility for data accuracy.
                </label>
              </div>

              <button 
                type="submit" 
                onClick={(e) => { e.preventDefault(); handleSubmit(e); }}
                disabled={!state.complianceChecked || !isInputValid || state.isProcessing} 
                className={`w-full py-3 rounded-xl font-bold uppercase tracking-widest text-[9px] transition-all shadow-lg ${state.complianceChecked && isInputValid && !state.isProcessing ? 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-[1.01]' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
              >
                {state.isProcessing ? 'Synthesizing...' : 'Generate AI Report'}
              </button>
            </GlassCard>
          </div>
          
          <div className="mt-auto py-4 text-center flex-shrink-0 opacity-60">
            <p className={`text-[9px] uppercase tracking-widest font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
              A Product of{' '}
              <a
                href="https://crane-systems.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-600 transition-colors inline-flex items-center gap-0.5 font-bold"
              >
                Crane Systems
                <svg className="w-2.5 h-2.5" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M2.5 9.5l7-7M10 2.5H4.5M10 2.5v5.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </a>
            </p>
          </div>
        </aside>

        {/* Dynamic Main Content Pane: hidden on mobile during input step */}
        <div className={`${
          state.step === 'input' ? 'hidden sm:flex' : 'flex'
        } flex-grow flex-col p-4 sm:p-6 overflow-hidden relative min-h-0`}>
          
          <nav className={`hidden sm:flex flex-shrink-0 items-center gap-1.5 mb-6 ${theme === 'dark' ? 'bg-slate-800/40' : 'bg-slate-200/40'} p-1 rounded-2xl w-fit overflow-x-auto no-scrollbar scroll-smooth`}>
            <button 
              onClick={() => setState(prev => ({ ...prev, step: 'history' }))} 
              className={`flex-shrink-0 flex items-center gap-1.5 px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${state.step === 'history' ? (theme === 'dark' ? 'bg-slate-700 text-blue-400 shadow-sm' : 'bg-white text-blue-600 shadow-sm') : 'text-slate-400 hover:text-slate-600'}`}
            >
              <ICONS.History className="w-4 h-4" /> Archives
            </button>
            
            {canViewAudit && (
              <button 
                onClick={() => setState(prev => ({ ...prev, step: 'audit' }))} 
                className={`flex-shrink-0 flex items-center gap-1.5 px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${state.step === 'audit' ? (theme === 'dark' ? 'bg-slate-700 text-blue-400 shadow-sm' : 'bg-white text-blue-600 shadow-sm') : 'text-slate-400 hover:text-slate-600'}`}
              >
                <ICONS.MessageSquare className="w-4 h-4" /> Audit
              </button>
            )}

            <button 
              onClick={() => setState(prev => ({ ...prev, step: 'profile' }))} 
              className={`flex-shrink-0 flex items-center gap-1.5 px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${state.step === 'profile' ? (theme === 'dark' ? 'bg-slate-700 text-blue-400 shadow-sm' : 'bg-white text-blue-600 shadow-sm') : 'text-slate-400 hover:text-slate-600'}`}
            >
              <ICONS.UserIcon className="w-4 h-4" /> My Profile
            </button>

            {isSysAdmin && (
              <button 
                onClick={() => setState(prev => ({ ...prev, step: 'admin' }))} 
                className={`flex-shrink-0 flex items-center gap-1.5 px-6 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${state.step === 'admin' ? (theme === 'dark' ? 'bg-slate-700 text-blue-400 shadow-sm' : 'bg-white text-blue-600 shadow-sm') : 'text-slate-400 hover:text-slate-600'}`}
              >
                <ICONS.Lock className="w-4 h-4" /> Identity
              </button>
            )}
          </nav>

          <GlassCard className={`flex-grow flex flex-col min-h-0 overflow-y-auto lg:overflow-hidden shadow-2xl ${theme === 'dark' ? '!bg-slate-800/80 border-slate-700' : '!bg-white/80 border-white/50'} scroll-smooth`}>
            {state.step === 'history' ? (
              <HistorySection user={state.user!} history={state.history} onSelectItem={handleSelectHistoryItem} onDeleteItem={deleteHistoryItem} />
            ) : state.step === 'audit' && canViewAudit ? (
              <AdminFeedbackReview user={state.user!} />
            ) : state.step === 'admin' && isSysAdmin ? (
              <AdminPanel user={state.user!} theme={theme} />
            ) : state.step === 'profile' ? (
              <MyProfile user={state.user!} onUpdateUser={(u) => setState(prev => ({ ...prev, user: u }))} theme={theme} />
            ) : (
              <div className="flex flex-col h-full min-h-0">
                <div className="flex justify-between items-center mb-5 sm:mb-6 flex-shrink-0">
                  <div className="flex items-center gap-2 text-blue-600">
                    <ICONS.FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                    <h2 className={`font-bold uppercase tracking-[0.2em] text-[9px] sm:text-[10px] ${theme === 'dark' ? 'text-blue-400' : ''}`}>Strategic Synthesis</h2>
                  </div>
                  {state.report && (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setIsEditingReport(!isEditingReport)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 ${isEditingReport ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'}`}
                      >
                        <ICONS.Edit className="w-3.5 h-3.5" />
                        {isEditingReport ? 'Preview' : 'Edit'}
                      </button>
                      <button 
                        onClick={copyToClipboard}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 ${copyFeedback ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'}`}
                      >
                        {copyFeedback ? <ICONS.Check className="w-3.5 h-3.5" /> : <ICONS.Copy className="w-3.5 h-3.5" />}
                        {copyFeedback ? 'Copied' : 'Copy All'}
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex-grow flex flex-col min-h-0 overflow-hidden">
                  {state.step === 'input' && (
                    <div className="flex-grow flex flex-col items-center justify-center text-center opacity-30 py-12 sm:py-20">
                      <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full flex items-center justify-center mb-5 sm:mb-6 border animate-float ${theme === 'dark' ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-white'}`}>
                        <ICONS.FileText className="w-8 h-8 sm:w-10 sm:h-10 text-slate-300" />
                      </div>
                      <h3 className={`font-bold mb-1.5 sm:mb-2 text-sm sm:text-base ${theme === 'dark' ? 'text-slate-100' : 'text-slate-800'}`}>Awaiting Submission</h3>
                      <p className={`font-light text-[11px] sm:text-sm max-w-[200px] sm:max-w-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-400'}`}>Grant intelligence will populate here in real-time.</p>
                    </div>
                  )}

                  {state.step === 'processing' && !state.report && (
                    <ProcessingState message={state.progressMessage} />
                  )}

                  {(state.step === 'result' || (state.step === 'processing' && state.report)) && (
                    <div className="flex-grow flex flex-col min-h-0 animate-in fade-in zoom-in-95 overflow-hidden">
                      <div className={`flex-grow border rounded-2xl p-4 sm:p-8 mb-5 sm:mb-6 shadow-inner overflow-y-auto prose prose-slate ${theme === 'dark' ? 'prose-invert bg-slate-900/50 border-slate-700' : 'bg-white border-slate-100'} max-w-none scroll-smooth`}>
                        {isEditingReport ? (
                          <textarea
                            value={state.report || ''}
                            onChange={(e) => setState(prev => ({ ...prev, report: e.target.value }))}
                            className="w-full h-full bg-transparent border-none resize-none focus:outline-none focus:ring-0 text-sm font-mono"
                          />
                        ) : (
                          <div dangerouslySetInnerHTML={{ __html: marked.parse(state.report || '') }} />
                        )}
                      </div>
                      <ExportPanel isAvailable={true} onExport={handleExport} />
                    </div>
                  )}
                </div>
              </div>
            )}
          </GlassCard>
        </div>
      </main>

      {/* Restored Floating Info Trigger */}
      <button 
        onClick={() => setShowInfoModal(true)}
        className={`fixed bottom-6 left-6 z-40 p-3 border rounded-full shadow-lg transition-all hover:scale-110 active:scale-95 ${theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-blue-400' : 'bg-white border-slate-200 text-slate-400 hover:text-blue-500 hover:border-blue-200'}`}
        title="Compliance"
      >
        <ICONS.Info className="w-5 h-5" />
      </button>

      {/* Restored Compliance Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className={`rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl animate-in zoom-in-95 overflow-y-auto max-h-[85vh] scroll-smooth ${theme === 'dark' ? 'bg-slate-800 text-slate-100' : 'bg-white text-slate-900'}`}>
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-xl font-bold flex items-center gap-3"><ICONS.Info className="text-blue-600" /> System Integrity</h2>
              <button onClick={() => setShowInfoModal(false)} className={`p-1 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-100 text-slate-400'}`}><ICONS.X className="w-5 h-5" /></button>
            </div>
            <div className={`space-y-6 text-[13px] sm:text-sm leading-relaxed ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
              <section>
                <h3 className={`text-xs font-bold uppercase tracking-widest mb-3 ${theme === 'dark' ? 'text-slate-100' : 'text-slate-800'}`}>OPERATIONAL PROTOCOL</h3>
                <ul className="space-y-2.5 list-disc list-inside marker:text-blue-500">
                  <li>AI outputs must be verified by human officers prior to submission.</li>
                  <li>System prioritizes donor formatting over creative narrative.</li>
                  <li>Identity access is recorded for internal security auditing.</li>
                </ul>
              </section>

              <section className={`p-4 rounded-2xl border ${theme === 'dark' ? 'bg-red-900/20 border-red-900' : 'bg-red-50/50 border-red-100'}`}>
                <h3 className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${theme === 'dark' ? 'text-red-400' : 'text-red-800'}`}>SECURITY ADVISORY</h3>
                <p className={`text-[11px] font-medium leading-normal ${theme === 'dark' ? 'text-red-300' : 'text-red-700'}`}>
                  Factual legitimacy remains the responsibility of the designated officer. The synthesis engine does not detect financial fraud or fabricated data.
                </p>
              </section>
            </div>
            <button onClick={() => setShowInfoModal(false)} className="w-full mt-8 py-3.5 bg-blue-600 text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">
              ACKNOWLEDGE POLICY
            </button>
          </div>
        </div>
      )}

      {/* Feedback widget: desktop only — on mobile it's accessible via the menu */}
      <div className={`fixed bottom-6 right-6 z-[100] hidden sm:block`}>
        <ContextualFeedbackWidget 
          user={state.user}
          context={{
            draftId: state.currentTaskId || null,
            donorType: inputs.donor_type,
            style: inputs.style,
            consistencyScore: state.report ? 0.94 : 0, 
            lastAiAction: state.isProcessing ? 'Processing' : 'Generation'
          }}
        />
      </div>
    </div>
  );
};

export default App;

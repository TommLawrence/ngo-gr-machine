
import React, { useState } from 'react';
import { ICONS } from '../constants.tsx';
import { FeedbackContext, FeedbackPayload, User } from '../types.ts';

interface ContextualFeedbackWidgetProps {
  context: FeedbackContext;
  user: User | null;
}

export const ContextualFeedbackWidget: React.FC<ContextualFeedbackWidgetProps> = ({ context, user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  // Form State
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [messageText, setMessageText] = useState('');

  const resetForm = () => {
    setMessageText('');
    setIsSuccess(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !context.draftId) return;
    
    setIsSubmitting(true);

    const payload = {
      workflow_run_id: context.draftId,
      draft_id: context.draftId,
      donor_type: context.donorType,
      style: context.style,
      feedback_message: messageText,
      feedback_type: "Contextual Analytics Feedback",
      submitted_at: new Date().toISOString(),
    };

    try {
      // Direct Integration with Web3Forms
      const formData = new FormData();
      const accessKey = import.meta.env.VITE_WEB3FORMS_ACCESS_KEY;
      if (!accessKey) {
        throw new Error('Web3Forms access key is not configured.');
      }
      formData.append('access_key', accessKey);
      formData.append('subject', 'New Feedback from NGO Grant Machine');
      formData.append('from_name', name);
      formData.append('email', email);
      formData.append('message', JSON.stringify(payload, null, 2));

      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        body: formData
      });
      
      if (!res.ok) throw new Error('Web3Forms submission failed');
      
      // Local backup for audit
      const existing = localStorage.getItem('ngo_feedback_logs');
      const logs = existing ? JSON.parse(existing) : [];
      logs.push(payload);
      localStorage.setItem('ngo_feedback_logs', JSON.stringify(logs.slice(-50)));

      setIsSuccess(true);
      // Close after delay
      setTimeout(() => {
        setIsOpen(false);
        resetForm();
      }, 2000);
    } catch (err) {
      console.error('Feedback transmission failed', err);
      // Still show success to user to not break flow, but log error internally
      setIsSuccess(true); 
      setTimeout(() => {
        setIsOpen(false);
        resetForm();
      }, 2000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
      {/* Feedback Card */}
      {isOpen && (
        <div className="mb-4 w-80 glass rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-6 duration-300 border border-white/40 overflow-hidden">
          {isSuccess ? (
            <div className="py-10 text-center flex flex-col items-center animate-in zoom-in-95 duration-200">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <ICONS.Check className="text-green-600 w-6 h-6" />
              </div>
              <h3 className="text-slate-800 font-bold mb-1">Feedback Sent</h3>
              <p className="text-slate-500 text-xs italic">Thank you for your feedback, It matters a lot to us</p>
            </div>
          ) : !context.draftId ? (
            <div className="py-8 text-center flex flex-col items-center relative">
              <button
                onClick={() => setIsOpen(false)}
                className="absolute top-0 right-0 p-1 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ICONS.X className="w-4 h-4 text-slate-400" />
              </button>
              <ICONS.Info className="text-slate-300 w-10 h-10 mb-3" />
              <p className="text-slate-500 text-xs px-4 leading-relaxed">Generate a report first to provide contextual feedback.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="flex justify-between items-center mb-1">
                <h3 className="text-sm font-bold text-slate-800">Field Intelligence Feedback</h3>
                <button 
                  type="button" 
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-slate-200/50 rounded-lg transition-colors"
                >
                  <ICONS.X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              {/* Name */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Name</label>
                <input 
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full bg-white/50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/10 text-slate-700"
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Email</label>
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full bg-white/50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/10 text-slate-700"
                />
              </div>

              {/* Message */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Message</label>
                <textarea 
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  required
                  placeholder="How can we improve your experience?"
                  className="w-full h-20 bg-white/50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/10 resize-none text-slate-700"
                />
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting || !messageText.trim()}
                className={`w-full py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${isSubmitting ? 'bg-slate-100 text-slate-400' : 'bg-slate-800 text-white hover:bg-slate-900'}`}
              >
                {isSubmitting ? <ICONS.Loader className="w-4 h-4" /> : 'Send Message'}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Toggle Button */}
      <button 
        id="feedback-toggle-btn"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-2xl ${isOpen ? 'bg-slate-100 text-slate-400 rotate-90 scale-90' : 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-110 active:scale-95'}`}
      >
        {isOpen ? <ICONS.X className="w-6 h-6" /> : <ICONS.MessageSquare className="w-6 h-6" />}
      </button>
    </div>
  );
};

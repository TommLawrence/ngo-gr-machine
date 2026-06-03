import React, { useState } from 'react';
import { User, UserAccount } from '../types.ts';
import { ICONS } from '../constants.tsx';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '../utils/cropImage.ts';

interface MyProfileProps {
  user: User;
  onUpdateUser: (updatedUser: User) => void;
}

export const MyProfile: React.FC<MyProfileProps> = ({ user, onUpdateUser }) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'error' | 'success' } | null>(null);

  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const passwordsMatch = newPassword === confirmPassword;
  const hasMismatch = confirmPassword.length > 0 && !passwordsMatch;
  const isValidFormat = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(newPassword);
  const canSubmitPassword = oldPassword.length > 0 && newPassword.length > 0 && confirmPassword.length > 0 && passwordsMatch && isValidFormat;

  const handlePasswordUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage({ text: 'New passwords do not match.', type: 'error' });
      return;
    }
    if (newPassword.length < 8) {
      setMessage({ text: 'New password must be at least 8 characters.', type: 'error' });
      return;
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      setMessage({ text: 'Password must contain at least one special character, figure, upper and lowercase.', type: 'error' });
      return;
    }

    const vaultRaw = localStorage.getItem('ngo_user_vault');
    const vault: UserAccount[] = vaultRaw ? JSON.parse(vaultRaw) : [];
    const accountIndex = vault.findIndex(acc => acc.id === user.id);

    if (accountIndex === -1) {
      setMessage({ text: 'User account not found.', type: 'error' });
      return;
    }

    if (vault[accountIndex].passwordHash !== oldPassword) {
      setMessage({ text: 'Incorrect old password.', type: 'error' });
      return;
    }

    // Update password
    vault[accountIndex].passwordHash = newPassword;
    localStorage.setItem('ngo_user_vault', JSON.stringify(vault));
    
    setMessage({ text: 'Password updated successfully.', type: 'success' });
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setMessage({ text: 'Image size must be less than 2MB.', type: 'error' });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setCropImageSrc(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
    // reset input so the same file can be selected again
    e.target.value = '';
  };

  const handleCropComplete = (croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleCropSave = async () => {
    if (!cropImageSrc || !croppedAreaPixels) return;
    try {
      const croppedImageBase64 = await getCroppedImg(cropImageSrc, croppedAreaPixels);
      
      const vaultRaw = localStorage.getItem('ngo_user_vault');
      const vault: UserAccount[] = vaultRaw ? JSON.parse(vaultRaw) : [];
      const accountIndex = vault.findIndex(acc => acc.id === user.id);
      
      if (accountIndex !== -1) {
        vault[accountIndex].avatar = croppedImageBase64;
        localStorage.setItem('ngo_user_vault', JSON.stringify(vault));
      }

      onUpdateUser({ ...user, avatar: croppedImageBase64 });
      setMessage({ text: 'Profile photo updated successfully.', type: 'success' });
      setCropImageSrc(null);
    } catch (e) {
      setMessage({ text: 'Failed to crop image.', type: 'error' });
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0 p-2 sm:p-4">
      <div className="flex justify-between items-center mb-6 flex-shrink-0">
        <div className="flex items-center gap-2 text-blue-600">
          <ICONS.UserIcon className="w-5 h-5" />
          <h2 className="font-bold uppercase tracking-[0.2em] text-[10px]">My Profile</h2>
        </div>
      </div>

      <div className="flex-grow overflow-y-auto min-h-0 space-y-8 pb-10">
        {/* Profile Card */}
        <div className="glass p-6 rounded-2xl border border-slate-200/60 bg-white/50 shadow-sm flex flex-col md:flex-row gap-6 items-center md:items-start">
          <div className="flex-shrink-0 relative group">
            <div className="w-24 h-24 rounded-full border-4 border-white shadow-lg overflow-hidden bg-slate-100 flex items-center justify-center">
              {user.avatar ? (
                <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <ICONS.UserIcon className="w-10 h-10 text-slate-300" />
              )}
            </div>
            <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 cursor-pointer rounded-full transition-opacity">
              <ICONS.Edit className="w-5 h-5" />
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
            </label>
          </div>
          
          <div className="flex-grow space-y-3 text-center md:text-left">
            <div>
              <h3 className="text-xl font-bold text-slate-800">{user.name}</h3>
              <p className="text-sm text-slate-500 font-medium">{user.role}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-slate-400 font-medium"><strong>Email:</strong> {user.email}</p>
              <p className="text-xs text-slate-400 font-medium"><strong>User ID:</strong> {user.id}</p>
            </div>
          </div>
        </div>

        {/* Password Update Form */}
        <div className="glass p-6 rounded-2xl border border-slate-200/60 bg-white/50 shadow-sm max-w-md">
          <h4 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
            <ICONS.Lock className="w-4 h-4 text-blue-500" /> Update Password
          </h4>
          
          <form onSubmit={handlePasswordUpdate} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1.5 ml-1">Old Password</label>
              <input 
                type="password" 
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                required
                className="w-full border rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 border-slate-200 bg-white text-slate-700"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1.5 ml-1">New Password</label>
              <div className="relative group">
                <input 
                  type={showNewPassword ? "text" : "password"} 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full border rounded-xl px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 border-slate-200 bg-white text-slate-700"
                />
                <button 
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showNewPassword ? <ICONS.EyeOff className="w-4 h-4" /> : <ICONS.Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1.5 ml-1">Confirm New Password</label>
              <div className="relative group">
                <input 
                  type={showConfirmPassword ? "text" : "password"} 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full border rounded-xl px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 border-slate-200 bg-white text-slate-700"
                />
                <button 
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showConfirmPassword ? <ICONS.EyeOff className="w-4 h-4" /> : <ICONS.Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <p className={`text-[9px] italic mt-2 leading-relaxed ${isValidFormat || newPassword.length === 0 ? 'text-slate-500' : 'text-red-500'}`}>
              * Password must contain at least one special character, figure, upper and lowercase and must be a minimum of 8 characters.
            </p>
            {hasMismatch && (
              <p className="text-[10px] text-red-500 font-bold mt-1">
                Passwords do not match.
              </p>
            )}
            
            {message && (
              <div className={`p-3 rounded-xl text-xs font-medium animate-in fade-in slide-in-from-top-2 ${message.type === 'error' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'}`}>
                {message.text}
              </div>
            )}
            
            <button 
              type="submit" 
              disabled={!canSubmitPassword}
              className={`w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-widest shadow-md transition-all mt-2 ${canSubmitPassword ? 'bg-slate-800 text-white hover:bg-slate-900' : 'bg-slate-300 text-slate-500 cursor-not-allowed'}`}
            >
              Update Password
            </button>
          </form>
        </div>
      </div>

      {cropImageSrc && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 sm:p-6 animate-in fade-in">
          <div className="bg-slate-900 rounded-3xl p-4 sm:p-6 w-full max-w-md shadow-2xl flex flex-col h-[500px]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-bold text-sm uppercase tracking-widest">Crop Photo</h3>
              <button onClick={() => setCropImageSrc(null)} className="text-slate-400 hover:text-white transition-colors"><ICONS.X className="w-5 h-5" /></button>
            </div>
            <div className="relative flex-grow rounded-2xl overflow-hidden bg-black/50">
              <Cropper
                image={cropImageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                onCropChange={setCrop}
                onCropComplete={handleCropComplete}
                onZoomChange={setZoom}
              />
            </div>
            <div className="mt-4 flex gap-3">
              <button 
                onClick={() => setCropImageSrc(null)} 
                className="flex-1 py-3 rounded-xl bg-slate-800 text-white text-xs font-bold uppercase hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleCropSave} 
                className="flex-1 py-3 rounded-xl bg-blue-600 text-white text-xs font-bold uppercase hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/20"
              >
                Save Photo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

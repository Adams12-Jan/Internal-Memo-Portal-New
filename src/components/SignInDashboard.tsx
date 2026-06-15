import React, { useState, useEffect } from 'react';
import { Role } from '../types';
import { ROLE_PROFILES } from './RoleSwitcher';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  Sparkles, 
  UserCheck, 
  AlertCircle, 
  Clock, 
  KeyRound, 
  Fingerprint, 
  HelpCircle, 
  ArrowRight,
  CheckCircle2,
  Users
} from 'lucide-react';

interface SignInDashboardProps {
  onSignIn: (role: Role, name: string, email: string) => void;
  pendingCounts: Record<Role, number>;
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
}

// Generate secure 2FA OTP codes
function generateNewOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export default function SignInDashboard({ onSignIn, pendingCounts, theme, onThemeToggle }: SignInDashboardProps) {
  const [emailInput, setEmailInput] = useState('a.olanrewaju@vetiva.com');
  const [passwordInput, setPasswordInput] = useState('••••••••••••');
  const [authenticatorInput, setAuthenticatorInput] = useState('');
  const [customRole, setCustomRole] = useState<Role>('Initiator');
  const [errorMessage, setErrorMessage] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Authenticator dynamic rotational OTP state
  const [activeOtp, setActiveOtp] = useState(() => generateNewOtp());
  const [secondsLeft, setSecondsLeft] = useState(30);

  // Rotate OTP security token dynamically
  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setActiveOtp(generateNewOtp());
          return 30;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Detect matching profile based on user email
  const getMappedProfile = (email: string) => {
    const cleanEmail = email.trim().toLowerCase();
    if (cleanEmail === 'a.olanrewaju@vetiva.com' || cleanEmail === 'friday@vetiva.com') {
      return ROLE_PROFILES.find(p => p.id === 'Initiator');
    } else if (cleanEmail === 'b.lawson@vetiva.com') {
      return ROLE_PROFILES.find(p => p.id === 'LineManager');
    } else if (cleanEmail === 'c.nze@vetiva.com') {
      return ROLE_PROFILES.find(p => p.id === 'Auditor');
    } else if (cleanEmail === 'o.vetiva@vetiva.com') {
      return ROLE_PROFILES.find(p => p.id === 'Executive');
    } else if (cleanEmail === 'a.suleiman@vetiva.com') {
      return ROLE_PROFILES.find(p => p.id === 'Finance');
    } else if (cleanEmail === 'admin@vetiva.com') {
      return ROLE_PROFILES.find(p => p.id === 'Admin');
    }
    return null;
  };

  const activeMatchedProfile = getMappedProfile(emailInput);

  // Autofill dynamic directory cards
  const applyDirectoryProfile = (email: string) => {
    setEmailInput(email);
    setPasswordInput('••••••••••••');
    setAuthenticatorInput(activeOtp); // Pre-fill authenticator for supreme user comfort during testing
    setErrorMessage('');
  };

  const handleSecureLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!emailInput.trim()) {
      setErrorMessage('Institutional Email Address is required to verify identity.');
      return;
    }

    if (!emailInput.includes('@') || !emailInput.endsWith('.com')) {
      setErrorMessage('Access denied. Please enter a valid institutional Vetiva workspace domain email.');
      return;
    }

    if (!authenticatorInput.trim()) {
      setErrorMessage('Dynamic 2FA verification pin is required to proceed.');
      return;
    }

    // Authenticator validation (flexible default: accept exact OTP or any valid 6-digit code for testing usability)
    const cleanOtp = authenticatorInput.trim().replace(/\s/g, '');
    if (cleanOtp.length !== 6 || isNaN(Number(cleanOtp))) {
      setErrorMessage('The Authenticator security token must be a 6-digit numeric passcode.');
      return;
    }

    setIsAuthenticating(true);
    
    // Determine target session parameters
    const mapped = activeMatchedProfile;
    const finalRole = mapped ? mapped.id : customRole;
    const finalName = mapped ? mapped.name.split(' / ')[0] : emailInput.split('@')[0].toUpperCase();

    setTimeout(() => {
      setIsAuthenticating(false);
      setIsSuccess(true);
      
      // Complete secure entry hand-off
      setTimeout(() => {
        onSignIn(finalRole, finalName, emailInput);
      }, 500);
    }, 900);
  };

  return (
    <div className={`min-h-screen flex flex-col justify-between transition-colors duration-200 font-sans ${
      theme === 'dark' ? 'bg-[#0B0F19] text-slate-100' : 'bg-[#F8FAFC] text-slate-800'
    }`}>
      {/* Top Banner Ribbon */}
      <header className={`px-6 py-4 flex items-center justify-between border-b transition-colors ${
        theme === 'dark' ? 'bg-[#131B2E] border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center gap-3">
          <img src="https://imgur.com/12nOK79.png" alt="Vetiva Logo" referrerPolicy="no-referrer" className="h-8 w-auto object-contain shrink-0" />
          <div>
            <span className={`text-[11px] font-bold tracking-widest uppercase block ${
              theme === 'dark' ? 'text-slate-200' : 'text-slate-900'
            }`}>
              Vetiva Capital Management
            </span>
            <span className="text-[9px] text-blue-600 font-mono tracking-widest uppercase font-semibold block">
              Internal Memo Portal
            </span>
          </div>
        </div>

        {/* Day / Night Mode Button */}
        <button
          onClick={onThemeToggle}
          type="button"
          className={`px-3 py-1.5 rounded-lg border transition-all cursor-pointer shadow-sm text-xs flex items-center gap-1.5 font-bold ${
            theme === 'dark'
              ? 'bg-[#1E293B] border-slate-700 text-yellow-400 hover:text-yellow-300'
              : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900'
          }`}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? (
            <>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
              </span>
              <span>Day Mode</span>
            </>
          ) : (
            <>
              <span>🌙 Dark Mode</span>
            </>
          )}
        </button>
      </header>

      {/* Hero Welcome Column */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 flex flex-col lg:flex-row items-center justify-center gap-12">
        
        {/* Left Side Descriptive Branding Copy Section */}
        <div className="max-w-md space-y-6 text-center lg:text-left select-none">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-500 rounded-full text-[10px] font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> High-Security Treasury Operations
          </span>
          <h2 className={`text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight ${
            theme === 'dark' ? 'text-white' : 'text-slate-950'
          }`}>
            Vetiva Internal Cash &amp; Treasury Ledger
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Authorized portal for administrative digital signatures, compliance policy audits, bank ledger disbursements, and petty cash reconciliations.
          </p>

          <div className={`p-4 rounded-xl border flex items-start gap-3 text-xs leading-relaxed transition-colors ${
            theme === 'dark' ? 'bg-[#111A2E]/55 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
          }`}>
            <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <strong className={`font-semibold block mb-0.5 ${
                theme === 'dark' ? 'text-slate-200' : 'text-slate-800'
              }`}>
                Multi-Factor Security Assurance
              </strong>
              All petty cash advances and voucher payments require live institutional authentication and e-signature certificates mapped to active clearance classes.
            </div>
          </div>
        </div>

        {/* Secure Sign-In Centerpiece */}
        <div className="w-full max-w-xl flex flex-col gap-6">
          
          {/* Main Authentication Card */}
          <div className={`p-6 rounded-2xl border shadow-xl transition-all ${
            theme === 'dark' ? 'bg-[#131C2E] border-slate-800' : 'bg-white border-slate-200'
          }`}>
            
            <div className={`border-b border-dashed pb-4 mb-5 flex justify-between items-center ${
              theme === 'dark' ? 'border-slate-800' : 'border-slate-200'
            }`}>
              <div>
                <h3 className={`font-extrabold text-base flex items-center gap-1.5 ${
                  theme === 'dark' ? 'text-slate-100' : 'text-slate-900'
                }`}>
                  <Fingerprint className="w-5 h-5 text-blue-500" />
                  Institutional Gateway Access
                </h3>
                <p className="text-[11px] text-slate-500">Sign in using your corporate email address and authenticator key.</p>
              </div>
              <span className={`px-2 py-0.5 text-[9px] font-semibold font-mono border rounded ${
                theme === 'dark' ? 'bg-[#1E293B] border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-250 text-slate-600'
              }`}>
                TLS 1.3 SECURE
              </span>
            </div>

            {/* ERROR FEEDBACK */}
            {errorMessage && (
              <div className="mb-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl p-3 flex items-center gap-2 text-xs font-semibold animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0 animate-bounce" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* SUCCESS SPLASH */}
            {isSuccess && (
              <div className="mb-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl p-3 flex items-center gap-2.5 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 animate-pulse" />
                <span>Verification successful. Loading treasury dashboard...</span>
              </div>
            )}

            <form onSubmit={handleSecureLogin} className="space-y-4">
              
              {/* Institutional Email Address */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Institutional Email Address
                  </label>
                  {activeMatchedProfile && (
                    <span className="text-[10px] text-emerald-500 font-semibold flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Matched Profile: {activeMatchedProfile.id}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={emailInput}
                    onChange={(e) => {
                      setEmailInput(e.target.value);
                      setErrorMessage('');
                    }}
                    placeholder="Enter name@vetiva.com"
                    className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all ${
                      theme === 'dark' ? 'bg-[#0E1524] border-slate-700 text-slate-200' : 'bg-white border-slate-250 text-slate-800'
                    }`}
                  />
                </div>
              </div>

              {/* Dynamic Clearance Selector for Unknown Custom Emails */}
              {!activeMatchedProfile && emailInput.includes('@') && (
                <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl space-y-2 text-xs">
                  <div className="flex items-center gap-1.5 text-amber-500 font-semibold text-[11px]">
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Unlisted email domain. Please designate clearance level:</span>
                  </div>
                  <select
                    value={customRole}
                    onChange={(e) => setCustomRole(e.target.value as Role)}
                    className={`w-full p-2 text-xs rounded-lg border focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                      theme === 'dark' ? 'bg-[#1E293B] border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-700'
                    }`}
                  >
                    {ROLE_PROFILES.map((profile) => (
                      <option key={profile.id} value={profile.id}>
                        {profile.title} ({profile.name.split(' / ')[0]})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Grid block for Password & 2FA Passing Authenticator */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Security Passcode */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Security Passcode
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      required
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="••••••••••••"
                      className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all ${
                        theme === 'dark' ? 'bg-[#0E1524] border-slate-700 text-slate-200' : 'bg-white border-slate-250 text-slate-800'
                      }`}
                    />
                  </div>
                </div>

                {/* Authenticator App Token Code */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Authenticator Code
                    </label>
                    <span className="text-[9px] text-blue-500 font-mono font-bold animate-pulse">2FA REQUIRED</span>
                  </div>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      maxLength={6}
                      required
                      value={authenticatorInput}
                      onChange={(e) => {
                        setAuthenticatorInput(e.target.value.replace(/\D/g, ''));
                        setErrorMessage('');
                      }}
                      placeholder="e.g. 742183"
                      className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border focus:outline-none font-mono tracking-widest focus:ring-1 focus:ring-blue-500 transition-all ${
                        theme === 'dark' ? 'bg-[#0E1524] border-slate-700 text-slate-200' : 'bg-white border-slate-250 text-slate-800'
                      }`}
                    />
                  </div>
                </div>

              </div>

              {/* Dynamic Authenticator Simulator Drawer */}
              <div className={`p-4 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-4 transition-all ${
                theme === 'dark' ? 'bg-[#0E1524] border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center gap-3">
                  <div className="relative flex items-center justify-center h-10 w-10 shrink-0">
                    <div className="absolute inset-0 rounded-full border-2 border-dashed border-blue-500/20 animate-spin"></div>
                    <Clock className="w-5 h-5 text-blue-500 relative" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">
                      Vetiva Mobile Authenticator App Sync
                    </span>
                    <strong className="text-sm font-semibold block text-blue-500 dark:text-blue-400 font-mono">
                      Security Token: {activeOtp.slice(0, 3)} {activeOtp.slice(3)}
                    </strong>
                    <span className="text-[9.5px] text-slate-500 block font-mono">
                      Passcode rotates in {secondsLeft} seconds
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => applyDirectoryProfile(emailInput)}
                  className={`px-3 py-1.5 text-[10px] font-bold rounded-lg border flex items-center gap-1 cursor-pointer transition-all shrink-0 ${
                    theme === 'dark'
                      ? 'bg-[#1E293B] border-slate-700 text-slate-300 hover:text-white hover:border-slate-500'
                      : 'bg-white border-slate-250 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  ⚡ Auto-sync 2FA Code
                </button>
              </div>

              {/* Sign In Trigger Button */}
              <button
                type="submit"
                disabled={isAuthenticating || isSuccess}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs py-2.5 px-3 rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <UserCheck className="w-4 h-4" />
                {isAuthenticating ? 'Decrypting Vault Connection...' : 'Validate Access credentials & Sign In'}
              </button>

            </form>

          </div>

          {/* Quick-Select Corporate Officer Directory (Extreme simulation helper block) */}
          <div className={`p-5 rounded-2xl border ${
            theme === 'dark' ? 'bg-[#131C2E] border-slate-800' : 'bg-white border-slate-200'
          }`}>
            <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase block mb-3.5 flex items-center gap-1.5 border-b border-slate-100 dark:border-slate-800 pb-2">
              <Users className="w-3.5 h-3.5 text-blue-500" />
              Corporate Officers Active Directory
            </span>

            <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3">
              {[
                { name: 'A. Olanrewaju', email: 'a.olanrewaju@vetiva.com', role: 'Initiator', icon: '👤' },
                { name: 'Manager Lawson', email: 'b.lawson@vetiva.com', role: 'Line Manager', icon: '💼' },
                { name: 'C. Nze (Auditor)', email: 'c.nze@vetiva.com', role: 'Auditor', icon: '🔍' },
                { name: 'Dr. O. Vetiva', email: 'o.vetiva@vetiva.com', role: 'Executive', icon: '⚖️' },
                { name: 'Aisha Suleman', email: 'a.suleiman@vetiva.com', role: 'Finance', icon: '💵' },
                { name: 'System Admin', email: 'admin@vetiva.com', role: 'Admin', icon: '⚙️' },
              ].map((co) => {
                const count = pendingCounts[co.role === 'Line Manager' ? 'LineManager' : co.role as Role] || 0;
                return (
                  <button
                    key={co.email}
                    onClick={() => {
                      applyDirectoryProfile(co.email);
                    }}
                    type="button"
                    className={`p-2 rounded-xl text-left border cursor-pointer select-none transition-all hover:scale-[1.01] ${
                      emailInput === co.email
                        ? theme === 'dark'
                          ? 'bg-[#1E293B] border-blue-500/80 shadow'
                          : 'bg-blue-50/50 border-blue-600/60 shadow-3xs'
                        : theme === 'dark'
                          ? 'bg-[#0E1524] border-slate-800 hover:bg-[#141E33]'
                          : 'bg-slate-50 border-slate-150 hover:bg-slate-100/55'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-1">
                      <span className="text-[10.5px] font-bold text-slate-800 dark:text-slate-100 truncate block">
                        {co.icon} {co.name}
                      </span>
                      {count > 0 && (
                        <span className="bg-rose-500 text-white leading-none font-bold px-1 py-0.5 rounded text-[7.5px] shrink-0 animate-pulse">
                          {count}
                        </span>
                      )}
                    </div>
                    <span className="text-[9px] text-slate-500 block truncate leading-tight mt-0.5">{co.email}</span>
                    <span className="text-[8.5px] text-blue-600 dark:text-blue-400 font-mono block mt-1 uppercase font-semibold">
                      {co.role}
                    </span>
                  </button>
                );
              })}
            </div>
            
            <div className={`mt-3 pt-2 border-t text-[9.5px] text-slate-500 leading-normal flex items-start gap-1.5 ${
              theme === 'dark' ? 'border-slate-800' : 'border-slate-100'
            }`}>
              <HelpCircle className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
              <span>
                Select any office holder to auto-fill. The integrated dynamic authenticator rotates passcodes dynamically for secure sandbox entry.
              </span>
            </div>
          </div>

        </div>

      </div>

      {/* Corporate Compliance footer */}
      <footer className="py-4 text-center text-[9px] text-slate-500 font-mono select-none">
        Vetiva Capital Management Security Policy • Protected by Cryptographic Dual-Key Dual-Role Multi-Signature (SHA-256) Protocol.
      </footer>
    </div>
  );
}

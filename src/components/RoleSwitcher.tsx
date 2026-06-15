import { Role } from '../types';
import { Shield, User, Landmark, ClipboardCheck, DollarSign, Settings, ArrowRight } from 'lucide-react';

interface RoleProfile {
  id: Role;
  name: string;
  title: string;
  avatarBg: string;
  description: string;
}

export const ROLE_PROFILES: RoleProfile[] = [
  {
    id: 'Initiator',
    name: 'Adeleke Olanrewaju / Friday Ezekiel',
    title: 'Employee / Initiator',
    avatarBg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    description: 'Create cash advances, petty cash request, submit petty cash retirements, respond to queries, and view status.'
  },
  {
    id: 'LineManager',
    name: 'Babatunde Lawson',
    title: 'Line Manager',
    avatarBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    description: 'Review departmental memos, certify business justification, authorize or return for correction, sign digitally.'
  },
  {
    id: 'Auditor',
    name: 'Chioma Nze',
    title: 'Internal Control Auditor',
    avatarBg: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
    description: 'Verify policy compliance, audit documentation accuracy, raise queries directly to initiators.'
  },
  {
    id: 'Executive',
    name: 'Dr. Olaoluwa Vetiva',
    title: 'Executive Management',
    avatarBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    description: 'Perform budget-utilization overview, final executive endorsement, or return for query responses.'
  },
  {
    id: 'Finance',
    name: 'Aisha Suleiman',
    title: 'Finance Department',
    avatarBg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    description: 'Process payments, generate payment vouchers, record transaction references, attach proof/bank slips.'
  },
  {
    id: 'Admin',
    name: 'Admin Console',
    title: 'System Administrator',
    avatarBg: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    description: 'Monitor enterprise audit trail log records, view all transitions across the ecosystem, configure rules.'
  }
];

interface RoleSwitcherProps {
  currentRole: Role;
  onRoleChange: (role: Role) => void;
  pendingCounts: Record<Role, number>;
  theme?: 'light' | 'dark';
}

export default function RoleSwitcher({ currentRole, onRoleChange, pendingCounts, theme = 'light' }: RoleSwitcherProps) {
  const getIcon = (role: Role) => {
    switch (role) {
      case 'Initiator': return <User className="w-4 h-4" />;
      case 'LineManager': return <Shield className="w-4 h-4" />;
      case 'Auditor': return <ClipboardCheck className="w-4 h-4" />;
      case 'Executive': return <Landmark className="w-4 h-4" />;
      case 'Finance': return <DollarSign className="w-4 h-4" />;
      case 'Admin': return <Settings className="w-4 h-4" />;
    }
  };

  const activeProfile = ROLE_PROFILES.find(p => p.id === currentRole);

  return (
    <div className={`border-b p-4 transition-colors duration-200 ${
      theme === 'dark' ? 'bg-[#0E1524] border-slate-800' : 'bg-slate-50 border-slate-200'
    }`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-bold tracking-widest px-2.5 py-1 rounded-full uppercase border ${
                theme === 'dark' 
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                  : 'bg-emerald-50 border-emerald-250 text-emerald-707'
              }`}>
                Active Session Identity
              </span>
              <span className="text-xs text-slate-500 font-mono">Simulated Role Controller</span>
            </div>
            
            {activeProfile && (
              <div className="mt-2 flex items-start gap-3">
                <div className={`p-2.5 rounded-xl border shrink-0 shadow-sm transition-colors ${
                  theme === 'dark' 
                    ? 'bg-[#131C2E] border-slate-700 text-slate-300' 
                    : 'bg-white border-slate-200 text-slate-650'
                }`}>
                  {getIcon(activeProfile.id)}
                </div>
                <div>
                  <h3 className="text-sm font-semibold flex items-center gap-1.5 leading-none mb-1">
                    <span className={theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}>
                      {activeProfile.name}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs text-emerald-600 font-normal">({activeProfile.title})</span>
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 max-w-2xl leading-relaxed">
                    {activeProfile.description}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className={`flex flex-wrap lg:justify-end gap-1.5 shrink-0 p-1.5 rounded-xl border transition-colors ${
            theme === 'dark' ? 'bg-[#131C2E] border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}>
            {ROLE_PROFILES.map((profile) => {
              const isActive = profile.id === currentRole;
              const hasAlert = pendingCounts[profile.id] > 0;

              return (
                <button
                  key={profile.id}
                  onClick={() => onRoleChange(profile.id)}
                  className={`relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? theme === 'dark'
                        ? 'bg-[#1E293B] text-white border border-slate-700 shadow-sm font-bold'
                        : 'bg-white text-slate-900 border border-slate-200 shadow-sm font-bold'
                      : theme === 'dark'
                        ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                  id={`btn-role-${profile.id}`}
                >
                  <span className={`${isActive ? 'text-emerald-500' : 'text-slate-400'}`}>
                    {getIcon(profile.id)}
                  </span>
                  <span>{profile.id === 'Initiator' ? 'Initiator' : profile.id === 'LineManager' ? 'Line Manager' : profile.id === 'Auditor' ? 'Auditor' : profile.id === 'Executive' ? 'Executive' : profile.id === 'Finance' ? 'Finance' : 'Admin'}</span>
                  
                  {hasAlert && (
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                    </span>
                  )}
                  {pendingCounts[profile.id] > 0 && (
                    <span className="bg-rose-500/10 text-rose-500 px-1 py-0.2 rounded font-mono text-[9px] border border-rose-500/20">
                      {pendingCounts[profile.id]}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

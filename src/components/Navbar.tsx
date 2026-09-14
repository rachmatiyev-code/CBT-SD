import React from 'react';
import {
  BookOpen,
  Activity,
  BarChart3,
  BrainCircuit,
  Users,
  Building2,
  Server,
  Settings,
  GraduationCap,
  Sparkles,
} from 'lucide-react';

export type NavTab = 'exams' | 'monitoring' | 'analytics' | 'remedial' | 'students' | 'letterhead';

interface NavbarProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  appMode: 'teacher' | 'student';
  onToggleMode: (mode: 'teacher' | 'student') => void;
  onOpenServerMonitor: () => void;
  onOpenSettings: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  appMode,
  onToggleMode,
  onOpenServerMonitor,
  onOpenSettings,
}) => {
  const tabs: Array<{ id: NavTab; label: string; icon: React.ReactNode }> = [
    { id: 'exams', label: 'Paket Soal & AI', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'monitoring', label: 'Live Monitoring', icon: <Activity className="w-4 h-4" /> },
    { id: 'analytics', label: 'Analisis & Rapor', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'remedial', label: 'Remidi & Pengayaan', icon: <BrainCircuit className="w-4 h-4" /> },
    { id: 'students', label: 'Data Siswa', icon: <Users className="w-4 h-4" /> },
    { id: 'letterhead', label: 'Kop Surat Resmi', icon: <Building2 className="w-4 h-4" /> },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Navbar Top Row */}
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-xs">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-black text-slate-900 tracking-tight text-base sm:text-lg">
                  CBT SD Cerdas
                </span>
                <span className="text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-md flex items-center gap-0.5">
                  <Sparkles className="w-3 h-3 text-purple-600" /> Gemini AI
                </span>
              </div>
              <p className="text-[11px] text-slate-400 -mt-0.5">
                Kurikulum Merdeka SD Kelas 1 - 6 &bull; Taksonomi Bloom
              </p>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Mode Switcher */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                id="btn-mode-guru"
                onClick={() => onToggleMode('teacher')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  appMode === 'teacher'
                    ? 'bg-white text-indigo-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Mode Guru
              </button>
              <button
                id="btn-mode-siswa"
                onClick={() => onToggleMode('student')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  appMode === 'student'
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Mode Siswa
              </button>
            </div>

            {/* Server Monitor Pill */}
            <button
              id="btn-nav-server-monitor"
              onClick={onOpenServerMonitor}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-colors cursor-pointer"
              title="Periksa Kinerja Server Backend Express"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <Server className="w-3.5 h-3.5 text-slate-500" />
              <span>Server Live</span>
            </button>

            {/* Settings & GSync */}
            <button
              id="btn-nav-settings"
              onClick={onOpenSettings}
              className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              title="Pengaturan Sistem &amp; GSync Backup"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation Row (Shown in Teacher Mode) */}
        {appMode === 'teacher' && (
          <nav className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto py-2.5 border-t border-slate-100 scrollbar-none">
            {tabs.map((tab) => {
              const isActive = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`nav-tab-${tab.id}`}
                  onClick={() => onTabChange(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              );
            })}
          </nav>
        )}
      </div>
    </header>
  );
};

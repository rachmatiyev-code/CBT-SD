import React, { useEffect, useState } from 'react';
import { Exam, LiveStudentSession, Student } from '../../types';
import { storageService } from '../../services/storageService';
import {
  Activity,
  ShieldAlert,
  Send,
  Lock,
  Clock,
  Battery,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Radio,
  Sparkles,
} from 'lucide-react';

interface LiveMonitoringProps {
  exams: Exam[];
  students: Student[];
}

export const LiveMonitoring: React.FC<LiveMonitoringProps> = ({ exams, students }) => {
  const [selectedExamId, setSelectedExamId] = useState<string>(exams[0]?.id || '');
  const [liveSessions, setLiveSessions] = useState<LiveStudentSession[]>([]);
  const [messageTarget, setMessageTarget] = useState<LiveStudentSession | null>(null);
  const [directMessageText, setDirectMessageText] = useState('');
  const [sentNotice, setSentNotice] = useState(false);

  // Load and subscribe to live sessions
  const refreshSessions = () => {
    const rawSessions = storageService.getLiveSessions();
    const currentExam = exams.find((e) => e.id === selectedExamId) || exams[0];

    // If no live sessions exist for this exam, generate dynamic demo active sessions for students
    if (rawSessions.filter((s) => s.examId === selectedExamId).length === 0 && currentExam) {
      const demoActive: LiveStudentSession[] = students.slice(0, 4).map((s, idx) => ({
        studentId: s.id,
        studentName: s.name,
        studentNisn: s.nisn,
        examId: selectedExamId,
        currentQuestionNumber: Math.min(idx * 2 + 1, currentExam.questions?.length || 5),
        answeredCount: idx * 2,
        totalQuestions: currentExam.questions?.length || 6,
        status: idx === 2 ? 'warning' : 'active',
        violationCount: idx === 2 ? 2 : 0,
        lastViolation: idx === 2 ? 'Peringatan: Beralih tab jendela browser' : undefined,
        timeRemainingSeconds: 45 * 60 - idx * 300,
        batteryLevel: 95 - idx * 10,
        isOnline: true,
        lastHeartbeat: new Date().toISOString(),
      }));
      demoActive.forEach((sess) => storageService.updateLiveSession(sess));
      setLiveSessions(demoActive);
    } else {
      setLiveSessions(rawSessions.filter((s) => s.examId === selectedExamId));
    }
  };

  useEffect(() => {
    refreshSessions();

    const handleSessionUpdate = () => {
      refreshSessions();
    };

    window.addEventListener('cbt-live-session-update', handleSessionUpdate);
    const interval = setInterval(refreshSessions, 3000);

    return () => {
      window.removeEventListener('cbt-live-session-update', handleSessionUpdate);
      clearInterval(interval);
    };
  }, [selectedExamId]);

  const handleSendTeacherMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageTarget || !directMessageText.trim()) return;

    // Send via CustomEvent for 2-way client communication
    window.dispatchEvent(
      new CustomEvent('cbt-teacher-direct-message', {
        detail: {
          studentId: messageTarget.studentId,
          examId: messageTarget.examId,
          message: directMessageText.trim(),
          timestamp: new Date().toLocaleTimeString(),
        },
      })
    );

    setSentNotice(true);
    setTimeout(() => {
      setSentNotice(false);
      setMessageTarget(null);
      setDirectMessageText('');
    }, 1500);
  };

  const handleForceAction = (session: LiveStudentSession, action: 'lock' | 'add_time' | 'force_submit') => {
    window.dispatchEvent(
      new CustomEvent('cbt-teacher-command', {
        detail: {
          studentId: session.studentId,
          examId: session.examId,
          action,
        },
      })
    );
    alert(`Perintah '${action}' berhasil dikirim ke perangkat ${session.studentName}.`);
  };

  const totalViolations = liveSessions.reduce((acc, s) => acc + s.violationCount, 0);
  const activeCount = liveSessions.filter((s) => s.status === 'active' || s.status === 'warning').length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-6 h-6 text-emerald-600" />
              Dasbor Pengawasan Real-Time Ujian Siswa
            </h2>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Pantau pergerakan siswa, deteksi kecurangan beralih tab, dan lakukan komunikasi dua arah secara langsung.
          </p>
        </div>

        {/* Exam Select */}
        <div className="flex items-center gap-3">
          <select
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="text-xs font-bold p-2.5 rounded-xl border border-slate-300 focus:outline-emerald-500 bg-slate-50 text-slate-800"
          >
            {exams.map((ex) => (
              <option key={ex.id} value={ex.id}>
                Kelas {ex.grade} - {ex.subject}
              </option>
            ))}
          </select>
          <button
            onClick={refreshSessions}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer"
            title="Muat Ulang Data Sesi"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500">Siswa Sedang Mengerjakan</span>
            <h3 className="text-2xl font-black text-slate-900">{activeCount} Siswa</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500">Total Pelanggaran Tab</span>
            <h3 className="text-2xl font-black text-rose-600">{totalViolations} Insiden</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500">Sistem Keamanan CBT</span>
            <h3 className="text-sm font-bold text-slate-800">Browser Lock & Anti-Copy Aktif</h3>
          </div>
        </div>
      </div>

      {/* Live Student Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {liveSessions.map((session) => {
          const progressPercent = Math.round(
            ((session.answeredCount || 0) / (session.totalQuestions || 1)) * 100
          );
          const minutesRemaining = Math.floor(session.timeRemainingSeconds / 60);

          return (
            <div
              key={session.studentId}
              className={`bg-white rounded-2xl p-5 border transition-all shadow-xs flex flex-col justify-between ${
                session.violationCount > 0
                  ? 'border-rose-300 ring-2 ring-rose-100'
                  : 'border-slate-200 hover:border-emerald-300'
              }`}
            >
              <div>
                {/* Card Top */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-slate-900 leading-snug">{session.studentName}</h4>
                    <p className="text-xs font-mono text-slate-400 mt-0.5">NISN: {session.studentNisn}</p>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                      session.violationCount > 0
                        ? 'bg-rose-100 text-rose-700 animate-pulse'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {session.violationCount > 0 ? (
                      <>
                        <AlertTriangle className="w-3 h-3" /> Peringatan ({session.violationCount})
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3 h-3" /> Aman & Fokus
                      </>
                    )}
                  </span>
                </div>

                {/* Violation banner if any */}
                {session.lastViolation && (
                  <div className="mt-3 p-2 bg-rose-50 border border-rose-200 rounded-lg text-[11px] text-rose-800 font-medium">
                    ⚠️ {session.lastViolation}
                  </div>
                )}

                {/* Progress bar */}
                <div className="mt-4 space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-500">Soal Aktif: No. {session.currentQuestionNumber}</span>
                    <span className="text-slate-800">
                      {session.answeredCount} / {session.totalQuestions} ({progressPercent}%)
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Telemetry info */}
                <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Sisa Waktu: <strong>{minutesRemaining} Menit</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Battery className="w-3.5 h-3.5 text-slate-400" />
                    <span>Baterai: <strong>{session.batteryLevel}%</strong></span>
                  </div>
                </div>
              </div>

              {/* Action Buttons: 2-Way Teacher Interactivity */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  id={`btn-chat-${session.studentId}`}
                  onClick={() => setMessageTarget(session)}
                  className="flex-1 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 py-2 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" /> Kirim Pesan
                </button>

                <button
                  onClick={() => handleForceAction(session, 'lock')}
                  className="p-2 text-slate-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                  title="Kunci Ujian Siswa Ini"
                >
                  <Lock className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleForceAction(session, 'add_time')}
                  className="p-2 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition-colors cursor-pointer"
                  title="Beri Tambahan Waktu (+5 Menit)"
                >
                  +5m
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 2-Way Message Modal */}
      {messageTarget && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Send className="w-4 h-4 text-indigo-600" />
                Kirim Pesan Langsung ke Siswa
              </h3>
              <button
                onClick={() => setMessageTarget(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSendTeacherMessage} className="mt-4 space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-700">
                Tujuan: <strong>{messageTarget.studentName}</strong> (NISN: {messageTarget.studentNisn})
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Isi Pesan Guru (Akan langsung muncul di layar siswa):
                </label>
                <textarea
                  rows={3}
                  required
                  value={directMessageText}
                  onChange={(e) => setDirectMessageText(e.target.value)}
                  placeholder="Contoh: Tolong tetap fokus pada layar ujian ya nak, jangan membuka aplikasi lain."
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-indigo-500 font-medium"
                />
              </div>

              {/* Quick Presets */}
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Fokus ya nak, jangan beralih tab!',
                  'Sisa waktu masih cukup, teliti kembali.',
                  'Bagus, lanjutkan pengerjaan!',
                ].map((txt) => (
                  <button
                    key={txt}
                    type="button"
                    onClick={() => setDirectMessageText(txt)}
                    className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded-md"
                  >
                    {txt}
                  </button>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setMessageTarget(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {sentNotice ? 'Pesan Terkirim!' : 'Kirim Sekarang'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

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
  RotateCcw,
  Edit3,
  Trash2,
  CheckSquare,
  Square,
  X,
  Check,
} from 'lucide-react';

interface LiveMonitoringProps {
  exams: Exam[];
  students: Student[];
}

export const LiveMonitoring: React.FC<LiveMonitoringProps> = ({ exams, students }) => {
  const [selectedExamId, setSelectedExamId] = useState<string>(exams[0]?.id || '');
  const [liveSessions, setLiveSessions] = useState<LiveStudentSession[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [messageTarget, setMessageTarget] = useState<LiveStudentSession | null>(null);
  const [directMessageText, setDirectMessageText] = useState('');
  const [sentNotice, setSentNotice] = useState(false);

  // Edit Modal State
  const [editingSession, setEditingSession] = useState<LiveStudentSession | null>(null);
  const [editFormData, setEditFormData] = useState<{
    status: 'active' | 'warning' | 'submitted' | 'locked';
    timeRemainingMinutes: number;
    violationCount: number;
    currentQuestionNumber: number;
  }>({
    status: 'active',
    timeRemainingMinutes: 45,
    violationCount: 0,
    currentQuestionNumber: 1,
  });

  // Delete & Reset Confirmations
  const [confirmDeleteSession, setConfirmDeleteSession] = useState<LiveStudentSession | null>(null);
  const [confirmResetSession, setConfirmResetSession] = useState<LiveStudentSession | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Load and subscribe to live sessions
  const refreshSessions = () => {
    const rawSessions = storageService.getLiveSessions();
    const currentExam = exams.find((e) => e.id === selectedExamId) || exams[0];

    // If no live sessions exist for this exam, populate initial demo active sessions for students
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

  // Selection handlers
  const handleToggleSelect = (studentId: string) => {
    setSelectedStudentIds((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]
    );
  };

  const handleSelectAll = () => {
    if (selectedStudentIds.length === liveSessions.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(liveSessions.map((s) => s.studentId));
    }
  };

  // Edit Session Handler
  const handleOpenEdit = (session: LiveStudentSession) => {
    setEditingSession(session);
    setEditFormData({
      status: session.status,
      timeRemainingMinutes: Math.round(session.timeRemainingSeconds / 60),
      violationCount: session.violationCount,
      currentQuestionNumber: session.currentQuestionNumber,
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSession) return;

    const updated: LiveStudentSession = {
      ...editingSession,
      status: editFormData.status,
      timeRemainingSeconds: Math.max(0, editFormData.timeRemainingMinutes * 60),
      violationCount: editFormData.violationCount,
      currentQuestionNumber: editFormData.currentQuestionNumber,
      lastHeartbeat: new Date().toISOString(),
    };

    storageService.updateLiveSession(updated);
    refreshSessions();
    setEditingSession(null);
    showToast(`Data sesi pengawasan untuk ${editingSession.studentName} berhasil diperbarui.`);
  };

  // Single Delete Handler
  const handleDeleteSession = async (session: LiveStudentSession) => {
    await storageService.clearLiveSession(session.examId, session.studentId);
    refreshSessions();
    setSelectedStudentIds((prev) => prev.filter((id) => id !== session.studentId));
    setConfirmDeleteSession(null);
    showToast(`Siswa ${session.studentName} dikeluarkan dari pemantauan aktif.`);
  };

  // Single Reset Handler (Allows student to retake exam)
  const handleResetSession = async (session: LiveStudentSession) => {
    const currentExam = exams.find((e) => e.id === session.examId);
    await storageService.resetStudentExamAttempt(session.examId, session.studentId);

    // Re-create a fresh active session
    const resetSession: LiveStudentSession = {
      ...session,
      currentQuestionNumber: 1,
      answeredCount: 0,
      status: 'active',
      violationCount: 0,
      lastViolation: undefined,
      timeRemainingSeconds: (currentExam?.durationMinutes || 45) * 60,
      lastHeartbeat: new Date().toISOString(),
    };
    storageService.updateLiveSession(resetSession);

    refreshSessions();
    setConfirmResetSession(null);
    showToast(`Ujian untuk ${session.studentName} telah direset! Siswa kini dapat mengerjakan ulang dari nomor 1.`);
  };

  // Bulk Reset Action
  const handleBulkReset = async () => {
    if (selectedStudentIds.length === 0) return;
    const currentExam = exams.find((e) => e.id === selectedExamId);

    for (const sId of selectedStudentIds) {
      await storageService.resetStudentExamAttempt(selectedExamId, sId);
      const session = liveSessions.find((s) => s.studentId === sId);
      if (session) {
        const resetSession: LiveStudentSession = {
          ...session,
          currentQuestionNumber: 1,
          answeredCount: 0,
          status: 'active',
          violationCount: 0,
          lastViolation: undefined,
          timeRemainingSeconds: (currentExam?.durationMinutes || 45) * 60,
          lastHeartbeat: new Date().toISOString(),
        };
        storageService.updateLiveSession(resetSession);
      }
    }

    refreshSessions();
    const count = selectedStudentIds.length;
    setSelectedStudentIds([]);
    showToast(`${count} siswa berhasil direset. Mereka dapat mengerjakan ulang soal.`);
  };

  // Bulk Delete Action
  const handleBulkDelete = async () => {
    if (selectedStudentIds.length === 0) return;
    for (const sId of selectedStudentIds) {
      await storageService.clearLiveSession(selectedExamId, sId);
    }
    refreshSessions();
    const count = selectedStudentIds.length;
    setSelectedStudentIds([]);
    showToast(`${count} siswa telah dikeluarkan dari pemantauan.`);
  };

  // Direct Teacher Message
  const handleSendTeacherMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageTarget || !directMessageText.trim()) return;

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
    }, 1200);
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
    showToast(`Perintah '${action}' berhasil dikirim ke perangkat ${session.studentName}.`);
  };

  const totalViolations = liveSessions.reduce((acc, s) => acc + s.violationCount, 0);
  const activeCount = liveSessions.filter((s) => s.status === 'active' || s.status === 'warning').length;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Feedback Toast */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-3 animate-fade-in text-sm font-semibold">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

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
            Pantau progres siswa secara langsung. Dilengkapi kontrol pilih, edit status, hapus sesi, dan reset agar siswa dapat mengulang soal.
          </p>
        </div>

        {/* Exam Select & Refresh */}
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
            <span className="text-xs font-semibold text-slate-500">Siswa Aktif Ujian</span>
            <h3 className="text-2xl font-black text-slate-900">{activeCount} Siswa</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500">Pelanggaran Tab Terdeteksi</span>
            <h3 className="text-2xl font-black text-rose-600">{totalViolations} Insiden</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold text-slate-500">Fitur Kontrol Pengawas</span>
            <h3 className="text-xs font-bold text-slate-800">Pilih &bull; Edit &bull; Hapus &bull; Reset Ulang</h3>
          </div>
        </div>
      </div>

      {/* Multi-Selection Control Toolbar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={handleSelectAll}
            className="flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-indigo-600 px-3 py-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
          >
            {selectedStudentIds.length === liveSessions.length && liveSessions.length > 0 ? (
              <CheckSquare className="w-4 h-4 text-indigo-600" />
            ) : (
              <Square className="w-4 h-4 text-slate-400" />
            )}
            Pilih Semua ({selectedStudentIds.length}/{liveSessions.length})
          </button>

          {selectedStudentIds.length > 0 && (
            <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
              {selectedStudentIds.length} Siswa Terpilih
            </span>
          )}
        </div>

        {selectedStudentIds.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold rounded-xl border border-amber-200 transition-all cursor-pointer"
              title="Reset siswa terpilih agar dapat mengerjakan ulang"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
              Reset Terpilih ({selectedStudentIds.length})
            </button>
            <button
              onClick={handleBulkDelete}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 transition-all cursor-pointer"
              title="Hapus sesi siswa terpilih"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              Hapus Terpilih ({selectedStudentIds.length})
            </button>
          </div>
        )}
      </div>

      {/* Live Student Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {liveSessions.map((session) => {
          const isSelected = selectedStudentIds.includes(session.studentId);
          const progressPercent = Math.round(
            ((session.answeredCount || 0) / (session.totalQuestions || 1)) * 100
          );
          const minutesRemaining = Math.floor(session.timeRemainingSeconds / 60);

          return (
            <div
              key={session.studentId}
              className={`bg-white rounded-2xl p-5 border transition-all shadow-xs flex flex-col justify-between relative ${
                isSelected
                  ? 'border-indigo-500 ring-2 ring-indigo-200 bg-indigo-50/20'
                  : session.violationCount > 0
                  ? 'border-rose-300 ring-2 ring-rose-100'
                  : 'border-slate-200 hover:border-emerald-300'
              }`}
            >
              <div>
                {/* Card Top with Checkbox (PILIH) */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5">
                    <button
                      onClick={() => handleToggleSelect(session.studentId)}
                      className="mt-0.5 text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                      title="Pilih Siswa Ini"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-indigo-600" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                    <div>
                      <h4 className="font-bold text-slate-900 leading-snug">{session.studentName}</h4>
                      <p className="text-xs font-mono text-slate-400 mt-0.5">NISN: {session.studentNisn}</p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0 ${
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
                    <span>
                      Sisa: <strong>{minutesRemaining} Menit</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Battery className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      Baterai: <strong>{session.batteryLevel}%</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* ACTION BUTTONS: PILIH, EDIT, HAPUS, RESET, CHAT */}
              <div className="mt-5 pt-3 border-t border-slate-100 space-y-2">
                {/* Primary Row: Reset Ulang Soal & Chat */}
                <div className="flex items-center gap-2">
                  {/* RESET BUTTON (Allows student to retake exam) */}
                  <button
                    id={`btn-reset-${session.studentId}`}
                    onClick={() => setConfirmResetSession(session)}
                    className="flex-1 text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 py-1.5 px-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    title="Reset ujian agar siswa dapat mengerjakan ulang dari awal"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-600" /> Reset (Ulangi Soal)
                  </button>

                  {/* CHAT BUTTON */}
                  <button
                    id={`btn-chat-${session.studentId}`}
                    onClick={() => setMessageTarget(session)}
                    className="text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 py-1.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                    title="Kirim pesan peringatan / arahan ke layar siswa"
                  >
                    <Send className="w-3.5 h-3.5" /> Pesan
                  </button>
                </div>

                {/* Secondary Row: EDIT, HAPUS, LOCK, +5M */}
                <div className="flex items-center justify-between gap-1 pt-1">
                  {/* EDIT BUTTON */}
                  <button
                    id={`btn-edit-${session.studentId}`}
                    onClick={() => handleOpenEdit(session)}
                    className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                    title="Edit parameter sesi pengawasan siswa"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-indigo-500" /> Edit Sesi
                  </button>

                  {/* HAPUS BUTTON */}
                  <button
                    id={`btn-delete-${session.studentId}`}
                    onClick={() => setConfirmDeleteSession(session)}
                    className="flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                    title="Hapus siswa dari pengawasan sesi aktif"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-500" /> Hapus
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleForceAction(session, 'lock')}
                      className="p-1.5 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Kunci Ujian Siswa Ini"
                    >
                      <Lock className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleForceAction(session, 'add_time')}
                      className="px-2 py-1 text-[11px] font-bold text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer border border-emerald-200"
                      title="Beri Tambahan Waktu (+5 Menit)"
                    >
                      +5m
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL 1: EDIT LIVE SESSION */}
      {editingSession && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-indigo-600" />
                Edit Sesi Pengawasan Siswa
              </h3>
              <button
                onClick={() => setEditingSession(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="mt-4 space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-0.5">
                <p className="font-bold text-slate-900">{editingSession.studentName}</p>
                <p className="text-slate-500 font-mono">NISN: {editingSession.studentNisn}</p>
              </div>

              {/* Status Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Status Ujian
                </label>
                <select
                  value={editFormData.status}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      status: e.target.value as 'active' | 'warning' | 'submitted' | 'locked',
                    })
                  }
                  className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 focus:outline-indigo-500 bg-white"
                >
                  <option value="active">Aktif Mengerjakan (Normal)</option>
                  <option value="warning">Peringatan (Terdeteksi Pelanggaran)</option>
                  <option value="locked">Terkunci oleh Guru</option>
                  <option value="submitted">Telah Mengumpulkan / Selesai</option>
                </select>
              </div>

              {/* Time Remaining Minutes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Sisa Waktu Ujian (Menit)
                </label>
                <input
                  type="number"
                  min="0"
                  max="180"
                  value={editFormData.timeRemainingMinutes}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      timeRemainingMinutes: Number(e.target.value) || 0,
                    })
                  }
                  className="w-full text-xs font-mono font-bold p-2.5 rounded-xl border border-slate-300 focus:outline-indigo-500"
                />
              </div>

              {/* Violation Count */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Jumlah Pelanggaran Tab Browser
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="99"
                    value={editFormData.violationCount}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        violationCount: Number(e.target.value) || 0,
                      })
                    }
                    className="flex-1 text-xs font-mono font-bold p-2.5 rounded-xl border border-slate-300 focus:outline-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setEditFormData({ ...editFormData, violationCount: 0 })}
                    className="px-3 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl"
                  >
                    Nolkan (0)
                  </button>
                </div>
              </div>

              {/* Current Question Number */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Posisi Nomor Soal Aktif
                </label>
                <input
                  type="number"
                  min="1"
                  max={editingSession.totalQuestions}
                  value={editFormData.currentQuestionNumber}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      currentQuestionNumber: Number(e.target.value) || 1,
                    })
                  }
                  className="w-full text-xs font-mono font-bold p-2.5 rounded-xl border border-slate-300 focus:outline-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingSession(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" /> Simpan Perubahan Sesi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CONFIRM RESET (ALLOW RETAKE EXAM) */}
      {confirmResetSession && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Reset Ujian Siswa (Mengerjakan Ulang)?
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Anda akan mereset ujian untuk siswa <strong>{confirmResetSession.studentName}</strong> (NISN: {confirmResetSession.studentNisn}).
              </p>
              <div className="mt-3 p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 space-y-1">
                <p className="font-bold">Konsekuensi Tindakan:</p>
                <ul className="list-disc pl-4 space-y-0.5">
                  <li>Seluruh jawaban yang telah diinput sebelumnya akan dihapus.</li>
                  <li>Laporan nilai dan sesi pengawasan dikembalikan ke awal (Nomor 1).</li>
                  <li>Siswa dapat langsung memulai kembali ujian seperti peserta baru.</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setConfirmResetSession(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                id="btn-confirm-reset-student"
                onClick={() => handleResetSession(confirmResetSession)}
                className="px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Ya, Reset & Izinkan Ulangi Soal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: CONFIRM DELETE SESSION */}
      {confirmDeleteSession && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Keluarkan Siswa dari Pengawasan?
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                Apakah Anda yakin ingin menghapus sesi pemantauan aktif untuk <strong>{confirmDeleteSession.studentName}</strong>?
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setConfirmDeleteSession(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                id="btn-confirm-delete-session"
                onClick={() => handleDeleteSession(confirmDeleteSession)}
                className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Hapus Sesi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: DIRECT TEACHER MESSAGE */}
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
                <X className="w-4 h-4" />
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
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
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

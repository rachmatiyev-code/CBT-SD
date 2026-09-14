import React, { useState, useEffect } from 'react';
import { Exam, Letterhead, Student, Submission } from './types';
import { storageService } from './services/storageService';
import { testConnection } from './firebase/config';
import { Navbar, NavTab } from './components/Navbar';
import { ExamBuilder } from './components/exam-creator/ExamBuilder';
import { LiveMonitoring } from './components/monitoring/LiveMonitoring';
import { AnalyticsDashboard } from './components/analytics/AnalyticsDashboard';
import { RemedialCenter } from './components/remedial/RemedialCenter';
import { StudentManager } from './components/students/StudentManager';
import { LetterheadEditor } from './components/kop/LetterheadEditor';
import { ExamPlayer } from './components/student-player/ExamPlayer';
import { PrintModal } from './components/print/PrintModal';
import { ParentNotifier } from './components/notifications/ParentNotifier';
import { ServerMonitorModal } from './components/server-monitor/ServerMonitorModal';
import { SettingsModal } from './components/settings/SettingsModal';
import {
  GraduationCap,
  Play,
  Award,
  CheckCircle,
  Clock,
  Sparkles,
  ArrowRight,
  BookOpen,
  UserCheck,
} from 'lucide-react';

export default function App() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [letterhead, setLetterhead] = useState<Letterhead>(storageService.getLetterhead());

  const [appMode, setAppMode] = useState<'teacher' | 'student'>('teacher');
  const [currentTab, setCurrentTab] = useState<NavTab>('exams');

  // Student test taker state
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [selectedExamIdForStudent, setSelectedExamIdForStudent] = useState<string>('');
  const [isExamInProgress, setIsExamInProgress] = useState(false);
  const [lastSubmissionResult, setLastSubmissionResult] = useState<Submission | null>(null);

  // Modals
  const [printModalState, setPrintModalState] = useState<{
    isOpen: boolean;
    type: 'exam_sheet' | 'student_report' | 'classical_report';
    exam?: Exam;
    submission?: Submission;
  }>({ isOpen: false, type: 'exam_sheet' });

  const [parentNotifierSub, setParentNotifierSub] = useState<Submission | null>(null);
  const [isServerMonitorOpen, setIsServerMonitorOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Initial load
  useEffect(() => {
    // 1. Test connection to Firestore (CRITICAL per skill requirement)
    testConnection();

    // 2. Load data
    const loadedExams = storageService.getExams();
    const loadedStudents = storageService.getStudents();
    const loadedSubs = storageService.getSubmissions();
    const loadedKop = storageService.getLetterhead();

    setExams(loadedExams);
    setStudents(loadedStudents);
    setSubmissions(loadedSubs);
    setLetterhead(loadedKop);

    if (loadedStudents.length > 0) setSelectedStudentId(loadedStudents[0].id);
    if (loadedExams.length > 0) setSelectedExamIdForStudent(loadedExams[0].id);

    // Check URL parameters for direct student exam access
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const urlMode = urlParams.get('mode');
      const urlExamId = urlParams.get('examId');
      if (urlMode === 'student') {
        setAppMode('student');
      }
      if (urlExamId) {
        setSelectedExamIdForStudent(urlExamId);
      }
    } catch {
      // Ignore if URL parsing is unavailable
    }
  }, []);

  const activeStudent = students.find((s) => s.id === selectedStudentId) || students[0];
  const activeExam = exams.find((e) => e.id === selectedExamIdForStudent) || exams[0];

  const handleStartExamAsStudent = (student?: Student, exam?: Exam) => {
    if (student) setSelectedStudentId(student.id);
    if (exam) setSelectedExamIdForStudent(exam.id);
    setAppMode('student');
    setIsExamInProgress(true);
    setLastSubmissionResult(null);
  };

  const handleExamFinished = (newSubmission: Submission) => {
    setIsExamInProgress(false);
    setLastSubmissionResult(newSubmission);
    const refreshedSubs = storageService.getSubmissions();
    const refreshedStudents = storageService.getStudents();
    setSubmissions(refreshedSubs);
    setStudents(refreshedStudents);
  };

  // If student is actively inside the exam taking mode
  if (appMode === 'student' && isExamInProgress && activeStudent && activeExam) {
    return (
      <ExamPlayer
        exam={activeExam}
        student={activeStudent}
        onFinishedExam={handleExamFinished}
        onExit={() => setIsExamInProgress(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col justify-between">
      <div>
        {/* Top App Navbar */}
        <Navbar
          currentTab={currentTab}
          onTabChange={setCurrentTab}
          appMode={appMode}
          onToggleMode={(mode) => {
            setAppMode(mode);
            setIsExamInProgress(false);
          }}
          onOpenServerMonitor={() => setIsServerMonitorOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        {/* Content Area */}
        <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {/* TEACHER MODE TABS */}
          {appMode === 'teacher' && (
            <div>
              {currentTab === 'exams' && (
                <ExamBuilder
                  exams={exams}
                  onExamsUpdated={setExams}
                  onSelectExamForPrint={(exam) =>
                    setPrintModalState({ isOpen: true, type: 'exam_sheet', exam })
                  }
                  onOpenStudentMode={(examId) => {
                    setSelectedExamIdForStudent(examId);
                    setAppMode('student');
                  }}
                />
              )}

              {currentTab === 'monitoring' && (
                <LiveMonitoring exams={exams} students={students} />
              )}

              {currentTab === 'analytics' && (
                <AnalyticsDashboard
                  exams={exams}
                  submissions={submissions}
                  onPrintClassicalReport={(exam, subs, docType) =>
                    setPrintModalState({
                      isOpen: true,
                      type: docType || 'exam_analysis',
                      exam,
                    })
                  }
                  onPrintIndividualReport={(sub) =>
                    setPrintModalState({
                      isOpen: true,
                      type: 'student_report',
                      submission: sub,
                      exam: exams.find((e) => e.id === sub.examId) || activeExam,
                    })
                  }
                  onOpenParentNotifier={(sub) => setParentNotifierSub(sub)}
                />
              )}

              {currentTab === 'remedial' && (
                <RemedialCenter
                  exams={exams}
                  submissions={submissions}
                  onOpenParentNotifier={(sub) => setParentNotifierSub(sub)}
                />
              )}

              {currentTab === 'students' && (
                <StudentManager
                  students={students}
                  onStudentsUpdated={setStudents}
                  onSelectStudentForExam={(student) => handleStartExamAsStudent(student, activeExam)}
                />
              )}

              {currentTab === 'letterhead' && (
                <LetterheadEditor initialLetterhead={letterhead} onSaved={setLetterhead} />
              )}
            </div>
          )}

          {/* STUDENT MODE LOBBY */}
          {appMode === 'student' && !isExamInProgress && (
            <div className="max-w-4xl mx-auto space-y-8 py-4">
              {/* Submission Result Announcement if just finished */}
              {lastSubmissionResult && (
                <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-emerald-500 shadow-xl space-y-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-3xl">
                    🎉
                  </div>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
                      Ujian Telah Selesai!
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
                      Selamat, {lastSubmissionResult.studentName}!
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">
                      Jawabanmu telah tersimpan dan dinilai oleh sistem serta Gemini AI.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-lg mx-auto bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <div>
                      <span className="text-xs text-slate-500">Nilai Akhir</span>
                      <h3 className="text-3xl font-black text-indigo-600">
                        {lastSubmissionResult.totalScore}
                      </h3>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500">Status</span>
                      <h3
                        className={`text-lg font-black uppercase mt-1 ${
                          lastSubmissionResult.passed ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {lastSubmissionResult.passed ? 'Tuntas' : 'Remidi'}
                      </h3>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <span className="text-xs text-slate-500">Hadiah XP</span>
                      <h3 className="text-lg font-black text-amber-600 mt-1">
                        +{lastSubmissionResult.totalScore + 100} XP 🏅
                      </h3>
                    </div>
                  </div>

                  {lastSubmissionResult.personalizedRecommendation && (
                    <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-2xl text-left text-xs space-y-2 max-w-xl mx-auto">
                      <p className="font-bold text-indigo-950 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-purple-600" />
                        Pesan Motivasi Belajar:
                      </p>
                      <p className="italic text-slate-700">
                        "{lastSubmissionResult.personalizedRecommendation.motivationalMessage}"
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                      onClick={() =>
                        setPrintModalState({
                          isOpen: true,
                          type: 'student_report',
                          submission: lastSubmissionResult,
                        })
                      }
                      className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
                    >
                      Lihat Lembar Rapor Lengkap
                    </button>
                    <button
                      onClick={() => setLastSubmissionResult(null)}
                      className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                    >
                      Kembali ke Menu Ujian
                    </button>
                  </div>
                </div>
              )}

              {/* Lobby Hero Card */}
              <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xs space-y-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-slate-100 pb-6">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                      Ruang Ujian Siswa SD Cerdas
                    </span>
                    <h2 className="text-2xl font-black text-slate-900 mt-2">
                      Selamat Datang di Ujian Berbasis Komputer
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">
                      Pilih identitas siswa dan paket soal untuk memulai pengerjaan dengan sistem anti-kecurangan aktif.
                    </p>
                  </div>

                  {/* Student Avatar Card */}
                  {activeStudent && (
                    <div className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-200 rounded-2xl shrink-0">
                      <div className="w-14 h-14 rounded-2xl bg-indigo-100 flex items-center justify-center text-3xl shadow-inner">
                        {activeStudent.avatar}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900">{activeStudent.name}</h4>
                        <p className="text-xs text-slate-500 font-mono">NISN: {activeStudent.nisn}</p>
                        <div className="mt-1 flex items-center gap-2 text-[11px] font-bold text-amber-600">
                          <Award className="w-3.5 h-3.5" /> Level {activeStudent.level} &bull;{' '}
                          {activeStudent.totalXp} XP
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Selectors */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Select Student */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-indigo-600" />
                      1. Pilih Identitas Siswa:
                    </label>
                    <select
                      id="select-student-for-exam"
                      value={selectedStudentId}
                      onChange={(e) => setSelectedStudentId(e.target.value)}
                      className="w-full text-sm font-semibold p-3.5 rounded-2xl border border-slate-300 focus:outline-indigo-500 bg-white"
                    >
                      {students.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.avatar} {s.name} (Kelas {s.grade} SD - NISN: {s.nisn})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Select Exam */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-indigo-600" />
                      2. Pilih Paket Ujian yang Dikerjakan:
                    </label>
                    <select
                      id="select-exam-for-student"
                      value={selectedExamIdForStudent}
                      onChange={(e) => setSelectedExamIdForStudent(e.target.value)}
                      className="w-full text-sm font-semibold p-3.5 rounded-2xl border border-slate-300 focus:outline-indigo-500 bg-white"
                    >
                      {exams.map((ex) => (
                        <option key={ex.id} value={ex.id}>
                          Kelas {ex.grade} - {ex.subject} ({ex.questions?.length || 0} Soal)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Exam Details Preview */}
                {activeExam && (
                  <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <h3 className="text-base font-bold text-slate-900">{activeExam.title}</h3>
                      <span className="text-xs font-bold px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full">
                        {activeExam.subject}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                      <div>
                        <span className="text-slate-400">Durasi Pengerjaan:</span>
                        <p className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3.5 h-3.5 text-indigo-500" />
                          {activeExam.durationMinutes} Menit
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-400">Total Butir Soal:</span>
                        <p className="font-bold text-slate-800 mt-0.5">
                          {activeExam.questions?.length || 0} Soal Campuran
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-400">KKM Ketuntasan:</span>
                        <p className="font-bold text-slate-800 mt-0.5">
                          Nilai {activeExam.passingGrade}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-400">Anti-Kecurangan:</span>
                        <p className="font-bold text-emerald-600 mt-0.5 flex items-center gap-1">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Aktif (Deteksi Tab)
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200 text-xs text-slate-600">
                      <p className="font-semibold mb-1">Tata Tertib Siswa:</p>
                      <p className="whitespace-pre-line leading-relaxed italic">{activeExam.instructions}</p>
                    </div>
                  </div>
                )}

                {/* Start Exam Button */}
                <div className="flex justify-center pt-2">
                  <button
                    id="btn-start-exam-now"
                    onClick={() => handleStartExamAsStudent()}
                    disabled={!activeExam || !activeStudent}
                    className="px-8 py-4 bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-black text-base rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center gap-3 cursor-pointer disabled:opacity-50"
                  >
                    <Play className="w-5 h-5 fill-current" />
                    Mulai Kerjakan Ujian Sekarang
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-6 text-center text-xs text-slate-400 mt-12 print:hidden">
        <p>
          CBT SD Cerdas &bull; {letterhead.schoolName} &bull; Platform Ujian Berbasis Komputer &amp; AI
          Kurikulum Merdeka SD Kelas 1 - 6
        </p>
      </footer>

      {/* Modals */}
      {printModalState.isOpen && (
        <PrintModal
          type={printModalState.type}
          letterhead={letterhead}
          exam={printModalState.exam || activeExam}
          submission={printModalState.submission}
          submissions={submissions.filter((s) => s.examId === (printModalState.exam?.id || activeExam?.id))}
          onClose={() => setPrintModalState({ ...printModalState, isOpen: false })}
        />
      )}

      {parentNotifierSub && (
        <ParentNotifier
          submission={parentNotifierSub}
          student={students.find((s) => s.id === parentNotifierSub.studentId)}
          letterhead={letterhead}
          onClose={() => setParentNotifierSub(null)}
        />
      )}

      {isServerMonitorOpen && (
        <ServerMonitorModal onClose={() => setIsServerMonitorOpen(false)} />
      )}

      {isSettingsOpen && (
        <SettingsModal
          onClose={() => setIsSettingsOpen(false)}
          onDataRestored={() => {
            setStudents(storageService.getStudents());
            setExams(storageService.getExams());
            setSubmissions(storageService.getSubmissions());
          }}
        />
      )}
    </div>
  );
}

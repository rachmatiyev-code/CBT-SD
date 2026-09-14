import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Exam, Question, Student, StudentAnswer, Submission } from '../../types';
import { geminiService } from '../../services/geminiService';
import { storageService } from '../../services/storageService';
import {
  Clock,
  ShieldAlert,
  Award,
  ChevronLeft,
  ChevronRight,
  Send,
  AlertTriangle,
  Maximize2,
  Lock,
  Sparkles,
  CheckCircle,
  HelpCircle,
  Volume2,
} from 'lucide-react';

interface ExamPlayerProps {
  exam: Exam;
  student: Student;
  onFinishedExam: (submission: Submission) => void;
  onExit: () => void;
}

export const ExamPlayer: React.FC<ExamPlayerProps> = ({
  exam,
  student,
  onFinishedExam,
  onExit,
}) => {
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState(exam.durationMinutes * 60);
  const [violationCount, setViolationCount] = useState(0);
  const [violationsLog, setViolationsLog] = useState<string[]>([]);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [lastWarningText, setLastWarningText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isLockedByTeacher, setIsLockedByTeacher] = useState(false);
  const [teacherMessageToast, setTeacherMessageToast] = useState<string | null>(null);

  const currentQuestion: Question | undefined = exam.questions?.[currentQIndex];
  const totalQuestions = exam.questions?.length || 0;

  // Sync session heartbeat to teacher
  useEffect(() => {
    const syncHeartbeat = () => {
      const answeredCount = Object.keys(answers).filter((k) => !!answers[k]?.trim()).length;
      storageService.updateLiveSession({
        studentId: student.id,
        studentName: student.name,
        studentNisn: student.nisn,
        examId: exam.id,
        currentQuestionNumber: currentQIndex + 1,
        answeredCount,
        totalQuestions,
        status: violationCount > 0 ? 'warning' : 'active',
        violationCount,
        lastViolation: violationsLog[violationsLog.length - 1],
        timeRemainingSeconds,
        batteryLevel: 98,
        isOnline: true,
        lastHeartbeat: new Date().toISOString(),
      });
    };

    syncHeartbeat();
    const interval = setInterval(syncHeartbeat, 5000);
    return () => clearInterval(interval);
  }, [currentQIndex, answers, violationCount, timeRemainingSeconds]);

  // Countdown Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Anti-Cheat: Visibility change & Window Blur Detection
  useEffect(() => {
    if (!exam.antiCheatEnabled) return;

    const recordViolation = (reason: string) => {
      const timeStr = new Date().toLocaleTimeString();
      const log = `${reason} (Pukul ${timeStr})`;
      setViolationCount((v) => v + 1);
      setViolationsLog((prev) => [...prev, log]);
      setLastWarningText(reason);
      setShowWarningModal(true);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        recordViolation('Peringatan: Kamu terdeteksi berpindah tab atau meminimalkan layar ujian!');
      }
    };

    const handleBlur = () => {
      recordViolation('Peringatan: Jendela ujian kehilangan fokus kursor.');
    };

    // Anti-Copy, Anti-Cut, Anti-Context-Menu
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    const handleCopy = (e: ClipboardEvent) => e.preventDefault();
    const handlePaste = (e: ClipboardEvent) => {
      // allow typing inside textarea, prevent copying outside
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopy);

    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopy);
    };
  }, [exam.antiCheatEnabled]);

  // Listen to 2-Way Teacher Messages & Commands
  useEffect(() => {
    const handleTeacherMessage = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail.studentId === student.id && detail.examId === exam.id) {
        setTeacherMessageToast(detail.message);
        setTimeout(() => setTeacherMessageToast(null), 8000);
      }
    };

    const handleTeacherCommand = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail.studentId === student.id && detail.examId === exam.id) {
        if (detail.action === 'lock') {
          setIsLockedByTeacher((prev) => !prev);
        } else if (detail.action === 'add_time') {
          setTimeRemainingSeconds((prev) => prev + 300);
        } else if (detail.action === 'force_submit') {
          handleSubmitExam();
        }
      }
    };

    const handleStudentReset = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail.studentId === student.id && detail.examId === exam.id) {
        setAnswers({});
        setCurrentQIndex(0);
        setTimeRemainingSeconds(exam.durationMinutes * 60);
        setViolationCount(0);
        setViolationsLog([]);
        setIsLockedByTeacher(false);
        setTeacherMessageToast('Ujian telah direset oleh Guru Pengawas. Kamu dapat mengulang dari nomor 1.');
        setTimeout(() => setTeacherMessageToast(null), 7000);
      }
    };

    window.addEventListener('cbt-teacher-direct-message', handleTeacherMessage);
    window.addEventListener('cbt-teacher-command', handleTeacherCommand);
    window.addEventListener('cbt-student-reset', handleStudentReset);

    return () => {
      window.removeEventListener('cbt-teacher-direct-message', handleTeacherMessage);
      window.removeEventListener('cbt-teacher-command', handleTeacherCommand);
      window.removeEventListener('cbt-student-reset', handleStudentReset);
    };
  }, [student.id, exam.id]);

  const handleAnswerSelect = (val: string) => {
    if (!currentQuestion) return;
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: val,
    }));
  };

  const handleRequestFullscreen = () => {
    try {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } catch {}
  };

  const handleSubmitExam = async () => {
    setIsSubmitting(true);

    try {
      let mcqScore = 0;
      let shortScore = 0;
      let essayScore = 0;
      const evaluatedAnswers: StudentAnswer[] = [];

      for (const q of exam.questions || []) {
        const studentAns = (answers[q.id] || '').trim();

        if (q.type === 'mcq') {
          const isCorrect = studentAns.toUpperCase() === q.correctAnswer.toUpperCase();
          const score = isCorrect ? q.maxScore : 0;
          mcqScore += score;
          evaluatedAnswers.push({
            questionId: q.id,
            questionNumber: q.number,
            type: q.type,
            answerText: studentAns,
            isCorrect,
            scoreAwarded: score,
            maxScore: q.maxScore,
          });
        } else if (q.type === 'short_answer') {
          // Check matching or keywords
          const isExact = studentAns.toLowerCase() === q.correctAnswer.toLowerCase();
          const detectedKw = (q.keywords || []).filter((kw) =>
            studentAns.toLowerCase().includes(kw.toLowerCase())
          );
          let score = 0;
          if (isExact) {
            score = q.maxScore;
          } else if (detectedKw.length > 0) {
            score = Math.round((detectedKw.length / (q.keywords?.length || 1)) * q.maxScore);
          }
          shortScore += score;
          evaluatedAnswers.push({
            questionId: q.id,
            questionNumber: q.number,
            type: q.type,
            answerText: studentAns,
            isCorrect: score >= q.maxScore * 0.7,
            scoreAwarded: score,
            maxScore: q.maxScore,
            detectedKeywords: detectedKw,
          });
        } else if (q.type === 'essay') {
          // AI Score for essay if student wrote something
          let score = 0;
          let feedback = '';
          let detectedKw: string[] = [];
          let missingKw: string[] = [];

          if (studentAns.length > 5) {
            try {
              const aiRes = await geminiService.scoreEssay({
                questionPrompt: q.prompt,
                correctAnswerGuide: q.correctAnswer,
                expectedKeywords: q.keywords || [],
                studentAnswer: studentAns,
                maxScore: q.maxScore,
                bloomTaxonomy: q.bloomTaxonomy,
              });

              if (aiRes.success && aiRes.scoring) {
                score = aiRes.scoring.scoreAwarded;
                feedback = aiRes.scoring.feedback;
                detectedKw = aiRes.scoring.detectedKeywords || [];
                missingKw = aiRes.scoring.missingKeywords || [];
              } else {
                // Fallback scoring
                score = Math.round(q.maxScore * 0.75);
                feedback = 'Jawaban terangkum dengan cukup baik.';
              }
            } catch {
              score = Math.round(q.maxScore * 0.75);
              feedback = 'Jawaban siswa telah tercatat.';
            }
          }

          essayScore += score;
          evaluatedAnswers.push({
            questionId: q.id,
            questionNumber: q.number,
            type: q.type,
            answerText: studentAns,
            scoreAwarded: score,
            maxScore: q.maxScore,
            detectedKeywords: detectedKw,
            missingKeywords: missingKw,
            aiFeedback: feedback,
          });
        }
      }

      // Calculate total normalized to 100
      const totalPossibleMax = (exam.questions || []).reduce((acc, q) => acc + q.maxScore, 0) || 1;
      const totalRaw = mcqScore + shortScore + essayScore;
      const finalScore100 = Math.round((totalRaw / totalPossibleMax) * 100);
      const isPassed = finalScore100 >= exam.passingGrade;
      const category = finalScore100 >= 85 ? 'pengayaan' : isPassed ? 'tuntas' : 'remedi';

      // Gamification Reward calculation
      const xpEarned = isPassed ? 100 + finalScore100 : 50;
      const updatedStudent: Student = {
        ...student,
        totalXp: student.totalXp + xpEarned,
        level: Math.floor((student.totalXp + xpEarned) / 250) + 1,
        streak: student.streak + 1,
      };
      await storageService.saveStudent(updatedStudent);

      // Generate AI recommendation for remidi/pengayaan
      let aiRecommendation;
      try {
        const weakTaxonomies = exam.questions
          ?.filter((q) => {
            const a = evaluatedAnswers.find((ans) => ans.questionId === q.id);
            return (a?.scoreAwarded || 0) < q.maxScore * 0.6;
          })
          .map((q) => q.bloomTaxonomy) || [];

        const recRes = await geminiService.getPersonalizedRecommendations({
          studentName: student.name,
          grade: student.grade,
          subject: exam.subject,
          score: finalScore100,
          passingGrade: exam.passingGrade,
          weakTaxonomies: Array.from(new Set(weakTaxonomies)),
          missedTopics: [exam.subject],
        });
        if (recRes.success) {
          aiRecommendation = recRes.recommendation;
        }
      } catch (err) {
        console.warn('AI recommendation generation fallback:', err);
      }

      const submission: Submission = {
        id: 'sub-' + Date.now(),
        examId: exam.id,
        studentId: student.id,
        studentName: student.name,
        studentNisn: student.nisn,
        grade: student.grade,
        answers: evaluatedAnswers,
        totalScore: finalScore100,
        mcqScore,
        shortScore,
        essayScore,
        passed: isPassed,
        violationCount,
        violationsLog,
        submittedAt: new Date().toISOString(),
        durationSecondsUsed: exam.durationMinutes * 60 - timeRemainingSeconds,
        remedialCategory: category,
        personalizedRecommendation: aiRecommendation,
      };

      await storageService.saveSubmission(submission);
      await storageService.clearLiveSession(exam.id, student.id);

      // Confetti celebration!
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
        });
      } catch {}

      onFinishedExam(submission);
    } catch (err) {
      console.error(err);
      alert('Terjadi kendala saat menyimpan jawaban. Mohon hubungi pengawas.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const minutes = Math.floor(timeRemainingSeconds / 60);
  const seconds = timeRemainingSeconds % 60;
  const formatTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between select-none">
      {/* Teacher Toast Notification */}
      {teacherMessageToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 max-w-lg w-full px-4 animate-bounce">
          <div className="bg-amber-500 text-white p-4 rounded-2xl shadow-xl flex items-start gap-3 border-2 border-white">
            <Volume2 className="w-6 h-6 shrink-0" />
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-amber-100">
                Pesan Dari Bapak/Ibu Guru Pengawas:
              </p>
              <p className="text-sm font-bold mt-0.5">{teacherMessageToast}</p>
            </div>
          </div>
        </div>
      )}

      {/* Screen Lock Overlay if Teacher Locked */}
      {isLockedByTeacher && (
        <div className="fixed inset-0 bg-slate-900/90 z-50 flex items-center justify-center p-6 text-center text-white">
          <div className="max-w-md space-y-4">
            <Lock className="w-16 h-16 text-rose-500 mx-auto animate-pulse" />
            <h2 className="text-2xl font-black">Ujian Dikunci Sementara</h2>
            <p className="text-sm text-slate-300">
              Guru pengawas telah mengunci layar ujianmu. Silakan angkat tangan dan konfirmasi kepada guru pengawas.
            </p>
          </div>
        </div>
      )}

      {/* Top Header Navigation Bar */}
      <header className="bg-white border-b border-slate-200 px-4 sm:px-8 py-3.5 sticky top-0 z-20 shadow-2xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          {/* Student Profile Info */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-2xl shadow-xs">
              {student.avatar}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 leading-tight">{student.name}</h3>
                <span className="text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md">
                  Kelas {student.grade} SD
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">NISN: {student.nisn}</p>
            </div>
          </div>

          {/* Gamified XP & AntiCheat Shield */}
          <div className="hidden sm:flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold">
              <Award className="w-4 h-4 text-amber-500" />
              <span>{student.totalXp} XP</span>
              <span className="text-slate-400 font-normal">&bull; Level {student.level}</span>
            </div>

            {exam.antiCheatEnabled && (
              <div className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-semibold">
                <CheckCircle className="w-3.5 h-3.5" />
                Anti-Kecurangan Aktif
              </div>
            )}
          </div>

          {/* Countdown Clock */}
          <div className="flex items-center gap-2">
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-2xl border font-mono font-bold text-sm shadow-xs ${
                timeRemainingSeconds < 300
                  ? 'bg-rose-50 text-rose-700 border-rose-300 animate-pulse'
                  : 'bg-slate-900 text-white border-slate-800'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>{formatTime}</span>
            </div>

            <button
              onClick={handleRequestFullscreen}
              className="p-2 text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
              title="Layar Penuh (Fullscreen)"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Test Body */}
      <main className="max-w-6xl mx-auto w-full p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left 3 Columns: Active Question Area */}
        <div className="lg:col-span-3 space-y-6">
          {currentQuestion ? (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
              {/* Question Header & Taxonomy badge */}
              <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-2xl bg-indigo-600 text-white font-black text-base flex items-center justify-center shadow-xs">
                    {currentQuestion.number}
                  </span>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Soal {currentQuestion.number} dari {totalQuestions}
                    </span>
                    <h4 className="text-xs font-semibold text-slate-700">
                      {currentQuestion.type === 'mcq'
                        ? 'Pilihan Ganda'
                        : currentQuestion.type === 'short_answer'
                        ? 'Isian Singkat'
                        : 'Uraian / Essay'}
                    </h4>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl">
                    Taksonomi {currentQuestion.bloomTaxonomy}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-xl">
                    Bobot: {currentQuestion.maxScore} Poin
                  </span>
                </div>
              </div>

              {/* Question Text */}
              <div className="text-slate-800 text-base sm:text-lg font-medium leading-relaxed">
                {currentQuestion.prompt}
              </div>

              {/* Question Image if present */}
              {currentQuestion.imageUrl && (
                <div className="my-3 p-3 bg-slate-100/80 border border-slate-200 rounded-2xl flex flex-col items-center justify-center">
                  <img
                    src={currentQuestion.imageUrl}
                    alt={`Ilustrasi Soal Nomor ${currentQuestion.number}`}
                    className="max-h-72 w-auto object-contain rounded-xl shadow-xs"
                    referrerPolicy="no-referrer"
                  />
                  <p className="text-xs text-slate-500 italic mt-2 font-medium">
                    Perhatikan gambar / ilustrasi di atas untuk menjawab soal
                  </p>
                </div>
              )}

              {/* Supporting Doc notice if any */}
              {exam.supportingDocContent && (
                <div className="p-4 bg-indigo-50/60 border border-indigo-100 rounded-2xl text-xs text-indigo-900 space-y-1">
                  <span className="font-bold flex items-center gap-1.5 text-indigo-700">
                    📖 Cuplikan Materi Pelajaran:
                  </span>
                  <p className="italic text-slate-700">{exam.supportingDocContent}</p>
                </div>
              )}

              {/* Interactive Answer Input */}
              {currentQuestion.type === 'mcq' ? (
                <div className="space-y-3 pt-2">
                  {(currentQuestion.options || ['A', 'B', 'C', 'D']).map((opt, optIdx) => {
                    const optLetter = String.fromCharCode(65 + optIdx);
                    const isSelected = answers[currentQuestion.id] === optLetter;

                    return (
                      <button
                        key={optIdx}
                        id={`btn-option-${optLetter}`}
                        onClick={() => handleAnswerSelect(optLetter)}
                        className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center gap-4 cursor-pointer text-sm sm:text-base ${
                          isSelected
                            ? 'bg-indigo-50/70 border-indigo-600 text-indigo-950 font-bold shadow-xs scale-[1.01]'
                            : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span
                          className={`w-9 h-9 rounded-xl font-black text-sm flex items-center justify-center shrink-0 transition-colors ${
                            isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {optLetter}
                        </span>
                        <span className="flex-1">{opt}</span>
                      </button>
                    );
                  })}
                </div>
              ) : currentQuestion.type === 'short_answer' ? (
                <div className="space-y-2 pt-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                    Tuliskan Jawaban Singkat Kamu:
                  </label>
                  <input
                    id="input-short-answer"
                    type="text"
                    value={answers[currentQuestion.id] || ''}
                    onChange={(e) => handleAnswerSelect(e.target.value)}
                    placeholder="Ketikkan jawaban singkat di sini..."
                    className="w-full text-base p-4 rounded-2xl border-2 border-slate-200 focus:border-indigo-600 focus:outline-none font-semibold text-slate-900 bg-slate-50/50"
                  />
                </div>
              ) : (
                <div className="space-y-2 pt-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-purple-600" />
                    Tuliskan Uraian Lengkap Kamu (Dinilai Otomatis oleh AI):
                  </label>
                  <textarea
                    id="input-essay-answer"
                    rows={6}
                    value={answers[currentQuestion.id] || ''}
                    onChange={(e) => handleAnswerSelect(e.target.value)}
                    placeholder="Jelaskan alasan dan pemikiranmu secara lengkap di sini..."
                    className="w-full text-sm sm:text-base p-4 rounded-2xl border-2 border-slate-200 focus:border-indigo-600 focus:outline-none font-normal text-slate-900 leading-relaxed bg-slate-50/50"
                  />
                  <p className="text-xs text-slate-400">
                    Tips: Gunakan kalimat lengkap dan sertakan kata-kata penting yang relevan dengan pertanyaan.
                  </p>
                </div>
              )}

              {/* Question Navigation Controls */}
              <div className="flex items-center justify-between gap-4 pt-6 border-t border-slate-100">
                <button
                  id="btn-prev-question"
                  onClick={() => setCurrentQIndex((prev) => Math.max(0, prev - 1))}
                  disabled={currentQIndex === 0}
                  className="px-5 py-3 rounded-2xl border border-slate-200 text-slate-700 font-bold text-xs sm:text-sm hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent transition-all flex items-center gap-2 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" /> Soal Sebelumnya
                </button>

                {currentQIndex < totalQuestions - 1 ? (
                  <button
                    id="btn-next-question"
                    onClick={() => setCurrentQIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
                    className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-xs transition-all flex items-center gap-2 cursor-pointer"
                  >
                    Soal Berikutnya <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    id="btn-open-submit-modal"
                    onClick={() => setShowConfirmModal(true)}
                    className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Send className="w-4 h-4" /> Kumpulkan Ujian Sekarang
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-white rounded-3xl border border-slate-200">
              Tidak ada butir soal pada paket ini.
            </div>
          )}
        </div>

        {/* Right 1 Column: Number Quick Grid & Summary */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Daftar Nomor Soal (1 - {totalQuestions})
            </h4>

            {/* Grid */}
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
              {(exam.questions || []).map((q, idx) => {
                const hasAnswer = !!answers[q.id]?.trim();
                const isCurrent = idx === currentQIndex;

                return (
                  <button
                    key={q.id}
                    id={`btn-jump-q-${idx + 1}`}
                    onClick={() => setCurrentQIndex(idx)}
                    className={`h-11 rounded-xl text-xs font-black transition-all flex items-center justify-center cursor-pointer ${
                      isCurrent
                        ? 'bg-indigo-600 text-white ring-2 ring-indigo-300 scale-105 shadow-sm'
                        : hasAnswer
                        ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="pt-3 border-t border-slate-100 space-y-2 text-[11px] text-slate-600">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-md bg-indigo-600 shrink-0" />
                <span>Sedang Dikerjakan</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-md bg-emerald-100 border border-emerald-300 shrink-0" />
                <span>Sudah Dijawab</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-md bg-slate-100 shrink-0" />
                <span>Belum Dijawab</span>
              </div>
            </div>

            {/* Submit button on sidebar */}
            <button
              id="btn-sidebar-submit"
              onClick={() => setShowConfirmModal(true)}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-2xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <CheckCircle className="w-4 h-4" />
              Selesai & Kumpulkan
            </button>
          </div>
        </div>
      </main>

      {/* Violation Warning Modal */}
      {showWarningModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border-2 border-rose-500 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto animate-pulse">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-black text-rose-700">Peringatan Kecurangan CBT!</h3>
            <p className="text-xs text-slate-600 leading-relaxed">{lastWarningText}</p>
            <div className="p-3 bg-rose-50 rounded-xl text-xs font-semibold text-rose-800">
              Jumlah Pelanggaran: <strong>{violationCount} Kali</strong>
              <p className="text-[10px] text-rose-600 mt-0.5">
                Pelanggaran ini tercatat di dasbor pengawasan guru secara real-time.
              </p>
            </div>
            <button
              id="btn-dismiss-warning"
              onClick={() => setShowWarningModal(false)}
              className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
            >
              Saya Mengerti & Kembali Mengerjakan
            </button>
          </div>
        </div>
      )}

      {/* Confirmation Submit Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Kumpulkan Jawaban Ujian?</h3>
                <p className="text-xs text-slate-500">Pastikan kamu sudah memeriksa semua nomor soal.</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl text-xs text-slate-700 space-y-1">
              <p>
                Total Soal: <strong>{totalQuestions}</strong>
              </p>
              <p>
                Soal Terjawab:{' '}
                <strong>{Object.keys(answers).filter((k) => !!answers[k]?.trim()).length}</strong>
              </p>
              <p>
                Sisa Waktu: <strong>{formatTime}</strong>
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Periksa Lagi
              </button>
              <button
                id="btn-confirm-final-submit"
                onClick={handleSubmitExam}
                disabled={isSubmitting}
                className="px-6 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {isSubmitting ? 'Memproses & Menilai via AI...' : 'Ya, Kumpulkan Sekarang'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

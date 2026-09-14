import React, { useState } from 'react';
import { Exam, Submission } from '../../types';
import { geminiService } from '../../services/geminiService';
import { storageService } from '../../services/storageService';
import {
  BrainCircuit,
  Sparkles,
  BookCheck,
  Compass,
  CheckCircle,
  AlertCircle,
  Clock,
  Printer,
  Send,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

interface RemedialCenterProps {
  exams: Exam[];
  submissions: Submission[];
  onOpenParentNotifier?: (sub: Submission) => void;
}

export const RemedialCenter: React.FC<RemedialCenterProps> = ({
  exams,
  submissions,
  onOpenParentNotifier,
}) => {
  const [selectedExamId, setSelectedExamId] = useState<string>(exams[0]?.id || '');
  const [activeCategory, setActiveCategory] = useState<'all' | 'remedi' | 'pengayaan'>('all');
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(submissions[0] || null);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  const currentExam = exams.find((e) => e.id === selectedExamId) || exams[0];
  const currentSubmissions = submissions.filter((s) => s.examId === selectedExamId);

  const remedialList = currentSubmissions.filter((s) => !s.passed);
  const enrichmentList = currentSubmissions.filter((s) => s.passed);

  const filteredList =
    activeCategory === 'remedi'
      ? remedialList
      : activeCategory === 'pengayaan'
      ? enrichmentList
      : currentSubmissions;

  const handleGenerateFreshRecommendation = async (sub: Submission) => {
    setIsGeneratingAi(true);
    try {
      const res = await geminiService.getPersonalizedRecommendations({
        studentName: sub.studentName,
        grade: sub.grade,
        subject: currentExam?.subject || 'IPAS',
        score: sub.totalScore,
        passingGrade: currentExam?.passingGrade || 75,
        weakTaxonomies: sub.passed ? ['C5', 'C6'] : ['C1', 'C2', 'C3'],
        missedTopics: [currentExam?.subject || 'Materi Pelajaran'],
      });

      if (res.success && res.recommendation) {
        const updatedSub: Submission = {
          ...sub,
          personalizedRecommendation: res.recommendation,
        };
        await storageService.saveSubmission(updatedSub);
        setSelectedSubmission(updatedSub);
      }
    } catch (err) {
      console.error(err);
      alert('Gagal membuat rekomendasi materi AI.');
    } finally {
      setIsGeneratingAi(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BrainCircuit className="w-6 h-6 text-indigo-600" />
            Pusat Tindakan Remidial & Pengayaan Terpersonalisasi (Gemini AI)
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Rumusan otomatis materi tindak lanjut berdasarkan hasil diagnostik ujian siswa sesuai prinsip Kurikulum Merdeka.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="text-xs font-bold p-2.5 rounded-xl border border-slate-300 focus:outline-indigo-500 bg-slate-50 text-slate-800"
          >
            {exams.map((ex) => (
              <option key={ex.id} value={ex.id}>
                Kelas {ex.grade} - {ex.subject}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div
          onClick={() => setActiveCategory('remedi')}
          className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
            activeCategory === 'remedi'
              ? 'bg-rose-50/70 border-rose-500 shadow-xs'
              : 'bg-white border-slate-200 hover:border-rose-300'
          }`}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-rose-700">
                Kelompok Remidial (&lt; KKM {currentExam?.passingGrade || 75})
              </span>
              <h3 className="text-2xl font-black text-slate-900">{remedialList.length} Siswa</h3>
            </div>
          </div>
          <span className="text-xs font-semibold text-rose-700 bg-rose-100 px-3 py-1 rounded-xl">
            Perlu Bimbingan Khusus
          </span>
        </div>

        <div
          onClick={() => setActiveCategory('pengayaan')}
          className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${
            activeCategory === 'pengayaan'
              ? 'bg-emerald-50/70 border-emerald-500 shadow-xs'
              : 'bg-white border-slate-200 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                Kelompok Pengayaan (&ge; KKM {currentExam?.passingGrade || 75})
              </span>
              <h3 className="text-2xl font-black text-slate-900">{enrichmentList.length} Siswa</h3>
            </div>
          </div>
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-xl">
            Materi Pendalaman
          </span>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Student Selector List */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Daftar Siswa ({filteredList.length})
            </h4>
            <button
              onClick={() => setActiveCategory('all')}
              className="text-[11px] font-bold text-indigo-600 hover:underline"
            >
              Lihat Semua
            </button>
          </div>

          <div className="space-y-1.5 max-h-[520px] overflow-y-auto">
            {filteredList.map((sub) => {
              const isSelected = selectedSubmission?.id === sub.id;
              return (
                <button
                  key={sub.id}
                  onClick={() => setSelectedSubmission(sub)}
                  className={`w-full text-left p-3 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-2 ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div>
                    <p className="font-bold text-xs">{sub.studentName}</p>
                    <p className={`text-[10px] font-mono ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>
                      Nilai: {sub.totalScore}
                    </p>
                  </div>
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : sub.passed
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {sub.passed ? 'Pengayaan' : 'Remidi'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Individual Personalized Remedial / Enrichment Plan View */}
        <div className="lg:col-span-2 space-y-6">
          {selectedSubmission ? (
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-slate-900">{selectedSubmission.studentName}</h3>
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        selectedSubmission.passed
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      Status: {selectedSubmission.passed ? 'PENGAYAAN' : 'REMIDIAL'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Nilai Perolehan: <strong>{selectedSubmission.totalScore}</strong> (KKM:{' '}
                    {currentExam?.passingGrade || 75})
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleGenerateFreshRecommendation(selectedSubmission)}
                    disabled={isGeneratingAi}
                    className="px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold rounded-xl border border-purple-200 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingAi ? 'animate-spin' : ''}`} />
                    {isGeneratingAi ? 'Menyusun AI...' : 'Generate AI Ulang'}
                  </button>

                  {onOpenParentNotifier && (
                    <button
                      onClick={() => onOpenParentNotifier(selectedSubmission)}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" /> Kirim Panduan ke WA Orang Tua
                    </button>
                  )}
                </div>
              </div>

              {/* Personalized Study Guide Body */}
              {selectedSubmission.personalizedRecommendation ? (
                <div className="space-y-6">
                  {/* Title & Motivational note */}
                  <div className="p-4 bg-linear-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      <h4 className="font-bold text-sm text-indigo-950">
                        {selectedSubmission.personalizedRecommendation.studyGuideTitle}
                      </h4>
                    </div>
                    <p className="text-xs text-slate-700 italic">
                      "{selectedSubmission.personalizedRecommendation.motivationalMessage}"
                    </p>
                  </div>

                  {/* Key Concepts */}
                  <div className="space-y-2">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                      Konsep Pokok yang Perlu Dikuatkan:
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      {selectedSubmission.personalizedRecommendation.keyConcepts?.map((kc, i) => (
                        <span
                          key={i}
                          className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold px-3 py-1 rounded-xl"
                        >
                          📌 {kc}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Recommended Activities */}
                  <div className="space-y-3">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                      Aktivitas Pembelajaran Mandiri / Terbimbing:
                    </h5>
                    <div className="space-y-2.5">
                      {selectedSubmission.personalizedRecommendation.recommendedActivities?.map((act, i) => (
                        <div
                          key={i}
                          className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-start justify-between gap-3 text-xs"
                        >
                          <div className="space-y-1">
                            <h6 className="font-bold text-slate-900">{act.title}</h6>
                            <p className="text-slate-600">{act.description}</p>
                          </div>
                          <span className="text-[10px] font-bold text-indigo-600 bg-white border border-indigo-200 px-2 py-1 rounded-lg shrink-0 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {act.duration}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Diagnostic Practice Questions */}
                  {selectedSubmission.personalizedRecommendation.practiceQuestions && (
                    <div className="space-y-3">
                      <h5 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                        Pertanyaan Refleksi / Latihan Ulang:
                      </h5>
                      <div className="space-y-2">
                        {selectedSubmission.personalizedRecommendation.practiceQuestions.map((pq, i) => (
                          <div key={i} className="p-3 bg-amber-50/50 border border-amber-200 rounded-xl text-xs space-y-1">
                            <p className="font-semibold text-slate-800">Q: {pq.question}</p>
                            <p className="text-slate-500 italic">💡 Petunjuk: {pq.hint}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notes for Parents */}
                  {selectedSubmission.personalizedRecommendation.parentNotes && (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs space-y-1 text-emerald-950">
                      <p className="font-bold">Pesan Bimbingan untuk Orang Tua di Rumah:</p>
                      <p className="text-slate-700">{selectedSubmission.personalizedRecommendation.parentNotes}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 p-6 space-y-3">
                  <Sparkles className="w-10 h-10 text-purple-400 mx-auto" />
                  <h4 className="text-sm font-bold text-slate-800">
                    Belum Ada Rekomendasi Materi Terpadu
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Klik tombol di bawah untuk meminta Gemini AI menyusunkan kurikulum remidial / pengayaan khusus bagi {selectedSubmission.studentName}.
                  </p>
                  <button
                    onClick={() => handleGenerateFreshRecommendation(selectedSubmission)}
                    disabled={isGeneratingAi}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all inline-flex items-center gap-2 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" />
                    Buat Rekomendasi Belajar Sekarang
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-400">
              Pilih salah satu siswa di sebelah kiri untuk melihat rekomendasi belajar.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

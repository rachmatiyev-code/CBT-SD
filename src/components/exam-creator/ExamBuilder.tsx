import React, { useState } from 'react';
import { BloomTaxonomy, Exam, Question, QuestionType } from '../../types';
import { geminiService } from '../../services/geminiService';
import { storageService } from '../../services/storageService';
import {
  Sparkles,
  BookOpen,
  Plus,
  Trash2,
  FileText,
  Upload,
  CheckCircle2,
  Layers,
  Save,
  Clock,
  Printer,
  FileUp,
  Sliders,
  HelpCircle,
} from 'lucide-react';

interface ExamBuilderProps {
  exams: Exam[];
  onExamsUpdated: (updated: Exam[]) => void;
  onSelectExamForPrint?: (exam: Exam) => void;
}

const BLOOM_LEVELS: Array<{ code: BloomTaxonomy; label: string; desc: string; color: string }> = [
  { code: 'C1', label: 'C1 - Mengingat', desc: 'Mengingat fakta dasar, definisi, istilah', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { code: 'C2', label: 'C2 - Memahami', desc: 'Menjelaskan ide, mengartikan konsep', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  { code: 'C3', label: 'C3 - Menerapkan', desc: 'Menggunakan informasi dalam situasi nyata', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { code: 'C4', label: 'C4 - Menganalisis', desc: 'Membedakan bagian, sebab-akibat, pola', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { code: 'C5', label: 'C5 - Mengevaluasi', desc: 'Membuat penilaian berdasarkan kriteria', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  { code: 'C6', label: 'C6 - Mencipta', desc: 'Menghasilkan gagasan baru, menyusun solusi', color: 'bg-purple-50 text-purple-700 border-purple-200' },
];

const SD_SUBJECTS = [
  'Ilmu Pengetahuan Alam dan Sosial (IPAS)',
  'Matematika',
  'Bahasa Indonesia',
  'Pendidikan Pancasila',
  'Bahasa Inggris',
  'Seni Budaya dan Prakarya',
  'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)',
];

export const ExamBuilder: React.FC<ExamBuilderProps> = ({ exams, onExamsUpdated, onSelectExamForPrint }) => {
  const [selectedExamId, setSelectedExamId] = useState<string>(exams[0]?.id || '');
  const currentExam = exams.find((e) => e.id === selectedExamId) || exams[0];

  // AI Generator Modal states
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [aiGrade, setAiGrade] = useState<number>(currentExam?.grade || 5);
  const [aiSubject, setAiSubject] = useState<string>(currentExam?.subject || SD_SUBJECTS[0]);
  const [aiCount, setAiCount] = useState<number>(5);
  const [aiSelectedTaxonomies, setAiSelectedTaxonomies] = useState<BloomTaxonomy[]>(['C1', 'C2', 'C3', 'C4']);
  const [aiDocText, setAiDocText] = useState<string>('');
  const [aiDocFileName, setAiDocFileName] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // New Exam Modal
  const [showNewExamModal, setShowNewExamModal] = useState(false);
  const [newExamTitle, setNewExamTitle] = useState('');
  const [newExamSubject, setNewExamSubject] = useState(SD_SUBJECTS[0]);
  const [newExamGrade, setNewExamGrade] = useState(5);
  const [newExamDuration, setNewExamDuration] = useState(45);
  const [newExamPassingGrade, setNewExamPassingGrade] = useState(75);

  const handleCreateNewExam = async (e: React.FormEvent) => {
    e.preventDefault();
    const newExam: Exam = {
      id: 'exam-' + Date.now(),
      title: newExamTitle.trim() || `Ujian Penilaian Harian ${newExamSubject} Kelas ${newExamGrade}`,
      subject: newExamSubject,
      grade: newExamGrade,
      academicYear: '2025/2026',
      semester: 'Genap',
      durationMinutes: newExamDuration,
      passingGrade: newExamPassingGrade,
      totalQuestions: 0,
      questions: [],
      status: 'active',
      antiCheatEnabled: true,
      createdAt: new Date().toISOString(),
      instructions: '1. Berdoalah sebelum mulai.\n2. Bacalah instruksi dengan saksama.\n3. Jangan beralih tab selama ujian.',
    };

    await storageService.saveExam(newExam);
    const updated = storageService.getExams();
    onExamsUpdated(updated);
    setSelectedExamId(newExam.id);
    setShowNewExamModal(false);
  };

  const handleAddManualQuestion = (type: QuestionType) => {
    if (!currentExam) return;
    const newNumber = (currentExam.questions?.length || 0) + 1;
    if (newNumber > 50) {
      alert('Batas maksimal adalah 50 soal per paket ujian.');
      return;
    }

    const newQuestion: Question = {
      id: 'q-' + Date.now(),
      number: newNumber,
      type,
      bloomTaxonomy: 'C2',
      prompt: `Soal nomor ${newNumber}: Tuliskan pertanyaan Anda di sini...`,
      options: type === 'mcq' ? ['A. Pilihan 1', 'B. Pilihan 2', 'C. Pilihan 3', 'D. Pilihan 4'] : undefined,
      correctAnswer: type === 'mcq' ? 'A' : '',
      keywords: type !== 'mcq' ? ['kata_kunci'] : undefined,
      maxScore: type === 'essay' ? 20 : 10,
      explanation: 'Penjelasan jawaban.',
    };

    const updatedExam: Exam = {
      ...currentExam,
      questions: [...(currentExam.questions || []), newQuestion],
      totalQuestions: (currentExam.questions?.length || 0) + 1,
    };

    saveExamChanges(updatedExam);
  };

  const handleUpdateQuestion = (qIndex: number, updatedQ: Question) => {
    if (!currentExam) return;
    const newQuestions = [...currentExam.questions];
    newQuestions[qIndex] = updatedQ;
    saveExamChanges({ ...currentExam, questions: newQuestions });
  };

  const handleDeleteQuestion = (qIndex: number) => {
    if (!currentExam) return;
    const newQuestions = currentExam.questions
      .filter((_, idx) => idx !== qIndex)
      .map((q, idx) => ({ ...q, number: idx + 1 }));
    saveExamChanges({
      ...currentExam,
      questions: newQuestions,
      totalQuestions: newQuestions.length,
    });
  };

  const saveExamChanges = async (exam: Exam) => {
    await storageService.saveExam(exam);
    const updated = storageService.getExams();
    onExamsUpdated(updated);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  // Trigger Gemini AI generation
  const handleGenerateAiQuestions = async () => {
    if (!aiTopic.trim()) {
      alert('Silakan masukkan topik materi atau unggah dokumen rujukan.');
      return;
    }
    setIsGenerating(true);
    try {
      const res = await geminiService.generateQuestions({
        grade: aiGrade,
        subject: aiSubject,
        topic: aiTopic,
        count: aiCount,
        taxonomyLevels: aiSelectedTaxonomies,
        questionTypes: ['mcq', 'short_answer', 'essay'],
        documentText: aiDocText,
      });

      if (res.success && res.questions?.length > 0) {
        const startNumber = (currentExam?.questions?.length || 0) + 1;
        const formattedNew: Question[] = res.questions.map((q: any, i: number) => ({
          id: 'q-ai-' + Date.now() + '-' + i,
          number: startNumber + i,
          type: q.type || 'mcq',
          bloomTaxonomy: (q.bloomTaxonomy as BloomTaxonomy) || 'C2',
          prompt: q.prompt || 'Pertanyaan...',
          options: q.options || (q.type === 'mcq' ? ['A', 'B', 'C', 'D'] : undefined),
          correctAnswer: q.correctAnswer || 'A',
          keywords: q.keywords || [],
          maxScore: q.maxScore || (q.type === 'essay' ? 20 : 10),
          explanation: q.explanation || 'Penjelasan dari guru.',
        }));

        const combined = [...(currentExam?.questions || []), ...formattedNew].slice(0, 50);
        const updatedExam: Exam = {
          ...currentExam,
          questions: combined,
          totalQuestions: combined.length,
          supportingDocName: aiDocFileName || currentExam?.supportingDocName,
          supportingDocContent: aiDocText || currentExam?.supportingDocContent,
        };

        await saveExamChanges(updatedExam);
        setShowAiModal(false);
      }
    } catch (err) {
      console.error(err);
      alert('Terjadi kendala saat menghasilkan soal AI. Soal standar telah disiapkan.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAiDocFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setAiDocText(text);
      if (!aiTopic) {
        setAiTopic(`Materi dari dokumen: ${file.name.replace(/\.[^/.]+$/, '')}`);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-indigo-600" />
              Pembuat & Editor Paket Soal CBT (SD Kelas 1-6)
            </h2>
            <span className="text-xs font-bold px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full">
              Hingga 50 Soal
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Dukungan Taksonomi Bloom & Anderson revisi (C1 - C6), soal campuran (PG, Isian, Uraian), dan kecerdasan Gemini AI.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            id="btn-open-new-exam-modal"
            onClick={() => setShowNewExamModal(true)}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-all cursor-pointer"
          >
            + Buat Paket Baru
          </button>
          <button
            id="btn-open-ai-generator"
            onClick={() => setShowAiModal(true)}
            className="px-5 py-2.5 bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            Generate Soal Otomatis (Gemini AI)
          </button>
        </div>
      </div>

      {/* Select Exam & Exam Meta Controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex-1 w-full sm:w-auto">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Pilih Paket Ujian Aktif:
            </label>
            <select
              id="select-active-exam"
              value={selectedExamId}
              onChange={(e) => setSelectedExamId(e.target.value)}
              className="w-full sm:w-96 text-sm font-bold p-2.5 rounded-xl border border-slate-300 focus:outline-indigo-500 text-slate-900 bg-slate-50"
            >
              {exams.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  Kelas {ex.grade} - {ex.subject} ({ex.title}) - {ex.questions?.length || 0} Soal
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {onSelectExamForPrint && currentExam && (
              <button
                id="btn-print-exam-sheet"
                onClick={() => onSelectExamForPrint(currentExam)}
                className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Cetak Soal + Kop Resmi
              </button>
            )}

            <button
              id="btn-save-exam-package"
              onClick={() => currentExam && saveExamChanges(currentExam)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {saveSuccess ? 'Tersimpan!' : 'Simpan Paket Soal'}
            </button>
          </div>
        </div>

        {/* Exam Detail Inputs */}
        {currentExam && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="font-semibold text-slate-500">Mata Pelajaran:</span>
              <p className="font-bold text-slate-800 text-sm">{currentExam.subject}</p>
            </div>
            <div>
              <span className="font-semibold text-slate-500">Tingkat Kelas SD:</span>
              <p className="font-bold text-slate-800 text-sm">Kelas {currentExam.grade}</p>
            </div>
            <div>
              <span className="font-semibold text-slate-500 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-indigo-500" /> Durasi & KKM:
              </span>
              <p className="font-bold text-slate-800 text-sm">
                {currentExam.durationMinutes} Menit &bull; KKM: {currentExam.passingGrade}
              </p>
            </div>
            <div>
              <span className="font-semibold text-slate-500">Total Soal Terisi:</span>
              <p className="font-bold text-indigo-600 text-sm">
                {currentExam.questions?.length || 0} / 50 Soal
              </p>
            </div>
          </div>
        )}

        {/* Supporting Document Info */}
        {currentExam?.supportingDocName && (
          <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl flex items-center justify-between text-xs text-indigo-900">
            <span className="flex items-center gap-2 font-medium">
              <FileText className="w-4 h-4 text-indigo-600" />
              Dokumen Rujukan Terlampir: <strong>{currentExam.supportingDocName}</strong>
            </span>
            <span className="text-[11px] text-indigo-600">Siap dievaluasi oleh Gemini AI</span>
          </div>
        )}
      </div>

      {/* Manual Add Question Buttons */}
      <div className="flex items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex-wrap">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
          <Plus className="w-4 h-4 text-indigo-600" /> Tambah Soal Manual:
        </span>
        <div className="flex items-center gap-2">
          <button
            id="btn-add-mcq"
            onClick={() => handleAddManualQuestion('mcq')}
            className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-xl border border-blue-200 transition-all cursor-pointer"
          >
            + Pilihan Ganda (PG)
          </button>
          <button
            id="btn-add-short"
            onClick={() => handleAddManualQuestion('short_answer')}
            className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-xl border border-emerald-200 transition-all cursor-pointer"
          >
            + Isian Singkat
          </button>
          <button
            id="btn-add-essay"
            onClick={() => handleAddManualQuestion('essay')}
            className="px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-semibold rounded-xl border border-purple-200 transition-all cursor-pointer"
          >
            + Uraian (Essay)
          </button>
        </div>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {!currentExam?.questions || currentExam.questions.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-2xl border border-dashed border-slate-300 p-6">
            <Sparkles className="w-12 h-12 text-indigo-400 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">Paket Soal Masih Kosong</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              Gunakan tombol "Generate Soal Otomatis (Gemini AI)" untuk membuat soal sesuai Kurikulum Merdeka dan Taksonomi Bloom dalam hitungan detik, atau tambah butir soal secara manual.
            </p>
            <button
              onClick={() => setShowAiModal(true)}
              className="mt-4 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all inline-flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              Buka Generator Gemini AI
            </button>
          </div>
        ) : (
          currentExam.questions.map((q, idx) => (
            <div
              key={q.id || idx}
              className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-slate-300 shadow-xs transition-all space-y-4"
            >
              {/* Question Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-xl bg-slate-900 text-white font-black text-sm flex items-center justify-center shrink-0">
                    {q.number}
                  </span>
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Bentuk Soal:
                    </span>
                    <select
                      value={q.type}
                      onChange={(e) =>
                        handleUpdateQuestion(idx, {
                          ...q,
                          type: e.target.value as QuestionType,
                          options: e.target.value === 'mcq' ? ['A. ', 'B. ', 'C. ', 'D. '] : undefined,
                        })
                      }
                      className="ml-2 text-xs font-bold text-slate-800 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200"
                    >
                      <option value="mcq">Pilihan Ganda (PG)</option>
                      <option value="short_answer">Isian Singkat</option>
                      <option value="essay">Uraian (Essay)</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Bloom Taxonomy selector */}
                  <span className="text-xs font-bold text-slate-400">Taksonomi:</span>
                  <select
                    value={q.bloomTaxonomy}
                    onChange={(e) =>
                      handleUpdateQuestion(idx, { ...q, bloomTaxonomy: e.target.value as BloomTaxonomy })
                    }
                    className="text-xs font-bold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg border border-indigo-200"
                  >
                    {BLOOM_LEVELS.map((b) => (
                      <option key={b.code} value={b.code}>
                        {b.label}
                      </option>
                    ))}
                  </select>

                  <div className="flex items-center gap-1 pl-2">
                    <span className="text-xs text-slate-400">Bobot:</span>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={q.maxScore}
                      onChange={(e) =>
                        handleUpdateQuestion(idx, { ...q, maxScore: Number(e.target.value) || 10 })
                      }
                      className="w-14 text-xs font-bold p-1 rounded-md border border-slate-200 text-center"
                    />
                  </div>

                  <button
                    onClick={() => handleDeleteQuestion(idx)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    title="Hapus Soal"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Question Prompt */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Kalimat Pertanyaan / Stimulus Soal:
                </label>
                <textarea
                  rows={2}
                  value={q.prompt}
                  onChange={(e) => handleUpdateQuestion(idx, { ...q, prompt: e.target.value })}
                  className="w-full text-sm p-3 rounded-xl border border-slate-200 focus:outline-indigo-500 font-medium text-slate-800"
                  placeholder="Tuliskan butir soal di sini..."
                />
              </div>

              {/* Options for MCQ */}
              {q.type === 'mcq' && (
                <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                    Pilihan Jawaban (A, B, C, D) & Kunci Jawaban Benar:
                  </label>
                  {(q.options || ['A. Opsi 1', 'B. Opsi 2', 'C. Opsi 3', 'D. Opsi 4']).map((opt, optIdx) => {
                    const optLetter = String.fromCharCode(65 + optIdx); // A, B, C, D
                    const isCorrect = q.correctAnswer === optLetter;
                    return (
                      <div key={optIdx} className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleUpdateQuestion(idx, { ...q, correctAnswer: optLetter })}
                          className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center transition-all cursor-pointer ${
                            isCorrect
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-100'
                          }`}
                          title={`Jadikan ${optLetter} sebagai kunci jawaban`}
                        >
                          {optLetter}
                        </button>
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => {
                            const newOpts = [...(q.options || [])];
                            newOpts[optIdx] = e.target.value;
                            handleUpdateQuestion(idx, { ...q, options: newOpts });
                          }}
                          className="flex-1 text-xs p-2 bg-white rounded-lg border border-slate-200 focus:outline-indigo-500"
                        />
                      </div>
                    );
                  })}
                  <p className="text-[11px] text-emerald-700 font-medium pt-1">
                    ✓ Kunci Jawaban Terpilih: <strong>Opsi {q.correctAnswer}</strong>
                  </p>
                </div>
              )}

              {/* Short Answer / Essay Guides & Keywords */}
              {q.type !== 'mcq' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Kunci Jawaban / Panduan Rubrik Guru:
                    </label>
                    <textarea
                      rows={2}
                      value={q.correctAnswer}
                      onChange={(e) => handleUpdateQuestion(idx, { ...q, correctAnswer: e.target.value })}
                      className="w-full text-xs p-2.5 bg-white rounded-lg border border-slate-200 focus:outline-indigo-500"
                      placeholder="Jawaban acuan guru..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                      Kata-Kata Penting (Keywords untuk AI Auto-Scoring):
                    </label>
                    <input
                      type="text"
                      value={q.keywords?.join(', ') || ''}
                      onChange={(e) => {
                        const kws = e.target.value
                          .split(',')
                          .map((k) => k.trim())
                          .filter(Boolean);
                        handleUpdateQuestion(idx, { ...q, keywords: kws });
                      }}
                      className="w-full text-xs p-2.5 bg-white rounded-lg border border-slate-200 focus:outline-indigo-500"
                      placeholder="Pisahkan dengan koma (contoh: klorofil, fotosintesis, daun)"
                    />
                    <p className="text-[10px] text-slate-500 mt-1">
                      Gemini AI akan mendeteksi kemunculan kata penting ini dalam jawaban siswa.
                    </p>
                  </div>
                </div>
              )}

              {/* Explanation */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-0.5">
                  Pembahasan / Catatan Edukatif untuk Siswa:
                </label>
                <input
                  type="text"
                  value={q.explanation || ''}
                  onChange={(e) => handleUpdateQuestion(idx, { ...q, explanation: e.target.value })}
                  className="w-full text-xs p-2 rounded-lg border border-slate-200 text-slate-600"
                  placeholder="Penjelasan konsep..."
                />
              </div>
            </div>
          ))
        )}
      </div>

      {/* AI Generator Modal */}
      {showAiModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Generator Soal Cerdas Gemini AI
                  </h3>
                  <p className="text-xs text-slate-500">
                    Sesuai Taksonomi Bloom & Kurikulum Merdeka SD Kelas 1 - 6
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAiModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="mt-5 space-y-4 text-sm">
              {/* Grade & Subject */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Tingkat Kelas SD
                  </label>
                  <select
                    id="select-ai-grade"
                    value={aiGrade}
                    onChange={(e) => setAiGrade(Number(e.target.value))}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-bold"
                  >
                    {[1, 2, 3, 4, 5, 6].map((g) => (
                      <option key={g} value={g}>
                        Kelas {g} SD
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Mata Pelajaran
                  </label>
                  <select
                    id="select-ai-subject"
                    value={aiSubject}
                    onChange={(e) => setAiSubject(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-semibold"
                  >
                    {SD_SUBJECTS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Topic */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Topik / Materi Pembelajaran yang Diujikan
                </label>
                <input
                  id="input-ai-topic"
                  type="text"
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  placeholder="Contoh: Ekosistem dan Rantai Makanan, Pecahan Senilai, Sumpah Pemuda..."
                  className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-purple-500 font-medium"
                />
              </div>

              {/* Document upload for instant study materials */}
              <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-2xl space-y-2">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <FileUp className="w-4 h-4 text-purple-600" />
                  Unggah Dokumen Materi Pembelajaran (Opsional)
                </label>
                <p className="text-[11px] text-slate-500">
                  AI akan mengekstrak konsep dari dokumen teks atau modul ringkasan untuk dijadikan rujukan soal.
                </p>
                <input
                  id="input-doc-upload"
                  type="file"
                  accept=".txt,.md,.pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-purple-100 file:text-purple-700 hover:file:bg-purple-200 cursor-pointer"
                />
                {aiDocFileName && (
                  <p className="text-xs text-purple-700 font-medium">✓ File terpilih: {aiDocFileName}</p>
                )}
              </div>

              {/* Question Count slider (up to 50) */}
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
                  <span>Jumlah Soal yang Ingin Dibuat:</span>
                  <span className="text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-md font-mono text-sm">
                    {aiCount} Soal
                  </span>
                </div>
                <input
                  id="slider-ai-count"
                  type="range"
                  min={1}
                  max={25}
                  value={aiCount}
                  onChange={(e) => setAiCount(Number(e.target.value))}
                  className="w-full accent-purple-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                  <span>1 Soal</span>
                  <span>10 Soal</span>
                  <span>25 Soal (Maks Sekali Generate)</span>
                </div>
              </div>

              {/* Taxonomy Levels */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Target Level Taksonomi Bloom & Anderson:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {BLOOM_LEVELS.map((b) => {
                    const isChecked = aiSelectedTaxonomies.includes(b.code);
                    return (
                      <button
                        key={b.code}
                        type="button"
                        onClick={() => {
                          if (isChecked) {
                            if (aiSelectedTaxonomies.length > 1) {
                              setAiSelectedTaxonomies(aiSelectedTaxonomies.filter((t) => t !== b.code));
                            }
                          } else {
                            setAiSelectedTaxonomies([...aiSelectedTaxonomies, b.code]);
                          }
                        }}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                          isChecked
                            ? 'bg-purple-50 border-purple-300 ring-1 ring-purple-300'
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="font-bold text-xs text-slate-900">{b.label}</div>
                        <div className="text-[10px] text-slate-500 leading-tight mt-0.5">{b.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAiModal(false)}
                className="px-4 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                id="btn-confirm-generate-ai"
                onClick={handleGenerateAiQuestions}
                disabled={isGenerating}
                className="px-6 py-2.5 text-xs font-bold text-white bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                {isGenerating ? 'Gemini Sedang Merancang Soal...' : `Hasilkan ${aiCount} Soal Sekarang`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Exam Modal */}
      {showNewExamModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900">Buat Paket Ujian Baru</h3>
            <form onSubmit={handleCreateNewExam} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mata Pelajaran:</label>
                <select
                  value={newExamSubject}
                  onChange={(e) => setNewExamSubject(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                >
                  {SD_SUBJECTS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tingkat Kelas SD:</label>
                <select
                  value={newExamGrade}
                  onChange={(e) => setNewExamGrade(Number(e.target.value))}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-bold"
                >
                  {[1, 2, 3, 4, 5, 6].map((g) => (
                    <option key={g} value={g}>
                      Kelas {g} SD
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Judul Ujian:</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Penilaian Sumatif Akhir Semester IPAS"
                  value={newExamTitle}
                  onChange={(e) => setNewExamTitle(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Durasi (Menit):</label>
                  <input
                    type="number"
                    min={10}
                    max={180}
                    value={newExamDuration}
                    onChange={(e) => setNewExamDuration(Number(e.target.value))}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 text-center"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">KKM (Nilai Lulus):</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={newExamPassingGrade}
                    onChange={(e) => setNewExamPassingGrade(Number(e.target.value))}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 text-center"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewExamModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl cursor-pointer"
                >
                  Simpan & Lanjut
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

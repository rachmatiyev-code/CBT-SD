import React, { useState } from 'react';
import { BloomTaxonomy, Exam, Question, QuestionType } from '../../types';
import { geminiService } from '../../services/geminiService';
import { storageService } from '../../services/storageService';
import { SD_DIAGRAM_PRESETS, DiagramPreset } from '../../data/diagramPresets';
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
  Image,
  ImageIcon,
  Link2,
  ExternalLink,
  Copy,
  Search,
  Check,
  X,
  Play,
  Share2,
  Send,
  Eye,
  Edit2,
  RotateCcw,
} from 'lucide-react';

interface ExamBuilderProps {
  exams: Exam[];
  onExamsUpdated: (updated: Exam[]) => void;
  onSelectExamForPrint?: (exam: Exam) => void;
  onOpenStudentMode?: (examId: string) => void;
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

export const ExamBuilder: React.FC<ExamBuilderProps> = ({
  exams,
  onExamsUpdated,
  onSelectExamForPrint,
  onOpenStudentMode,
}) => {
  const [activeBuilderView, setActiveBuilderView] = useState<'editor' | 'history'>('editor');
  const [selectedExamId, setSelectedExamId] = useState<string>(exams[0]?.id || '');
  const currentExam = exams.find((e) => e.id === selectedExamId) || exams[0];

  // Feedback Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Image Inserter Modal / Drawer for Questions
  const [imageModalQIndex, setImageModalQIndex] = useState<number | null>(null);
  const [tempImageUrl, setTempImageUrl] = useState('');
  const [selectedCategoryPreset, setSelectedCategoryPreset] = useState<string>('Semua');

  // History Filtering & Search
  const [historySearch, setHistorySearch] = useState('');
  const [historyGradeFilter, setHistoryGradeFilter] = useState<number | 'all'>('all');
  const [historyStatusFilter, setHistoryStatusFilter] = useState<'all' | 'active' | 'draft'>('all');
  const [deleteConfirmExamId, setDeleteConfirmExamId] = useState<string | null>(null);

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
  const [isSaving, setIsSaving] = useState(false);

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
      instructions:
        '1. Berdoalah sebelum mulai mengerjakan.\n2. Bacalah instruksi soal dengan saksama.\n3. Jangan beralih tab selama ujian berlangsung.',
    };

    await storageService.saveExam(newExam);
    const updated = storageService.getExams();
    onExamsUpdated(updated);
    setSelectedExamId(newExam.id);
    setShowNewExamModal(false);
    setActiveBuilderView('editor');
    showToast(`Paket soal "${newExam.title}" berhasil dibuat!`);
  };

  const handleAddManualQuestion = (type: QuestionType) => {
    if (!currentExam) return;
    const newNumber = (currentExam.questions?.length || 0) + 1;
    if (newNumber > 50) {
      alert('Batas maksimal adalah 50 butir soal per paket.');
      return;
    }

    const newQuestion: Question = {
      id: 'q-' + Date.now(),
      number: newNumber,
      type,
      bloomTaxonomy: 'C2',
      prompt: `Tuliskan pertanyaan soal nomor ${newNumber} di sini...`,
      options: type === 'mcq' ? ['Pilihan A', 'Pilihan B', 'Pilihan C', 'Pilihan D'] : undefined,
      correctAnswer: type === 'mcq' ? 'A' : '',
      keywords: type !== 'mcq' ? ['kata_kunci'] : undefined,
      maxScore: type === 'essay' ? 20 : 10,
      explanation: 'Penjelasan konsep soal.',
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

  const saveExamChanges = async (examToSave: Exam) => {
    setIsSaving(true);
    try {
      await storageService.saveExam(examToSave);
      const updated = storageService.getExams();
      onExamsUpdated(updated);
      showToast('Perubahan paket dan butir soal berhasil disimpan & tersinkronisasi!');
    } catch (err) {
      console.error(err);
      showToast('Gagal menyimpan perubahan.');
    } finally {
      setIsSaving(false);
    }
  };

  // Image Inserter: Handle Local File Upload (converts to base64 data URL)
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || imageModalQIndex === null || !currentExam) return;

    if (file.size > 2.5 * 1024 * 1024) {
      alert('Ukuran gambar terlalu besar. Maksimal ukuran gambar adalah 2.5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      const targetQ = currentExam.questions[imageModalQIndex];
      handleUpdateQuestion(imageModalQIndex, {
        ...targetQ,
        imageUrl: dataUrl,
      });
      setImageModalQIndex(null);
      showToast('Gambar berhasil disisipkan ke dalam soal!');
    };
    reader.readAsDataURL(file);
  };

  // Image Inserter: Apply URL
  const handleApplyImageUrl = () => {
    if (!tempImageUrl.trim() || imageModalQIndex === null || !currentExam) return;
    const targetQ = currentExam.questions[imageModalQIndex];
    handleUpdateQuestion(imageModalQIndex, {
      ...targetQ,
      imageUrl: tempImageUrl.trim(),
    });
    setTempImageUrl('');
    setImageModalQIndex(null);
    showToast('Tautan gambar berhasil disisipkan ke dalam soal!');
  };

  // Image Inserter: Select Educational Diagram Preset
  const handleSelectPresetDiagram = (preset: DiagramPreset) => {
    if (imageModalQIndex === null || !currentExam) return;
    const targetQ = currentExam.questions[imageModalQIndex];
    handleUpdateQuestion(imageModalQIndex, {
      ...targetQ,
      imageUrl: preset.dataUrl,
    });
    setImageModalQIndex(null);
    showToast(`Diagram "${preset.title}" berhasil disisipkan ke dalam soal!`);
  };

  // Image Inserter: Remove Image from Question
  const handleRemoveImage = (qIndex: number) => {
    if (!currentExam) return;
    const targetQ = currentExam.questions[qIndex];
    handleUpdateQuestion(qIndex, {
      ...targetQ,
      imageUrl: undefined,
    });
    showToast('Gambar pada soal telah dihapus.');
  };

  // Deploy / Undeploy Toggle for Exam
  const handleToggleDeploy = async (exam: Exam) => {
    const newStatus = exam.status === 'active' ? 'draft' : 'active';
    const updatedExam: Exam = { ...exam, status: newStatus };
    await storageService.saveExam(updatedExam);
    const updated = storageService.getExams();
    onExamsUpdated(updated);
    if (newStatus === 'active') {
      showToast(`Paket "${exam.title}" berhasil di-deploy! Siswa sekarang dapat mengaksesnya.`);
    } else {
      showToast(`Paket "${exam.title}" diturunkan ke status Draf.`);
    }
  };

  // Copy Student Link to Clipboard
  const handleCopyStudentLink = (examId: string) => {
    const url = `${window.location.origin}${window.location.pathname}?mode=student&examId=${examId}`;
    navigator.clipboard.writeText(url);
    showToast('Tautan mode siswa berhasil disalin ke clipboard!');
  };

  // Delete Exam from History
  const handleDeleteExam = async (examId: string) => {
    await storageService.deleteExam(examId);
    const updated = storageService.getExams();
    onExamsUpdated(updated);
    if (selectedExamId === examId && updated.length > 0) {
      setSelectedExamId(updated[0].id);
    }
    setDeleteConfirmExamId(null);
    showToast('Paket ujian berhasil dihapus dari Bank Soal.');
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
          options: q.options || (q.type === 'mcq' ? ['A. Opsi 1', 'B. Opsi 2', 'C. Opsi 3', 'D. Opsi 4'] : undefined),
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
        showToast(`${formattedNew.length} butir soal berhasil digenerate oleh Gemini AI! Anda kini dapat menyisipkan gambar pada masing-masing soal.`);
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

  // Filtered History Exams
  const filteredExams = exams.filter((ex) => {
    const matchSearch =
      ex.title.toLowerCase().includes(historySearch.toLowerCase()) ||
      ex.subject.toLowerCase().includes(historySearch.toLowerCase());
    const matchGrade = historyGradeFilter === 'all' || ex.grade === historyGradeFilter;
    const matchStatus =
      historyStatusFilter === 'all' ||
      (historyStatusFilter === 'active' && ex.status === 'active') ||
      (historyStatusFilter === 'draft' && ex.status !== 'active');
    return matchSearch && matchGrade && matchStatus;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl border border-slate-700 flex items-center gap-3 animate-fade-in text-sm font-semibold">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner & Tab Switcher (Editor vs Riwayat Soal) */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-indigo-600" />
                Manajemen & Editor Paket Soal CBT SD
              </h2>
              <span className="text-xs font-bold px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full">
                Kurikulum Merdeka
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Buat, edit, sisipkan ilustrasi gambar, kelola riwayat paket soal, deploy ke siswa, dan cetak naskah soal serta kisi-kisi.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              id="btn-open-new-exam-modal"
              onClick={() => setShowNewExamModal(true)}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer"
            >
              + Buat Paket Baru
            </button>
            <button
              id="btn-open-ai-generator"
              onClick={() => setShowAiModal(true)}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              Generate Soal AI
            </button>
          </div>
        </div>

        {/* View Switcher: Editor vs Riwayat Soal */}
        <div className="flex items-center gap-3 border-t border-slate-100 pt-4">
          <button
            onClick={() => setActiveBuilderView('editor')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeBuilderView === 'editor'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Edit2 className="w-4 h-4" />
            Editor Butir Soal ({currentExam?.questions?.length || 0} Soal)
          </button>

          <button
            id="tab-btn-exam-history"
            onClick={() => setActiveBuilderView('history')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeBuilderView === 'history'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Layers className="w-4 h-4" />
            Riwayat Paket Soal & Bank Ujian ({exams.length})
          </button>
        </div>
      </div>

      {/* VIEW 1: RIWAYAT PAKET SOAL (HISTORY MANAGEMENT) */}
      {activeBuilderView === 'history' && (
        <div className="space-y-5">
          {/* Filter and Search Bar for History */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Cari berdasarkan judul ujian atau mata pelajaran..."
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-indigo-500 font-medium"
              />
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <select
                value={historyGradeFilter}
                onChange={(e) =>
                  setHistoryGradeFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))
                }
                className="text-xs font-semibold p-2 rounded-xl border border-slate-200 bg-white"
              >
                <option value="all">Semua Kelas</option>
                {[1, 2, 3, 4, 5, 6].map((g) => (
                  <option key={g} value={g}>
                    Kelas {g} SD
                  </option>
                ))}
              </select>

              <select
                value={historyStatusFilter}
                onChange={(e) => setHistoryStatusFilter(e.target.value as any)}
                className="text-xs font-semibold p-2 rounded-xl border border-slate-200 bg-white"
              >
                <option value="all">Semua Status</option>
                <option value="active">Deployed / Aktif</option>
                <option value="draft">Draf</option>
              </select>
            </div>
          </div>

          {/* Exam History Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredExams.map((exam) => {
              const isSelected = exam.id === currentExam?.id;
              const isDeployed = exam.status === 'active';

              return (
                <div
                  key={exam.id}
                  className={`bg-white rounded-2xl p-6 border transition-all shadow-xs flex flex-col justify-between space-y-4 ${
                    isSelected
                      ? 'border-indigo-500 ring-2 ring-indigo-200 bg-indigo-50/10'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Status & Grade Badges */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg">
                        Kelas {exam.grade} SD
                      </span>

                      <span
                        className={`text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5 ${
                          isDeployed
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isDeployed ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                          }`}
                        />
                        {isDeployed ? 'Deployed / Aktif (Siswa Dapat Mengakses)' : 'Draf (Belum Dibuka)'}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-slate-900 leading-snug">{exam.title}</h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Mata Pelajaran: <strong>{exam.subject}</strong> &bull; Semester {exam.semester} ({exam.academicYear})
                      </p>
                    </div>

                    {/* Quick Metrics */}
                    <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 text-center text-xs">
                      <div>
                        <span className="text-slate-400 text-[10px] uppercase font-bold">Butir Soal</span>
                        <p className="font-bold text-slate-800 mt-0.5">{exam.questions?.length || 0} Butir</p>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] uppercase font-bold">Waktu</span>
                        <p className="font-bold text-slate-800 mt-0.5">{exam.durationMinutes} Menit</p>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] uppercase font-bold">KKM</span>
                        <p className="font-bold text-indigo-700 mt-0.5">{exam.passingGrade}</p>
                      </div>
                    </div>
                  </div>

                  {/* ACTION BUTTONS FOR EACH EXAM: PILIH, EDIT, HAPUS, DEPLOY, LINK MODE SISWA */}
                  <div className="space-y-2 pt-3 border-t border-slate-100">
                    {/* Primary Row: Pilih, Edit, Hapus, Deploy */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* 1. TOMBOL PILIH */}
                      <button
                        onClick={() => {
                          setSelectedExamId(exam.id);
                          showToast(`Paket "${exam.title}" dipilih sebagai paket aktif.`);
                        }}
                        className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1 cursor-pointer ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        {isSelected ? 'Dipilih' : 'Pilih'}
                      </button>

                      {/* 2. TOMBOL EDIT */}
                      <button
                        onClick={() => {
                          setSelectedExamId(exam.id);
                          setActiveBuilderView('editor');
                        }}
                        className="px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" /> Edit Soal
                      </button>

                      {/* 3. TOMBOL DEPLOY */}
                      <button
                        onClick={() => handleToggleDeploy(exam)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-all flex items-center gap-1 cursor-pointer ${
                          isDeployed
                            ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                        }`}
                        title={isDeployed ? 'Klik untuk mengubah kembali ke Draf' : 'Klik untuk mengaktifkan paket ke siswa'}
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        {isDeployed ? 'Undeploy (Draf)' : 'Deploy Soal'}
                      </button>

                      {/* 4. TOMBOL HAPUS */}
                      <button
                        onClick={() => setDeleteConfirmExamId(exam.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer ml-auto"
                        title="Hapus Paket Ujian"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Secondary Row: LINK MODE SISWA & BUKA MODE SISWA */}
                    <div className="flex items-center gap-2 pt-1">
                      {/* 5. TOMBOL LINK MODE SISWA */}
                      <button
                        onClick={() => handleCopyStudentLink(exam.id)}
                        className="flex-1 text-xs font-semibold text-slate-700 hover:text-indigo-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 py-1.5 px-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        title="Salin tautan ujian khusus siswa untuk dibagikan"
                      >
                        <Link2 className="w-3.5 h-3.5 text-indigo-500" /> Salin Link Mode Siswa
                      </button>

                      {onOpenStudentMode && (
                        <button
                          onClick={() => onOpenStudentMode(exam.id)}
                          className="text-xs font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl border border-indigo-200 transition-all flex items-center gap-1 cursor-pointer"
                          title="Buka ujian langsung dalam mode siswa"
                        >
                          <Play className="w-3 h-3 fill-current" /> Buka
                        </button>
                      )}

                      {onSelectExamForPrint && (
                        <button
                          onClick={() => onSelectExamForPrint(exam)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                          title="Cetak Naskah Soal & Kisi-Kisi"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: EDITOR BUTIR SOAL */}
      {activeBuilderView === 'editor' && (
        <div className="space-y-6">
          {/* Active Exam Details and Action Bar */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedExamId}
                    onChange={(e) => setSelectedExamId(e.target.value)}
                    className="font-bold text-sm text-slate-900 border border-slate-300 rounded-xl p-1.5 bg-slate-50 focus:outline-indigo-500"
                  >
                    {exams.map((ex) => (
                      <option key={ex.id} value={ex.id}>
                        {ex.title} (Kelas {ex.grade})
                      </option>
                    ))}
                  </select>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      currentExam?.status === 'active'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {currentExam?.status === 'active' ? '● Deployed / Aktif' : '○ Draf'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Mata Pelajaran: <strong>{currentExam?.subject}</strong> &bull; Total Soal:{' '}
                  <strong>{currentExam?.questions?.length || 0} Butir</strong> &bull; Durasi:{' '}
                  <strong>{currentExam?.durationMinutes} Menit</strong>
                </p>
              </div>
            </div>

            {/* Quick Actions: Save, Print Kisi-Kisi, Add Question */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* FITUR SIMPAN DATA SOAL */}
              <button
                id="btn-save-questions-exam"
                onClick={() => currentExam && saveExamChanges(currentExam)}
                disabled={isSaving}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Menyimpan...' : 'Simpan Data Soal'}
              </button>

              {/* FITUR CETAK SOAL & KISI-KISI */}
              {onSelectExamForPrint && (
                <button
                  id="btn-print-exam-and-blueprint"
                  onClick={() => currentExam && onSelectExamForPrint(currentExam)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                  title="Cetak Naskah Soal Ujian dan Matriks Kisi-Kisi Soal Kurikulum Merdeka"
                >
                  <Printer className="w-4 h-4 text-slate-600" />
                  Cetak Soal & Kisi-Kisi
                </button>
              )}

              {/* Salin Tautan Siswa */}
              {currentExam && (
                <button
                  onClick={() => handleCopyStudentLink(currentExam.id)}
                  className="p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl transition-colors cursor-pointer"
                  title="Salin Tautan Mode Siswa"
                >
                  <Link2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Quick Manual Add Controls */}
          <div className="flex items-center justify-between bg-slate-100/70 p-3 rounded-2xl border border-slate-200 text-xs">
            <span className="font-bold text-slate-600">Tambah Butir Soal Baru Secara Manual:</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleAddManualQuestion('mcq')}
                className="px-3 py-1.5 bg-white hover:bg-slate-50 text-indigo-700 font-semibold rounded-lg border border-slate-300 shadow-2xs cursor-pointer"
              >
                + Pilihan Ganda
              </button>
              <button
                onClick={() => handleAddManualQuestion('short_answer')}
                className="px-3 py-1.5 bg-white hover:bg-slate-50 text-emerald-700 font-semibold rounded-lg border border-slate-300 shadow-2xs cursor-pointer"
              >
                + Isian Singkat
              </button>
              <button
                onClick={() => handleAddManualQuestion('essay')}
                className="px-3 py-1.5 bg-white hover:bg-slate-50 text-purple-700 font-semibold rounded-lg border border-slate-300 shadow-2xs cursor-pointer"
              >
                + Uraian (Essay)
              </button>
            </div>
          </div>

          {/* Questions List */}
          <div className="space-y-5">
            {!currentExam?.questions || currentExam.questions.length === 0 ? (
              <div className="py-16 text-center bg-white rounded-2xl border border-dashed border-slate-300 p-6">
                <Sparkles className="w-12 h-12 text-indigo-400 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-800">Paket Soal Masih Kosong</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                  Gunakan tombol "Generate Soal AI" untuk membuat butir soal otomatis dengan Taksonomi Bloom, atau tambahkan butir soal di atas.
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
                  {/* Header Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-xl bg-slate-900 text-white font-black text-sm flex items-center justify-center shrink-0">
                        {q.number}
                      </span>
                      <div>
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                          Bentuk:
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
                      {/* Bloom Taxonomy Selector */}
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

                  {/* FITUR PENYISIPAN GAMBAR PADA SOAL (MENDUKUNG SOAL AI MAUPUN MANUAL) */}
                  <div className="bg-slate-50/80 p-3.5 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                        <ImageIcon className="w-4 h-4 text-indigo-600" />
                        Ilustrasi / Gambar Pendukung Soal:
                      </span>

                      <div className="flex items-center gap-2">
                        {q.imageUrl && (
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            className="text-[11px] font-semibold text-rose-600 hover:text-rose-800 bg-rose-50 px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" /> Hapus Gambar
                          </button>
                        )}
                        <button
                          type="button"
                          id={`btn-insert-image-${q.number}`}
                          onClick={() => {
                            setImageModalQIndex(idx);
                            setTempImageUrl(q.imageUrl || '');
                          }}
                          className="text-[11px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-3 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                        >
                          <Image className="w-3.5 h-3.5" />
                          {q.imageUrl ? 'Ganti / Atur Gambar' : '+ Sisipkan Gambar'}
                        </button>
                      </div>
                    </div>

                    {/* Image Preview if Present */}
                    {q.imageUrl ? (
                      <div className="pt-1 flex items-start gap-4">
                        <div className="relative group max-w-sm rounded-xl overflow-hidden border border-slate-300 bg-white p-2">
                          <img
                            src={q.imageUrl}
                            alt={`Ilustrasi Soal Nomor ${q.number}`}
                            className="max-h-48 w-auto object-contain rounded-lg mx-auto"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="text-xs text-slate-500 space-y-1">
                          <p className="font-medium text-emerald-700">✓ Gambar terpasang pada soal ini.</p>
                          <p className="text-[11px]">
                            Gambar ini akan otomatis tampil di layar ujian siswa dan dicetak pada naskah soal.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400 italic">
                        Belum ada gambar. Klik "Sisipkan Gambar" untuk mengunggah dari perangkat, tautan URL, atau memilih diagram tematik SD.
                      </p>
                    )}
                  </div>

                  {/* Options for MCQ */}
                  {q.type === 'mcq' && (
                    <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                        Pilihan Jawaban (A, B, C, D) & Kunci Jawaban Benar:
                      </label>
                      {(q.options || ['Pilihan A', 'Pilihan B', 'Pilihan C', 'Pilihan D']).map((opt, optIdx) => {
                        const optLetter = String.fromCharCode(65 + optIdx);
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
        </div>
      )}

      {/* MODAL: SISIPKAN / GANTI GAMBAR PADA SOAL */}
      {imageModalQIndex !== null && currentExam && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-5 my-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Image className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Sisipkan Ilustrasi Gambar (Soal No. {currentExam.questions[imageModalQIndex]?.number})
                  </h3>
                  <p className="text-xs text-slate-500">
                    Mendukung unggah gambar komputer/HP, tautan URL, atau contoh diagram SD
                  </p>
                </div>
              </div>
              <button
                onClick={() => setImageModalQIndex(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* OPSI 1: UNGGAH DARI KOMPUTER */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Opsi 1: Unggah Berkas Gambar dari Perangkat (PNG, JPG, SVG, WebP)
              </label>
              <label className="border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/30 hover:bg-indigo-50/60 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors">
                <Upload className="w-6 h-6 text-indigo-600 mb-1" />
                <span className="text-xs font-semibold text-slate-700">
                  Klik untuk Memilih Berkas Gambar
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5">Maksimal 2.5 MB</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* OPSI 2: TAUTAN URL GAMBAR */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Opsi 2: Tautan URL Gambar Web
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  value={tempImageUrl}
                  onChange={(e) => setTempImageUrl(e.target.value)}
                  placeholder="https://example.com/gambar-soal.png"
                  className="flex-1 text-xs p-2.5 rounded-xl border border-slate-300 focus:outline-indigo-500 font-mono"
                />
                <button
                  type="button"
                  onClick={handleApplyImageUrl}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer shrink-0"
                >
                  Terapkan URL
                </button>
              </div>
            </div>

            {/* OPSI 3: CONTOH DIAGRAM PEMBELAJARAN SD */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Opsi 3: Pilih dari Koleksi Diagram Pembelajaran SD
                </label>
                <div className="flex gap-1">
                  {['Semua', 'Matematika', 'IPAS', 'Pancasila'].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategoryPreset(cat)}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        selectedCategoryPreset === cat
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-56 overflow-y-auto p-1">
                {SD_DIAGRAM_PRESETS.filter(
                  (p) => selectedCategoryPreset === 'Semua' || p.category === selectedCategoryPreset
                ).map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPresetDiagram(preset)}
                    className="p-2 border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/40 rounded-xl transition-all text-left flex flex-col justify-between group cursor-pointer"
                  >
                    <div className="bg-slate-100 rounded-lg p-1 mb-2 flex items-center justify-center">
                      <img
                        src={preset.dataUrl}
                        alt={preset.title}
                        className="max-h-20 w-auto object-contain rounded"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div>
                      <p className="font-bold text-[11px] text-slate-800 group-hover:text-indigo-600 line-clamp-1">
                        {preset.title}
                      </p>
                      <span className="text-[9px] text-slate-400">{preset.category}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setImageModalQIndex(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DELETE CONFIRMATION EXAM */}
      {deleteConfirmExamId && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Hapus Paket Soal Ini?</h3>
              <p className="text-xs text-slate-600 mt-1">
                Paket soal beserta seluruh butir soal di dalamnya akan dihapus permanen dari sistem dan basis data.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setDeleteConfirmExamId(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                id="btn-confirm-delete-exam"
                onClick={() => handleDeleteExam(deleteConfirmExamId)}
                className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Hapus Permanen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: BUAT PAKET BARU */}
      {showNewExamModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 my-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-indigo-600" />
                Buat Paket Ujian CBT Baru
              </h3>
              <button
                onClick={() => setShowNewExamModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewExam} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Mata Pelajaran
                </label>
                <select
                  value={newExamSubject}
                  onChange={(e) => setNewExamSubject(e.target.value)}
                  className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 focus:outline-indigo-500"
                >
                  {SD_SUBJECTS.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Tingkat Kelas SD
                </label>
                <select
                  value={newExamGrade}
                  onChange={(e) => setNewExamGrade(Number(e.target.value))}
                  className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 focus:outline-indigo-500"
                >
                  {[1, 2, 3, 4, 5, 6].map((g) => (
                    <option key={g} value={g}>
                      Kelas {g} SD
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Judul Paket Ujian
                </label>
                <input
                  type="text"
                  required
                  value={newExamTitle}
                  onChange={(e) => setNewExamTitle(e.target.value)}
                  placeholder={`Penilaian Harian ${newExamSubject} Kelas ${newExamGrade}`}
                  className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 focus:outline-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Durasi (Menit)
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={180}
                    value={newExamDuration}
                    onChange={(e) => setNewExamDuration(Number(e.target.value) || 45)}
                    className="w-full text-xs font-mono font-bold p-2.5 rounded-xl border border-slate-300 focus:outline-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    KKM (Passing Grade)
                  </label>
                  <input
                    type="number"
                    min={50}
                    max={100}
                    value={newExamPassingGrade}
                    onChange={(e) => setNewExamPassingGrade(Number(e.target.value) || 75)}
                    className="w-full text-xs font-mono font-bold p-2.5 rounded-xl border border-slate-300 focus:outline-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewExamModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  Simpan & Mulai Tambah Soal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: GENERATOR SOAL GEMINI AI */}
      {showAiModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 my-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                  <Sparkles className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Generator Soal Otomatis Gemini AI
                  </h3>
                  <p className="text-xs text-slate-500">
                    Kurikulum Merdeka, Taksonomi Bloom (C1-C6) & Soal Campuran
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAiModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Mata Pelajaran
                  </label>
                  <select
                    value={aiSubject}
                    onChange={(e) => setAiSubject(e.target.value)}
                    className="w-full text-xs font-semibold p-2 rounded-xl border border-slate-300 focus:outline-indigo-500"
                  >
                    {SD_SUBJECTS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Kelas SD
                  </label>
                  <select
                    value={aiGrade}
                    onChange={(e) => setAiGrade(Number(e.target.value))}
                    className="w-full text-xs font-semibold p-2 rounded-xl border border-slate-300 focus:outline-indigo-500"
                  >
                    {[1, 2, 3, 4, 5, 6].map((g) => (
                      <option key={g} value={g}>
                        Kelas {g} SD
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Topik / Pokok Bahasan Materi:
                </label>
                <input
                  type="text"
                  required
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  placeholder="Contoh: Fotosintesis & Rantai Makanan Ekosistem Sawah"
                  className="w-full text-xs font-semibold p-2.5 rounded-xl border border-slate-300 focus:outline-indigo-500"
                />
              </div>

              {/* Unggah Dokumen Pendukung */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Unggah Dokumen Rujukan Materi (Opsional):
                </label>
                <label className="border border-dashed border-slate-300 hover:border-indigo-400 rounded-xl p-3 flex items-center justify-between cursor-pointer bg-slate-50 transition-colors">
                  <div className="flex items-center gap-2">
                    <FileUp className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs text-slate-700 font-medium">
                      {aiDocFileName || 'Pilih berkas teks (.txt, .md, materi modul)'}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">Unggah</span>
                  <input type="file" accept=".txt,.md,.json" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>

              {/* Jumlah Soal */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Jumlah Soal yang Digenerate:
                </label>
                <div className="flex items-center gap-3">
                  {[3, 5, 10, 15].map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setAiCount(cnt)}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        aiCount === cnt
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {cnt} Soal
                    </button>
                  ))}
                </div>
              </div>

              {/* Taksonomi Bloom Levels */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Tingkat Taksonomi Bloom:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {BLOOM_LEVELS.map((lvl) => {
                    const isSelected = aiSelectedTaxonomies.includes(lvl.code);
                    return (
                      <button
                        key={lvl.code}
                        type="button"
                        onClick={() => {
                          setAiSelectedTaxonomies((prev) =>
                            isSelected ? prev.filter((t) => t !== lvl.code) : [...prev, lvl.code]
                          );
                        }}
                        className={`p-2 rounded-xl text-left border transition-all text-xs cursor-pointer ${
                          isSelected
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-900 font-bold'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{lvl.code}</span>
                          {isSelected && <Check className="w-3 h-3 text-indigo-600" />}
                        </div>
                        <p className="text-[10px] font-normal text-slate-500 truncate">{lvl.label.split('-')[1]}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAiModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleGenerateAiQuestions}
                  disabled={isGenerating}
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  {isGenerating ? 'AI Sedang Menyusun Soal...' : 'Mulai Generate Soal'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

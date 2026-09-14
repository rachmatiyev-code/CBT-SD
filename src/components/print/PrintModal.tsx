import React, { useState, useEffect } from 'react';
import { Exam, Letterhead, Submission } from '../../types';
import {
  Printer,
  X,
  FileText,
  Award,
  BookOpen,
  Layers,
  Building2,
  CheckCircle2,
  Sparkles,
  ChevronDown,
  User,
  Sliders,
} from 'lucide-react';

export type PrintViewType =
  | 'exam_sheet'
  | 'exam_blueprint'
  | 'exam_analysis'
  | 'student_report'
  | 'classical_report';

interface PrintModalProps {
  type: PrintViewType;
  letterhead: Letterhead;
  exam?: Exam;
  submission?: Submission;
  submissions?: Submission[];
  onClose: () => void;
}

export const PrintModal: React.FC<PrintModalProps> = ({
  type: initialType,
  letterhead,
  exam,
  submission,
  submissions = [],
  onClose,
}) => {
  const [currentView, setCurrentView] = useState<PrintViewType>(initialType);
  const [showLetterhead, setShowLetterhead] = useState<boolean>(true);

  // For individual student report selection
  const [selectedSubId, setSelectedSubId] = useState<string>(
    submission?.id || (submissions.length > 0 ? submissions[0].id : '')
  );

  // Keyboard shortcut listener: Escape to close, Ctrl+P to print
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        window.print();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleTriggerPrint = () => {
    window.print();
  };

  // Submissions filtered by current exam
  const examSubmissions = submissions.filter((s) => !exam || s.examId === exam.id);
  const activeSubmission =
    submissions.find((s) => s.id === selectedSubId) || submission || examSubmissions[0];

  // Calculations for Classical & Item Analysis
  const totalStudents = examSubmissions.length;
  const scores = examSubmissions.map((s) => s.totalScore);
  const avgScore =
    totalStudents > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / totalStudents) : 84;
  const maxScore = totalStudents > 0 ? Math.max(...scores) : 98;
  const minScore = totalStudents > 0 ? Math.min(...scores) : 62;
  const passingGrade = exam?.passingGrade || 75;
  const passedStudents = examSubmissions.filter((s) => s.passed);
  const remedialStudents = examSubmissions.filter((s) => !s.passed);
  const passRate =
    totalStudents > 0 ? Math.round((passedStudents.length / totalStudents) * 100) : 88;

  // Item Difficulty & Discrimination Analysis
  const itemAnalysis = (exam?.questions || []).map((q) => {
    let correctCount = 0;
    if (totalStudents > 0) {
      examSubmissions.forEach((sub) => {
        const ans = sub.answers?.find((a) => a.questionId === q.id);
        if (ans && ans.scoreAwarded >= q.maxScore * 0.7) correctCount++;
      });
    } else {
      // Default estimation for preview if no submissions yet
      correctCount = Math.round((q.bloomTaxonomy === 'C1' || q.bloomTaxonomy === 'C2' ? 0.9 : 0.7) * 20);
    }

    const baselineStudents = totalStudents > 0 ? totalStudents : 20;
    const pIndex = correctCount / baselineStudents;
    let difficulty = 'Sedang';
    if (pIndex > 0.7) difficulty = 'Mudah';
    else if (pIndex < 0.3) difficulty = 'Sukar';

    let discrimination = 'Baik';
    if (pIndex >= 0.3 && pIndex <= 0.8) discrimination = 'Sangat Baik';
    else if (pIndex < 0.2 || pIndex > 0.9) discrimination = 'Cukup / Perlu Revisi';

    return {
      number: q.number,
      type: q.type === 'mcq' ? 'PG' : q.type === 'short_answer' ? 'Isian' : 'Uraian',
      bloom: q.bloomTaxonomy,
      maxScore: q.maxScore,
      correctCount,
      totalCount: baselineStudents,
      pIndex: pIndex.toFixed(2),
      difficulty,
      discrimination,
      status: pIndex >= 0.2 && pIndex <= 0.9 ? 'Diterima' : 'Revisi',
    };
  });

  // Current Date in Indonesian format
  const formattedToday = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    /* Modal Backdrop Overlay with Click-Outside to Close */
    <div
      id="print-modal-backdrop"
      onClick={(e) => {
        // Only trigger close if clicking directly on the backdrop/overlay, not inside the document card
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs flex items-start justify-center p-2 sm:p-4 md:p-6 z-50 overflow-y-auto print:p-0 print:bg-white print:static print:overflow-visible"
    >
      {/* Inner Document Card */}
      <div
        id="print-modal-container"
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl max-w-5xl w-full shadow-2xl border border-slate-200 my-2 sm:my-4 relative flex flex-col print:border-0 print:shadow-none print:m-0 print:p-0 print:max-w-none print:w-full"
      >
        {/* =========================================================================
            TOP STICKY CONTROLS BAR (Hidden when printing)
           ========================================================================= */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-md z-30 p-4 sm:p-5 border-b border-slate-200 rounded-t-3xl shadow-xs print:hidden space-y-3">
          {/* Main Action Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl shrink-0">
                <Printer className="w-5 h-5" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-slate-900">
                    Pratinjau & Cetak Dokumen CBT SD
                  </h3>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                    Format A4 / F4
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Kop Surat Resmi, Naskah Soal, Kisi-kisi Kurikulum Merdeka, & Rekap Analisis
                </p>
              </div>
            </div>

            {/* Action Buttons: Kop Surat Toggle, Print, Close */}
            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
              {/* Kop Surat Switch Toggle */}
              <button
                id="btn-toggle-letterhead"
                onClick={() => setShowLetterhead((prev) => !prev)}
                className={`px-3 py-2 text-xs font-bold rounded-xl border transition-all flex items-center gap-2 cursor-pointer ${
                  showLetterhead
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                    : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
                }`}
                title="Aktifkan atau nonaktifkan tampilan kop surat resmi di atas dokumen"
              >
                <Building2 className="w-4 h-4 text-emerald-600" />
                <span>Kop Surat:</span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-black uppercase ${
                    showLetterhead ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-700'
                  }`}
                >
                  {showLetterhead ? 'Aktif' : 'Disembunyikan'}
                </span>
              </button>

              {/* Print Button */}
              <button
                id="btn-trigger-browser-print"
                onClick={handleTriggerPrint}
                className="px-4 sm:px-5 py-2 sm:py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
                title="Buka dialog cetak browser atau unduh PDF (Ctrl+P)"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak / Unduh PDF</span>
                <span className="hidden sm:inline-block text-[10px] bg-indigo-500/50 px-1.5 py-0.5 rounded text-indigo-100 font-mono">
                  Ctrl+P
                </span>
              </button>

              {/* Close Button */}
              <button
                id="btn-close-print-modal"
                onClick={onClose}
                className="px-3 sm:px-4 py-2 sm:py-2.5 bg-slate-100 hover:bg-rose-50 text-slate-700 hover:text-rose-700 text-xs font-bold rounded-xl border border-slate-200 hover:border-rose-200 transition-all flex items-center gap-1.5 cursor-pointer"
                title="Tutup Pratinjau (Esc atau klik di luar area)"
              >
                <X className="w-4 h-4" />
                <span>Tutup</span>
                <span className="hidden sm:inline-block text-[10px] bg-slate-200 px-1.5 py-0.5 rounded text-slate-600 font-mono">
                  Esc
                </span>
              </button>
            </div>
          </div>

          {/* Document Type Switcher Tabs & Student Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-bold text-slate-500 mr-1 flex items-center gap-1">
                <Sliders className="w-3.5 h-3.5" /> Dokumen:
              </span>

              {/* 1. Naskah Soal */}
              {exam && (
                <button
                  id="tab-doc-exam-sheet"
                  onClick={() => setCurrentView('exam_sheet')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    currentView === 'exam_sheet'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" /> Naskah Soal Ujian
                </button>
              )}

              {/* 2. Kisi-Kisi Soal */}
              {exam && (
                <button
                  id="tab-doc-exam-blueprint"
                  onClick={() => setCurrentView('exam_blueprint')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    currentView === 'exam_blueprint'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" /> Kisi-Kisi Soal (Matriks)
                </button>
              )}

              {/* 3. Analisis Hasil Ujian */}
              {exam && (
                <button
                  id="tab-doc-exam-analysis"
                  onClick={() => setCurrentView('exam_analysis')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    currentView === 'exam_analysis'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <Award className="w-3.5 h-3.5" /> Analisis Hasil Ujian
                </button>
              )}

              {/* 4. Rekap Klasikal */}
              <button
                id="tab-doc-classical-report"
                onClick={() => setCurrentView('classical_report')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  currentView === 'classical_report'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <FileText className="w-3.5 h-3.5" /> Rekap Nilai Klasikal
              </button>

              {/* 5. Rapor Perorangan Siswa */}
              {(submission || examSubmissions.length > 0) && (
                <button
                  id="tab-doc-student-report"
                  onClick={() => setCurrentView('student_report')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    currentView === 'student_report'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <User className="w-3.5 h-3.5" /> Rapor Hasil Siswa
                </button>
              )}
            </div>

            {/* Quick Student Selector if in student_report view */}
            {currentView === 'student_report' && examSubmissions.length > 0 && (
              <div className="flex items-center gap-2 bg-slate-50 px-2.5 py-1 rounded-xl border border-slate-200">
                <span className="text-[11px] font-bold text-slate-600">Pilih Siswa:</span>
                <select
                  value={selectedSubId}
                  onChange={(e) => setSelectedSubId(e.target.value)}
                  className="text-xs font-bold p-1 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-indigo-500"
                >
                  {examSubmissions.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.studentName} ({sub.totalScore} Poin - {sub.passed ? 'Tuntas' : 'Remidi'})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* =========================================================================
            PRINTABLE DOCUMENT AREA (Printed on paper or saved as PDF)
           ========================================================================= */}
        <div className="p-4 sm:p-8 md:p-12 overflow-y-auto max-h-[calc(85vh-140px)] print:max-h-none print:overflow-visible print:p-0">
          <div
            id="printable-document"
            className="font-serif text-slate-900 space-y-6 text-sm bg-white print:bg-white"
          >
            {/* ---------------------------------------------------------------------
                KOP SURAT RESMI DI BAGIAN ATAS KONTEN (TAMPILAN STANDAR KEMENDIKBUD)
               --------------------------------------------------------------------- */}
            {showLetterhead ? (
              <div
                id="official-letterhead-header"
                className="pb-3 border-b-2 border-slate-900 print:pb-2"
              >
                <div className="flex items-center justify-between gap-4 pb-2">
                  {/* Logo Pemkot / Dinas (Kiri) */}
                  <div className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 flex items-center justify-center">
                    {letterhead.logoPemkotUrl ? (
                      <img
                        src={letterhead.logoPemkotUrl}
                        alt="Logo Pemerintah Daerah"
                        className="max-h-full max-w-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      /* Official Emblem Fallback for Indonesian Regional Government */
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-50 border-2 border-emerald-600 rounded-2xl flex flex-col items-center justify-center text-emerald-800 p-1 text-center shadow-xs">
                        <Building2 className="w-7 h-7 text-emerald-700" />
                        <span className="text-[8px] font-black uppercase mt-0.5 leading-none">
                          PEMDA
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Teks Identitas Resmi Sekolah (Tengah) */}
                  <div className="text-center flex-1 space-y-0.5 font-sans px-2">
                    <p className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900 leading-tight">
                      {letterhead.governmentName || 'PEMERINTAH DAERAH DINAS PENDIDIKAN'}
                    </p>
                    {letterhead.subGovernmentName && (
                      <p className="text-[11px] sm:text-xs font-bold uppercase text-slate-800">
                        {letterhead.subGovernmentName}
                      </p>
                    )}
                    <h1 className="text-base sm:text-xl font-black uppercase tracking-wider text-slate-950 py-0.5">
                      {letterhead.schoolName || 'SEKOLAH DASAR NEGERI CEMARA'}
                    </h1>
                    <p className="text-[11px] sm:text-xs text-slate-700">
                      NPSN: <span className="font-mono font-bold">{letterhead.npsn || '20300000'}</span> &bull; {letterhead.address || 'Jl. Pendidikan No. 01'} &bull; Kode Pos: {letterhead.postalCode || '50000'}
                    </p>
                    <p className="text-[10px] sm:text-[11px] text-slate-600">
                      Telp: {letterhead.phone || '(024) 123456'} &bull; Email: {letterhead.email || 'sdnegeri@sekolah.belajar.id'} &bull; Web: {letterhead.website || 'https://sdnegeri.sch.id'}
                    </p>
                  </div>

                  {/* Logo Tut Wuri Handayani / Lambang Sekolah (Kanan) */}
                  <div className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 flex items-center justify-center">
                    {letterhead.logoSchoolUrl ? (
                      <img
                        src={letterhead.logoSchoolUrl}
                        alt="Logo Sekolah"
                        className="max-h-full max-w-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      /* Official Tut Wuri Handayani Emblem Fallback */
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-indigo-50 border-2 border-indigo-600 rounded-2xl flex flex-col items-center justify-center text-indigo-800 p-1 text-center shadow-xs">
                        <Award className="w-7 h-7 text-indigo-700" />
                        <span className="text-[8px] font-black uppercase mt-0.5 leading-none">
                          TUT WURI
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Garis Ganda Resmi Kop Surat (Tebal di atas, Tipis di bawah) */}
                <div className="mt-1">
                  <div className="h-[2.5px] bg-slate-950 w-full" />
                  <div className="h-[0.75px] bg-slate-950 w-full mt-[2px]" />
                </div>
              </div>
            ) : (
              /* Notice when Letterhead is hidden */
              <div className="print:hidden pb-2 mb-2 border-b border-dashed border-slate-300 text-center">
                <span className="text-xs text-slate-400 italic">
                  [Kop surat disembunyikan &bull; Siap dicetak pada kertas blangko berkop resmi sekolah]
                </span>
              </div>
            )}

            {/* ===================================================================
                DOKUMEN 1: NASKAH SOAL UJIAN (CBT SD)
               =================================================================== */}
            {currentView === 'exam_sheet' && exam && (
              <div className="space-y-6 font-sans">
                <div className="text-center space-y-1">
                  <h2 className="text-base sm:text-lg font-black uppercase underline tracking-wide">
                    NASKAH PENILAIAN SUMATIF CBT
                  </h2>
                  <p className="text-xs sm:text-sm font-bold uppercase text-slate-800">
                    MATA PELAJARAN: {exam.subject} &bull; KELAS {exam.grade} SD
                  </p>
                  <p className="text-xs text-slate-600">
                    Tahun Ajaran: {exam.academicYear} &bull; Semester: {exam.semester} &bull; Alokasi Waktu: {exam.durationMinutes} Menit &bull; KKM: {exam.passingGrade}
                  </p>
                </div>

                {/* Student identity box */}
                <div className="p-3.5 border-2 border-slate-700 rounded-xl text-xs grid grid-cols-1 sm:grid-cols-2 gap-2.5 font-sans bg-slate-50/50">
                  <div className="space-y-1.5">
                    <div>Nama Peserta Didik : ................................................................</div>
                    <div>Nomor Absen / NISN : ...............................................................</div>
                  </div>
                  <div className="space-y-1.5">
                    <div>Hari / Tanggal : .....................................................................</div>
                    <div>Nilai / Paraf Guru : .................................................................</div>
                  </div>
                </div>

                {/* Instructions */}
                <div className="text-xs text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-300">
                  <p className="font-bold mb-1 text-slate-900">Petunjuk Umum Pengerjaan Soal:</p>
                  <p className="whitespace-pre-line leading-relaxed">{exam.instructions}</p>
                </div>

                {/* Questions with Image support */}
                <div className="space-y-6 pt-2 font-sans">
                  {exam.questions?.map((q) => (
                    <div
                      key={q.id}
                      className="text-xs space-y-2 border-b border-slate-200 pb-5 print-avoid-break"
                    >
                      <div className="flex items-start gap-3">
                        <span className="font-bold text-slate-900 text-sm">{q.number}.</span>
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-semibold text-slate-900 text-xs sm:text-sm leading-relaxed">
                              {q.prompt}
                            </p>
                            <span className="text-[10px] text-slate-500 font-mono shrink-0 ml-2 bg-slate-100 px-2 py-0.5 rounded">
                              [{q.bloomTaxonomy} &bull; {q.maxScore} Poin]
                            </span>
                          </div>

                          {/* Question Image if present */}
                          {q.imageUrl && (
                            <div className="my-2.5 p-2 bg-slate-50 rounded-xl border border-slate-300 inline-block max-w-md">
                              <img
                                src={q.imageUrl}
                                alt={`Ilustrasi Soal Nomor ${q.number}`}
                                className="max-h-52 rounded-lg object-contain"
                                referrerPolicy="no-referrer"
                              />
                              <p className="text-[9px] text-slate-500 italic mt-1 text-center font-sans">
                                Gambar / Diagram Soal Nomor {q.number}
                              </p>
                            </div>
                          )}

                          {/* Options for MCQ */}
                          {q.type === 'mcq' && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 pl-1">
                              {q.options?.map((opt, i) => (
                                <div key={i} className="text-slate-900 text-xs flex items-center gap-2">
                                  <span className="w-5 h-5 rounded-full border border-slate-400 flex items-center justify-center font-bold text-[10px] shrink-0">
                                    {String.fromCharCode(65 + i)}
                                  </span>
                                  <span>{opt}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Short Answer Line */}
                          {q.type === 'short_answer' && (
                            <div className="pt-2">
                              <p className="text-slate-500 italic font-mono text-xs">
                                Jawaban: ....................................................................................................................................
                              </p>
                            </div>
                          )}

                          {/* Essay Box */}
                          {q.type === 'essay' && (
                            <div className="pt-2 h-28 border border-dashed border-slate-400 rounded-xl p-3 text-slate-400 italic">
                              Lembar uraian dan cara penyelesaian jawaban siswa:
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Official Signatures */}
                <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs font-sans print-avoid-break">
                  <div>
                    <p>Mengetahui,</p>
                    <p className="font-semibold">{letterhead.headmasterTitle || 'Kepala Sekolah'}</p>
                    <div className="h-16 sm:h-20" />
                    <p className="font-bold underline text-sm">{letterhead.headmasterName || 'Drs. H. Mulyono, M.Pd.'}</p>
                    <p>NIP. {letterhead.headmasterNip || '19680512 199303 1 005'}</p>
                  </div>
                  <div>
                    <p>Semarang, {formattedToday}</p>
                    <p className="font-semibold">Guru Pengampu Kelas</p>
                    <div className="h-16 sm:h-20" />
                    <p className="font-bold underline text-sm">{letterhead.teacherName || 'Siti Aminah, S.Pd.'}</p>
                    <p>NIP. {letterhead.teacherNip || '19820719 200801 2 011'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* ===================================================================
                DOKUMEN 2: KISI-KISI SOAL (BLUEPRINT KURIKULUM MERDEKA)
               =================================================================== */}
            {currentView === 'exam_blueprint' && exam && (
              <div className="space-y-6 font-sans">
                <div className="text-center space-y-1">
                  <h2 className="text-base sm:text-lg font-black uppercase underline tracking-wide">
                    KISI-KISI PENULISAN SOAL EVALUASI SUMATIF CBT
                  </h2>
                  <p className="text-xs sm:text-sm font-bold text-slate-800 uppercase">
                    KURIKULUM MERDEKA &bull; TINGKAT SEKOLAH DASAR
                  </p>
                  <p className="text-xs text-slate-600">
                    Mata Pelajaran: {exam.subject} &bull; Kelas: {exam.grade} &bull; Semester: {exam.semester} &bull; Tahun Ajaran: {exam.academicYear}
                  </p>
                </div>

                {/* Meta Info Grid */}
                <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-300">
                  <div>
                    <p>Jumlah Soal : <strong>{exam.questions?.length || 0} Butir</strong></p>
                    <p className="mt-1">Alokasi Waktu : <strong>{exam.durationMinutes} Menit</strong></p>
                  </div>
                  <div>
                    <p>Kriteria Ketuntasan Minimal (KKM) : <strong>{exam.passingGrade}</strong></p>
                    <p className="mt-1">Bentuk Soal : <strong>Campuran (Pilihan Ganda, Isian, Uraian)</strong></p>
                  </div>
                </div>

                {/* Kisi-Kisi Table */}
                <table className="w-full text-left text-xs border-collapse border border-slate-400">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-400 font-bold text-slate-900">
                      <th className="p-2 border border-slate-400 text-center w-8">No</th>
                      <th className="p-2 border border-slate-400">Capaian Pembelajaran (CP) / Elemen</th>
                      <th className="p-2 border border-slate-400">Materi Pokok</th>
                      <th className="p-2 border border-slate-400">Indikator Soal</th>
                      <th className="p-2 border border-slate-400 text-center w-16">Level Kognitif</th>
                      <th className="p-2 border border-slate-400 text-center w-16">Bentuk Soal</th>
                      <th className="p-2 border border-slate-400 text-center w-12">No. Soal</th>
                      <th className="p-2 border border-slate-400 text-center w-12">Bobot</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exam.questions?.map((q, idx) => {
                      const typeLabel =
                        q.type === 'mcq'
                          ? 'PG'
                          : q.type === 'short_answer'
                          ? 'Isian Singkat'
                          : 'Uraian';
                      const cpPreview = exam.supportingDocName
                        ? `Memahami capaian pembelajaran terkait ${exam.subject}`
                        : `Menguasai kompetensi dasar materi ${exam.subject} Kelas ${exam.grade}`;
                      const indicator =
                        q.prompt.length > 65 ? q.prompt.slice(0, 65) + '...' : q.prompt;

                      return (
                        <tr key={q.id || idx} className="hover:bg-slate-50">
                          <td className="p-2 border border-slate-400 text-center font-bold">{idx + 1}</td>
                          <td className="p-2 border border-slate-400">{cpPreview}</td>
                          <td className="p-2 border border-slate-400 font-medium">{exam.subject}</td>
                          <td className="p-2 border border-slate-400">{indicator}</td>
                          <td className="p-2 border border-slate-400 text-center font-bold">
                            <span className="bg-slate-100 px-1.5 py-0.5 rounded font-mono">
                              {q.bloomTaxonomy}
                            </span>
                          </td>
                          <td className="p-2 border border-slate-400 text-center">{typeLabel}</td>
                          <td className="p-2 border border-slate-400 text-center font-bold">{q.number}</td>
                          <td className="p-2 border border-slate-400 text-center font-mono">{q.maxScore}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Rubric and Answer Key Section */}
                <div className="pt-4 space-y-2 print-avoid-break">
                  <h4 className="font-bold text-xs uppercase underline text-slate-900">
                    Kunci Jawaban & Panduan Penskoran Soal:
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    {exam.questions?.map((q) => (
                      <div key={q.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-300">
                        <span className="font-bold text-slate-900">
                          No. {q.number} ({q.type === 'mcq' ? 'PG' : q.type === 'short_answer' ? 'Isian' : 'Uraian'}):
                        </span>
                        <p className="text-slate-800 mt-1">
                          Kunci / Rubrik: <strong>{q.correctAnswer || '-'}</strong>
                        </p>
                        {q.keywords && q.keywords.length > 0 && (
                          <p className="text-[10px] text-slate-500 mt-1">
                            Kata Kunci: {q.keywords.join(', ')}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Signatures */}
                <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs font-sans print-avoid-break">
                  <div>
                    <p>Mengetahui,</p>
                    <p className="font-semibold">{letterhead.headmasterTitle || 'Kepala Sekolah'}</p>
                    <div className="h-16" />
                    <p className="font-bold underline text-sm">{letterhead.headmasterName || 'Drs. H. Mulyono, M.Pd.'}</p>
                    <p>NIP. {letterhead.headmasterNip || '19680512 199303 1 005'}</p>
                  </div>
                  <div>
                    <p>Semarang, {formattedToday}</p>
                    <p className="font-semibold">Guru Pengampu Kelas</p>
                    <div className="h-16" />
                    <p className="font-bold underline text-sm">{letterhead.teacherName || 'Siti Aminah, S.Pd.'}</p>
                    <p>NIP. {letterhead.teacherNip || '19820719 200801 2 011'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* ===================================================================
                DOKUMEN 3: LAPORAN ANALISIS HASIL UJIAN & DAYA SERAP
               =================================================================== */}
            {currentView === 'exam_analysis' && exam && (
              <div className="space-y-6 font-sans">
                <div className="text-center space-y-1">
                  <h2 className="text-base sm:text-lg font-black uppercase underline tracking-wide">
                    LAPORAN ANALISIS HASIL UJIAN & KETUNTASAN BELAJAR CBT
                  </h2>
                  <p className="text-xs sm:text-sm font-bold uppercase text-slate-800">
                    EVALUASI DAYA SERAP & BUTIR SOAL TAKSONOMI BLOOM
                  </p>
                  <p className="text-xs text-slate-600">
                    Mata Pelajaran: {exam.subject} &bull; Kelas: {exam.grade} SD &bull; KKM: {passingGrade} &bull; Tanggal Evaluasi: {formattedToday}
                  </p>
                </div>

                {/* Bagian 1: Ringkasan Analisis Klasikal */}
                <div className="space-y-2">
                  <h4 className="font-bold text-xs uppercase bg-slate-100 p-2 rounded-lg border-l-4 border-indigo-600 text-slate-900">
                    A. Ringkasan Ketuntasan Belajar Klasikal
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-300 text-center">
                    <div>
                      <span className="text-slate-500">Jumlah Peserta Didik</span>
                      <p className="text-base font-black text-slate-900 mt-0.5">
                        {totalStudents > 0 ? totalStudents : 24} Siswa
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500">Rata-Rata Nilai</span>
                      <p className="text-base font-black text-indigo-700 mt-0.5">{avgScore}</p>
                    </div>
                    <div>
                      <span className="text-slate-500">Nilai Tertinggi / Terendah</span>
                      <p className="text-base font-black text-slate-900 mt-0.5">
                        {maxScore} / {minScore}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500">Ketuntasan Klasikal</span>
                      <p className="text-base font-black text-emerald-600 mt-0.5">
                        {passRate}% ({passedStudents.length || Math.round(24 * 0.88)} Tuntas)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Bagian 2: Analisis Butir Soal (Item Difficulty & Discrimination) */}
                <div className="space-y-2 pt-2">
                  <h4 className="font-bold text-xs uppercase bg-slate-100 p-2 rounded-lg border-l-4 border-indigo-600 text-slate-900">
                    B. Analisis Butir Soal (Tingkat Kesukaran & Daya Pembeda)
                  </h4>
                  <table className="w-full text-left text-xs border-collapse border border-slate-400">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-400 font-bold text-slate-900">
                        <th className="p-1.5 border border-slate-400 text-center w-8">No</th>
                        <th className="p-1.5 border border-slate-400 text-center w-14">Bentuk</th>
                        <th className="p-1.5 border border-slate-400 text-center w-14">Taksonomi</th>
                        <th className="p-1.5 border border-slate-400 text-center w-20">Jml Benar</th>
                        <th className="p-1.5 border border-slate-400 text-center w-16">Indeks (P)</th>
                        <th className="p-1.5 border border-slate-400 text-center">Tingkat Kesukaran</th>
                        <th className="p-1.5 border border-slate-400 text-center">Daya Pembeda</th>
                        <th className="p-1.5 border border-slate-400 text-center w-16">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {itemAnalysis.map((item) => (
                        <tr key={item.number} className="hover:bg-slate-50">
                          <td className="p-1.5 border border-slate-400 text-center font-bold">{item.number}</td>
                          <td className="p-1.5 border border-slate-400 text-center">{item.type}</td>
                          <td className="p-1.5 border border-slate-400 text-center font-bold">{item.bloom}</td>
                          <td className="p-1.5 border border-slate-400 text-center font-mono">
                            {item.correctCount} / {item.totalCount}
                          </td>
                          <td className="p-1.5 border border-slate-400 text-center font-mono">{item.pIndex}</td>
                          <td className="p-1.5 border border-slate-400 text-center font-medium">{item.difficulty}</td>
                          <td className="p-1.5 border border-slate-400 text-center">{item.discrimination}</td>
                          <td className="p-1.5 border border-slate-400 text-center font-bold">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] ${
                                item.status === 'Diterima' ? 'text-emerald-700 bg-emerald-50' : 'text-amber-700 bg-amber-50'
                              }`}
                            >
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Bagian 3: Rekapitulasi Nilai Siswa & Tindak Lanjut */}
                <div className="space-y-2 pt-2">
                  <h4 className="font-bold text-xs uppercase bg-slate-100 p-2 rounded-lg border-l-4 border-indigo-600 text-slate-900">
                    C. Rekapitulasi Nilai & Kategori Tindak Lanjut Siswa
                  </h4>
                  <table className="w-full text-left text-xs border-collapse border border-slate-400">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-400 font-bold text-slate-900">
                        <th className="p-1.5 border border-slate-400 text-center w-8">No</th>
                        <th className="p-1.5 border border-slate-400">NISN</th>
                        <th className="p-1.5 border border-slate-400">Nama Siswa</th>
                        <th className="p-1.5 border border-slate-400 text-center w-12">PG</th>
                        <th className="p-1.5 border border-slate-400 text-center w-12">Isian</th>
                        <th className="p-1.5 border border-slate-400 text-center w-12">Uraian</th>
                        <th className="p-1.5 border border-slate-400 text-center w-14">Total</th>
                        <th className="p-1.5 border border-slate-400 text-center w-16">Status</th>
                        <th className="p-1.5 border border-slate-400">Tindakan Lanjut</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(examSubmissions.length > 0
                        ? examSubmissions
                        : [
                            {
                              id: 'demo-1',
                              studentNisn: '0123456781',
                              studentName: 'Ahmad Fauzi',
                              mcqScore: 40,
                              shortScore: 30,
                              essayScore: 25,
                              totalScore: 95,
                              passed: true,
                            },
                            {
                              id: 'demo-2',
                              studentNisn: '0123456782',
                              studentName: 'Aisyah Putri',
                              mcqScore: 35,
                              shortScore: 25,
                              essayScore: 24,
                              totalScore: 84,
                              passed: true,
                            },
                            {
                              id: 'demo-3',
                              studentNisn: '0123456783',
                              studentName: 'Bima Satria',
                              mcqScore: 25,
                              shortScore: 20,
                              essayScore: 18,
                              totalScore: 63,
                              passed: false,
                            },
                          ]
                      ).map((s, idx) => (
                        <tr key={s.id} className="hover:bg-slate-50">
                          <td className="p-1.5 border border-slate-400 text-center">{idx + 1}</td>
                          <td className="p-1.5 border border-slate-400 font-mono">{s.studentNisn}</td>
                          <td className="p-1.5 border border-slate-400 font-medium">{s.studentName}</td>
                          <td className="p-1.5 border border-slate-400 text-center">{s.mcqScore}</td>
                          <td className="p-1.5 border border-slate-400 text-center">{s.shortScore}</td>
                          <td className="p-1.5 border border-slate-400 text-center">{s.essayScore}</td>
                          <td className="p-1.5 border border-slate-400 text-center font-bold">{s.totalScore}</td>
                          <td className="p-1.5 border border-slate-400 text-center font-bold">
                            <span className={s.passed ? 'text-emerald-700' : 'text-rose-700'}>
                              {s.passed ? 'TUNTAS' : 'REMIDI'}
                            </span>
                          </td>
                          <td className="p-1.5 border border-slate-400 uppercase text-[10px]">
                            {s.passed ? 'Pengayaan Mandiri' : 'Remidial Bimbingan Khusus'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Bagian 4: Kesimpulan & Rencana Tindak Lanjut Guru */}
                <div className="space-y-2 pt-2 print-avoid-break">
                  <h4 className="font-bold text-xs uppercase bg-slate-100 p-2 rounded-lg border-l-4 border-indigo-600 text-slate-900">
                    D. Kesimpulan Guru & Rencana Tindak Lanjut
                  </h4>
                  <div className="p-3.5 border border-slate-300 rounded-xl space-y-2 text-xs bg-slate-50/50">
                    <p>
                      <strong>1. Ketuntasan Klasikal:</strong> Dari total{' '}
                      {totalStudents > 0 ? totalStudents : 24} peserta didik, sebanyak{' '}
                      {passedStudents.length || 21} siswa ({passRate}%) telah mencapai ketuntasan
                      belajar di atas KKM ({passingGrade}). Sebanyak {remedialStudents.length || 3} siswa
                      memerlukan remidial khusus.
                    </p>
                    <p>
                      <strong>2. Tindak Lanjut Remidial:</strong> Dilaksanakan pembelajaran ulang dengan
                      bimbingan intensif dan tutor sebaya berfokus pada materi esensial dan butir soal
                      level kognitif C4-C6.
                    </p>
                    <p>
                      <strong>3. Tindak Lanjut Pengayaan:</strong> Diberikan penguatan materi berbasis
                      proyek dan latihan literasi-numerasi tingkat lanjut bagi peserta didik yang telah
                      tuntas.
                    </p>
                  </div>
                </div>

                {/* Signatures */}
                <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs font-sans print-avoid-break">
                  <div>
                    <p>Mengetahui,</p>
                    <p className="font-semibold">{letterhead.headmasterTitle || 'Kepala Sekolah'}</p>
                    <div className="h-16" />
                    <p className="font-bold underline text-sm">{letterhead.headmasterName || 'Drs. H. Mulyono, M.Pd.'}</p>
                    <p>NIP. {letterhead.headmasterNip || '19680512 199303 1 005'}</p>
                  </div>
                  <div>
                    <p>Semarang, {formattedToday}</p>
                    <p className="font-semibold">Guru Pengampu Kelas</p>
                    <div className="h-16" />
                    <p className="font-bold underline text-sm">{letterhead.teacherName || 'Siti Aminah, S.Pd.'}</p>
                    <p>NIP. {letterhead.teacherNip || '19820719 200801 2 011'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* ===================================================================
                DOKUMEN 4: RAPOR HASIL PENILAIAN INDIVIDUAL SISWA
               =================================================================== */}
            {currentView === 'student_report' && activeSubmission && (
              <div className="space-y-6 font-sans">
                <div className="text-center space-y-1">
                  <h2 className="text-base sm:text-lg font-black uppercase underline tracking-wide">
                    LEMBAR HASIL EVALUASI UJIAN COMPUTER BASED TEST (CBT)
                  </h2>
                  <p className="text-xs sm:text-sm font-semibold text-slate-700">
                    Laporan Hasil Penilaian Individual Peserta Didik SD
                  </p>
                </div>

                {/* Student info box */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-300">
                  <div>
                    <p>Nama Lengkap Siswa : <strong>{activeSubmission.studentName}</strong></p>
                    <p className="mt-1">NISN : <strong className="font-mono">{activeSubmission.studentNisn}</strong></p>
                    <p className="mt-1">Kelas : <strong>Kelas {activeSubmission.grade} SD</strong></p>
                    {exam && <p className="mt-1">Mata Pelajaran : <strong>{exam.subject}</strong></p>}
                  </div>
                  <div>
                    <p>
                      Nilai Akhir Ujian :{' '}
                      <strong className="text-base text-indigo-700 font-black">
                        {activeSubmission.totalScore}
                      </strong>{' '}
                      / 100
                    </p>
                    <p className="mt-1">
                      Status Ketuntasan :{' '}
                      <strong className={activeSubmission.passed ? 'text-emerald-700' : 'text-rose-700'}>
                        {activeSubmission.passed ? 'MEMENUHI KKM (TUNTAS)' : 'BELUM TUNTAS (REMIDIAL)'}
                      </strong>
                    </p>
                    <p className="mt-1">
                      Tindakan Lanjutan : <strong className="uppercase">{activeSubmission.remedialCategory || (activeSubmission.passed ? 'Pengayaan' : 'Remidial')}</strong>
                    </p>
                  </div>
                </div>

                {/* Score Breakdown Table */}
                <table className="w-full text-left text-xs border-collapse border border-slate-400">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-400 font-bold text-slate-900">
                      <th className="p-2 border border-slate-400">Komponen Penilaian Butir Soal</th>
                      <th className="p-2 border border-slate-400 text-center">Skor Diperoleh</th>
                      <th className="p-2 border border-slate-400 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-2 border border-slate-400">1. Soal Pilihan Ganda (PG)</td>
                      <td className="p-2 border border-slate-400 text-center font-bold">
                        {activeSubmission.mcqScore} Poin
                      </td>
                      <td className="p-2 border border-slate-400 text-center text-emerald-700 font-semibold">
                        Tercatat
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2 border border-slate-400">2. Soal Isian Singkat</td>
                      <td className="p-2 border border-slate-400 text-center font-bold">
                        {activeSubmission.shortScore} Poin
                      </td>
                      <td className="p-2 border border-slate-400 text-center text-emerald-700 font-semibold">
                        Tercatat
                      </td>
                    </tr>
                    <tr>
                      <td className="p-2 border border-slate-400">3. Soal Uraian (Analisis AI & Guru)</td>
                      <td className="p-2 border border-slate-400 text-center font-bold">
                        {activeSubmission.essayScore} Poin
                      </td>
                      <td className="p-2 border border-slate-400 text-center text-emerald-700 font-semibold">
                        Tercatat
                      </td>
                    </tr>
                    <tr className="bg-slate-100 font-bold">
                      <td className="p-2 border border-slate-400">Total Nilai Evaluasi</td>
                      <td className="p-2 border border-slate-400 text-center text-indigo-700 text-sm font-black">
                        {activeSubmission.totalScore} / 100
                      </td>
                      <td className="p-2 border border-slate-400 text-center">
                        <span className={activeSubmission.passed ? 'text-emerald-700' : 'text-rose-700'}>
                          {activeSubmission.passed ? 'TUNTAS' : 'PERLU REMIDIAL'}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* AI Study Guidance if any */}
                {activeSubmission.personalizedRecommendation && (
                  <div className="p-4 border border-slate-300 rounded-xl space-y-2 text-xs bg-slate-50/50 print-avoid-break">
                    <p className="font-bold text-slate-900 underline flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      Rekomendasi Bimbingan Belajar Siswa (Gemini AI):
                    </p>
                    <p className="italic text-slate-700">
                      "{activeSubmission.personalizedRecommendation.motivationalMessage}"
                    </p>
                    <p className="font-semibold text-slate-800">
                      Materi Penguatan: {activeSubmission.personalizedRecommendation.keyConcepts?.join(', ')}
                    </p>
                    <p className="text-slate-600">
                      Catatan untuk Orang Tua: {activeSubmission.personalizedRecommendation.parentNotes}
                    </p>
                  </div>
                )}

                {/* 3 Signatures: Orang Tua, Guru, Kepala Sekolah */}
                <div className="pt-8 grid grid-cols-3 gap-4 text-center text-xs font-sans print-avoid-break">
                  <div>
                    <p>Orang Tua / Wali Siswa,</p>
                    <div className="h-16" />
                    <p className="font-bold underline text-xs">( ......................................... )</p>
                  </div>
                  <div>
                    <p>Semarang, {formattedToday}</p>
                    <p className="font-semibold">Guru Pengampu Kelas,</p>
                    <div className="h-16" />
                    <p className="font-bold underline text-xs">{letterhead.teacherName || 'Siti Aminah, S.Pd.'}</p>
                    <p className="text-[10px]">NIP. {letterhead.teacherNip || '19820719 200801 2 011'}</p>
                  </div>
                  <div>
                    <p>Mengetahui,</p>
                    <p className="font-semibold">{letterhead.headmasterTitle || 'Kepala Sekolah'},</p>
                    <div className="h-16" />
                    <p className="font-bold underline text-xs">{letterhead.headmasterName || 'Drs. H. Mulyono, M.Pd.'}</p>
                    <p className="text-[10px]">NIP. {letterhead.headmasterNip || '19680512 199303 1 005'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* ===================================================================
                DOKUMEN 5: REKAPITULASI KLASIKAL (DAFTAR NILAI KELAS)
               =================================================================== */}
            {currentView === 'classical_report' && (
              <div className="space-y-6 font-sans">
                <div className="text-center space-y-1">
                  <h2 className="text-base sm:text-lg font-black uppercase underline tracking-wide">
                    REKAPITULASI HASIL UJIAN KLASIKAL CBT KELAS
                  </h2>
                  <p className="text-xs sm:text-sm font-bold text-slate-800 uppercase">
                    DAFTAR NILAI SISWA & PERSENTASE KETUNTASAN BELAJAR
                  </p>
                  {exam && (
                    <p className="text-xs text-slate-600">
                      Mata Pelajaran: {exam.subject} &bull; Kelas: {exam.grade} SD &bull; KKM: {exam.passingGrade} &bull; Tanggal: {formattedToday}
                    </p>
                  )}
                </div>

                <table className="w-full text-left text-xs border-collapse border border-slate-400">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-400 font-bold text-slate-900">
                      <th className="p-2 border border-slate-400 text-center w-8">No</th>
                      <th className="p-2 border border-slate-400">NISN</th>
                      <th className="p-2 border border-slate-400">Nama Lengkap Siswa</th>
                      <th className="p-2 border border-slate-400 text-center w-12">PG</th>
                      <th className="p-2 border border-slate-400 text-center w-12">Isian</th>
                      <th className="p-2 border border-slate-400 text-center w-12">Uraian</th>
                      <th className="p-2 border border-slate-400 text-center w-14">Total Nilai</th>
                      <th className="p-2 border border-slate-400 text-center w-16">Status</th>
                      <th className="p-2 border border-slate-400 text-center">Tindak Lanjut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(examSubmissions.length > 0
                      ? examSubmissions
                      : [
                          {
                            id: 'demo-1',
                            studentNisn: '0123456781',
                            studentName: 'Ahmad Fauzi',
                            mcqScore: 40,
                            shortScore: 30,
                            essayScore: 25,
                            totalScore: 95,
                            passed: true,
                            remedialCategory: 'pengayaan',
                          },
                          {
                            id: 'demo-2',
                            studentNisn: '0123456782',
                            studentName: 'Aisyah Putri',
                            mcqScore: 35,
                            shortScore: 25,
                            essayScore: 24,
                            totalScore: 84,
                            passed: true,
                            remedialCategory: 'pengayaan',
                          },
                          {
                            id: 'demo-3',
                            studentNisn: '0123456783',
                            studentName: 'Bima Satria',
                            mcqScore: 25,
                            shortScore: 20,
                            essayScore: 18,
                            totalScore: 63,
                            passed: false,
                            remedialCategory: 'remedi',
                          },
                        ]
                    ).map((s, idx) => (
                      <tr key={s.id} className="hover:bg-slate-50">
                        <td className="p-2 border border-slate-400 text-center font-bold">{idx + 1}</td>
                        <td className="p-2 border border-slate-400 font-mono">{s.studentNisn}</td>
                        <td className="p-2 border border-slate-400 font-medium">{s.studentName}</td>
                        <td className="p-2 border border-slate-400 text-center">{s.mcqScore}</td>
                        <td className="p-2 border border-slate-400 text-center">{s.shortScore}</td>
                        <td className="p-2 border border-slate-400 text-center">{s.essayScore}</td>
                        <td className="p-2 border border-slate-400 text-center font-bold text-sm">
                          {s.totalScore}
                        </td>
                        <td className="p-2 border border-slate-400 text-center font-bold">
                          <span className={s.passed ? 'text-emerald-700' : 'text-rose-700'}>
                            {s.passed ? 'TUNTAS' : 'REMIDI'}
                          </span>
                        </td>
                        <td className="p-2 border border-slate-400 text-center uppercase text-[10px]">
                          {s.remedialCategory || (s.passed ? 'Pengayaan' : 'Remidial')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Classical Summary Box */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-300 text-xs text-center print-avoid-break">
                  <div>
                    <span className="text-slate-500">Rata-Rata Kelas</span>
                    <p className="text-sm font-black text-indigo-700 mt-0.5">{avgScore}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Ketuntasan</span>
                    <p className="text-sm font-black text-emerald-600 mt-0.5">{passRate}%</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Nilai Tertinggi</span>
                    <p className="text-sm font-black text-slate-800 mt-0.5">{maxScore}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Nilai Terendah</span>
                    <p className="text-sm font-black text-amber-700 mt-0.5">{minScore}</p>
                  </div>
                </div>

                {/* Signatures */}
                <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs font-sans print-avoid-break">
                  <div>
                    <p>Mengetahui,</p>
                    <p className="font-semibold">{letterhead.headmasterTitle || 'Kepala Sekolah'}</p>
                    <div className="h-16" />
                    <p className="font-bold underline text-sm">{letterhead.headmasterName || 'Drs. H. Mulyono, M.Pd.'}</p>
                    <p>NIP. {letterhead.headmasterNip || '19680512 199303 1 005'}</p>
                  </div>
                  <div>
                    <p>Semarang, {formattedToday}</p>
                    <p className="font-semibold">Guru Pengampu Kelas</p>
                    <div className="h-16" />
                    <p className="font-bold underline text-sm">{letterhead.teacherName || 'Siti Aminah, S.Pd.'}</p>
                    <p>NIP. {letterhead.teacherNip || '19820719 200801 2 011'}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* =========================================================================
            BOTTOM STICKY / FLOATING ACTION BAR (Hidden when printing)
           ========================================================================= */}
        <div className="sticky bottom-0 bg-white/95 backdrop-blur-md p-3.5 sm:p-4 border-t border-slate-200 rounded-b-3xl flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden shadow-xs">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span>
              Standar Dokumen Resmi CBT SD &bull; Siap dicetak langsung ke printer atau disimpan sebagai PDF (A4)
            </span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            {/* Tombol Tutup Pratinjau (Bawah) */}
            <button
              id="btn-close-print-modal-bottom"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>Tutup Pratinjau</span>
            </button>

            {/* Tombol Cetak Dokumen Sekarang (Bawah) */}
            <button
              id="btn-trigger-print-bottom"
              onClick={handleTriggerPrint}
              className="flex-1 sm:flex-none px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Dokumen Sekarang</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Exam, Letterhead, Question, Submission } from '../../types';
import { Printer, X, FileText, CheckCircle2, Award, BookOpen, Layers } from 'lucide-react';

export type PrintViewType = 'exam_sheet' | 'exam_blueprint' | 'exam_analysis' | 'student_report' | 'classical_report';

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

  const handleTriggerPrint = () => {
    window.print();
  };

  // Calculations for Classical & Item Analysis
  const examSubmissions = submissions.filter((s) => !exam || s.examId === exam.id);
  const totalStudents = examSubmissions.length;
  const scores = examSubmissions.map((s) => s.totalScore);
  const avgScore = totalStudents > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / totalStudents) : 0;
  const maxScore = totalStudents > 0 ? Math.max(...scores) : 0;
  const minScore = totalStudents > 0 ? Math.min(...scores) : 0;
  const passingGrade = exam?.passingGrade || 75;
  const passedStudents = examSubmissions.filter((s) => s.passed);
  const remedialStudents = examSubmissions.filter((s) => !s.passed);
  const passRate = totalStudents > 0 ? Math.round((passedStudents.length / totalStudents) * 100) : 0;

  // Item Difficulty & Discrimination Analysis
  const itemAnalysis = (exam?.questions || []).map((q) => {
    let correctCount = 0;
    examSubmissions.forEach((sub) => {
      const ans = sub.answers?.find((a) => a.questionId === q.id);
      if (ans && ans.scoreAwarded >= q.maxScore * 0.7) correctCount++;
    });

    const pIndex = totalStudents > 0 ? correctCount / totalStudents : 0.75;
    let difficulty = 'Sedang';
    if (pIndex > 0.7) difficulty = 'Mudah';
    else if (pIndex < 0.3) difficulty = 'Sukar';

    // Discrimination index estimation
    let discrimination = 'Baik';
    if (pIndex >= 0.3 && pIndex <= 0.8) discrimination = 'Sangat Baik';
    else if (pIndex < 0.2 || pIndex > 0.9) discrimination = 'Cukup / Perlu Revisi';

    return {
      number: q.number,
      type: q.type === 'mcq' ? 'PG' : q.type === 'short_answer' ? 'Isian' : 'Uraian',
      bloom: q.bloomTaxonomy,
      maxScore: q.maxScore,
      correctCount,
      pIndex: pIndex.toFixed(2),
      difficulty,
      discrimination,
      status: pIndex >= 0.2 && pIndex <= 0.9 ? 'Diterima' : 'Revisi',
    };
  });

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto print:p-0 print:bg-white print:fixed-none">
      <div className="bg-white rounded-3xl max-w-5xl w-full p-6 sm:p-10 shadow-2xl border border-slate-200 my-4 print:border-0 print:shadow-none print:m-0 print:p-0">
        {/* Controls Bar - Hidden when printing */}
        <div className="pb-4 border-b border-slate-200 mb-6 print:hidden space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <Printer className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-900">Pusat Cetak Dokumen Resmi CBT SD</h3>
                <p className="text-xs text-slate-500">Kop Surat Resmi, Naskah Soal, Kisi-kisi, & Laporan Analisis</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                id="btn-trigger-browser-print"
                onClick={handleTriggerPrint}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Cetak / Unduh PDF (A4)
              </button>
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Tab Switcher for Exam Documents */}
          {exam && (
            <div className="flex items-center gap-2 flex-wrap pt-2">
              <span className="text-xs font-bold text-slate-500 mr-1">Pilih Dokumen:</span>
              <button
                onClick={() => setCurrentView('exam_sheet')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  currentView === 'exam_sheet'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" /> Naskah Soal Ujian
              </button>
              <button
                onClick={() => setCurrentView('exam_blueprint')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  currentView === 'exam_blueprint'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <Layers className="w-3.5 h-3.5" /> Kisi-Kisi Soal (Matrix)
              </button>
              <button
                onClick={() => setCurrentView('exam_analysis')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  currentView === 'exam_analysis'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <Award className="w-3.5 h-3.5" /> Analisis Hasil Ujian
              </button>
              <button
                onClick={() => setCurrentView('classical_report')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  currentView === 'classical_report'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <FileText className="w-3.5 h-3.5" /> Rekap Nilai Klasikal
              </button>
            </div>
          )}
        </div>

        {/* PRINTABLE DOCUMENT AREA */}
        <div id="printable-document" className="font-serif text-slate-900 space-y-6 text-sm">
          {/* OFFICIAL KOP SURAT */}
          <div className="pb-3 border-b-2 border-slate-900">
            <div className="flex items-center justify-between gap-4 pb-2">
              <div className="w-20 h-20 shrink-0 flex items-center justify-center">
                {letterhead.logoPemkotUrl ? (
                  <img
                    src={letterhead.logoPemkotUrl}
                    alt="Logo Pemkot"
                    className="max-h-full max-w-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-16 h-16 bg-slate-200 rounded" />
                )}
              </div>

              <div className="text-center flex-1 space-y-0.5 font-sans">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-800 whitespace-pre-line leading-tight">
                  {letterhead.governmentName}
                </p>
                {letterhead.subGovernmentName && (
                  <p className="text-[11px] font-semibold uppercase text-slate-700">
                    {letterhead.subGovernmentName}
                  </p>
                )}
                <h1 className="text-base sm:text-lg font-black uppercase tracking-wider text-slate-900">
                  {letterhead.schoolName}
                </h1>
                <p className="text-[11px] text-slate-600">
                  NPSN: {letterhead.npsn} &bull; {letterhead.address} &bull; Kode Pos: {letterhead.postalCode}
                </p>
                <p className="text-[10px] text-slate-500">
                  Telp: {letterhead.phone} &bull; Email: {letterhead.email} &bull; Website: {letterhead.website}
                </p>
              </div>

              <div className="w-20 h-20 shrink-0 flex items-center justify-center">
                {letterhead.logoSchoolUrl ? (
                  <img
                    src={letterhead.logoSchoolUrl}
                    alt="Logo Sekolah"
                    className="max-h-full max-w-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-16 h-16 bg-slate-200 rounded" />
                )}
              </div>
            </div>

            {/* Official Double Border */}
            <div className="mt-1">
              <div className="h-[2.5px] bg-slate-900 w-full" />
              <div className="h-[0.75px] bg-slate-900 w-full mt-[2px]" />
            </div>
          </div>

          {/* DOKUMEN 1: NASKAH SOAL UJIAN */}
          {currentView === 'exam_sheet' && exam && (
            <div className="space-y-6 font-sans">
              <div className="text-center space-y-1">
                <h2 className="text-base font-bold uppercase underline">NASKAH PENILAIAN SUMATIF CBT</h2>
                <p className="text-xs font-semibold uppercase text-slate-700">
                  MATA PELAJARAN: {exam.subject} &bull; KELAS {exam.grade} SD
                </p>
                <p className="text-xs text-slate-500">
                  Tahun Ajaran {exam.academicYear} &bull; Semester {exam.semester} &bull; Waktu: {exam.durationMinutes} Menit &bull; KKM: {exam.passingGrade}
                </p>
              </div>

              {/* Student identity box */}
              <div className="p-3 border border-slate-400 rounded-lg text-xs grid grid-cols-2 gap-2 font-sans">
                <div>Nama Siswa : .....................................................</div>
                <div>Nomor Absen / NISN : ...........................................</div>
                <div>Hari / Tanggal : ..................................................</div>
                <div>Nilai / Paraf Guru : ............................................</div>
              </div>

              {/* Instructions */}
              <div className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <p className="font-bold mb-1">Petunjuk Pengerjaan:</p>
                <p className="whitespace-pre-line leading-relaxed">{exam.instructions}</p>
              </div>

              {/* Questions with Image support */}
              <div className="space-y-6 pt-2 font-sans">
                {exam.questions?.map((q) => (
                  <div key={q.id} className="text-xs space-y-2 border-b border-slate-100 pb-4">
                    <div className="flex items-start gap-2.5">
                      <span className="font-bold text-slate-900 text-sm">{q.number}.</span>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-slate-900 text-xs sm:text-sm leading-relaxed">
                            {q.prompt}
                          </p>
                          <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-2">
                            [{q.bloomTaxonomy} &bull; {q.maxScore} Poin]
                          </span>
                        </div>

                        {/* Question Image if present */}
                        {q.imageUrl && (
                          <div className="my-2 p-1.5 bg-slate-50 rounded-xl border border-slate-200 inline-block max-w-sm">
                            <img
                              src={q.imageUrl}
                              alt={`Ilustrasi Soal Nomor ${q.number}`}
                              className="max-h-48 rounded-lg object-contain"
                              referrerPolicy="no-referrer"
                            />
                            <p className="text-[9px] text-slate-400 italic mt-1 text-center">Gambar Soal Nomor {q.number}</p>
                          </div>
                        )}

                        {/* Options for MCQ */}
                        {q.type === 'mcq' && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 pl-1">
                            {q.options?.map((opt, i) => (
                              <div key={i} className="text-slate-800 text-xs">
                                {opt}
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Short Answer Line */}
                        {q.type === 'short_answer' && (
                          <div className="pt-2">
                            <p className="text-slate-500 italic font-mono">
                              Jawaban: ....................................................................................................................
                            </p>
                          </div>
                        )}

                        {/* Essay Box */}
                        {q.type === 'essay' && (
                          <div className="pt-2 h-24 border border-dashed border-slate-300 rounded-lg p-2.5 text-slate-400 italic">
                            Lembar uraian / penjelasan siswa:
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Signatures */}
              <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs font-sans">
                <div>
                  <p>Mengetahui,</p>
                  <p className="font-semibold">{letterhead.headmasterTitle}</p>
                  <div className="h-16" />
                  <p className="font-bold underline">{letterhead.headmasterName}</p>
                  <p>NIP. {letterhead.headmasterNip}</p>
                </div>
                <div>
                  <p>Semarang, {new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}</p>
                  <p className="font-semibold">Guru Pengampu Kelas</p>
                  <div className="h-16" />
                  <p className="font-bold underline">{letterhead.teacherName}</p>
                  <p>NIP. {letterhead.teacherNip}</p>
                </div>
              </div>
            </div>
          )}

          {/* DOKUMEN 2: KISI-KISI SOAL (BLUEPRINT KURIKULUM MERDEKA) */}
          {currentView === 'exam_blueprint' && exam && (
            <div className="space-y-6 font-sans">
              <div className="text-center space-y-1">
                <h2 className="text-base font-bold uppercase underline">
                  KISI-KISI PENULISAN SOAL EVALUASI SUMATIF CBT
                </h2>
                <p className="text-xs font-semibold text-slate-700 uppercase">
                  KURIKULUM MERDEKA &bull; TINGKAT SEKOLAH DASAR
                </p>
                <p className="text-xs text-slate-500">
                  Mata Pelajaran: {exam.subject} &bull; Kelas: {exam.grade} &bull; Semester: {exam.semester} &bull; Tahun Ajaran: {exam.academicYear}
                </p>
              </div>

              {/* Meta Info Grid */}
              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
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
                  <tr className="bg-slate-100 border-b border-slate-400 font-bold text-slate-800">
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
                    const typeLabel = q.type === 'mcq' ? 'PG' : q.type === 'short_answer' ? 'Isian Singkat' : 'Uraian';
                    const cpPreview = exam.supportingDocName
                      ? `Memahami capaian terkait ${exam.subject}`
                      : `Menguasai kompetensi dasar materi ${exam.subject} Kelas ${exam.grade}`;
                    const indicator = q.prompt.length > 60 ? q.prompt.slice(0, 60) + '...' : q.prompt;

                    return (
                      <tr key={q.id || idx} className="hover:bg-slate-50">
                        <td className="p-2 border border-slate-400 text-center font-bold">{idx + 1}</td>
                        <td className="p-2 border border-slate-400">{cpPreview}</td>
                        <td className="p-2 border border-slate-400 font-medium">{exam.subject}</td>
                        <td className="p-2 border border-slate-400">{indicator}</td>
                        <td className="p-2 border border-slate-400 text-center font-bold">{q.bloomTaxonomy}</td>
                        <td className="p-2 border border-slate-400 text-center">{typeLabel}</td>
                        <td className="p-2 border border-slate-400 text-center font-bold">{q.number}</td>
                        <td className="p-2 border border-slate-400 text-center font-mono">{q.maxScore}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Rubric and Answer Key Section */}
              <div className="pt-4 space-y-2">
                <h4 className="font-bold text-xs uppercase underline">Kunci Jawaban & Panduan Penskoran Soal:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {exam.questions?.map((q) => (
                    <div key={q.id} className="p-2 bg-slate-50 rounded border border-slate-200">
                      <span className="font-bold">No. {q.number} ({q.type === 'mcq' ? 'PG' : q.type === 'short_answer' ? 'Isian' : 'Uraian'}):</span>
                      <p className="text-slate-800 mt-0.5">
                        Kunci: <strong>{q.correctAnswer || '-'}</strong>
                      </p>
                      {q.keywords && q.keywords.length > 0 && (
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          Kata Kunci Penting: {q.keywords.join(', ')}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Signatures */}
              <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs font-sans">
                <div>
                  <p>Mengetahui,</p>
                  <p className="font-semibold">{letterhead.headmasterTitle}</p>
                  <div className="h-16" />
                  <p className="font-bold underline">{letterhead.headmasterName}</p>
                  <p>NIP. {letterhead.headmasterNip}</p>
                </div>
                <div>
                  <p>Semarang, {new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}</p>
                  <p className="font-semibold">Guru Pengampu Kelas</p>
                  <div className="h-16" />
                  <p className="font-bold underline">{letterhead.teacherName}</p>
                  <p>NIP. {letterhead.teacherNip}</p>
                </div>
              </div>
            </div>
          )}

          {/* DOKUMEN 3: ANALISIS HASIL UJIAN & DAYA SERAP */}
          {currentView === 'exam_analysis' && exam && (
            <div className="space-y-6 font-sans">
              <div className="text-center space-y-1">
                <h2 className="text-base font-bold uppercase underline">
                  LAPORAN ANALISIS HASIL UJIAN & KETUNTASAN BELAJAR CBT
                </h2>
                <p className="text-xs font-semibold uppercase text-slate-700">
                  EVALUASI DAYA SERAP & BUTIR SOAL TAKSONOMI BLOOM
                </p>
                <p className="text-xs text-slate-500">
                  Mata Pelajaran: {exam.subject} &bull; Kelas: {exam.grade} SD &bull; KKM: {passingGrade} &bull; Tanggal: {new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}
                </p>
              </div>

              {/* Bagian 1: Ringkasan Analisis Klasikal */}
              <div className="space-y-2">
                <h4 className="font-bold text-xs uppercase bg-slate-100 p-2 rounded border-l-4 border-indigo-600">
                  A. Ringkasan Ketuntasan Belajar Klasikal
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                  <div>
                    <span className="text-slate-500">Jumlah Siswa</span>
                    <p className="text-base font-bold text-slate-900 mt-0.5">{totalStudents} Anak</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Rata-Rata Nilai</span>
                    <p className="text-base font-bold text-indigo-700 mt-0.5">{avgScore}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Nilai Tertinggi / Terendah</span>
                    <p className="text-base font-bold text-slate-900 mt-0.5">{maxScore} / {minScore}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Ketuntasan Klasikal</span>
                    <p className="text-base font-bold text-emerald-600 mt-0.5">{passRate}% ({passedStudents.length} Tuntas)</p>
                  </div>
                </div>
              </div>

              {/* Bagian 2: Analisis Butir Soal (Item Difficulty & Discrimination) */}
              <div className="space-y-2 pt-2">
                <h4 className="font-bold text-xs uppercase bg-slate-100 p-2 rounded border-l-4 border-indigo-600">
                  B. Analisis Butir Soal (Tingkat Kesukaran & Daya Beda)
                </h4>
                <table className="w-full text-left text-xs border-collapse border border-slate-400">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-400 font-bold text-slate-800">
                      <th className="p-1.5 border border-slate-400 text-center w-8">No</th>
                      <th className="p-1.5 border border-slate-400 text-center w-14">Bentuk</th>
                      <th className="p-1.5 border border-slate-400 text-center w-14">Taksonomi</th>
                      <th className="p-1.5 border border-slate-400 text-center w-16">Jml Benar</th>
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
                        <td className="p-1.5 border border-slate-400 text-center">{item.correctCount} / {totalStudents}</td>
                        <td className="p-1.5 border border-slate-400 text-center font-mono">{item.pIndex}</td>
                        <td className="p-1.5 border border-slate-400 text-center font-medium">{item.difficulty}</td>
                        <td className="p-1.5 border border-slate-400 text-center">{item.discrimination}</td>
                        <td className="p-1.5 border border-slate-400 text-center font-bold">{item.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Bagian 3: Rekapitulasi Nilai Siswa & Tindak Lanjut */}
              <div className="space-y-2 pt-2">
                <h4 className="font-bold text-xs uppercase bg-slate-100 p-2 rounded border-l-4 border-indigo-600">
                  C. Rekapitulasi Nilai & Kategori Tindak Lanjut Siswa
                </h4>
                <table className="w-full text-left text-xs border-collapse border border-slate-400">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-400 font-bold text-slate-800">
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
                    {examSubmissions.map((s, idx) => (
                      <tr key={s.id} className="hover:bg-slate-50">
                        <td className="p-1.5 border border-slate-400 text-center">{idx + 1}</td>
                        <td className="p-1.5 border border-slate-400 font-mono">{s.studentNisn}</td>
                        <td className="p-1.5 border border-slate-400 font-medium">{s.studentName}</td>
                        <td className="p-1.5 border border-slate-400 text-center">{s.mcqScore}</td>
                        <td className="p-1.5 border border-slate-400 text-center">{s.shortScore}</td>
                        <td className="p-1.5 border border-slate-400 text-center">{s.essayScore}</td>
                        <td className="p-1.5 border border-slate-400 text-center font-bold">{s.totalScore}</td>
                        <td className="p-1.5 border border-slate-400 text-center font-bold">
                          {s.passed ? 'TUNTAS' : 'REMIDI'}
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
              <div className="space-y-2 pt-2">
                <h4 className="font-bold text-xs uppercase bg-slate-100 p-2 rounded border-l-4 border-indigo-600">
                  D. Kesimpulan Guru & Rencana Tindak Lanjut
                </h4>
                <div className="p-3 border border-slate-300 rounded-xl space-y-2 text-xs">
                  <p>
                    <strong>1. Ketuntasan Klasikal:</strong> Dari total {totalStudents} peserta didik, sebanyak {passedStudents.length} siswa ({passRate}%) telah mencapai ketuntasan belajar di atas KKM ({passingGrade}). Sebanyak {remedialStudents.length} siswa memerlukan remidial.
                  </p>
                  <p>
                    <strong>2. Tindak Lanjut Remidial:</strong> Dilaksanakan pembelajaran ulang dengan tutor sebaya serta penugasan materi esensial pada butir soal berlevel kognitif tinggi.
                  </p>
                  <p>
                    <strong>3. Tindak Lanjut Pengayaan:</strong> Diberikan penugasan berbasis proyek dan stimulus penalaran HOTS tingkat lanjut bagi siswa yang telah tuntas.
                  </p>
                </div>
              </div>

              {/* Signatures */}
              <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs font-sans">
                <div>
                  <p>Mengetahui,</p>
                  <p className="font-semibold">{letterhead.headmasterTitle}</p>
                  <div className="h-16" />
                  <p className="font-bold underline">{letterhead.headmasterName}</p>
                  <p>NIP. {letterhead.headmasterNip}</p>
                </div>
                <div>
                  <p>Semarang, {new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}</p>
                  <p className="font-semibold">Guru Pengampu Kelas</p>
                  <div className="h-16" />
                  <p className="font-bold underline">{letterhead.teacherName}</p>
                  <p>NIP. {letterhead.teacherNip}</p>
                </div>
              </div>
            </div>
          )}

          {/* DOKUMEN 4: INDIVIDUAL STUDENT REPORT */}
          {currentView === 'student_report' && submission && (
            <div className="space-y-6 font-sans">
              <div className="text-center space-y-1">
                <h2 className="text-base font-bold uppercase underline">
                  LEMBAR HASIL EVALUASI UJIAN COMPUTER BASED TEST (CBT)
                </h2>
                <p className="text-xs text-slate-600">Laporan Hasil Penilaian Individual Siswa</p>
              </div>

              {/* Student info table */}
              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <p>Nama Lengkap Siswa : <strong>{submission.studentName}</strong></p>
                  <p className="mt-1">NISN : <strong className="font-mono">{submission.studentNisn}</strong></p>
                  <p className="mt-1">Kelas : <strong>Kelas {submission.grade} SD</strong></p>
                </div>
                <div>
                  <p>Nilai Akhir Ujian : <strong className="text-base text-indigo-700">{submission.totalScore}</strong> / 100</p>
                  <p className="mt-1">Status Kelulusan : <strong>{submission.passed ? 'TUNTAS' : 'REMIDIAL'}</strong></p>
                  <p className="mt-1">Tindakan Lanjutan : <strong className="uppercase">{submission.remedialCategory}</strong></p>
                </div>
              </div>

              {/* Score Breakdown Table */}
              <table className="w-full text-left text-xs border-collapse border border-slate-400">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-400 font-bold">
                    <th className="p-2 border border-slate-400">Komponen Penilaian</th>
                    <th className="p-2 border border-slate-400 text-center">Skor Diperoleh</th>
                    <th className="p-2 border border-slate-400 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-2 border border-slate-400">Soal Pilihan Ganda (PG)</td>
                    <td className="p-2 border border-slate-400 text-center font-bold">{submission.mcqScore} Poin</td>
                    <td className="p-2 border border-slate-400 text-center text-emerald-600 font-semibold">Tercatat</td>
                  </tr>
                  <tr>
                    <td className="p-2 border border-slate-400">Soal Isian Singkat</td>
                    <td className="p-2 border border-slate-400 text-center font-bold">{submission.shortScore} Poin</td>
                    <td className="p-2 border border-slate-400 text-center text-emerald-600 font-semibold">Tercatat</td>
                  </tr>
                  <tr>
                    <td className="p-2 border border-slate-400">Soal Uraian (Analisis AI)</td>
                    <td className="p-2 border border-slate-400 text-center font-bold">{submission.essayScore} Poin</td>
                    <td className="p-2 border border-slate-400 text-center text-emerald-600 font-semibold">Tercatat</td>
                  </tr>
                  <tr className="bg-slate-50 font-bold">
                    <td className="p-2 border border-slate-400">Total Nilai Akhir Siswa</td>
                    <td className="p-2 border border-slate-400 text-center text-indigo-700 text-sm">{submission.totalScore} / 100</td>
                    <td className="p-2 border border-slate-400 text-center">
                      {submission.passed ? 'MEMENUHI KKM' : 'PERLU REMIDIAL'}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* AI Study Guidance if any */}
              {submission.personalizedRecommendation && (
                <div className="p-4 border border-slate-300 rounded-xl space-y-2 text-xs">
                  <p className="font-bold text-slate-900 underline">
                    Rekomendasi Bimbingan Belajar Siswa (Gemini AI):
                  </p>
                  <p className="italic text-slate-700">
                    "{submission.personalizedRecommendation.motivationalMessage}"
                  </p>
                  <p className="font-semibold text-slate-800">
                    Materi Penguatan: {submission.personalizedRecommendation.keyConcepts?.join(', ')}
                  </p>
                  <p className="text-slate-600">
                    Catatan untuk Orang Tua: {submission.personalizedRecommendation.parentNotes}
                  </p>
                </div>
              )}

              {/* Signatures */}
              <div className="pt-10 grid grid-cols-2 gap-8 text-center text-xs">
                <div>
                  <p>Mengetahui,</p>
                  <p className="font-semibold">{letterhead.headmasterTitle}</p>
                  <div className="h-16" />
                  <p className="font-bold underline">{letterhead.headmasterName}</p>
                  <p>NIP. {letterhead.headmasterNip}</p>
                </div>
                <div>
                  <p>Semarang, {new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}</p>
                  <p className="font-semibold">Guru Pengampu Kelas</p>
                  <div className="h-16" />
                  <p className="font-bold underline">{letterhead.teacherName}</p>
                  <p>NIP. {letterhead.teacherNip}</p>
                </div>
              </div>
            </div>
          )}

          {/* DOKUMEN 5: REKAPITULASI KLASIKAL */}
          {currentView === 'classical_report' && (
            <div className="space-y-6 font-sans">
              <div className="text-center space-y-1">
                <h2 className="text-base font-bold uppercase underline">
                  REKAPITULASI HASIL UJIAN KLASIKAL CBT KELAS
                </h2>
                <p className="text-xs text-slate-600">
                  Daftar Nilai Seluruh Siswa & Persentase Ketuntasan Belajar
                </p>
              </div>

              <table className="w-full text-left text-xs border-collapse border border-slate-400">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-400 font-bold">
                    <th className="p-2 border border-slate-400 text-center w-8">No</th>
                    <th className="p-2 border border-slate-400">NISN</th>
                    <th className="p-2 border border-slate-400">Nama Siswa</th>
                    <th className="p-2 border border-slate-400 text-center w-12">PG</th>
                    <th className="p-2 border border-slate-400 text-center w-12">Isian</th>
                    <th className="p-2 border border-slate-400 text-center w-12">Uraian</th>
                    <th className="p-2 border border-slate-400 text-center w-14">Nilai Total</th>
                    <th className="p-2 border border-slate-400 text-center w-16">Status</th>
                    <th className="p-2 border border-slate-400 text-center">Tindakan</th>
                  </tr>
                </thead>
                <tbody>
                  {examSubmissions.map((s, idx) => (
                    <tr key={s.id}>
                      <td className="p-2 border border-slate-400 text-center">{idx + 1}</td>
                      <td className="p-2 border border-slate-400 font-mono">{s.studentNisn}</td>
                      <td className="p-2 border border-slate-400 font-medium">{s.studentName}</td>
                      <td className="p-2 border border-slate-400 text-center">{s.mcqScore}</td>
                      <td className="p-2 border border-slate-400 text-center">{s.shortScore}</td>
                      <td className="p-2 border border-slate-400 text-center">{s.essayScore}</td>
                      <td className="p-2 border border-slate-400 text-center font-bold">{s.totalScore}</td>
                      <td className="p-2 border border-slate-400 text-center font-bold">
                        {s.passed ? 'TUNTAS' : 'REMIDI'}
                      </td>
                      <td className="p-2 border border-slate-400 text-center uppercase text-[10px]">
                        {s.remedialCategory}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Signatures */}
              <div className="pt-10 grid grid-cols-2 gap-8 text-center text-xs">
                <div>
                  <p>Mengetahui,</p>
                  <p className="font-semibold">{letterhead.headmasterTitle}</p>
                  <div className="h-16" />
                  <p className="font-bold underline">{letterhead.headmasterName}</p>
                  <p>NIP. {letterhead.headmasterNip}</p>
                </div>
                <div>
                  <p>Semarang, {new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}</p>
                  <p className="font-semibold">Guru Pengampu Kelas</p>
                  <div className="h-16" />
                  <p className="font-bold underline">{letterhead.teacherName}</p>
                  <p>NIP. {letterhead.teacherNip}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

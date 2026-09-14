import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
} from 'recharts';
import { Exam, Submission } from '../../types';
import {
  BarChart3,
  Users,
  Award,
  TrendingUp,
  Download,
  Printer,
  ChevronRight,
  CheckCircle2,
  XCircle,
  FileText,
  Sparkles,
  Send,
} from 'lucide-react';

interface AnalyticsDashboardProps {
  exams: Exam[];
  submissions: Submission[];
  onPrintClassicalReport?: (exam: Exam, subs: Submission[]) => void;
  onPrintIndividualReport?: (sub: Submission) => void;
  onOpenParentNotifier?: (sub: Submission) => void;
}

export const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({
  exams,
  submissions,
  onPrintClassicalReport,
  onPrintIndividualReport,
  onOpenParentNotifier,
}) => {
  const [selectedExamId, setSelectedExamId] = useState<string>(exams[0]?.id || '');
  const [activeTab, setActiveTab] = useState<'klasikal' | 'perorangan'>('klasikal');
  const [selectedStudentSubmission, setSelectedStudentSubmission] = useState<Submission | null>(
    submissions[0] || null
  );

  const currentExam = exams.find((e) => e.id === selectedExamId) || exams[0];
  const currentSubmissions = submissions.filter((s) => s.examId === selectedExamId);

  // Calculate classical statistics
  const totalStudents = currentSubmissions.length;
  const scores = currentSubmissions.map((s) => s.totalScore);
  const avgScore = totalStudents > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / totalStudents) : 0;
  const maxScore = totalStudents > 0 ? Math.max(...scores) : 0;
  const minScore = totalStudents > 0 ? Math.min(...scores) : 0;
  const passedCount = currentSubmissions.filter((s) => s.passed).length;
  const passRate = totalStudents > 0 ? Math.round((passedCount / totalStudents) * 100) : 0;

  // Score distribution for Histogram
  const distributionData = [
    { range: '0 - 40', count: currentSubmissions.filter((s) => s.totalScore <= 40).length },
    { range: '41 - 60', count: currentSubmissions.filter((s) => s.totalScore > 40 && s.totalScore <= 60).length },
    { range: '61 - 74', count: currentSubmissions.filter((s) => s.totalScore > 60 && s.totalScore < (currentExam?.passingGrade || 75)).length },
    { range: '75 - 89', count: currentSubmissions.filter((s) => s.totalScore >= (currentExam?.passingGrade || 75) && s.totalScore <= 89).length },
    { range: '90 - 100', count: currentSubmissions.filter((s) => s.totalScore >= 90).length },
  ];

  // Bloom taxonomy mastery data
  const bloomLevels = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6'];
  const bloomData = bloomLevels.map((lvl) => {
    // Find questions with this taxonomy
    const questionsOfLevel = (currentExam?.questions || []).filter((q) => q.bloomTaxonomy === lvl);
    if (questionsOfLevel.length === 0) {
      return { level: lvl, persentase: 80, fullMark: 100 };
    }

    let earned = 0;
    let possible = 0;
    currentSubmissions.forEach((sub) => {
      questionsOfLevel.forEach((q) => {
        const a = sub.answers.find((ans) => ans.questionId === q.id);
        earned += a?.scoreAwarded || 0;
        possible += q.maxScore || 1;
      });
    });

    const percent = possible > 0 ? Math.round((earned / possible) * 100) : 0;
    return { level: lvl, persentase: percent, fullMark: 100 };
  });

  // Item Difficulty Analysis (Analisis Butir Soal)
  const itemAnalysis = (currentExam?.questions || []).map((q) => {
    let correctCount = 0;
    currentSubmissions.forEach((sub) => {
      const a = sub.answers.find((ans) => ans.questionId === q.id);
      if (a && a.scoreAwarded >= q.maxScore * 0.7) correctCount++;
    });
    const pIndex = totalStudents > 0 ? correctCount / totalStudents : 0;
    let category = 'Sedang';
    if (pIndex > 0.7) category = 'Mudah';
    else if (pIndex < 0.3) category = 'Sukar';

    return {
      number: q.number,
      type: q.type === 'mcq' ? 'PG' : q.type === 'short_answer' ? 'Isian' : 'Uraian',
      taxonomy: q.bloomTaxonomy,
      pIndex: pIndex.toFixed(2),
      category,
      correctPercent: Math.round(pIndex * 100),
    };
  });

  const exportClassicalCsv = () => {
    const headers = ['No', 'NISN', 'Nama Siswa', 'Kelas', 'Nilai Total', 'PG', 'Isian', 'Uraian', 'Status', 'Pelanggaran Tab'];
    const rows = currentSubmissions.map((s, idx) => [
      idx + 1,
      s.studentNisn,
      `"${s.studentName}"`,
      s.grade,
      s.totalScore,
      s.mcqScore,
      s.shortScore,
      s.essayScore,
      s.passed ? 'TUNTAS' : 'REMIDI',
      s.violationCount,
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `rekap_nilai_${currentExam?.subject}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-indigo-600" />
            Dasbor Analisis & Laporan Hasil Ujian
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Analisis komprehensif tingkat klasikal dan rapor perorangan siswa dilengkapi evaluasi Taksonomi Bloom.
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

          <button
            id="btn-export-classical-csv"
            onClick={exportClassicalCsv}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4" /> Ekspor CSV
          </button>
        </div>
      </div>

      {/* Mode Tabs (Klasikal vs Perorangan) */}
      <div className="flex gap-2 border-b border-slate-200 pb-2">
        <button
          id="tab-analisis-klasikal"
          onClick={() => setActiveTab('klasikal')}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'klasikal'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          Analisis Klasikal (Satu Kelas)
        </button>

        <button
          id="tab-analisis-perorangan"
          onClick={() => setActiveTab('perorangan')}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'perorangan'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          Rapor Hasil Perorangan
        </button>
      </div>

      {/* KLASIKAL VIEW */}
      {activeTab === 'klasikal' && (
        <div className="space-y-6">
          {/* Classical Stat KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500">Rata-Rata Nilai</span>
              <h3 className="text-2xl font-black text-slate-900 mt-1">{avgScore}</h3>
              <span className="text-[11px] text-slate-400">KKM: {currentExam?.passingGrade || 75}</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500">Ketuntasan Belajar</span>
              <h3 className="text-2xl font-black text-emerald-600 mt-1">{passRate}%</h3>
              <span className="text-[11px] text-slate-400">{passedCount} dari {totalStudents} Siswa Tuntas</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500">Nilai Tertinggi</span>
              <h3 className="text-2xl font-black text-indigo-600 mt-1">{maxScore}</h3>
              <span className="text-[11px] text-slate-400">Skala 100</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-xs font-semibold text-slate-500">Nilai Terendah</span>
              <h3 className="text-2xl font-black text-amber-600 mt-1">{minScore}</h3>
              <span className="text-[11px] text-slate-400">Perlu Pendampingan Remidial</span>
            </div>
          </div>

          {/* Charts Row: Score Histogram & Bloom Radar */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Score Distribution */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                Distribusi Frekuensi Rentang Nilai
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={distributionData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="range" tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderRadius: '12px',
                        border: '1px solid #e2e8f0',
                        fontSize: '12px',
                      }}
                    />
                    <Bar dataKey="count" fill="#4f46e5" radius={[6, 6, 0, 0]} name="Jumlah Siswa" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Bloom Taxonomy Radar */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Award className="w-4 h-4 text-purple-600" />
                Penguasaan Taksonomi Bloom & Anderson (C1 - C6)
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart outerRadius={80} data={bloomData}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="level" tick={{ fontSize: 11, fill: '#475569' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#cbd5e1" tick={{ fontSize: 10 }} />
                    <Radar
                      name="Ketuntasan (%)"
                      dataKey="persentase"
                      stroke="#8b5cf6"
                      fill="#8b5cf6"
                      fillOpacity={0.4}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Item Difficulty Analysis Table (Analisis Butir Soal) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                Analisis Butir Soal (Tingkat Kesukaran & Daya Serap)
              </h3>
              <span className="text-xs text-slate-400">Total {itemAnalysis.length} Butir Soal</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold">
                    <th className="py-2.5 px-3">No. Soal</th>
                    <th className="py-2.5 px-3">Bentuk</th>
                    <th className="py-2.5 px-3">Taksonomi</th>
                    <th className="py-2.5 px-3">Indeks Kesukaran (P)</th>
                    <th className="py-2.5 px-3">Kategori</th>
                    <th className="py-2.5 px-3">Daya Serap</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {itemAnalysis.map((item) => (
                    <tr key={item.number} className="hover:bg-slate-50/80">
                      <td className="py-2.5 px-3 font-bold text-slate-900">Soal {item.number}</td>
                      <td className="py-2.5 px-3 font-medium">{item.type}</td>
                      <td className="py-2.5 px-3">
                        <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-bold">
                          {item.taxonomy}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono">{item.pIndex}</td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.category === 'Mudah'
                              ? 'bg-emerald-50 text-emerald-700'
                              : item.category === 'Sedang'
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {item.category}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-800">{item.correctPercent}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* PERORANGAN VIEW */}
      {activeTab === 'perorangan' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Student Submission Selector */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Pilih Siswa ({currentSubmissions.length} Data Ujian):
            </h4>
            <div className="space-y-1.5 max-h-[500px] overflow-y-auto">
              {currentSubmissions.map((sub) => {
                const isSelected = selectedStudentSubmission?.id === sub.id;
                return (
                  <button
                    key={sub.id}
                    onClick={() => setSelectedStudentSubmission(sub)}
                    className={`w-full text-left p-3 rounded-xl transition-all cursor-pointer flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div>
                      <p className="font-bold text-xs">{sub.studentName}</p>
                      <p className={`text-[10px] font-mono ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>
                        NISN: {sub.studentNisn}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-sm">{sub.totalScore}</span>
                      <p className={`text-[9px] font-bold uppercase ${isSelected ? 'text-indigo-100' : sub.passed ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {sub.passed ? 'Tuntas' : 'Remidi'}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Detailed Individual Student Report Card */}
          <div className="lg:col-span-2 space-y-6">
            {selectedStudentSubmission ? (
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
                {/* Header & Print / WA Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-lg font-black text-slate-900">
                      {selectedStudentSubmission.studentName}
                    </h3>
                    <p className="text-xs text-slate-500">
                      NISN: {selectedStudentSubmission.studentNisn} &bull; Kelas {selectedStudentSubmission.grade} SD
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {onPrintIndividualReport && (
                      <button
                        onClick={() => onPrintIndividualReport(selectedStudentSubmission)}
                        className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-200 transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" /> Cetak Rapor + Kop
                      </button>
                    )}

                    {onOpenParentNotifier && (
                      <button
                        onClick={() => onOpenParentNotifier(selectedStudentSubmission)}
                        className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-200 transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" /> Kirim Nilai ke Orang Tua
                      </button>
                    )}
                  </div>
                </div>

                {/* Score Breakdown Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center">
                  <div>
                    <span className="text-[11px] text-slate-500">Nilai Akhir</span>
                    <h4 className="text-2xl font-black text-indigo-600">
                      {selectedStudentSubmission.totalScore}
                    </h4>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500">Pilihan Ganda</span>
                    <h4 className="text-lg font-bold text-slate-800">
                      {selectedStudentSubmission.mcqScore} Poin
                    </h4>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500">Isian Singkat</span>
                    <h4 className="text-lg font-bold text-slate-800">
                      {selectedStudentSubmission.shortScore} Poin
                    </h4>
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-500">Uraian / Essay</span>
                    <h4 className="text-lg font-bold text-slate-800">
                      {selectedStudentSubmission.essayScore} Poin
                    </h4>
                  </div>
                </div>

                {/* Individual Answer Evaluation List */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Rincian Jawaban per Butir Soal:
                  </h4>

                  {selectedStudentSubmission.answers.map((ans) => {
                    const qObj = currentExam?.questions?.find((q) => q.id === ans.questionId);
                    return (
                      <div
                        key={ans.questionId}
                        className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900">
                            Soal No. {ans.questionNumber} ({ans.type === 'mcq' ? 'PG' : ans.type === 'short_answer' ? 'Isian' : 'Uraian'})
                          </span>
                          <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                            Skor: {ans.scoreAwarded} / {ans.maxScore}
                          </span>
                        </div>

                        {qObj && <p className="text-slate-600 italic">{qObj.prompt}</p>}

                        <div className="bg-slate-50 p-2.5 rounded-xl space-y-1">
                          <p>
                            <strong>Jawaban Siswa:</strong>{' '}
                            <span className="text-slate-800">{ans.answerText || '(Kosong)'}</span>
                          </p>
                          {qObj?.correctAnswer && (
                            <p className="text-emerald-700">
                              <strong>Kunci/Panduan Guru:</strong> {qObj.correctAnswer}
                            </p>
                          )}
                        </div>

                        {/* Keywords & AI feedback */}
                        {ans.detectedKeywords && ans.detectedKeywords.length > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap pt-1">
                            <span className="text-[10px] text-slate-400">Kata Kunci Terdeteksi:</span>
                            {ans.detectedKeywords.map((kw, i) => (
                              <span key={i} className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">
                                ✓ {kw}
                              </span>
                            ))}
                          </div>
                        )}

                        {ans.aiFeedback && (
                          <div className="p-2.5 bg-purple-50 border border-purple-200 rounded-xl text-purple-900 flex items-start gap-2">
                            <Sparkles className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                            <div>
                              <p className="font-bold text-[11px]">Evaluasi Cerdas Gemini AI:</p>
                              <p className="text-slate-700">{ans.aiFeedback}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-400">
                Pilih salah satu siswa di sebelah kiri untuk melihat rapor lengkap.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

import React from 'react';
import { Exam, Letterhead, Submission } from '../../types';
import { Printer, X } from 'lucide-react';

interface PrintModalProps {
  type: 'exam_sheet' | 'student_report' | 'classical_report';
  letterhead: Letterhead;
  exam?: Exam;
  submission?: Submission;
  submissions?: Submission[];
  onClose: () => void;
}

export const PrintModal: React.FC<PrintModalProps> = ({
  type,
  letterhead,
  exam,
  submission,
  submissions = [],
  onClose,
}) => {
  const handleTriggerPrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-50 overflow-y-auto print:p-0 print:bg-white print:fixed-none">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-10 shadow-2xl border border-slate-200 my-4 print:border-0 print:shadow-none print:m-0 print:p-0">
        {/* Controls - Hidden during print */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6 print:hidden">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Printer className="w-5 h-5" />
            </span>
            <h3 className="text-base font-bold text-slate-900">
              {type === 'exam_sheet'
                ? 'Cetak Naskah Soal Ujian'
                : type === 'student_report'
                ? 'Cetak Lembar Rapor Hasil Siswa'
                : 'Cetak Rekapitulasi Nilai Klasikal'}
            </h3>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleTriggerPrint}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4" /> Cetak / Unduh PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE DOCUMENT AREA */}
        <div id="printable-document" className="font-serif text-slate-900 space-y-6">
          {/* OFFICIAL KOP SURAT */}
          <div className="pb-3 border-b-2 border-slate-900">
            <div className="flex items-center justify-between gap-4 pb-2">
              <div className="w-20 h-20 shrink-0 flex items-center justify-center">
                {letterhead.logoPemkotUrl ? (
                  <img src={letterhead.logoPemkotUrl} alt="Logo Pemkot" className="max-h-full max-w-full object-contain" />
                ) : (
                  <div className="w-16 h-16 bg-slate-200" />
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
                  <img src={letterhead.logoSchoolUrl} alt="Logo Sekolah" className="max-h-full max-w-full object-contain" />
                ) : (
                  <div className="w-16 h-16 bg-slate-200" />
                )}
              </div>
            </div>

            {/* Official Double Border */}
            <div className="mt-1">
              <div className="h-[2.5px] bg-slate-900 w-full" />
              <div className="h-[0.75px] bg-slate-900 w-full mt-[2px]" />
            </div>
          </div>

          {/* DOCUMENT BODY TYPE 1: EXAM SHEET */}
          {type === 'exam_sheet' && exam && (
            <div className="space-y-6 font-sans">
              <div className="text-center space-y-1">
                <h2 className="text-base font-bold uppercase underline">NASKAH PENILAIAN SUMATIF CBT</h2>
                <p className="text-xs font-semibold uppercase text-slate-700">
                  MATA PELAJARAN: {exam.subject} &bull; KELAS {exam.grade} SD
                </p>
                <p className="text-xs text-slate-500">
                  Tahun Ajaran {exam.academicYear} &bull; Semester {exam.semester} &bull; Waktu: {exam.durationMinutes} Menit
                </p>
              </div>

              {/* Student identity box */}
              <div className="p-3 border border-slate-400 rounded-lg text-xs grid grid-cols-2 gap-2">
                <div>Nama Siswa: .....................................................</div>
                <div>Nomor Absen / NISN: ...........................................</div>
                <div>Hari / Tanggal: ..................................................</div>
                <div>Nilai / Paraf Guru: ............................................</div>
              </div>

              {/* Instructions */}
              <div className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200">
                <p className="font-bold mb-1">Petunjuk Pengerjaan:</p>
                <p className="whitespace-pre-line leading-relaxed">{exam.instructions}</p>
              </div>

              {/* Questions */}
              <div className="space-y-6 pt-2">
                {exam.questions?.map((q) => (
                  <div key={q.id} className="text-xs space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="font-bold">{q.number}.</span>
                      <div className="flex-1 space-y-2">
                        <p className="font-medium leading-relaxed">{q.prompt}</p>

                        {q.type === 'mcq' && (
                          <div className="grid grid-cols-2 gap-2 pt-1 pl-2">
                            {q.options?.map((opt, i) => (
                              <div key={i} className="text-slate-800">
                                {opt}
                              </div>
                            ))}
                          </div>
                        )}

                        {q.type === 'short_answer' && (
                          <div className="pt-2">
                            <p className="text-slate-400 italic">Jawaban: ....................................................................................................................</p>
                          </div>
                        )}

                        {q.type === 'essay' && (
                          <div className="pt-2 h-24 border border-dashed border-slate-300 rounded-lg p-2 text-slate-400">
                            Lembar Uraian / Penjelasan:
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* DOCUMENT BODY TYPE 2: INDIVIDUAL STUDENT REPORT */}
          {type === 'student_report' && submission && (
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
                  <div className="h-20" />
                  <p className="font-bold underline">{letterhead.headmasterName}</p>
                  <p>NIP. {letterhead.headmasterNip}</p>
                </div>
                <div>
                  <p>Semarang, {new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}</p>
                  <p className="font-semibold">Guru Pengampu Kelas</p>
                  <div className="h-20" />
                  <p className="font-bold underline">{letterhead.teacherName}</p>
                  <p>NIP. {letterhead.teacherNip}</p>
                </div>
              </div>
            </div>
          )}

          {/* DOCUMENT BODY TYPE 3: CLASSICAL REPORT */}
          {type === 'classical_report' && (
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
                    <th className="p-2 border border-slate-400 text-center">No</th>
                    <th className="p-2 border border-slate-400">NISN</th>
                    <th className="p-2 border border-slate-400">Nama Siswa</th>
                    <th className="p-2 border border-slate-400 text-center">Nilai Total</th>
                    <th className="p-2 border border-slate-400 text-center">Status</th>
                    <th className="p-2 border border-slate-400 text-center">Tindakan</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((s, idx) => (
                    <tr key={s.id}>
                      <td className="p-2 border border-slate-400 text-center">{idx + 1}</td>
                      <td className="p-2 border border-slate-400 font-mono">{s.studentNisn}</td>
                      <td className="p-2 border border-slate-400 font-medium">{s.studentName}</td>
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
                  <div className="h-20" />
                  <p className="font-bold underline">{letterhead.headmasterName}</p>
                  <p>NIP. {letterhead.headmasterNip}</p>
                </div>
                <div>
                  <p>Semarang, {new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}</p>
                  <p className="font-semibold">Guru Pengampu Kelas</p>
                  <div className="h-20" />
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

import React, { useState } from 'react';
import { Letterhead, Student, Submission } from '../../types';
import { geminiService } from '../../services/geminiService';
import { MessageSquare, Send, Check, ExternalLink, X, Smartphone } from 'lucide-react';

interface ParentNotifierProps {
  submission: Submission;
  student?: Student;
  letterhead: Letterhead;
  onClose: () => void;
}

export const ParentNotifier: React.FC<ParentNotifierProps> = ({
  submission,
  student,
  letterhead,
  onClose,
}) => {
  const parentPhone = student?.parentPhone || '081234567890';
  const parentName = student?.parentName || 'Bapak/Ibu Orang Tua';

  const defaultMessage = `Yth. ${parentName}, wali dari ananda ${submission.studentName}.

Kami dari ${letterhead.schoolName} menginformasikan bahwa ananda telah menyelesaikan ujian:
📌 Nilai Ujian: ${submission.totalScore} / 100
📌 Status: ${submission.passed ? 'TUNTAS BELAJAR' : 'PERLU BIMBINGAN REMIDIAL'}
📌 Tindak Lanjut: ${submission.remedialCategory.toUpperCase()}

${
  submission.personalizedRecommendation?.parentNotes
    ? `Pesan Khusus Guru & AI:
"${submission.personalizedRecommendation.parentNotes}"`
    : ''
}

Terima kasih atas kerja sama dan pendampingan belajar di rumah.
Hormat kami,
${letterhead.teacherName}`;

  const [messageText, setMessageText] = useState(defaultMessage);
  const [phone, setPhone] = useState(parentPhone);
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

  const handleSendViaServer = async () => {
    setIsSending(true);
    try {
      await geminiService.sendParentNotification({
        parentPhone: phone,
        parentName,
        studentName: submission.studentName,
        examTitle: 'Ujian Sumatif CBT',
        score: submission.totalScore,
        passingGrade: 75,
        schoolName: letterhead.schoolName,
      });
      setSendSuccess(true);
      setTimeout(() => setSendSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      alert('Gagal mengirim notifikasi.');
    } finally {
      setIsSending(false);
    }
  };

  const handleOpenWhatsAppWeb = () => {
    const cleanPhone = phone.replace(/^0/, '62').replace(/\D/g, '');
    const encoded = encodeURIComponent(messageText);
    const waUrl = `https://wa.me/${cleanPhone}?text=${encoded}`;
    window.open(waUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Kirim Laporan Nilai ke Orang Tua
              </h3>
              <p className="text-xs text-slate-500">Notifikasi Otomatis via WhatsApp</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Student summary */}
        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1">
          <p>
            Nama Siswa: <strong>{submission.studentName}</strong> (Kelas {submission.grade} SD)
          </p>
          <p>
            Nilai Ujian: <strong className="text-indigo-600 text-sm">{submission.totalScore}</strong>{' '}
            &bull; Status:{' '}
            <strong className={submission.passed ? 'text-emerald-600' : 'text-rose-600'}>
              {submission.passed ? 'Tuntas' : 'Remidi'}
            </strong>
          </p>
        </div>

        {/* Phone input */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
            Nomor WhatsApp Wali Murid:
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-mono"
            placeholder="081234567890"
          />
        </div>

        {/* Message Editor */}
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Draf Pesan WhatsApp:</label>
          <textarea
            rows={8}
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            className="w-full text-xs p-3 rounded-xl border border-slate-300 focus:outline-emerald-500 font-sans leading-relaxed"
          />
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 flex-wrap">
          <button
            onClick={handleOpenWhatsAppWeb}
            className="px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-300 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <ExternalLink className="w-4 h-4" /> Buka di WhatsApp Web
          </button>

          <button
            onClick={handleSendViaServer}
            disabled={isSending}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {sendSuccess ? <Check className="w-4 h-4" /> : <Send className="w-4 h-4" />}
            {sendSuccess ? 'Terkirim Sukses!' : isSending ? 'Mengirim...' : 'Kirim via Server API'}
          </button>
        </div>
      </div>
    </div>
  );
};

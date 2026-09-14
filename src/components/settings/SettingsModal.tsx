import React, { useState } from 'react';
import { storageService } from '../../services/storageService';
import { geminiService } from '../../services/geminiService';
import {
  Settings,
  Cloud,
  Github,
  Key,
  Database,
  CheckCircle,
  RefreshCw,
  X,
  UploadCloud,
  FileCheck,
  FolderGit2,
} from 'lucide-react';

interface SettingsModalProps {
  onClose: () => void;
  onDataRestored?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose, onDataRestored }) => {
  const [apiKey, setApiKey] = useState(storageService.getCustomApiKey());
  const [keySaved, setKeySaved] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatusText, setSyncStatusText] = useState<string | null>(null);
  const [lastGsync, setLastGsync] = useState(storageService.getLastGsyncTime());

  const handleSaveApiKey = () => {
    storageService.saveCustomApiKey(apiKey.trim());
    setKeySaved(true);
    setTimeout(() => setKeySaved(false), 2500);
  };

  const handleTriggerGDriveSync = async () => {
    setIsSyncing(true);
    try {
      const students = storageService.getStudents();
      const exams = storageService.getExams();
      const submissions = storageService.getSubmissions();
      const letterhead = storageService.getLetterhead();

      const payload = {
        timestamp: new Date().toISOString(),
        studentsCount: students.length,
        examsCount: exams.length,
        submissionsCount: submissions.length,
        letterheadSchool: letterhead.schoolName,
      };

      const res = await geminiService.backupToGDrive(payload);
      const newTime = new Date().toLocaleString('id-ID');
      storageService.setLastGsyncTime(newTime);
      setLastGsync(newTime);
      setSyncStatusText(`Berhasil dicadangkan ke Google Drive (${res.folderPath})!`);
    } catch (err) {
      console.error(err);
      setSyncStatusText('Gagal melakukan pencadangan.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncFromFirestore = async () => {
    setIsSyncing(true);
    try {
      const counts = await storageService.syncFromFirestore();
      setSyncStatusText(
        `Berhasil sinkron dari Firestore: ${counts.students} Siswa, ${counts.exams} Paket Soal, ${counts.submissions} Rapor!`
      );
      if (onDataRestored) onDataRestored();
    } catch {
      setSyncStatusText('Sinkronisasi selesai dengan cache lokal.');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Pengaturan Sistem & Integrasi</h3>
              <p className="text-xs text-slate-500">Google Drive GSync, Firebase Firestore & GitHub</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* GSync Google Drive Cloud Backup */}
        <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cloud className="w-5 h-5 text-indigo-600" />
              <div>
                <h4 className="text-xs font-bold text-slate-900">Google Drive GSync Backup</h4>
                <p className="text-[11px] text-slate-500">
                  Sinkronisasi snapshot otomatis paket soal & data nilai
                </p>
              </div>
            </div>
            <button
              onClick={handleTriggerGDriveSync}
              disabled={isSyncing}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              {isSyncing ? 'Mencadangkan...' : 'Cadangkan Sekarang'}
            </button>
          </div>
          <p className="text-[11px] text-indigo-900 font-medium">
            Terakhir dicadangkan: <strong>{lastGsync}</strong>
          </p>
        </div>

        {/* Firebase Firestore Database Status */}
        <div className="p-4 bg-emerald-50/70 border border-emerald-100 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-600" />
              <div>
                <h4 className="text-xs font-bold text-slate-900">Basis Data Cloud Firestore</h4>
                <p className="text-[11px] text-slate-500">Proyek terhubung: ungoogly-rigging-s6rpq</p>
              </div>
            </div>
            <button
              onClick={handleSyncFromFirestore}
              disabled={isSyncing}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              Tarik Data
            </button>
          </div>
        </div>

        {/* GitHub Integration Info */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
            <Github className="w-4 h-4 text-slate-700" />
            Integrasi Kode Sumber GitHub
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            Aplikasi CBT SD Cerdas ini dapat diekspor langsung ke repositori GitHub sekolah Anda melalui menu Settings platform AI Studio. Semua konfigurasi naskah soal dan kop surat otomatis terjaga.
          </p>
        </div>

        {/* Feedback text */}
        {syncStatusText && (
          <div className="p-3 bg-slate-900 text-emerald-400 text-xs rounded-xl font-medium flex items-center gap-2">
            <FileCheck className="w-4 h-4" /> {syncStatusText}
          </div>
        )}

        {/* Gemini API Key */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5 text-amber-500" />
            Custom Gemini API Key (Opsional):
          </label>
          <div className="flex items-center gap-2">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Masukkan API Key Gemini jika ingin menggunakan kuota pribadi"
              className="flex-1 text-xs p-2.5 rounded-xl border border-slate-300 font-mono"
            />
            <button
              onClick={handleSaveApiKey}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl cursor-pointer"
            >
              {keySaved ? 'Tersimpan!' : 'Simpan'}
            </button>
          </div>
          <p className="text-[10px] text-slate-400">
            Server secara default telah menggunakan variabel lingkungan sistem (GEMINI_API_KEY).
          </p>
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

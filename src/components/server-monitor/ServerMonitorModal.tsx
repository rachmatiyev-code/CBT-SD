import React, { useEffect, useState } from 'react';
import { geminiService } from '../../services/geminiService';
import { Server, Activity, Cpu, HardDrive, RefreshCw, X, ShieldCheck } from 'lucide-react';

interface ServerMonitorModalProps {
  onClose: () => void;
}

export const ServerMonitorModal: React.FC<ServerMonitorModalProps> = ({ onClose }) => {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [pingMs, setPingMs] = useState<number | null>(null);

  const fetchStatus = async () => {
    setLoading(true);
    const start = performance.now();
    try {
      const data = await geminiService.getServerStatus();
      const end = performance.now();
      setPingMs(Math.round(end - start));
      setStatus(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const timer = setInterval(fetchStatus, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Status Backend Server Node.js / Express
              </h3>
              <p className="text-xs text-slate-500">Pemantauan Kinerja &amp; Endpoint Gemini API</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading && !status ? (
          <div className="py-12 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" /> Menghubungi server...
          </div>
        ) : status ? (
          <div className="space-y-4 text-xs">
            {/* Status pill */}
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <span className="font-bold text-slate-800 uppercase tracking-wider">
                  Server Status: {status.status}
                </span>
              </div>
              <span className="font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full font-bold">
                Latency: {pingMs} ms
              </span>
            </div>

            {/* Grid Metrics */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 bg-white border border-slate-200 rounded-2xl space-y-1">
                <span className="text-slate-400 flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 text-indigo-500" /> Uptime Server:
                </span>
                <p className="text-sm font-bold text-slate-800">{status.uptime}</p>
              </div>

              <div className="p-3.5 bg-white border border-slate-200 rounded-2xl space-y-1">
                <span className="text-slate-400 flex items-center gap-1">
                  <Cpu className="w-3.5 h-3.5 text-purple-500" /> Versi Node.js:
                </span>
                <p className="text-sm font-bold font-mono text-slate-800">{status.nodeVersion}</p>
              </div>

              <div className="p-3.5 bg-white border border-slate-200 rounded-2xl space-y-1">
                <span className="text-slate-400 flex items-center gap-1">
                  <HardDrive className="w-3.5 h-3.5 text-emerald-500" /> Memori Heap:
                </span>
                <p className="text-sm font-bold text-slate-800">{status.memory?.heapUsed}</p>
                <p className="text-[10px] text-slate-400">Total: {status.memory?.heapTotal}</p>
              </div>

              <div className="p-3.5 bg-white border border-slate-200 rounded-2xl space-y-1">
                <span className="text-slate-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-500" /> Gemini SDK:
                </span>
                <p className="text-sm font-bold text-slate-800">
                  {status.geminiApiReady ? 'Terkoneksi' : 'Siap (API Key Opsional)'}
                </p>
              </div>
            </div>

            {/* Endpoints List */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5 font-mono text-[11px]">
              <p className="font-sans font-bold text-slate-700 text-xs mb-1">Rute API Aktif:</p>
              <div className="text-slate-600 space-y-1">
                <p>• POST /api/gemini/generate-questions (Bloom C1-C6)</p>
                <p>• POST /api/gemini/score-essay (Keywords Matching)</p>
                <p>• POST /api/gemini/personalized-recommendations</p>
                <p>• POST /api/notifications/send-parent (WA Dispatcher)</p>
                <p>• POST /api/sync/gdrive-backup (GSync Snapshot)</p>
              </div>
            </div>
          </div>
        ) : null}

        <div className="flex justify-between items-center pt-2 border-t border-slate-100">
          <button
            onClick={fetchStatus}
            className="text-xs text-indigo-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Manual
          </button>
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

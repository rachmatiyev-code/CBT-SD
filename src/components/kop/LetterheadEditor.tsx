import React, { useState } from 'react';
import { Letterhead } from '../../types';
import { storageService } from '../../services/storageService';
import { Building2, Check, RefreshCw, Upload, Image, ShieldCheck, Printer } from 'lucide-react';

interface LetterheadEditorProps {
  initialLetterhead: Letterhead;
  onSaved: (updated: Letterhead) => void;
}

export const LetterheadEditor: React.FC<LetterheadEditorProps> = ({ initialLetterhead, onSaved }) => {
  const [data, setData] = useState<Letterhead>(initialLetterhead);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await storageService.saveLetterhead(data);
    onSaved(data);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleLogoUpload = (type: 'pemkot' | 'school', file: File) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        if (type === 'pemkot') {
          setData((prev) => ({ ...prev, logoPemkotUrl: ev.target!.result as string }));
        } else {
          setData((prev) => ({ ...prev, logoSchoolUrl: ev.target!.result as string }));
        }
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-emerald-600" />
            Pengaturan Kop Surat Resmi Sekolah
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Kop surat ini digunakan secara otomatis pada cetak naskah soal ujian, lembar jawaban, dan rapor penilaian siswa.
          </p>
        </div>
        <button
          id="btn-save-kop-header"
          onClick={handleSave}
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
        >
          {savedSuccess ? <Check className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
          {savedSuccess ? 'Tersimpan ke Cloud!' : 'Simpan Kop Surat'}
        </button>
      </div>

      {/* Live Preview of Kop Surat */}
      <div className="bg-white p-8 rounded-2xl border border-slate-300 shadow-sm">
        <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Printer className="w-3.5 h-3.5" /> Pratinjau Tampilan Kop Resmi (Format Standar Kemendikbud)
          </span>
          <span className="text-xs bg-emerald-50 text-emerald-700 font-medium px-2.5 py-0.5 rounded-full">
            Kertas A4 / F4 Otomatis
          </span>
        </div>

        {/* Real Kop Surat Banner */}
        <div className="p-6 bg-white border border-slate-200 rounded-xl">
          <div className="flex items-center justify-between gap-4 pb-4">
            {/* Logo Pemkot / Dinas */}
            <div className="w-20 h-20 shrink-0 flex items-center justify-center border border-dashed border-slate-200 rounded-lg p-1 bg-slate-50 overflow-hidden">
              {data.logoPemkotUrl ? (
                <img src={data.logoPemkotUrl} alt="Logo Pemkot" className="max-h-full max-w-full object-contain" />
              ) : (
                <span className="text-[10px] text-slate-400 text-center font-medium">Logo Pemkot/Dinas</span>
              )}
            </div>

            {/* Texts */}
            <div className="text-center flex-1 space-y-0.5">
              <p className="text-sm font-bold uppercase tracking-wide text-slate-800 leading-tight whitespace-pre-line">
                {data.governmentName || 'PEMERINTAH KABUPATEN / KOTA\nDINAS PENDIDIKAN DAN KEBUDAYAAN'}
              </p>
              {data.subGovernmentName && (
                <p className="text-xs font-semibold text-slate-700 tracking-wider uppercase">
                  {data.subGovernmentName}
                </p>
              )}
              <h1 className="text-lg font-black uppercase text-slate-900 tracking-wider">
                {data.schoolName || 'SD NEGERI CONTOH 01'}
              </h1>
              <p className="text-xs text-slate-600">
                NPSN: {data.npsn || '12345678'} &bull; {data.address || 'Alamat Lengkap Sekolah'} &bull; Kode Pos: {data.postalCode || '12345'}
              </p>
              <p className="text-[11px] text-slate-500">
                Telp: {data.phone || '(021) 123456'} &bull; Email: {data.email || 'sekolah@sch.id'} &bull; Web: {data.website || 'www.sekolah.sch.id'}
              </p>
            </div>

            {/* Logo Sekolah / Tut Wuri Handayani */}
            <div className="w-20 h-20 shrink-0 flex items-center justify-center border border-dashed border-slate-200 rounded-lg p-1 bg-slate-50 overflow-hidden">
              {data.logoSchoolUrl ? (
                <img src={data.logoSchoolUrl} alt="Logo Sekolah" className="max-h-full max-w-full object-contain" />
              ) : (
                <span className="text-[10px] text-slate-400 text-center font-medium">Logo Sekolah</span>
              )}
            </div>
          </div>

          {/* Official Kop Double Line */}
          <div className="mt-1">
            <div className="h-[3px] bg-slate-900 w-full" />
            <div className="h-[1px] bg-slate-900 w-full mt-[2px]" />
          </div>
        </div>
      </div>

      {/* Form Editor */}
      <form onSubmit={handleSave} className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
        <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3">
          Detail Isian Data Kop Surat
        </h3>

        {/* Logos Upload Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <label className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <Image className="w-4 h-4 text-emerald-600" />
              Logo Pemerintah Kota / Kabupaten / Dinas
            </label>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white rounded-lg border border-slate-200 p-1 flex items-center justify-center overflow-hidden shrink-0">
                {data.logoPemkotUrl ? (
                  <img src={data.logoPemkotUrl} alt="Logo Pemkot" className="max-h-full max-w-full object-contain" />
                ) : (
                  <Building2 className="w-6 h-6 text-slate-400" />
                )}
              </div>
              <div className="flex-1">
                <input
                  id="input-logo-pemkot"
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && handleLogoUpload('pemkot', e.target.files[0])}
                  className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                />
                <p className="text-[11px] text-slate-400 mt-1">PNG atau JPG latar transparan/putih disarankan.</p>
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
            <label className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <Image className="w-4 h-4 text-blue-600" />
              Logo Sekolah / Lambang Tut Wuri Handayani
            </label>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white rounded-lg border border-slate-200 p-1 flex items-center justify-center overflow-hidden shrink-0">
                {data.logoSchoolUrl ? (
                  <img src={data.logoSchoolUrl} alt="Logo Sekolah" className="max-h-full max-w-full object-contain" />
                ) : (
                  <Building2 className="w-6 h-6 text-slate-400" />
                )}
              </div>
              <div className="flex-1">
                <input
                  id="input-logo-sekolah"
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && handleLogoUpload('school', e.target.files[0])}
                  className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                />
                <p className="text-[11px] text-slate-400 mt-1">PNG atau JPG lambang sekolah atau Tut Wuri Handayani.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Text Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Instansi Induk (Pemerintah Kota / Kabupaten & Dinas Pendidikan)
            </label>
            <textarea
              id="input-gov-name"
              rows={2}
              value={data.governmentName}
              onChange={(e) => setData({ ...data, governmentName: e.target.value })}
              className="w-full text-sm p-3 rounded-xl border border-slate-300 focus:outline-emerald-500"
              placeholder="Contoh: PEMERINTAH KOTA SEMARANG&#10;DINAS PENDIDIKAN DAN KEBUDAYAAN"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Wilayah / Sub-Instansi (Kecamatan / UPTD)
            </label>
            <input
              id="input-subgov-name"
              type="text"
              value={data.subGovernmentName}
              onChange={(e) => setData({ ...data, subGovernmentName: e.target.value })}
              className="w-full text-sm p-3 rounded-xl border border-slate-300 focus:outline-emerald-500"
              placeholder="Contoh: KOORDINATOR WILAYAH KECAMATAN BANYUMANIK"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Nama Resmi Sekolah Dasar (SD)
            </label>
            <input
              id="input-school-name"
              type="text"
              value={data.schoolName}
              onChange={(e) => setData({ ...data, schoolName: e.target.value })}
              className="w-full text-sm p-3 rounded-xl border border-slate-300 focus:outline-emerald-500 font-bold"
              placeholder="Contoh: SD NEGERI PEDALANGAN 02"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Nomor Pokok Sekolah Nasional (NPSN)
            </label>
            <input
              id="input-npsn"
              type="text"
              value={data.npsn}
              onChange={(e) => setData({ ...data, npsn: e.target.value })}
              className="w-full text-sm p-3 rounded-xl border border-slate-300 focus:outline-emerald-500"
              placeholder="Contoh: 20328901"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Kode Pos
            </label>
            <input
              id="input-postal-code"
              type="text"
              value={data.postalCode}
              onChange={(e) => setData({ ...data, postalCode: e.target.value })}
              className="w-full text-sm p-3 rounded-xl border border-slate-300 focus:outline-emerald-500"
              placeholder="Contoh: 50268"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Alamat Lengkap Sekolah
            </label>
            <input
              id="input-school-address"
              type="text"
              value={data.address}
              onChange={(e) => setData({ ...data, address: e.target.value })}
              className="w-full text-sm p-3 rounded-xl border border-slate-300 focus:outline-emerald-500"
              placeholder="Contoh: Jl. Tirto Agung No. 14, Pedalangan, Kec. Banyumanik"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Nomor Telepon
            </label>
            <input
              id="input-school-phone"
              type="text"
              value={data.phone}
              onChange={(e) => setData({ ...data, phone: e.target.value })}
              className="w-full text-sm p-3 rounded-xl border border-slate-300 focus:outline-emerald-500"
              placeholder="Contoh: (024) 7471234"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Email Resmi
            </label>
            <input
              id="input-school-email"
              type="email"
              value={data.email}
              onChange={(e) => setData({ ...data, email: e.target.value })}
              className="w-full text-sm p-3 rounded-xl border border-slate-300 focus:outline-emerald-500"
              placeholder="Contoh: sdn.pedalangan02@semarangkota.go.id"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Website / Portal Sekolah
            </label>
            <input
              id="input-school-website"
              type="text"
              value={data.website}
              onChange={(e) => setData({ ...data, website: e.target.value })}
              className="w-full text-sm p-3 rounded-xl border border-slate-300 focus:outline-emerald-500"
              placeholder="Contoh: https://sdnpedalangan02.sch.id"
            />
          </div>
        </div>

        {/* Tanda Tangan Pejabat */}
        <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 pt-4">
          Data Penandatangan Dokumen & Rapor
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Nama Kepala Sekolah (Lengkap Gelar)
            </label>
            <input
              id="input-headmaster-name"
              type="text"
              value={data.headmasterName}
              onChange={(e) => setData({ ...data, headmasterName: e.target.value })}
              className="w-full text-sm p-3 rounded-xl border border-slate-300 focus:outline-emerald-500 font-semibold"
              placeholder="Contoh: Dra. Hj. Sri Wahyuni, M.Pd."
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              NIP Kepala Sekolah
            </label>
            <input
              id="input-headmaster-nip"
              type="text"
              value={data.headmasterNip}
              onChange={(e) => setData({ ...data, headmasterNip: e.target.value })}
              className="w-full text-sm p-3 rounded-xl border border-slate-300 focus:outline-emerald-500"
              placeholder="Contoh: 19710814 199603 2 004"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Nama Guru Pengampu / Pembuat Soal
            </label>
            <input
              id="input-teacher-name"
              type="text"
              value={data.teacherName}
              onChange={(e) => setData({ ...data, teacherName: e.target.value })}
              className="w-full text-sm p-3 rounded-xl border border-slate-300 focus:outline-emerald-500"
              placeholder="Contoh: Budi Santoso, S.Pd., Gr."
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              NIP Guru Pengampu
            </label>
            <input
              id="input-teacher-nip"
              type="text"
              value={data.teacherNip}
              onChange={(e) => setData({ ...data, teacherNip: e.target.value })}
              className="w-full text-sm p-3 rounded-xl border border-slate-300 focus:outline-emerald-500"
              placeholder="Contoh: 19880521 201402 1 003"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="submit"
            id="btn-save-kop-bottom"
            className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer"
          >
            {savedSuccess ? <Check className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
            {savedSuccess ? 'Berhasil Disimpan!' : 'Simpan Perubahan Kop Surat'}
          </button>
        </div>
      </form>
    </div>
  );
};

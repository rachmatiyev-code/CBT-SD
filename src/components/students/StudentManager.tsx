import React, { useState } from 'react';
import { Student } from '../../types';
import { storageService } from '../../services/storageService';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Award,
  Phone,
  User,
  Check,
  X,
  Sparkles,
  Download,
} from 'lucide-react';

interface StudentManagerProps {
  students: Student[];
  onStudentsUpdated: (updated: Student[]) => void;
  onSelectStudentForExam?: (student: Student) => void;
}

const AVATAR_OPTIONS = ['🦁', '🌸', '🚀', '⭐', '🦊', '🦋', '🐼', '🐬', '🦉', '🐯', '🌟', '🤖'];

export const StudentManager: React.FC<StudentManagerProps> = ({
  students,
  onStudentsUpdated,
  onSelectStudentForExam,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrade, setSelectedGrade] = useState<number | 'all'>('all');
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState<Partial<Student>>({
    nisn: '',
    name: '',
    grade: 5,
    gender: 'L',
    parentName: '',
    parentPhone: '',
    avatar: '🦁',
  });

  const filteredStudents = students.filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.nisn.includes(searchQuery) ||
      s.parentName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchGrade = selectedGrade === 'all' || s.grade === selectedGrade;
    return matchSearch && matchGrade;
  });

  const handleStartAdd = () => {
    setIsAddingNew(true);
    setEditingStudent(null);
    setFormData({
      id: 'std-' + Date.now(),
      nisn: String(Math.floor(1000000000 + Math.random() * 9000000000)),
      name: '',
      grade: typeof selectedGrade === 'number' ? selectedGrade : 5,
      gender: 'L',
      parentName: '',
      parentPhone: '08',
      avatar: AVATAR_OPTIONS[Math.floor(Math.random() * AVATAR_OPTIONS.length)],
      totalXp: 100,
      level: 1,
      streak: 1,
      badges: ['Murid Baru'],
    });
  };

  const handleStartEdit = (student: Student) => {
    setEditingStudent(student);
    setIsAddingNew(false);
    setFormData({ ...student });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim() || !formData.nisn?.trim()) return;

    const studentToSave: Student = {
      id: formData.id || (editingStudent ? editingStudent.id : 'std-' + Date.now()),
      nisn: formData.nisn.trim(),
      name: formData.name.trim(),
      grade: Number(formData.grade) || 1,
      gender: (formData.gender as 'L' | 'P') || 'L',
      parentName: formData.parentName?.trim() || 'Wali Murid',
      parentPhone: formData.parentPhone?.trim() || '081234567890',
      avatar: formData.avatar || '⭐',
      totalXp: formData.totalXp ?? (editingStudent?.totalXp || 100),
      level: formData.level ?? (editingStudent?.level || 1),
      streak: formData.streak ?? (editingStudent?.streak || 1),
      badges: formData.badges || (editingStudent?.badges || ['Siswa Cerdas']),
    };

    await storageService.saveStudent(studentToSave);
    const refreshed = storageService.getStudents();
    onStudentsUpdated(refreshed);

    setIsAddingNew(false);
    setEditingStudent(null);
  };

  const handleDelete = async (id: string) => {
    await storageService.deleteStudent(id);
    const refreshed = storageService.getStudents();
    onStudentsUpdated(refreshed);
    setDeleteConfirmId(null);
  };

  const handleExportCsv = () => {
    const headers = ['NISN', 'Nama Siswa', 'Kelas', 'Jenis Kelamin', 'Nama Orang Tua', 'No WhatsApp Orang Tua', 'Level', 'Total XP'];
    const rows = filteredStudents.map((s) => [
      s.nisn,
      `"${s.name}"`,
      s.grade,
      s.gender,
      `"${s.parentName}"`,
      `"${s.parentPhone}"`,
      s.level,
      s.totalXp,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `data_siswa_sd_kelas_${selectedGrade}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-600" />
            Manajemen Data Siswa (SD Kelas 1 - 6)
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Kelola data pokok siswa, NISN, kontak wali murid untuk notifikasi otomatis, dan progres gamifikasi.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            id="btn-export-students-csv"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-xl transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            Ekspor CSV
          </button>
          <button
            id="btn-add-student"
            onClick={handleStartAdd}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            Tambah Siswa Baru
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center gap-4">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            id="input-search-student"
            type="text"
            placeholder="Cari berdasarkan nama, NISN, atau orang tua..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 focus:outline-indigo-500"
          />
        </div>

        {/* Grade Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider pl-1 pr-2 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Kelas:
          </span>
          <button
            onClick={() => setSelectedGrade('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
              selectedGrade === 'all'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semua
          </button>
          {[1, 2, 3, 4, 5, 6].map((g) => (
            <button
              key={g}
              id={`filter-grade-${g}`}
              onClick={() => setSelectedGrade(g)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                selectedGrade === g
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Kelas {g}
            </button>
          ))}
        </div>
      </div>

      {/* Student List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStudents.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-dashed border-slate-300">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 font-medium">Tidak ada data siswa ditemukan</p>
            <p className="text-xs text-slate-400 mt-1">Coba ubah kata kunci pencarian atau tambah siswa baru.</p>
          </div>
        ) : (
          filteredStudents.map((s) => (
            <div
              key={s.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-indigo-300 transition-all shadow-xs flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-2xl shadow-inner">
                      {s.avatar}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 leading-snug group-hover:text-indigo-600 transition-colors">
                        {s.name}
                      </h4>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">NISN: {s.nisn}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg shrink-0">
                    Kelas {s.grade}
                  </span>
                </div>

                {/* Info tags */}
                <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <User className="w-3.5 h-3.5" /> Wali:
                    </span>
                    <span className="font-medium text-slate-800">{s.parentName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <Phone className="w-3.5 h-3.5 text-emerald-600" /> No WA:
                    </span>
                    <span className="font-mono text-emerald-700 font-medium">{s.parentPhone}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="flex items-center gap-1.5 text-slate-500">
                      <Award className="w-3.5 h-3.5 text-amber-500" /> Gamifikasi:
                    </span>
                    <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                      Level {s.level} &bull; {s.totalXp} XP
                    </span>
                  </div>
                </div>

                {/* Badges */}
                {s.badges && s.badges.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {s.badges.slice(0, 2).map((b, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] bg-slate-100 text-slate-600 font-medium px-2 py-0.5 rounded-full"
                      >
                        🏅 {b}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                {onSelectStudentForExam && (
                  <button
                    onClick={() => onSelectStudentForExam(s)}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                  >
                    Mulai Ujian Sebagai Siswa Ini
                  </button>
                )}
                <div className="flex items-center gap-1 ml-auto">
                  <button
                    onClick={() => handleStartEdit(s)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    title="Edit Data Siswa"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(s.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    title="Hapus Siswa"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900">Hapus Data Siswa?</h3>
            <p className="text-sm text-slate-600 mt-2">
              Data siswa ini akan dihapus dari sistem dan sinkronisasi basis data cloud.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                id="btn-confirm-delete-student"
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl cursor-pointer"
              >
                Hapus Permanen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Student Modal */}
      {(isAddingNew || editingStudent) && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                {isAddingNew ? 'Tambah Data Siswa Baru' : 'Edit Data Siswa'}
              </h3>
              <button
                onClick={() => {
                  setIsAddingNew(false);
                  setEditingStudent(null);
                }}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-4">
              {/* Avatar Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Pilih Avatar Karakter Belajar
                </label>
                <div className="flex flex-wrap gap-2">
                  {AVATAR_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setFormData({ ...formData, avatar: emoji })}
                      className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all cursor-pointer ${
                        formData.avatar === emoji
                          ? 'bg-indigo-600 text-white scale-110 shadow-md ring-2 ring-indigo-300'
                          : 'bg-slate-100 hover:bg-slate-200'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* NISN & Grade */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    NISN (Nomor Induk)
                  </label>
                  <input
                    id="input-form-nisn"
                    type="text"
                    required
                    maxLength={20}
                    value={formData.nisn || ''}
                    onChange={(e) => setFormData({ ...formData, nisn: e.target.value })}
                    className="w-full text-sm p-2.5 rounded-xl border border-slate-300 focus:outline-indigo-500 font-mono"
                    placeholder="Contoh: 0123849101"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Tingkat Kelas SD
                  </label>
                  <select
                    id="select-form-grade"
                    value={formData.grade || 5}
                    onChange={(e) => setFormData({ ...formData, grade: Number(e.target.value) })}
                    className="w-full text-sm p-2.5 rounded-xl border border-slate-300 focus:outline-indigo-500 font-medium"
                  >
                    {[1, 2, 3, 4, 5, 6].map((g) => (
                      <option key={g} value={g}>
                        Kelas {g} SD
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Nama Lengkap Siswa
                </label>
                <input
                  id="input-form-name"
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full text-sm p-2.5 rounded-xl border border-slate-300 focus:outline-indigo-500 font-semibold"
                  placeholder="Contoh: Ahmad Faiz Pratama"
                />
              </div>

              {/* Gender */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Jenis Kelamin
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      value="L"
                      checked={formData.gender === 'L'}
                      onChange={() => setFormData({ ...formData, gender: 'L' })}
                    />
                    Laki-laki
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="gender"
                      value="P"
                      checked={formData.gender === 'P'}
                      onChange={() => setFormData({ ...formData, gender: 'P' })}
                    />
                    Perempuan
                  </label>
                </div>
              </div>

              {/* Parent Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Nama Orang Tua / Wali
                  </label>
                  <input
                    id="input-form-parent-name"
                    type="text"
                    required
                    value={formData.parentName || ''}
                    onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                    className="w-full text-sm p-2.5 rounded-xl border border-slate-300 focus:outline-indigo-500"
                    placeholder="Contoh: Hendra Pratama"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                    No. WhatsApp Orang Tua
                  </label>
                  <input
                    id="input-form-parent-phone"
                    type="tel"
                    required
                    value={formData.parentPhone || ''}
                    onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                    className="w-full text-sm p-2.5 rounded-xl border border-slate-300 focus:outline-indigo-500 font-mono"
                    placeholder="081234567890"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingNew(false);
                    setEditingStudent(null);
                  }}
                  className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Batal
                </button>
                <button
                  id="btn-save-student-submit"
                  type="submit"
                  className="px-6 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  Simpan Siswa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

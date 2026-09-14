import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase/config';
import { Exam, Letterhead, LiveStudentSession, Student, Submission } from '../types';
import { INITIAL_EXAMS, INITIAL_LETTERHEAD, INITIAL_STUDENTS, INITIAL_SUBMISSIONS } from '../data/initialData';

const STORAGE_KEYS = {
  STUDENTS: 'cbt_sd_students',
  EXAMS: 'cbt_sd_exams',
  SUBMISSIONS: 'cbt_sd_submissions',
  LETTERHEAD: 'cbt_sd_letterhead',
  LIVE_SESSIONS: 'cbt_sd_live_sessions',
  CUSTOM_API_KEY: 'cbt_sd_gemini_key',
  GSYNC_LAST: 'cbt_sd_gsync_last',
};

export const storageService = {
  // --- Students CRUD ---
  getStudents(): Student[] {
    const raw = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(INITIAL_STUDENTS));
      return INITIAL_STUDENTS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_STUDENTS;
    }
  },

  async saveStudent(student: Student): Promise<void> {
    const current = this.getStudents();
    const index = current.findIndex((s) => s.id === student.id);
    let updated: Student[];
    if (index >= 0) {
      updated = [...current];
      updated[index] = student;
    } else {
      updated = [student, ...current];
    }
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(updated));

    // Async sync to Firestore
    try {
      await setDoc(doc(db, 'students', student.id), student);
    } catch (err) {
      console.warn('Firestore sync student fallback:', err);
    }
  },

  async deleteStudent(studentId: string): Promise<void> {
    const current = this.getStudents().filter((s) => s.id !== studentId);
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(current));

    try {
      await deleteDoc(doc(db, 'students', studentId));
    } catch (err) {
      console.warn('Firestore delete student fallback:', err);
    }
  },

  // --- Exams CRUD ---
  getExams(): Exam[] {
    const raw = localStorage.getItem(STORAGE_KEYS.EXAMS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.EXAMS, JSON.stringify(INITIAL_EXAMS));
      return INITIAL_EXAMS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_EXAMS;
    }
  },

  async saveExam(exam: Exam): Promise<void> {
    const current = this.getExams();
    const idx = current.findIndex((e) => e.id === exam.id);
    let updated: Exam[];
    if (idx >= 0) {
      updated = [...current];
      updated[idx] = exam;
    } else {
      updated = [exam, ...current];
    }
    localStorage.setItem(STORAGE_KEYS.EXAMS, JSON.stringify(updated));

    try {
      await setDoc(doc(db, 'exams', exam.id), exam);
    } catch (err) {
      console.warn('Firestore sync exam fallback:', err);
    }
  },

  async deleteExam(examId: string): Promise<void> {
    const current = this.getExams().filter((e) => e.id !== examId);
    localStorage.setItem(STORAGE_KEYS.EXAMS, JSON.stringify(current));

    try {
      await deleteDoc(doc(db, 'exams', examId));
    } catch (err) {
      console.warn('Firestore delete exam fallback:', err);
    }
  },

  // --- Submissions ---
  getSubmissions(): Submission[] {
    const raw = localStorage.getItem(STORAGE_KEYS.SUBMISSIONS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(INITIAL_SUBMISSIONS));
      return INITIAL_SUBMISSIONS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_SUBMISSIONS;
    }
  },

  async saveSubmission(submission: Submission): Promise<void> {
    const current = this.getSubmissions();
    const idx = current.findIndex((s) => s.id === submission.id);
    let updated: Submission[];
    if (idx >= 0) {
      updated = [...current];
      updated[idx] = submission;
    } else {
      updated = [submission, ...current];
    }
    localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(updated));

    try {
      await setDoc(doc(db, 'submissions', submission.id), submission);
    } catch (err) {
      console.warn('Firestore sync submission fallback:', err);
    }
  },

  // --- Letterhead (Kop Surat) ---
  getLetterhead(): Letterhead {
    const raw = localStorage.getItem(STORAGE_KEYS.LETTERHEAD);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.LETTERHEAD, JSON.stringify(INITIAL_LETTERHEAD));
      return INITIAL_LETTERHEAD;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_LETTERHEAD;
    }
  },

  async saveLetterhead(letterhead: Letterhead): Promise<void> {
    localStorage.setItem(STORAGE_KEYS.LETTERHEAD, JSON.stringify(letterhead));
    try {
      await setDoc(doc(db, 'letterheads', letterhead.id || 'kop-utama'), letterhead);
    } catch (err) {
      console.warn('Firestore sync letterhead fallback:', err);
    }
  },

  // --- Live Sessions (2-Way Communication) ---
  getLiveSessions(): LiveStudentSession[] {
    const raw = localStorage.getItem(STORAGE_KEYS.LIVE_SESSIONS);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  async updateLiveSession(session: LiveStudentSession): Promise<void> {
    const sessions = this.getLiveSessions();
    const idx = sessions.findIndex((s) => s.studentId === session.studentId && s.examId === session.examId);
    let updated: LiveStudentSession[];
    if (idx >= 0) {
      updated = [...sessions];
      updated[idx] = session;
    } else {
      updated = [...sessions, session];
    }
    localStorage.setItem(STORAGE_KEYS.LIVE_SESSIONS, JSON.stringify(updated));

    // Cross-tab custom event dispatch for instant real-time in-browser 2-way sync
    window.dispatchEvent(new CustomEvent('cbt-live-session-update', { detail: session }));

    try {
      await setDoc(doc(db, 'liveSessions', `${session.examId}_${session.studentId}`), session);
    } catch (err) {
      // offline silent fallback
    }
  },

  async clearLiveSession(examId: string, studentId: string): Promise<void> {
    const sessions = this.getLiveSessions().filter((s) => !(s.examId === examId && s.studentId === studentId));
    localStorage.setItem(STORAGE_KEYS.LIVE_SESSIONS, JSON.stringify(sessions));
    try {
      await deleteDoc(doc(db, 'liveSessions', `${examId}_${studentId}`));
    } catch (err) {
      // fallback
    }
  },

  // --- Custom API Key & GSync ---
  getCustomApiKey(): string {
    return localStorage.getItem(STORAGE_KEYS.CUSTOM_API_KEY) || '';
  },

  saveCustomApiKey(key: string): void {
    localStorage.setItem(STORAGE_KEYS.CUSTOM_API_KEY, key);
  },

  getLastGsyncTime(): string {
    return localStorage.getItem(STORAGE_KEYS.GSYNC_LAST) || new Date().toISOString();
  },

  setLastGsyncTime(timestamp: string): void {
    localStorage.setItem(STORAGE_KEYS.GSYNC_LAST, timestamp);
  },

  // Pull all from Firestore if online
  async syncFromFirestore(): Promise<{ students: number; exams: number; submissions: number }> {
    let studentCount = 0;
    let examCount = 0;
    let submissionCount = 0;

    try {
      const snapStudents = await getDocs(collection(db, 'students'));
      if (!snapStudents.empty) {
        const list: Student[] = [];
        snapStudents.forEach((d) => list.push(d.data() as Student));
        if (list.length > 0) {
          localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(list));
          studentCount = list.length;
        }
      }

      const snapExams = await getDocs(collection(db, 'exams'));
      if (!snapExams.empty) {
        const list: Exam[] = [];
        snapExams.forEach((d) => list.push(d.data() as Exam));
        if (list.length > 0) {
          localStorage.setItem(STORAGE_KEYS.EXAMS, JSON.stringify(list));
          examCount = list.length;
        }
      }

      const snapSubs = await getDocs(collection(db, 'submissions'));
      if (!snapSubs.empty) {
        const list: Submission[] = [];
        snapSubs.forEach((d) => list.push(d.data() as Submission));
        if (list.length > 0) {
          localStorage.setItem(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(list));
          submissionCount = list.length;
        }
      }
    } catch (err) {
      console.warn('Firestore initial pull skipped:', err);
    }

    return {
      students: studentCount || this.getStudents().length,
      exams: examCount || this.getExams().length,
      submissions: submissionCount || this.getSubmissions().length,
    };
  },
};

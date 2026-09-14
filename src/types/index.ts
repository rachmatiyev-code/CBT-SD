export type BloomTaxonomy = 'C1' | 'C2' | 'C3' | 'C4' | 'C5' | 'C6';

export type QuestionType = 'mcq' | 'short_answer' | 'essay';

export interface Question {
  id: string;
  number: number;
  type: QuestionType;
  bloomTaxonomy: BloomTaxonomy;
  prompt: string;
  options?: string[]; // For MCQ (A, B, C, D)
  correctAnswer: string;
  keywords?: string[]; // Essential keywords for short answer & essay
  maxScore: number;
  explanation: string;
  imageUrl?: string;
}

export interface Exam {
  id: string;
  title: string;
  subject: string;
  grade: number; // 1 - 6
  academicYear: string;
  semester: 'Ganjil' | 'Genap';
  durationMinutes: number;
  passingGrade: number; // KKM (e.g. 75)
  totalQuestions: number;
  questions: Question[];
  status: 'draft' | 'active' | 'completed';
  antiCheatEnabled: boolean;
  createdAt: string;
  instructions: string;
  supportingDocName?: string;
  supportingDocContent?: string;
}

export interface Student {
  id: string;
  nisn: string;
  name: string;
  grade: number; // 1 - 6
  gender: 'L' | 'P';
  parentName: string;
  parentPhone: string;
  avatar: string;
  totalXp: number;
  level: number;
  streak: number;
  badges: string[];
}

export interface StudentAnswer {
  questionId: string;
  questionNumber: number;
  type: QuestionType;
  answerText: string;
  isCorrect?: boolean;
  scoreAwarded: number;
  maxScore: number;
  aiFeedback?: string;
  detectedKeywords?: string[];
  missingKeywords?: string[];
}

export interface Submission {
  id: string;
  examId: string;
  studentId: string;
  studentName: string;
  studentNisn: string;
  grade: number;
  answers: StudentAnswer[];
  totalScore: number; // 0 - 100
  mcqScore: number;
  shortScore: number;
  essayScore: number;
  passed: boolean;
  violationCount: number;
  violationsLog: string[];
  submittedAt: string;
  durationSecondsUsed: number;
  remedialCategory: 'tuntas' | 'remedi' | 'pengayaan';
  personalizedRecommendation?: {
    category: string;
    studyGuideTitle: string;
    motivationalMessage: string;
    keyConcepts: string[];
    recommendedActivities: Array<{ title: string; description: string; duration: string }>;
    practiceQuestions: Array<{ question: string; hint: string }>;
    parentNotes: string;
  };
}

export interface Letterhead {
  id: string;
  governmentName: string; // e.g. PEMERINTAH KOTA SURABAYA DINAS PENDIDIKAN
  subGovernmentName: string; // e.g. KECAMATAN GUBENG
  schoolName: string; // e.g. SEKOLAH DASAR NEGERI KERTAJAYA 01
  npsn: string;
  address: string;
  postalCode: string;
  phone: string;
  email: string;
  website: string;
  logoPemkotUrl: string;
  logoSchoolUrl: string;
  headmasterName: string;
  headmasterNip: string;
  headmasterTitle: string; // e.g. Kepala Sekolah
  teacherName: string;
  teacherNip: string;
}

export interface LiveStudentSession {
  studentId: string;
  studentName: string;
  studentNisn: string;
  examId: string;
  currentQuestionNumber: number;
  answeredCount: number;
  totalQuestions: number;
  status: 'active' | 'warning' | 'submitted' | 'offline';
  violationCount: number;
  lastViolation?: string;
  timeRemainingSeconds: number;
  batteryLevel: number;
  isOnline: boolean;
  lastHeartbeat: string;
}

export interface GDriveBackupLog {
  id: string;
  folderPath: string;
  fileName: string;
  fileSize: string;
  syncedAt: string;
  itemsCount: {
    students: number;
    exams: number;
    submissions: number;
  };
  checksum: string;
}

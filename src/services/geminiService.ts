import { storageService } from './storageService';

export interface GenerateQuestionsParams {
  grade: number;
  subject: string;
  topic: string;
  count: number;
  taxonomyLevels: string[];
  questionTypes: string[];
  documentText?: string;
}

export interface ScoreEssayParams {
  questionPrompt: string;
  correctAnswerGuide: string;
  expectedKeywords: string[];
  studentAnswer: string;
  maxScore: number;
  bloomTaxonomy: string;
}

export const geminiService = {
  async generateQuestions(params: GenerateQuestionsParams) {
    const customApiKey = storageService.getCustomApiKey();
    const res = await fetch('/api/gemini/generate-questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...params, customApiKey }),
    });

    if (!res.ok) {
      throw new Error(`Gagal menghasilkan soal: ${res.statusText}`);
    }

    return await res.json();
  },

  async scoreEssay(params: ScoreEssayParams) {
    const customApiKey = storageService.getCustomApiKey();
    const res = await fetch('/api/gemini/score-essay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...params, customApiKey }),
    });

    if (!res.ok) {
      throw new Error(`Gagal menilai uraian: ${res.statusText}`);
    }

    return await res.json();
  },

  async getPersonalizedRecommendations(params: {
    studentName: string;
    grade: number;
    subject: string;
    score: number;
    passingGrade: number;
    weakTaxonomies: string[];
    missedTopics: string[];
  }) {
    const customApiKey = storageService.getCustomApiKey();
    const res = await fetch('/api/gemini/personalized-recommendations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...params, customApiKey }),
    });

    if (!res.ok) {
      throw new Error(`Gagal membuat rekomendasi: ${res.statusText}`);
    }

    return await res.json();
  },

  async getServerStatus() {
    const res = await fetch('/api/server/status');
    if (!res.ok) {
      throw new Error('Gagal mengambil status server');
    }
    return await res.json();
  },

  async backupToGDrive(backupPayload: any) {
    const res = await fetch('/api/sync/gdrive-backup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ backupPayload }),
    });
    if (!res.ok) {
      throw new Error('Gagal mencadangkan ke G-Drive');
    }
    return await res.json();
  },

  async sendParentNotification(payload: {
    parentPhone: string;
    parentName: string;
    studentName: string;
    examTitle: string;
    score: number;
    passingGrade: number;
    schoolName: string;
  }) {
    const res = await fetch('/api/notifications/send-parent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      throw new Error('Gagal mengirim notifikasi ke orang tua');
    }
    return await res.json();
  },
};

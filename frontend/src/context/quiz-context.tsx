import {
  createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode,
} from "react";
import {
  // fallback mock data for unauthenticated dev mode
  mockQuizzes, mockQuizAttempts,
  type Quiz as MockQuiz, type QuizAttempt as MockQuizAttempt,
} from "@/lib/mock-data";
import { getAccessToken } from "@/lib/api";
import { quizzesApi } from "@/lib/api";

type Quiz = any;
type QuizAttempt = any;

interface QuizContextValue {
  quizzes: Quiz[];
  attempts: QuizAttempt[];
  addQuiz: (q: Partial<Quiz>) => void;
  deleteQuiz: (id: string) => void;
  updateQuizStatus: (id: string, status: string) => void;
  submitAttempt: (quizId: number, answers: any[]) => Promise<QuizAttempt | null>;
  getAttemptsByQuiz: (quizId: string) => QuizAttempt[];
  getAttemptsByStudent: (studentId: string) => QuizAttempt[];
}

const QuizContext = createContext<QuizContextValue | null>(null);

export function QuizProvider({ children }: { children: ReactNode }) {
  // If there's an access token we attempt real API; otherwise fall back to mocks
  const hasToken = useRef(Boolean(getAccessToken()));

  const [quizzes, setQuizzes]   = useState<Quiz[]>(() => (hasToken.current ? [] : mockQuizzes));
  const [attempts, setAttempts] = useState<QuizAttempt[]>(() => (hasToken.current ? [] : mockQuizAttempts));

  // Fetch real data when token present
  useEffect(() => {
    if (!hasToken.current) return;
    let mounted = true;
    (async () => {
      try {
        const res = await quizzesApi.list();
        if (!mounted) return;
        setQuizzes(res.results ?? []);
      } catch (e) {
        // keep empty state if API fails
      }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!hasToken.current) return;
    let mounted = true;
    (async () => {
      try {
        const res = await quizzesApi.submissions.list();
        if (!mounted) return;
        setAttempts(res.results ?? []);
      } catch (e) {
        // ignore
      }
    })();
    return () => { mounted = false; };
  }, []);

  const addQuiz = useCallback((q: Partial<Quiz>) => {
    // Local-only: creation via API not implemented in UI currently
    setQuizzes((prev) => [{ ...(q as Quiz), id: `local-${Date.now()}` }, ...prev]);
  }, []);

  const deleteQuiz = useCallback((id: string) => {
    // If token present, attempt API delete (best-effort)
    if (hasToken.current && !String(id).startsWith("local-")) {
      quizzesApi.delete(Number(id)).catch(() => {});
    }
    setQuizzes((prev) => prev.filter((q) => String(q.id) !== String(id)));
  }, []);

  const updateQuizStatus = useCallback((id: string, status: string) => {
    if (hasToken.current && !String(id).startsWith("local-")) {
      quizzesApi.update(Number(id), { status }).catch(() => {});
    }
    setQuizzes((prev) => prev.map((q) => (String(q.id) === String(id) ? { ...q, status } : q)));
  }, []);

  const submitAttempt = useCallback(async (quizId: number, answers: any[]) => {
    try {
      if (!hasToken.current) {
        // local mock behavior
        const localAttempt = { id: `att-${Date.now()}`, quiz_id: String(quizId), student_id: "me", score: Math.floor(Math.random() * 100), passed: Math.random() > 0.5, submitted_at: new Date().toISOString(), total_questions: answers.length, correct_count: Math.floor(Math.random() * answers.length) };
        setAttempts((prev) => [localAttempt, ...prev]);
        return localAttempt;
      }
      const res = await quizzesApi.submit(quizId, answers);
      // API returns { success: true, submission: { ... } }
      const submission = res.submission ?? res;
      // Normalize and insert
      setAttempts((prev) => [submission, ...prev]);
      return submission as QuizAttempt;
    } catch (e) {
      return null;
    }
  }, []);

  const getAttemptsByQuiz = useCallback((quizId: string) =>
    attempts.filter((a) => String(a.quiz?.id ?? a.quiz_id ?? a.quiz) === String(quizId)), [attempts]);

  const getAttemptsByStudent = useCallback((studentId: string) =>
    attempts.filter((a) => String(a.student?.id ?? a.student_id) === String(studentId)), [attempts]);

  const value = {
    quizzes, attempts, addQuiz, deleteQuiz, updateQuizStatus,
    submitAttempt, getAttemptsByQuiz, getAttemptsByStudent,
  } as QuizContextValue;

  return (
    <QuizContext.Provider value={value}>
      {children}
    </QuizContext.Provider>
  );
}

export function useQuiz() {
  const ctx = useContext(QuizContext);
  if (!ctx) throw new Error("useQuiz must be used within QuizProvider");
  return ctx;
}

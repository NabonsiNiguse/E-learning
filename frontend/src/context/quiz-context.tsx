import {
  createContext, useContext, useState, useCallback, type ReactNode,
} from "react";
import {
  mockQuizzes, mockQuizAttempts,
  type Quiz, type QuizAttempt,
} from "@/lib/mock-data";

interface QuizContextValue {
  quizzes: Quiz[];
  attempts: QuizAttempt[];
  addQuiz: (q: Omit<Quiz, "id" | "created_at">) => void;
  deleteQuiz: (id: string) => void;
  updateQuizStatus: (id: string, status: Quiz["status"]) => void;
  submitAttempt: (attempt: Omit<QuizAttempt, "id" | "submitted_at">) => QuizAttempt;
  getAttemptsByQuiz: (quizId: string) => QuizAttempt[];
  getAttemptsByStudent: (studentId: string) => QuizAttempt[];
}

const QuizContext = createContext<QuizContextValue | null>(null);

export function QuizProvider({ children }: { children: ReactNode }) {
  const [quizzes, setQuizzes]   = useState<Quiz[]>(mockQuizzes);
  const [attempts, setAttempts] = useState<QuizAttempt[]>(mockQuizAttempts);

  const addQuiz = useCallback((q: Omit<Quiz, "id" | "created_at">) => {
    const newQuiz: Quiz = {
      ...q,
      id:         `quiz-${Date.now()}`,
      created_at: new Date().toISOString().split("T")[0],
    };
    setQuizzes((prev) => [newQuiz, ...prev]);
  }, []);

  const deleteQuiz = useCallback((id: string) => {
    setQuizzes((prev) => prev.filter((q) => q.id !== id));
  }, []);

  const updateQuizStatus = useCallback((id: string, status: Quiz["status"]) => {
    setQuizzes((prev) => prev.map((q) => q.id === id ? { ...q, status } : q));
  }, []);

  const submitAttempt = useCallback(
    (attempt: Omit<QuizAttempt, "id" | "submitted_at">): QuizAttempt => {
      const full: QuizAttempt = {
        ...attempt,
        id:           `att-${Date.now()}`,
        submitted_at: new Date().toISOString(),
      };
      setAttempts((prev) => [full, ...prev]);
      return full;
    },
    []
  );

  const getAttemptsByQuiz    = useCallback((quizId: string) =>
    attempts.filter((a) => a.quiz_id === quizId), [attempts]);

  const getAttemptsByStudent = useCallback((studentId: string) =>
    attempts.filter((a) => a.student_id === studentId), [attempts]);

  return (
    <QuizContext.Provider value={{
      quizzes, attempts, addQuiz, deleteQuiz, updateQuizStatus,
      submitAttempt, getAttemptsByQuiz, getAttemptsByStudent,
    }}>
      {children}
    </QuizContext.Provider>
  );
}

export function useQuiz() {
  const ctx = useContext(QuizContext);
  if (!ctx) throw new Error("useQuiz must be used within QuizProvider");
  return ctx;
}

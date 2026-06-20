/**
 * QAContext — role-aware Q&A state management.
 *
 * Ownership rules:
 *   - Students can ask questions and edit/delete their own questions only
 *   - Teachers can answer questions in their courses and mark answers accepted
 *   - Admins can hide/unhide any question and delete any content
 *
 * Visibility rules:
 *   - "hidden" questions are invisible to students (even the asker)
 *   - Teachers see open + answered only (not hidden)
 *   - Admins see everything
 */
import {
  createContext, useContext, useState, useCallback, type ReactNode,
} from "react";
import {
  mockQAQuestions, filterQuestionsForRole,
  type QAQuestion, type QAAnswer, type QAState,
} from "@/lib/mock-qa";
import type { Role } from "@/lib/mock-data";

// ---------------------------------------------------------------------------
// Context shape
// ---------------------------------------------------------------------------
interface QAContextValue {
  questions: QAQuestion[];

  // Student actions
  askQuestion: (
    courseId: string,
    courseTitle: string,
    title: string,
    body: string,
    owner: { id: string; name: string; avatar: string },
  ) => void;
  editQuestion: (questionId: string, title: string, body: string, requesterId: string, requesterRole: Role) => void;
  deleteQuestion: (questionId: string, requesterId: string, requesterRole: Role) => void;

  // Teacher / Admin actions
  postAnswer: (
    questionId: string,
    body: string,
    owner: { id: string; name: string; avatar: string; role: "teacher" | "admin" },
  ) => void;
  editAnswer: (answerId: string, questionId: string, body: string, requesterId: string, requesterRole: Role) => void;
  deleteAnswer: (answerId: string, questionId: string, requesterId: string, requesterRole: Role) => void;
  acceptAnswer: (answerId: string, questionId: string, requesterId: string, requesterRole: Role) => void;

  // Admin / Teacher moderation
  setQuestionState: (questionId: string, state: QAState, requesterId: string, requesterRole: Role) => void;

  // Filtered view helper
  getVisibleQuestions: (role: Role, userId: string, courseId?: string) => QAQuestion[];
}

const QAContext = createContext<QAContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
export function QAProvider({ children }: { children: ReactNode }) {
  const [questions, setQuestions] = useState<QAQuestion[]>(mockQAQuestions);

  // ── Helpers ──────────────────────────────────────────────────────────────
  const now = () => new Date().toISOString();

  const canEditQuestion = (q: QAQuestion, requesterId: string, role: Role) =>
    role === "admin" || q.owner_id === requesterId;

  const canEditAnswer = (a: QAAnswer, requesterId: string, role: Role) =>
    role === "admin" || a.owner_id === requesterId;

  const canModerate = (role: Role) => role === "admin" || role === "teacher";

  // ── Student: ask ─────────────────────────────────────────────────────────
  const askQuestion = useCallback((
    courseId: string,
    courseTitle: string,
    title: string,
    body: string,
    owner: { id: string; name: string; avatar: string },
  ) => {
    const q: QAQuestion = {
      id:           `qa-${Date.now()}`,
      course_id:    courseId,
      course_title: courseTitle,
      owner_id:     owner.id,
      owner_name:   owner.name,
      owner_avatar: owner.avatar,
      title:        title.trim(),
      body:         body.trim(),
      state:        "open",
      answers:      [],
      created_at:   now(),
      updated_at:   now(),
    };
    setQuestions((prev) => [q, ...prev]);
  }, []);

  // ── Student / Admin: edit question ────────────────────────────────────────
  const editQuestion = useCallback((
    questionId: string,
    title: string,
    body: string,
    requesterId: string,
    requesterRole: Role,
  ) => {
    setQuestions((prev) => prev.map((q) => {
      if (q.id !== questionId) return q;
      if (!canEditQuestion(q, requesterId, requesterRole)) return q; // silently ignore
      return { ...q, title: title.trim(), body: body.trim(), updated_at: now() };
    }));
  }, []);

  // ── Student / Admin: delete question ─────────────────────────────────────
  const deleteQuestion = useCallback((
    questionId: string,
    requesterId: string,
    requesterRole: Role,
  ) => {
    setQuestions((prev) => prev.filter((q) => {
      if (q.id !== questionId) return true;
      return !canEditQuestion(q, requesterId, requesterRole);
    }));
  }, []);

  // ── Teacher / Admin: post answer ──────────────────────────────────────────
  const postAnswer = useCallback((
    questionId: string,
    body: string,
    owner: { id: string; name: string; avatar: string; role: "teacher" | "admin" },
  ) => {
    const answer: QAAnswer = {
      id:           `ans-${Date.now()}`,
      question_id:  questionId,
      owner_id:     owner.id,
      owner_name:   owner.name,
      owner_avatar: owner.avatar,
      owner_role:   owner.role,
      body:         body.trim(),
      is_accepted:  false,
      created_at:   now(),
      updated_at:   now(),
    };
    setQuestions((prev) => prev.map((q) => {
      if (q.id !== questionId) return q;
      const updatedAnswers = [...q.answers, answer];
      // Auto-transition to "answered" when first answer is posted
      const newState: QAState = q.state === "open" ? "answered" : q.state;
      return { ...q, answers: updatedAnswers, state: newState, updated_at: now() };
    }));
  }, []);

  // ── Teacher / Admin: edit answer ──────────────────────────────────────────
  const editAnswer = useCallback((
    answerId: string,
    questionId: string,
    body: string,
    requesterId: string,
    requesterRole: Role,
  ) => {
    setQuestions((prev) => prev.map((q) => {
      if (q.id !== questionId) return q;
      return {
        ...q,
        answers: q.answers.map((a) => {
          if (a.id !== answerId) return a;
          if (!canEditAnswer(a, requesterId, requesterRole)) return a;
          return { ...a, body: body.trim(), updated_at: now() };
        }),
        updated_at: now(),
      };
    }));
  }, []);

  // ── Teacher / Admin: delete answer ────────────────────────────────────────
  const deleteAnswer = useCallback((
    answerId: string,
    questionId: string,
    requesterId: string,
    requesterRole: Role,
  ) => {
    setQuestions((prev) => prev.map((q) => {
      if (q.id !== questionId) return q;
      const updatedAnswers = q.answers.filter((a) => {
        if (a.id !== answerId) return true;
        return !canEditAnswer(a, requesterId, requesterRole);
      });
      // Revert to "open" if all answers removed
      const newState: QAState = updatedAnswers.length === 0 && q.state === "answered" ? "open" : q.state;
      return { ...q, answers: updatedAnswers, state: newState, updated_at: now() };
    }));
  }, []);

  // ── Teacher / Admin: accept answer ────────────────────────────────────────
  const acceptAnswer = useCallback((
    answerId: string,
    questionId: string,
    requesterId: string,
    requesterRole: Role,
  ) => {
    setQuestions((prev) => prev.map((q) => {
      if (q.id !== questionId) return q;
      if (!canModerate(requesterRole) && q.owner_id !== requesterId) return q;
      return {
        ...q,
        answers: q.answers.map((a) => ({
          ...a,
          is_accepted: a.id === answerId,
        })),
        updated_at: now(),
      };
    }));
  }, []);

  // ── Admin / Teacher: set moderation state ────────────────────────────────
  const setQuestionState = useCallback((
    questionId: string,
    state: QAState,
    requesterId: string,
    requesterRole: Role,
  ) => {
    if (!canModerate(requesterRole)) return; // students cannot moderate
    setQuestions((prev) => prev.map((q) =>
      q.id === questionId ? { ...q, state, updated_at: now() } : q
    ));
  }, []);

  // ── Filtered view ─────────────────────────────────────────────────────────
  const getVisibleQuestions = useCallback((
    role: Role,
    userId: string,
    courseId?: string,
  ) => filterQuestionsForRole(questions, role, userId, courseId), [questions]);

  return (
    <QAContext.Provider value={{
      questions,
      askQuestion,
      editQuestion,
      deleteQuestion,
      postAnswer,
      editAnswer,
      deleteAnswer,
      acceptAnswer,
      setQuestionState,
      getVisibleQuestions,
    }}>
      {children}
    </QAContext.Provider>
  );
}

export function useQA() {
  const ctx = useContext(QAContext);
  if (!ctx) throw new Error("useQA must be used within QAProvider");
  return ctx;
}

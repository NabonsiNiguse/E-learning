/**
 * Q&A mock data — questions and answers with ownership, course scope,
 * and moderation states.
 *
 * Ownership rules enforced here:
 *   - question.owner_id  → the student who asked
 *   - answer.owner_id    → the teacher/admin who answered
 *   - state: "open" | "answered" | "hidden"
 *   - visibility: scoped to course (student must be enrolled)
 */
import type { Role } from "./mock-data";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type QAState = "open" | "answered" | "hidden";

export interface QAAnswer {
  id: string;
  question_id: string;
  owner_id: string;       // teacher or admin who answered
  owner_name: string;
  owner_avatar: string;
  owner_role: "teacher" | "admin";
  body: string;
  is_accepted: boolean;   // teacher/admin can mark one answer as accepted
  created_at: string;
  updated_at: string;
}

export interface QAQuestion {
  id: string;
  course_id: string;
  course_title: string;
  owner_id: string;       // student who asked
  owner_name: string;
  owner_avatar: string;
  title: string;
  body: string;
  state: QAState;         // open | answered | hidden
  answers: QAAnswer[];
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------
export const mockQAQuestions: QAQuestion[] = [
  {
    id: "qa1",
    course_id: "c1",
    course_title: "Modern Web Development",
    owner_id: "u3",
    owner_name: "Daniel Tesfaye",
    owner_avatar: "DT",
    title: "What is the difference between useEffect and useLayoutEffect?",
    body: "I've read the docs but I'm still confused about when to use useLayoutEffect over useEffect. Can someone explain with a practical example?",
    state: "answered",
    created_at: "2026-04-28T10:00:00Z",
    updated_at: "2026-04-28T14:30:00Z",
    answers: [
      {
        id: "ans1",
        question_id: "qa1",
        owner_id: "u2",
        owner_name: "Sara Bekele",
        owner_avatar: "SB",
        owner_role: "teacher",
        body: "Great question! useEffect runs asynchronously after the browser has painted. useLayoutEffect runs synchronously after DOM mutations but before the browser paints. Use useLayoutEffect only when you need to read layout (e.g. element dimensions) and synchronously re-render to avoid a visual flicker. In 99% of cases, useEffect is the right choice.",
        is_accepted: true,
        created_at: "2026-04-28T14:30:00Z",
        updated_at: "2026-04-28T14:30:00Z",
      },
    ],
  },
  {
    id: "qa2",
    course_id: "c1",
    course_title: "Modern Web Development",
    owner_id: "u4",
    owner_name: "Mira Patel",
    owner_avatar: "MP",
    title: "How do I properly type a generic React component in TypeScript?",
    body: "I'm trying to create a reusable Table component that accepts any data shape. I keep getting TypeScript errors when I try to pass the column definitions. Here's my current code:\n\nfunction Table<T>(props: { data: T[] }) { ... }\n\nBut I can't figure out how to type the column accessors.",
    state: "open",
    created_at: "2026-04-29T09:15:00Z",
    updated_at: "2026-04-29T09:15:00Z",
    answers: [],
  },
  {
    id: "qa3",
    course_id: "c1",
    course_title: "Modern Web Development",
    owner_id: "u6",
    owner_name: "Lina Chen",
    owner_avatar: "LC",
    title: "Why does my useEffect run twice in development?",
    body: "I noticed my API call fires twice when the component mounts. Is this a bug or expected behavior? I'm using React 18.",
    state: "answered",
    created_at: "2026-04-27T16:00:00Z",
    updated_at: "2026-04-27T18:00:00Z",
    answers: [
      {
        id: "ans2",
        question_id: "qa3",
        owner_id: "u2",
        owner_name: "Sara Bekele",
        owner_avatar: "SB",
        owner_role: "teacher",
        body: "This is expected in React 18 Strict Mode during development. React intentionally mounts, unmounts, and remounts components to help you find bugs from missing cleanup in useEffect. It only happens in development — your production build will run effects once. The fix is to add a proper cleanup function to your useEffect.",
        is_accepted: true,
        created_at: "2026-04-27T18:00:00Z",
        updated_at: "2026-04-27T18:00:00Z",
      },
    ],
  },
  {
    id: "qa4",
    course_id: "c3",
    course_title: "Data Science with Python",
    owner_id: "u4",
    owner_name: "Mira Patel",
    owner_avatar: "MP",
    title: "How do I handle missing values in a pandas DataFrame?",
    body: "My dataset has a lot of NaN values. What's the best strategy — drop them, fill with mean, or something else? Does it depend on the column type?",
    state: "open",
    created_at: "2026-04-30T11:00:00Z",
    updated_at: "2026-04-30T11:00:00Z",
    answers: [],
  },
  {
    id: "qa5",
    course_id: "c1",
    course_title: "Modern Web Development",
    owner_id: "u3",
    owner_name: "Daniel Tesfaye",
    owner_avatar: "DT",
    title: "Spam: buy cheap courses here!!!",
    body: "Visit my website for free courses...",
    state: "hidden",
    created_at: "2026-04-26T08:00:00Z",
    updated_at: "2026-04-26T08:05:00Z",
    answers: [],
  },
];

// ---------------------------------------------------------------------------
// Role-based visibility filter
// Applied in the context — not in raw data
// ---------------------------------------------------------------------------
export function filterQuestionsForRole(
  questions: QAQuestion[],
  role: Role,
  userId: string,
  courseId?: string,
): QAQuestion[] {
  let qs = courseId ? questions.filter((q) => q.course_id === courseId) : questions;

  if (role === "admin") {
    // Admin sees everything including hidden
    return qs;
  }

  if (role === "teacher") {
    // Teacher sees open + answered in their courses; never hidden
    return qs.filter((q) => q.state !== "hidden");
  }

  // Student: sees only open + answered; never hidden; only their own hidden
  return qs.filter((q) => q.state !== "hidden" || q.owner_id === userId);
}

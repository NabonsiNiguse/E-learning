export type Role = "super_admin" | "admin" | "teacher" | "student";

export interface MockUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar: string;
}

export const mockUsers: MockUser[] = [
  { id: "u0", name: "Academic Manager",  email: "academic@learnly.io",  role: "super_admin", avatar: "AM" },
  { id: "u1", name: "Ermiyas Mengistu",  email: "ermiyas@learnly.io",   role: "admin",       avatar: "EM" },
  { id: "u2", name: "Nabonsi Niguse",    email: "nabonsi@learnly.io",   role: "teacher",     avatar: "NN" },
  { id: "u3", name: "Keab Niguse",       email: "keab@learnly.io",      role: "student",     avatar: "KN" },
  { id: "u4", name: "Eyob Haile",        email: "eyob@learnly.io",      role: "student",     avatar: "EH" },
  { id: "u5", name: "Lemi Melkamu",      email: "lemi@learnly.io",      role: "teacher",     avatar: "LM" },
  { id: "u6", name: "Mikiyas Niguse",    email: "mikiyas@learnly.io",   role: "student",     avatar: "MN" },
];

export interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  instructor: string;
  students: number;
  lessons: number;
  duration: string;
  price: number;
  rating: number;
  progress?: number;
  thumbnail: string;        // Tailwind gradient classes (used as bg fallback)
  thumbnailImg?: string;    // Real Unsplash image URL
  locked?: boolean;
}

export const mockCourses: Course[] = [
  { id: "c1", title: "Modern Web Development",   description: "Master React, TypeScript and modern tooling to ship production apps.", category: "Development", level: "Intermediate", instructor: "Nabonsi Niguse", students: 18, lessons: 8,  duration: "4h 20m",  price: 49, rating: 4.8, progress: 64, thumbnail: "from-emerald-400 to-teal-600",   thumbnailImg: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=450&fit=crop" },
  { id: "c2", title: "UI/UX Design Foundations", description: "Learn the principles of beautiful, usable interface design.",           category: "Design",      level: "Beginner",     instructor: "Lemi Melkamu",   students: 12, lessons: 6,  duration: "3h 10m",  price: 39, rating: 4.7, progress: 32, thumbnail: "from-sky-400 to-indigo-600",    thumbnailImg: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=450&fit=crop" },
  { id: "c3", title: "Data Science with Python", description: "From pandas to ML — build a real data project end-to-end.",            category: "Data",        level: "Advanced",     instructor: "Nabonsi Niguse", students: 9,  lessons: 10, duration: "5h 45m",  price: 69, rating: 4.9, progress: 0,  thumbnail: "from-amber-400 to-orange-600",  thumbnailImg: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=450&fit=crop", locked: true },
  { id: "c4", title: "Digital Marketing Mastery",description: "Grow brands with SEO, paid ads, and content strategy.",                category: "Marketing",   level: "Beginner",     instructor: "Lemi Melkamu",   students: 7,  lessons: 5,  duration: "2h 30m",  price: 29, rating: 4.5, progress: 100,thumbnail: "from-rose-400 to-pink-600",     thumbnailImg: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=450&fit=crop" },
  { id: "c5", title: "Product Management 101",   description: "Frameworks for shipping products users love.",                         category: "Business",    level: "Intermediate", instructor: "Nabonsi Niguse", students: 5,  lessons: 7,  duration: "3h 50m",  price: 45, rating: 4.6, thumbnail: "from-violet-400 to-purple-600", thumbnailImg: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=450&fit=crop", locked: true },
  { id: "c6", title: "Mobile App Development",   description: "Build iOS & Android apps with React Native.",                          category: "Development", level: "Intermediate", instructor: "Lemi Melkamu",   students: 11, lessons: 9,  duration: "4h 55m",  price: 59, rating: 4.7, thumbnail: "from-cyan-400 to-blue-600",     thumbnailImg: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&h=450&fit=crop", locked: true },
];

export interface Lesson {
  id: string;
  title: string;
  duration: string;
  completed: boolean;
  description: string;
  type: "video" | "reading" | "quiz" | "assignment";
  thumbnail: string;        // Unsplash URL
  resources: { name: string; type: "pdf" | "zip" | "doc"; size: string }[];
  order: number;
}

export const mockLessons: Lesson[] = [
  {
    id: "l1", order: 1, title: "Introduction & Setup", duration: "8:24", completed: true,
    type: "video",
    thumbnail: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&h=450&fit=crop",
    description: "Get your development environment ready. We'll install Node.js, VS Code, and create your first React project with Vite.",
    resources: [{ name: "Setup Guide.pdf", type: "pdf", size: "1.2 MB" }],
  },
  {
    id: "l2", order: 2, title: "Components & Props", duration: "12:10", completed: true,
    type: "video",
    thumbnail: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&h=450&fit=crop",
    description: "Learn how to build reusable UI components and pass data between them using props. Covers functional components and TypeScript prop types.",
    resources: [{ name: "Components Cheatsheet.pdf", type: "pdf", size: "890 KB" }],
  },
  {
    id: "l3", order: 3, title: "State and Hooks", duration: "15:42", completed: true,
    type: "video",
    thumbnail: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=450&fit=crop",
    description: "Master useState and useEffect. Understand the component lifecycle and how to manage local state effectively in functional components.",
    resources: [
      { name: "Hooks Deep Dive.docx", type: "doc", size: "540 KB" },
      { name: "Code Examples.zip", type: "zip", size: "1.8 MB" },
    ],
  },
  {
    id: "l4", order: 4, title: "Routing Patterns", duration: "11:08", completed: false,
    type: "video",
    thumbnail: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&h=450&fit=crop",
    description: "Build multi-page apps with React Router. Learn nested routes, URL parameters, protected routes, and navigation patterns.",
    resources: [{ name: "Routing Guide.pdf", type: "pdf", size: "760 KB" }],
  },
  {
    id: "l5", order: 5, title: "Data Fetching", duration: "18:30", completed: false,
    type: "video",
    thumbnail: "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800&h=450&fit=crop",
    description: "Fetch data from REST APIs using fetch and axios. Handle loading states, errors, and caching strategies with React Query.",
    resources: [
      { name: "API Examples.zip", type: "zip", size: "2.1 MB" },
      { name: "React Query Docs.pdf", type: "pdf", size: "1.4 MB" },
    ],
  },
  {
    id: "l6", order: 6, title: "Forms & Validation", duration: "14:55", completed: false,
    type: "video",
    thumbnail: "https://images.unsplash.com/photo-1507721999472-8ed4421c4af2?w=800&h=450&fit=crop",
    description: "Build controlled forms with React Hook Form and Zod validation. Handle complex form state, error messages, and submission.",
    resources: [{ name: "Form Patterns.pdf", type: "pdf", size: "980 KB" }],
  },
  {
    id: "l7", order: 7, title: "Performance Tips", duration: "10:12", completed: false,
    type: "reading",
    thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=450&fit=crop",
    description: "Optimize your React app with useMemo, useCallback, React.memo, and code splitting. Measure performance with React DevTools.",
    resources: [{ name: "Performance Checklist.pdf", type: "pdf", size: "620 KB" }],
  },
  {
    id: "l8", order: 8, title: "Deployment", duration: "9:45", completed: false,
    type: "video",
    thumbnail: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&h=450&fit=crop",
    description: "Deploy your React app to Vercel, Netlify, or a custom server. Set up CI/CD pipelines and environment variables.",
    resources: [{ name: "Deployment Guide.pdf", type: "pdf", size: "1.1 MB" }],
  },
];

export const recentActivity = [
  { id: "a1", user: "Keab Niguse",     action: "Completed lesson",    target: "State and Hooks",           time: "2 min ago" },
  { id: "a2", user: "Eyob Haile",      action: "Enrolled in",         target: "UI/UX Design Foundations",  time: "1 hour ago" },
  { id: "a3", user: "Lemi Melkamu",    action: "Published course",    target: "Mobile App Development",    time: "3 hours ago" },
  { id: "a4", user: "Mikiyas Niguse",  action: "Submitted assignment",target: "Modern Web Development",    time: "5 hours ago" },
  { id: "a5", user: "Nabonsi Niguse",  action: "Updated lesson",      target: "Data Fetching",             time: "Yesterday" },
];

export const adminStats = {
  totalUsers: 38,
  teachers: 2,
  students: 35,
  courses: 6,
};

// ---------------------------------------------------------------------------
// ROLE-BASED PERMISSIONS & ACCESS CONTROL
// ---------------------------------------------------------------------------
/**
 * ADMIN ROLE:
 * - Full CRUD on all courses (create, read, update, delete)
 * - Full CRUD on all users (create, read, update, delete)
 * - View all attendance records across all courses
 * - View all student progress and grades
 * - Manage all enrollments
 * - View all payments and transactions
 * - System-wide analytics and reports
 * - Can impersonate any user for testing
 * 
 * TEACHER ROLE:
 * - READ all courses (view only)
 * - CREATE/UPDATE/DELETE only their own courses
 * - View attendance only for their courses
 * - View student progress only for their courses
 * - Create and grade assignments for their courses
 * - Create quizzes for their courses
 * - View enrollments for their courses
 * - Cannot delete users or manage system settings
 * 
 * STUDENT ROLE:
 * - READ only their enrolled courses
 * - Cannot create, update, or delete courses
 * - View only their own attendance records
 * - View only their own progress and grades
 * - Submit assignments
 * - Take quizzes
 * - View their own enrollments
 * - Cannot view other students' data
 */

// ---------------------------------------------------------------------------
// Notifications & Messages mock data
// ---------------------------------------------------------------------------
export type NotificationType =
  | "announcement"
  | "course_update"
  | "enrollment"
  | "payment_success"
  | "payment_failed"
  | "system"
  | "message";

export interface MockNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  related_object_id?: string;
}

export type MessageType = "direct" | "announcement" | "course_update";

export interface MockMessage {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_avatar: string;
  sender_role: Role;
  recipient_id: string | null;   // null = broadcast
  recipient_name: string | null;
  course_id: string | null;
  course_title: string | null;
  message_type: MessageType;
  subject: string;
  body: string;
  is_read: boolean;
  parent_id: string | null;
  reply_count: number;
  created_at: string;
}

export const mockNotifications: Record<Role, MockNotification[]> = {
  admin: [
    { id: "n1", type: "enrollment",    title: "New enrollment",         message: "Keab Niguse enrolled in Modern Web Development.",    is_read: false, created_at: "2 min ago" },
    { id: "n2", type: "payment_success",title: "Payment received",      message: "Eyob Haile paid $69 for Data Science with Python.",     is_read: false, created_at: "1 hour ago" },
    { id: "n3", type: "course_update", title: "Course published",       message: "Lemi Melkamu published Mobile App Development.",         is_read: true,  created_at: "3 hours ago" },
    { id: "n4", type: "system",        title: "System health OK",       message: "All services are running normally.",                    is_read: true,  created_at: "Yesterday" },
    { id: "n5", type: "enrollment",    title: "New enrollment",         message: "Mikiyas Niguse enrolled in UI/UX Design Foundations.",       is_read: false, created_at: "2 days ago" },
  ],
  teacher: [
    { id: "n6",  type: "enrollment",   title: "New student enrolled",   message: "Keab Niguse joined Modern Web Development.",         is_read: false, created_at: "5 min ago" },
    { id: "n7",  type: "message",      title: "New question",           message: "Eyob Haile asked a question in Data Science.",          is_read: false, created_at: "30 min ago" },
    { id: "n8",  type: "course_update",title: "Lesson completed",       message: "3 students completed 'State and Hooks'.",               is_read: true,  created_at: "2 hours ago" },
    { id: "n9",  type: "announcement", title: "Platform announcement",  message: "New grading features are now available.",               is_read: true,  created_at: "Yesterday" },
  ],
  student: [
    { id: "n10", type: "announcement", title: "🎉 Platform update",     message: "New quiz features are live! Check your courses.",       is_read: false, created_at: "1 hour ago" },
    { id: "n11", type: "course_update",title: "New lesson added",       message: "Nabonsi Niguse added 'Advanced Hooks' to Web Development.",is_read: false, created_at: "3 hours ago" },
    { id: "n12", type: "message",      title: "Teacher replied",        message: "Nabonsi Niguse replied to your question.",                 is_read: false, created_at: "5 hours ago" },
    { id: "n13", type: "payment_success",title: "Enrollment confirmed", message: "You're now enrolled in Data Science with Python.",      is_read: true,  created_at: "Yesterday" },
    { id: "n14", type: "enrollment",   title: "Course unlocked",        message: "Product Management 101 is now accessible.",             is_read: true,  created_at: "2 days ago" },
  ],
  super_admin: [
    { id: "n15", type: "system",       title: "Grade appeal escalated", message: "Mikiyas Niguse's appeal on UI Redesign has been escalated.", is_read: false, created_at: "1 hour ago" },
    { id: "n16", type: "announcement", title: "Platform health OK",     message: "All services are running normally.",                        is_read: true,  created_at: "Yesterday" },
  ],
};

export const mockMessages: Record<Role, MockMessage[]> = {
  admin: [
    {
      id: "m1", sender_id: "u1", sender_name: "Ermiyas Mengistu", sender_avatar: "EM", sender_role: "admin",
      recipient_id: null, recipient_name: null, course_id: null, course_title: null,
      message_type: "announcement", subject: "🚀 Platform Maintenance — May 5th",
      body: "We will be performing scheduled maintenance on May 5th from 2–4 AM UTC. The platform will be briefly unavailable. Thank you for your patience.",
      is_read: true, parent_id: null, reply_count: 0, created_at: "2 days ago",
    },
    {
      id: "m2", sender_id: "u3", sender_name: "Keab Niguse", sender_avatar: "KN", sender_role: "student",
      recipient_id: "u1", recipient_name: "Ermiyas Mengistu", course_id: null, course_title: null,
      message_type: "direct", subject: "Account issue",
      body: "Hi Ermiyas, I'm having trouble accessing my enrolled courses after the last update. Could you look into this?",
      is_read: false, parent_id: null, reply_count: 1, created_at: "4 hours ago",
    },
    {
      id: "m3", sender_id: "u2", sender_name: "Nabonsi Niguse", sender_avatar: "NN", sender_role: "teacher",
      recipient_id: "u1", recipient_name: "Ermiyas Mengistu", course_id: null, course_title: null,
      message_type: "direct", subject: "Request: Video upload limit increase",
      body: "Hello, I'd like to request an increase in the video upload limit for my courses. Currently capped at 500MB which is too small for HD content.",
      is_read: true, parent_id: null, reply_count: 0, created_at: "Yesterday",
    },
  ],
  teacher: [
    {
      id: "m4", sender_id: "u1", sender_name: "Ermiyas Mengistu", sender_avatar: "EM", sender_role: "admin",
      recipient_id: null, recipient_name: null, course_id: null, course_title: null,
      message_type: "announcement", subject: "🚀 Platform Maintenance — May 5th",
      body: "We will be performing scheduled maintenance on May 5th from 2–4 AM UTC. The platform will be briefly unavailable.",
      is_read: true, parent_id: null, reply_count: 0, created_at: "2 days ago",
    },
    {
      id: "m5", sender_id: "u3", sender_name: "Keab Niguse", sender_avatar: "KN", sender_role: "student",
      recipient_id: "u2", recipient_name: "Nabonsi Niguse", course_id: "c1", course_title: "Modern Web Development",
      message_type: "direct", subject: "Question about React hooks",
      body: "Hi Nabonsi, I'm confused about the difference between useEffect and useLayoutEffect. Could you explain when to use each?",
      is_read: false, parent_id: null, reply_count: 0, created_at: "30 min ago",
    },
    {
      id: "m6", sender_id: "u4", sender_name: "Eyob Haile", sender_avatar: "EH", sender_role: "student",
      recipient_id: "u2", recipient_name: "Nabonsi Niguse", course_id: "c3", course_title: "Data Science with Python",
      message_type: "direct", subject: "Assignment submission issue",
      body: "Hello, I submitted my pandas assignment but the system shows it as pending. Is there a delay in processing?",
      is_read: true, parent_id: null, reply_count: 1, created_at: "2 hours ago",
    },
    {
      id: "m7", sender_id: "u2", sender_name: "Nabonsi Niguse", sender_avatar: "NN", sender_role: "teacher",
      recipient_id: null, recipient_name: null, course_id: "c1", course_title: "Modern Web Development",
      message_type: "course_update", subject: "New lesson added: Advanced Hooks",
      body: "Hi everyone! I've just added a new lesson on Advanced Hooks covering useReducer, useContext, and custom hooks. Check it out in Week 3!",
      is_read: true, parent_id: null, reply_count: 0, created_at: "3 hours ago",
    },
  ],
  student: [
    {
      id: "m8", sender_id: "u1", sender_name: "Ermiyas Mengistu", sender_avatar: "EM", sender_role: "admin",
      recipient_id: null, recipient_name: null, course_id: null, course_title: null,
      message_type: "announcement", subject: "🚀 Platform Maintenance — May 5th",
      body: "We will be performing scheduled maintenance on May 5th from 2–4 AM UTC. The platform will be briefly unavailable.",
      is_read: false, parent_id: null, reply_count: 0, created_at: "2 days ago",
    },
    {
      id: "m9", sender_id: "u2", sender_name: "Nabonsi Niguse", sender_avatar: "NN", sender_role: "teacher",
      recipient_id: null, recipient_name: null, course_id: "c1", course_title: "Modern Web Development",
      message_type: "course_update", subject: "New lesson added: Advanced Hooks",
      body: "Hi everyone! I've just added a new lesson on Advanced Hooks covering useReducer, useContext, and custom hooks. Check it out in Week 3!",
      is_read: false, parent_id: null, reply_count: 0, created_at: "3 hours ago",
    },
    {
      id: "m10", sender_id: "u2", sender_name: "Nabonsi Niguse", sender_avatar: "NN", sender_role: "teacher",
      recipient_id: "u3", recipient_name: "Keab Niguse", course_id: "c1", course_title: "Modern Web Development",
      message_type: "direct", subject: "Re: Question about React hooks",
      body: "Great question Keab! useEffect runs after the paint, while useLayoutEffect runs synchronously after DOM mutations but before the browser paints. Use useLayoutEffect only when you need to read layout and synchronously re-render.",
      is_read: false, parent_id: "m5", reply_count: 0, created_at: "5 hours ago",
    },
  ],
  super_admin: [
    {
      id: "m11", sender_id: "u1", sender_name: "Ermiyas Mengistu", sender_avatar: "EM", sender_role: "admin",
      recipient_id: null, recipient_name: null, course_id: null, course_title: null,
      message_type: "announcement", subject: "🚀 Platform Maintenance — May 5th",
      body: "We will be performing scheduled maintenance on May 5th from 2–4 AM UTC. The platform will be briefly unavailable.",
      is_read: true, parent_id: null, reply_count: 0, created_at: "2 days ago",
    },
  ],
};

// ---------------------------------------------------------------------------
// Attendance mock data
// ---------------------------------------------------------------------------
export type AttendanceStatus = "present" | "absent" | "late" | "excused";

export interface AttendanceRecord {
  id: string;
  student_id: string;
  student_name: string;
  student_avatar: string;
  student_email: string;
  course_id: string;
  course_title: string;
  date: string;           // ISO "YYYY-MM-DD"
  status: AttendanceStatus;
  notes: string;
  marked_by: string;
}

// Generates a realistic spread of records across the last 30 days
function makeRecords(): AttendanceRecord[] {
  const students = [
    { id: "u3", name: "Keab Niguse",    avatar: "KN", email: "keab@learnly.io" },
    { id: "u4", name: "Eyob Haile",     avatar: "EH", email: "eyob@learnly.io" },
    { id: "u6", name: "Mikiyas Niguse", avatar: "MN", email: "mikiyas@learnly.io" },
    { id: "s10",name: "Niguse Tsegaye", avatar: "NT", email: "niguse@learnly.io" },
    { id: "s11",name: "John Wabskill",  avatar: "JW", email: "john@learnly.io" },
  ];

  const sessions: { courseId: string; courseTitle: string; daysAgo: number }[] = [
    { courseId: "c1", courseTitle: "Modern Web Development",   daysAgo: 0  },
    { courseId: "c1", courseTitle: "Modern Web Development",   daysAgo: 2  },
    { courseId: "c1", courseTitle: "Modern Web Development",   daysAgo: 7  },
    { courseId: "c1", courseTitle: "Modern Web Development",   daysAgo: 9  },
    { courseId: "c1", courseTitle: "Modern Web Development",   daysAgo: 14 },
    { courseId: "c1", courseTitle: "Modern Web Development",   daysAgo: 16 },
    { courseId: "c3", courseTitle: "Data Science with Python", daysAgo: 1  },
    { courseId: "c3", courseTitle: "Data Science with Python", daysAgo: 3  },
    { courseId: "c3", courseTitle: "Data Science with Python", daysAgo: 8  },
    { courseId: "c3", courseTitle: "Data Science with Python", daysAgo: 15 },
  ];

  const statusMatrix: AttendanceStatus[][] = [
    // Daniel
    ["present","present","present","present","present","late","present","present","present","present"],
    // Mira
    ["present","absent","present","present","late","present","present","excused","present","present"],
    // Lina
    ["late","present","absent","present","present","present","absent","present","present","present"],
    // Aaron
    ["present","present","present","absent","present","present","present","present","late","present"],
    // Beth
    ["absent","present","present","present","present","excused","present","present","present","absent"],
  ];

  const noteMatrix: string[][] = [
    ["","","","","","Joined 10 min late","","","",""],
    ["","Sick","","","Left early","","","Doctor appointment","",""],
    ["5 min late","","No show","","","","No show","","",""],
    ["","","","Family emergency","","","","","Traffic",""],
    ["No show","","","","","Medical leave","","","","No show"],
  ];

  const records: AttendanceRecord[] = [];
  let id = 1;

  sessions.forEach((session, si) => {
    const date = new Date();
    date.setDate(date.getDate() - session.daysAgo);
    const dateStr = date.toISOString().split("T")[0];

    students.forEach((student, sti) => {
      records.push({
        id:            String(id++),
        student_id:    student.id,
        student_name:  student.name,
        student_avatar:student.avatar,
        student_email: student.email,
        course_id:     session.courseId,
        course_title:  session.courseTitle,
        date:          dateStr,
        status:        statusMatrix[sti][si],
        notes:         noteMatrix[sti][si],
        marked_by:     "Nabonsi Niguse",
      });
    });
  });

  return records;
}

export const mockAttendanceRecords: AttendanceRecord[] = makeRecords();

// ---------------------------------------------------------------------------
// Materials mock data
// ---------------------------------------------------------------------------
export type FileType = "pdf" | "ppt" | "doc" | "xls" | "zip" | "txt" | "img";

export interface Material {
  id: string;
  title: string;
  description: string;
  file_type: FileType;
  file_name: string;
  file_size: string;       // human-readable e.g. "2.4 MB"
  course_id: string;
  course_title: string;
  lesson_id: string | null;
  lesson_title: string | null;
  uploaded_by: string;     // instructor name
  uploaded_by_avatar: string;
  uploaded_at: string;     // ISO date string
  downloads: number;
  is_downloadable: boolean;
}

export const mockMaterials: Material[] = [
  {
    id: "mat1", title: "React Fundamentals — Slides",
    description: "Complete slide deck covering React basics, JSX, and component lifecycle.",
    file_type: "ppt", file_name: "react-fundamentals.pptx", file_size: "3.2 MB",
    course_id: "c1", course_title: "Modern Web Development",
    lesson_id: "l1", lesson_title: "Introduction & Setup",
    uploaded_by: "Nabonsi Niguse", uploaded_by_avatar: "NN",
    uploaded_at: "2026-04-28", downloads: 14, is_downloadable: true,
  },
  {
    id: "mat2", title: "TypeScript Cheat Sheet",
    description: "Quick reference for TypeScript types, interfaces, generics, and utility types.",
    file_type: "pdf", file_name: "typescript-cheatsheet.pdf", file_size: "1.1 MB",
    course_id: "c1", course_title: "Modern Web Development",
    lesson_id: null, lesson_title: null,
    uploaded_by: "Nabonsi Niguse", uploaded_by_avatar: "NN",
    uploaded_at: "2026-04-25", downloads: 17, is_downloadable: true,
  },
  {
    id: "mat3", title: "Hooks Deep Dive — Notes",
    description: "Detailed written notes on useEffect, useCallback, useMemo, and custom hooks.",
    file_type: "doc", file_name: "hooks-deep-dive.docx", file_size: "540 KB",
    course_id: "c1", course_title: "Modern Web Development",
    lesson_id: "l3", lesson_title: "State and Hooks",
    uploaded_by: "Nabonsi Niguse", uploaded_by_avatar: "NN",
    uploaded_at: "2026-04-20", downloads: 11, is_downloadable: true,
  },
  {
    id: "mat4", title: "Design Principles — Workbook",
    description: "Exercises and worksheets for applying Gestalt principles in UI design.",
    file_type: "pdf", file_name: "design-workbook.pdf", file_size: "4.7 MB",
    course_id: "c2", course_title: "UI/UX Design Foundations",
    lesson_id: null, lesson_title: null,
    uploaded_by: "Lemi Melkamu", uploaded_by_avatar: "LM",
    uploaded_at: "2026-04-22", downloads: 9, is_downloadable: true,
  },
  {
    id: "mat5", title: "Figma Starter Kit",
    description: "Component library and design tokens to use throughout the course projects.",
    file_type: "zip", file_name: "figma-starter-kit.zip", file_size: "12.8 MB",
    course_id: "c2", course_title: "UI/UX Design Foundations",
    lesson_id: null, lesson_title: null,
    uploaded_by: "Lemi Melkamu", uploaded_by_avatar: "LM",
    uploaded_at: "2026-04-18", downloads: 10, is_downloadable: true,
  },
  {
    id: "mat6", title: "Pandas & NumPy Reference",
    description: "Comprehensive reference sheet for data manipulation with pandas and NumPy.",
    file_type: "pdf", file_name: "pandas-numpy-ref.pdf", file_size: "2.0 MB",
    course_id: "c3", course_title: "Data Science with Python",
    lesson_id: null, lesson_title: null,
    uploaded_by: "Nabonsi Niguse", uploaded_by_avatar: "NN",
    uploaded_at: "2026-04-15", downloads: 8, is_downloadable: true,
  },
  {
    id: "mat7", title: "ML Project Dataset",
    description: "Cleaned CSV dataset used for the end-to-end machine learning project.",
    file_type: "zip", file_name: "ml-project-dataset.zip", file_size: "8.3 MB",
    course_id: "c3", course_title: "Data Science with Python",
    lesson_id: null, lesson_title: null,
    uploaded_by: "Nabonsi Niguse", uploaded_by_avatar: "NN",
    uploaded_at: "2026-04-10", downloads: 7, is_downloadable: true,
  },
  {
    id: "mat8", title: "SEO Audit Template",
    description: "Excel template for conducting a full technical SEO audit.",
    file_type: "xls", file_name: "seo-audit-template.xlsx", file_size: "890 KB",
    course_id: "c4", course_title: "Digital Marketing Mastery",
    lesson_id: null, lesson_title: null,
    uploaded_by: "Lemi Melkamu", uploaded_by_avatar: "LM",
    uploaded_at: "2026-04-08", downloads: 6, is_downloadable: true,
  },
  {
    id: "mat9", title: "Product Roadmap Template",
    description: "Notion-style roadmap template for planning product releases.",
    file_type: "doc", file_name: "product-roadmap.docx", file_size: "320 KB",
    course_id: "c5", course_title: "Product Management 101",
    lesson_id: null, lesson_title: null,
    uploaded_by: "Nabonsi Niguse", uploaded_by_avatar: "NN",
    uploaded_at: "2026-04-05", downloads: 4, is_downloadable: false,
  },
  {
    id: "mat10", title: "React Native Setup Guide",
    description: "Step-by-step guide for setting up the React Native development environment.",
    file_type: "pdf", file_name: "rn-setup-guide.pdf", file_size: "1.6 MB",
    course_id: "c6", course_title: "Mobile App Development",
    lesson_id: null, lesson_title: null,
    uploaded_by: "Lemi Melkamu", uploaded_by_avatar: "LM",
    uploaded_at: "2026-04-01", downloads: 9, is_downloadable: true,
  },
];

// ---------------------------------------------------------------------------
// Quiz & Exam mock data
// ---------------------------------------------------------------------------
export type QuizStatus = "draft" | "upcoming" | "active" | "completed";

export interface QuizOption {
  id: string;
  text: string;
}

export interface QuizQuestion {
  id: string;
  text: string;
  options: QuizOption[];
  correct_option_id: string;
  explanation?: string;
}

export interface Quiz {
  id: string;
  title: string;
  instructions: string;
  course_id: string;
  course_title: string;
  created_by: string;       // instructor name
  created_by_avatar: string;
  time_limit_minutes: number;
  status: QuizStatus;
  questions: QuizQuestion[];
  passing_score: number;    // percentage 0-100
  created_at: string;
  available_from: string;   // ISO datetime
  available_until: string;  // ISO datetime
  attempts_allowed: number;
}

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  student_id: string;
  student_name: string;
  answers: Record<string, string>; // question_id → chosen option_id
  score: number;                   // percentage 0-100
  correct_count: number;
  total_questions: number;
  time_taken_seconds: number;
  submitted_at: string;
  passed: boolean;
}

export const mockQuizzes: Quiz[] = [
  {
    id: "q1",
    title: "React Fundamentals Quiz",
    instructions: "Answer all questions. Each question has one correct answer. You have 15 minutes to complete this quiz. Your score will be shown immediately after submission.",
    course_id: "c1", course_title: "Modern Web Development",
    created_by: "Nabonsi Niguse", created_by_avatar: "NN",
    time_limit_minutes: 15,
    status: "active",
    passing_score: 70,
    created_at: "2026-04-20",
    available_from: "2026-04-25T08:00:00",
    available_until: "2026-05-10T23:59:00",
    attempts_allowed: 2,
    questions: [
      {
        id: "q1-1",
        text: "What is the correct way to update state in a React functional component?",
        options: [
          { id: "a", text: "this.setState({ count: 1 })" },
          { id: "b", text: "setCount(1) using the useState hook" },
          { id: "c", text: "state.count = 1" },
          { id: "d", text: "React.updateState('count', 1)" },
        ],
        correct_option_id: "b",
        explanation: "In functional components, state is managed via the useState hook. The setter function (e.g. setCount) is the correct way to update state.",
      },
      {
        id: "q1-2",
        text: "Which hook is used to perform side effects in a React component?",
        options: [
          { id: "a", text: "useState" },
          { id: "b", text: "useContext" },
          { id: "c", text: "useEffect" },
          { id: "d", text: "useReducer" },
        ],
        correct_option_id: "c",
        explanation: "useEffect is designed for side effects like data fetching, subscriptions, and DOM manipulation.",
      },
      {
        id: "q1-3",
        text: "What does JSX stand for?",
        options: [
          { id: "a", text: "JavaScript XML" },
          { id: "b", text: "Java Syntax Extension" },
          { id: "c", text: "JSON XML Syntax" },
          { id: "d", text: "JavaScript Extra" },
        ],
        correct_option_id: "a",
        explanation: "JSX stands for JavaScript XML. It is a syntax extension that allows you to write HTML-like code inside JavaScript.",
      },
      {
        id: "q1-4",
        text: "Which of the following is NOT a React hook?",
        options: [
          { id: "a", text: "useCallback" },
          { id: "b", text: "useMemo" },
          { id: "c", text: "useHistory" },
          { id: "d", text: "useRef" },
        ],
        correct_option_id: "c",
        explanation: "useHistory was a React Router hook, not a core React hook. It has been replaced by useNavigate in React Router v6.",
      },
      {
        id: "q1-5",
        text: "What is the purpose of the key prop in React lists?",
        options: [
          { id: "a", text: "To style list items" },
          { id: "b", text: "To help React identify which items have changed" },
          { id: "c", text: "To set the order of list items" },
          { id: "d", text: "To pass data between components" },
        ],
        correct_option_id: "b",
        explanation: "The key prop helps React efficiently update the DOM by identifying which list items have changed, been added, or removed.",
      },
      {
        id: "q1-6",
        text: "What is a controlled component in React?",
        options: [
          { id: "a", text: "A component that controls other components" },
          { id: "b", text: "A form element whose value is controlled by React state" },
          { id: "c", text: "A component with no props" },
          { id: "d", text: "A component that uses Redux" },
        ],
        correct_option_id: "b",
        explanation: "A controlled component is a form element (input, textarea, select) whose value is driven by React state, making React the single source of truth.",
      },
    ],
  },
  {
    id: "q2",
    title: "TypeScript Types & Interfaces",
    instructions: "Test your knowledge of TypeScript fundamentals. Read each question carefully before answering. You have 20 minutes.",
    course_id: "c1", course_title: "Modern Web Development",
    created_by: "Nabonsi Niguse", created_by_avatar: "NN",
    time_limit_minutes: 20,
    status: "upcoming",
    passing_score: 75,
    created_at: "2026-04-28",
    available_from: "2026-05-10T09:00:00",
    available_until: "2026-05-20T23:59:00",
    attempts_allowed: 1,
    questions: [
      {
        id: "q2-1",
        text: "What is the difference between 'interface' and 'type' in TypeScript?",
        options: [
          { id: "a", text: "They are completely identical" },
          { id: "b", text: "Interfaces can be extended and merged; types are more flexible with unions" },
          { id: "c", text: "Types are only for primitives" },
          { id: "d", text: "Interfaces cannot have methods" },
        ],
        correct_option_id: "b",
        explanation: "Interfaces support declaration merging and are better for object shapes. Types are more flexible and support unions, intersections, and mapped types.",
      },
      {
        id: "q2-2",
        text: "What does the 'readonly' modifier do in TypeScript?",
        options: [
          { id: "a", text: "Makes a property optional" },
          { id: "b", text: "Prevents a property from being reassigned after initialization" },
          { id: "c", text: "Makes a property private" },
          { id: "d", text: "Converts a property to a getter" },
        ],
        correct_option_id: "b",
        explanation: "The readonly modifier prevents a property from being reassigned after it is first set, similar to const for variables.",
      },
      {
        id: "q2-3",
        text: "What is a generic type in TypeScript?",
        options: [
          { id: "a", text: "A type that accepts any value" },
          { id: "b", text: "A type that works with multiple types while maintaining type safety" },
          { id: "c", text: "A built-in TypeScript type" },
          { id: "d", text: "A type alias for 'any'" },
        ],
        correct_option_id: "b",
        explanation: "Generics allow you to write reusable code that works with multiple types while preserving type information and safety.",
      },
      {
        id: "q2-4",
        text: "What does the '?' symbol mean when used in a TypeScript interface property?",
        options: [
          { id: "a", text: "The property is required" },
          { id: "b", text: "The property is optional" },
          { id: "c", text: "The property can be null" },
          { id: "d", text: "The property is a function" },
        ],
        correct_option_id: "b",
        explanation: "The ? symbol marks a property as optional, meaning it may or may not be present in an object of that type.",
      },
    ],
  },
  {
    id: "q3",
    title: "UI Design Principles — Mid-term",
    instructions: "This is a graded mid-term exam. Answer all 5 questions. You have 25 minutes. Passing score is 80%.",
    course_id: "c2", course_title: "UI/UX Design Foundations",
    created_by: "Lemi Melkamu", created_by_avatar: "LM",
    time_limit_minutes: 25,
    status: "completed",
    passing_score: 80,
    created_at: "2026-04-10",
    available_from: "2026-04-15T10:00:00",
    available_until: "2026-04-20T23:59:00",
    attempts_allowed: 1,
    questions: [
      {
        id: "q3-1",
        text: "Which Gestalt principle describes our tendency to perceive objects close to each other as a group?",
        options: [
          { id: "a", text: "Similarity" },
          { id: "b", text: "Proximity" },
          { id: "c", text: "Continuity" },
          { id: "d", text: "Closure" },
        ],
        correct_option_id: "b",
        explanation: "The Gestalt principle of Proximity states that objects near each other tend to be perceived as a group.",
      },
      {
        id: "q3-2",
        text: "What is the recommended minimum touch target size for mobile interfaces?",
        options: [
          { id: "a", text: "24×24 pixels" },
          { id: "b", text: "32×32 pixels" },
          { id: "c", text: "44×44 pixels" },
          { id: "d", text: "64×64 pixels" },
        ],
        correct_option_id: "c",
        explanation: "Apple's HIG and Google's Material Design both recommend a minimum touch target of 44×44 points/dp for comfortable interaction.",
      },
      {
        id: "q3-3",
        text: "What does 'affordance' mean in UX design?",
        options: [
          { id: "a", text: "The cost of a design project" },
          { id: "b", text: "A visual cue that suggests how an object should be used" },
          { id: "c", text: "The accessibility score of an interface" },
          { id: "d", text: "The number of features in a product" },
        ],
        correct_option_id: "b",
        explanation: "Affordance refers to the perceived and actual properties of an object that suggest how it should be used — e.g., a button that looks pressable.",
      },
      {
        id: "q3-4",
        text: "Which color model is used for digital screens?",
        options: [
          { id: "a", text: "CMYK" },
          { id: "b", text: "Pantone" },
          { id: "c", text: "RGB" },
          { id: "d", text: "HSL only" },
        ],
        correct_option_id: "c",
        explanation: "Digital screens use the RGB (Red, Green, Blue) additive color model. CMYK is used for print.",
      },
      {
        id: "q3-5",
        text: "What is the purpose of a wireframe in the design process?",
        options: [
          { id: "a", text: "To show the final visual design with colors and typography" },
          { id: "b", text: "To outline the structure and layout without visual styling" },
          { id: "c", text: "To write the code for the interface" },
          { id: "d", text: "To test the performance of the application" },
        ],
        correct_option_id: "b",
        explanation: "Wireframes are low-fidelity blueprints that focus on structure, layout, and content hierarchy without visual design details.",
      },
    ],
  },
];

export const mockQuizAttempts: QuizAttempt[] = [
  {
    id: "att1",
    quiz_id: "q3",
    student_id: "u3",
    student_name: "Keab Niguse",
    answers: { "q3-1": "b", "q3-2": "c", "q3-3": "b", "q3-4": "c", "q3-5": "b" },
    score: 100,
    correct_count: 5,
    total_questions: 5,
    time_taken_seconds: 840,
    submitted_at: "2026-04-16T10:14:00",
    passed: true,
  },
  {
    id: "att2",
    quiz_id: "q3",
    student_id: "u4",
    student_name: "Eyob Haile",
    answers: { "q3-1": "a", "q3-2": "c", "q3-3": "b", "q3-4": "c", "q3-5": "a" },
    score: 60,
    correct_count: 3,
    total_questions: 5,
    time_taken_seconds: 1120,
    submitted_at: "2026-04-16T10:22:00",
    passed: false,
  },
];

// ---------------------------------------------------------------------------
// Assignment mock data
// ---------------------------------------------------------------------------
export type AssignmentStatus = "pending" | "submitted" | "graded" | "late" | "missing";

export interface AssignmentAttachment {
  name: string;
  size: string;
  type: string; // "pdf" | "doc" | "zip" | etc.
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  instructions: string;
  course_id: string;
  course_title: string;
  created_by: string;
  created_by_avatar: string;
  due_date: string;          // ISO datetime
  created_at: string;
  max_score: number;
  attachments: AssignmentAttachment[];
  allow_text_response: boolean;
  allow_file_upload: boolean;
}

export interface AssignmentSubmission {
  id: string;
  assignment_id: string;
  student_id: string;
  student_name: string;
  student_avatar: string;
  text_response: string;
  file_name: string | null;
  file_size: string | null;
  submitted_at: string;
  status: AssignmentStatus;
  score: number | null;
  feedback: string;
  graded_at: string | null;
  graded_by: string | null;
  is_late: boolean;
}

// Helper — days from today
function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}
function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

export const mockAssignments: Assignment[] = [
  {
    id: "asgn1",
    title: "Build a React Todo App",
    description: "Create a fully functional Todo application using React hooks and TypeScript.",
    instructions: "Build a Todo app that supports adding, completing, and deleting tasks. Use useState and useEffect hooks. Style it with Tailwind CSS. Submit your GitHub repository link and a short write-up explaining your approach.",
    course_id: "c1", course_title: "Modern Web Development",
    created_by: "Nabonsi Niguse", created_by_avatar: "NN",
    due_date: daysFromNow(5),
    created_at: daysAgo(3),
    max_score: 100,
    attachments: [
      { name: "todo-app-requirements.pdf", size: "420 KB", type: "pdf" },
      { name: "starter-template.zip",      size: "1.2 MB", type: "zip" },
    ],
    allow_text_response: true,
    allow_file_upload: true,
  },
  {
    id: "asgn2",
    title: "TypeScript Interface Design",
    description: "Design TypeScript interfaces for a real-world e-commerce data model.",
    instructions: "Create a TypeScript file defining interfaces for: Product, Cart, Order, and User. Each interface must include at least 5 typed properties. Use generics where appropriate. Include a brief explanation of your design decisions.",
    course_id: "c1", course_title: "Modern Web Development",
    created_by: "Nabonsi Niguse", created_by_avatar: "NN",
    due_date: daysFromNow(10),
    created_at: daysAgo(1),
    max_score: 50,
    attachments: [
      { name: "typescript-guidelines.pdf", size: "280 KB", type: "pdf" },
    ],
    allow_text_response: true,
    allow_file_upload: true,
  },
  {
    id: "asgn3",
    title: "UI Redesign Case Study",
    description: "Redesign the checkout flow of an existing e-commerce website.",
    instructions: "Choose any popular e-commerce site and redesign its checkout flow. Deliver: 3 wireframes, a high-fidelity Figma prototype, and a 500-word rationale explaining your UX decisions. Export your Figma file as PDF.",
    course_id: "c2", course_title: "UI/UX Design Foundations",
    created_by: "Lemi Melkamu", created_by_avatar: "LM",
    due_date: daysAgo(2),
    created_at: daysAgo(14),
    max_score: 100,
    attachments: [
      { name: "case-study-rubric.pdf", size: "350 KB", type: "pdf" },
    ],
    allow_text_response: false,
    allow_file_upload: true,
  },
  {
    id: "asgn4",
    title: "Pandas Data Analysis Report",
    description: "Perform exploratory data analysis on the provided dataset using pandas.",
    instructions: "Using the provided CSV dataset, write a Jupyter notebook that: loads and cleans the data, produces 5 meaningful visualisations, and summarises 3 key insights. Export as .ipynb and PDF.",
    course_id: "c3", course_title: "Data Science with Python",
    created_by: "Nabonsi Niguse", created_by_avatar: "NN",
    due_date: daysFromNow(7),
    created_at: daysAgo(5),
    max_score: 100,
    attachments: [
      { name: "sales-dataset.csv", size: "2.4 MB", type: "csv" },
      { name: "analysis-template.ipynb", size: "18 KB", type: "ipynb" },
    ],
    allow_text_response: false,
    allow_file_upload: true,
  },
];

export const mockSubmissions: AssignmentSubmission[] = [
  {
    id: "sub1",
    assignment_id: "asgn1",
    student_id: "u3", student_name: "Keab Niguse", student_avatar: "KN",
    text_response: "I built the Todo app using React 18 with TypeScript. I used useState for task management and useEffect to persist data to localStorage. The app supports adding, completing, and deleting tasks with smooth animations.",
    file_name: "todo-app-keab.zip", file_size: "3.1 MB",
    submitted_at: daysAgo(1),
    status: "submitted",
    score: null, feedback: "", graded_at: null, graded_by: null,
    is_late: false,
  },
  {
    id: "sub2",
    assignment_id: "asgn1",
    student_id: "u4", student_name: "Eyob Haile", student_avatar: "EH",
    text_response: "My implementation uses useReducer for more complex state management. I also added drag-and-drop reordering using the HTML5 drag API.",
    file_name: "todo-app-eyob.zip", file_size: "2.8 MB",
    submitted_at: daysAgo(2),
    status: "graded",
    score: 92, feedback: "Excellent work Eyob! The useReducer approach is well-structured and the drag-and-drop is a great bonus. Minor: add error boundaries for production readiness.",
    graded_at: daysAgo(1), graded_by: "Nabonsi Niguse",
    is_late: false,
  },
  {
    id: "sub3",
    assignment_id: "asgn3",
    student_id: "u3", student_name: "Keab Niguse", student_avatar: "KN",
    text_response: "",
    file_name: "checkout-redesign-keab.pdf", file_size: "4.7 MB",
    submitted_at: daysAgo(1),
    status: "late",
    score: null, feedback: "", graded_at: null, graded_by: null,
    is_late: true,
  },
  {
    id: "sub4",
    assignment_id: "asgn3",
    student_id: "u6", student_name: "Mikiyas Niguse", student_avatar: "MN",
    text_response: "",
    file_name: "checkout-redesign-mikiyas.pdf", file_size: "5.2 MB",
    submitted_at: daysAgo(3),
    status: "graded",
    score: 88, feedback: "Great wireframes and solid rationale. The high-fidelity prototype could use more consistent spacing. Overall very strong work.",
    graded_at: daysAgo(2), graded_by: "Lemi Melkamu",
    is_late: false,
  },
  // Graded submissions for Keab (u3) — needed for Results page appeal buttons
  {
    id: "sub5",
    assignment_id: "asgn2",
    student_id: "u3", student_name: "Keab Niguse", student_avatar: "KN",
    text_response: "I designed interfaces for Product, Cart, Order, and User with generics for the cart items array. Each interface has typed properties and JSDoc comments.",
    file_name: "ecommerce-interfaces.ts", file_size: "18 KB",
    submitted_at: daysAgo(4),
    status: "graded",
    score: 44, feedback: "Good structure overall. The Product interface is well-typed. However, the Cart generic is missing the quantity field and the Order status enum needs more states.",
    graded_at: daysAgo(3), graded_by: "Nabonsi Niguse",
    is_late: false,
  },
  {
    id: "sub6",
    assignment_id: "asgn4",
    student_id: "u3", student_name: "Keab Niguse", student_avatar: "KN",
    text_response: "",
    file_name: "pandas-analysis-keab.ipynb", file_size: "2.1 MB",
    submitted_at: daysAgo(2),
    status: "graded",
    score: 78, feedback: "Solid EDA work. The visualisations are clear and the insights are relevant. Missing one visualisation — only 4 of the required 5 were included.",
    graded_at: daysAgo(1), graded_by: "Nabonsi Niguse",
    is_late: false,
  },
];

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Learning Shorts mock data
// ---------------------------------------------------------------------------
export interface Short {
  id: string;
  title: string;
  description: string;
  teacher_name: string;
  teacher_avatar: string;
  course_id: string;
  course_title: string;
  category: string;
  duration: string;
  thumbnail_gradient: string;
  thumbnail_img: string;       // Unsplash still frame shown before play
  video_url: string;           // Real embeddable video (YouTube nocookie)
  likes: number;
  views: number;
  tags: string[];
  created_at: string;
  is_published?: boolean;      // teacher/admin can toggle
}

export const mockShorts: Short[] = [
  {
    id: "sh1",
    title: "What is the Virtual DOM?",
    description: "In 90 seconds: how React's Virtual DOM makes UI updates fast by diffing a lightweight copy of the real DOM before committing changes.",
    teacher_name: "Nabonsi Niguse", teacher_avatar: "NN",
    course_id: "c1", course_title: "Modern Web Development",
    category: "Development", duration: "1:32",
    thumbnail_gradient: "from-emerald-500 to-teal-700",
    thumbnail_img: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=700&fit=crop",
    video_url: "https://www.youtube-nocookie.com/embed/BYbgopx44vo?autoplay=1&mute=0&controls=1&rel=0",
    likes: 11, views: 17, tags: ["react", "dom", "performance"],
    created_at: "2026-04-28", is_published: true,
  },
  {
    id: "sh2",
    title: "CSS Flexbox in 2 Minutes",
    description: "Master the core flexbox properties — display, flex-direction, justify-content, align-items — with visual examples you can use immediately.",
    teacher_name: "Lemi Melkamu", teacher_avatar: "LM",
    course_id: "c2", course_title: "UI/UX Design Foundations",
    category: "Design", duration: "2:05",
    thumbnail_gradient: "from-sky-500 to-indigo-700",
    thumbnail_img: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=700&fit=crop",
    video_url: "https://www.youtube-nocookie.com/embed/fYq5PXgSsbE?autoplay=1&mute=0&controls=1&rel=0",
    likes: 9, views: 12, tags: ["css", "flexbox", "layout"],
    created_at: "2026-04-27", is_published: true,
  },
  {
    id: "sh3",
    title: "useState vs useReducer",
    description: "When should you reach for useReducer instead of useState? This short explains the decision with a real counter example.",
    teacher_name: "Nabonsi Niguse", teacher_avatar: "NN",
    course_id: "c1", course_title: "Modern Web Development",
    category: "Development", duration: "1:58",
    thumbnail_gradient: "from-violet-500 to-purple-700",
    thumbnail_img: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=700&fit=crop",
    video_url: "https://www.youtube-nocookie.com/embed/3VClygDRSsU?autoplay=1&mute=0&controls=1&rel=0",
    likes: 7, views: 14, tags: ["react", "hooks", "state"],
    created_at: "2026-04-26", is_published: true,
  },
  {
    id: "sh4",
    title: "Python List Comprehensions",
    description: "Replace verbose for-loops with clean, readable list comprehensions. Covers basic syntax, conditions, and nested comprehensions.",
    teacher_name: "Nabonsi Niguse", teacher_avatar: "NN",
    course_id: "c3", course_title: "Data Science with Python",
    category: "Data", duration: "2:20",
    thumbnail_gradient: "from-amber-500 to-orange-700",
    thumbnail_img: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=700&fit=crop",
    video_url: "https://www.youtube-nocookie.com/embed/AhSvKGTh28Q?autoplay=1&mute=0&controls=1&rel=0",
    likes: 6, views: 9, tags: ["python", "lists", "syntax"],
    created_at: "2026-04-25", is_published: true,
  },
  {
    id: "sh5",
    title: "The 8pt Grid System",
    description: "Why every spacing value in your design should be a multiple of 8. This principle creates visual harmony and speeds up your workflow.",
    teacher_name: "Lemi Melkamu", teacher_avatar: "LM",
    course_id: "c2", course_title: "UI/UX Design Foundations",
    category: "Design", duration: "1:45",
    thumbnail_gradient: "from-rose-500 to-pink-700",
    thumbnail_img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=700&fit=crop",
    video_url: "https://www.youtube-nocookie.com/embed/YyN0YTmmC3I?autoplay=1&mute=0&controls=1&rel=0",
    likes: 8, views: 11, tags: ["design", "grid", "spacing"],
    created_at: "2026-04-24", is_published: true,
  },
  {
    id: "sh6",
    title: "TypeScript Generics Explained",
    description: "Generics let you write reusable, type-safe code. See how <T> works with a simple identity function and a typed array utility.",
    teacher_name: "Nabonsi Niguse", teacher_avatar: "NN",
    course_id: "c1", course_title: "Modern Web Development",
    category: "Development", duration: "2:10",
    thumbnail_gradient: "from-cyan-500 to-blue-700",
    thumbnail_img: "https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=400&h=700&fit=crop",
    video_url: "https://www.youtube-nocookie.com/embed/nViEqpgwxHE?autoplay=1&mute=0&controls=1&rel=0",
    likes: 5, views: 13, tags: ["typescript", "generics", "types"],
    created_at: "2026-04-23", is_published: true,
  },
  {
    id: "sh7",
    title: "pandas .groupby() in 90s",
    description: "Group your DataFrame by a column and apply aggregations like sum, mean, and count. Essential for any data analysis workflow.",
    teacher_name: "Nabonsi Niguse", teacher_avatar: "NN",
    course_id: "c3", course_title: "Data Science with Python",
    category: "Data", duration: "1:38",
    thumbnail_gradient: "from-lime-500 to-green-700",
    thumbnail_img: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=700&fit=crop",
    video_url: "https://www.youtube-nocookie.com/embed/txMdrV1Ut64?autoplay=1&mute=0&controls=1&rel=0",
    likes: 4, views: 8, tags: ["pandas", "python", "data"],
    created_at: "2026-04-22", is_published: true,
  },
  {
    id: "sh8",
    title: "Contrast Ratios & Accessibility",
    description: "WCAG requires a 4.5:1 contrast ratio for normal text. Learn how to check and fix contrast issues in your designs quickly.",
    teacher_name: "Lemi Melkamu", teacher_avatar: "LM",
    course_id: "c2", course_title: "UI/UX Design Foundations",
    category: "Design", duration: "1:52",
    thumbnail_gradient: "from-fuchsia-500 to-pink-700",
    thumbnail_img: "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=700&fit=crop",
    video_url: "https://www.youtube-nocookie.com/embed/Iqf4J2eDMio?autoplay=1&mute=0&controls=1&rel=0",
    likes: 6, views: 10, tags: ["accessibility", "design", "wcag"],
    created_at: "2026-04-21", is_published: true,
  },
];

// ---------------------------------------------------------------------------
// Certificate mock data
// ---------------------------------------------------------------------------
export interface Certificate {
  id: string;           // e.g. "CERT-2026-A1B2C3"
  course_id: string;
  course_title: string;
  course_category: string;
  student_id: string;
  student_name: string;
  instructor_name: string;
  issued_date: string;  // ISO date
  completion_date: string;
  grade: string;        // "Distinction" | "Merit" | "Pass"
  score: number;        // final score percentage
}

export const mockCertificates: Certificate[] = [
  {
    id: "CERT-2026-KN4821",
    course_id: "c4",
    course_title: "Digital Marketing Mastery",
    course_category: "Marketing",
    student_id: "u3",
    student_name: "Keab Niguse",
    instructor_name: "Lemi Melkamu",
    issued_date: "2026-04-15",
    completion_date: "2026-04-14",
    grade: "Distinction",
    score: 96,
  },
];

// ---------------------------------------------------------------------------
// Student Results — calculated from assignments + quizzes + attendance
// Used by the Results page for all three roles
// ---------------------------------------------------------------------------
export interface StudentResult {
  student_id: string;
  student_name: string;
  student_avatar: string;
  course_id: string;
  course_title: string;
  instructor: string;
  // Component scores (all out of 100)
  assignment_score: number;   // avg of graded assignments
  quiz_score: number;         // avg of quiz attempts
  attendance_score: number;   // % present/excused
  progress_score: number;     // % lessons completed
  // Calculated
  final_grade: number;        // weighted average
  grade_letter: "A+" | "A" | "B+" | "B" | "C+" | "C" | "D" | "F";
  status: "passing" | "at_risk" | "failing";
  last_active: string;
}

function letterGrade(score: number): StudentResult["grade_letter"] {
  if (score >= 95) return "A+";
  if (score >= 90) return "A";
  if (score >= 85) return "B+";
  if (score >= 80) return "B";
  if (score >= 75) return "C+";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

function calcFinal(a: number, q: number, att: number, prog: number) {
  // Weights: assignments 40%, quizzes 30%, attendance 15%, progress 15%
  return Math.round(a * 0.4 + q * 0.3 + att * 0.15 + prog * 0.15);
}

export const mockStudentResults: StudentResult[] = [
  // Modern Web Development (Nabonsi Niguse)
  {
    student_id: "u3", student_name: "Keab Niguse", student_avatar: "KN",
    course_id: "c1", course_title: "Modern Web Development", instructor: "Nabonsi Niguse",
    assignment_score: 78, quiz_score: 100, attendance_score: 90, progress_score: 75,
    final_grade: calcFinal(78, 100, 90, 75),
    grade_letter: letterGrade(calcFinal(78, 100, 90, 75)),
    status: "passing", last_active: "2 hours ago",
  },
  {
    student_id: "u4", student_name: "Eyob Haile", student_avatar: "EH",
    course_id: "c1", course_title: "Modern Web Development", instructor: "Nabonsi Niguse",
    assignment_score: 92, quiz_score: 60, attendance_score: 80, progress_score: 60,
    final_grade: calcFinal(92, 60, 80, 60),
    grade_letter: letterGrade(calcFinal(92, 60, 80, 60)),
    status: "passing", last_active: "1 day ago",
  },
  {
    student_id: "u6", student_name: "Mikiyas Niguse", student_avatar: "MN",
    course_id: "c1", course_title: "Modern Web Development", instructor: "Nabonsi Niguse",
    assignment_score: 55, quiz_score: 45, attendance_score: 60, progress_score: 40,
    final_grade: calcFinal(55, 45, 60, 40),
    grade_letter: letterGrade(calcFinal(55, 45, 60, 40)),
    status: "at_risk", last_active: "3 days ago",
  },
  {
    student_id: "s10", student_name: "Niguse Tsegaye", student_avatar: "NT",
    course_id: "c1", course_title: "Modern Web Development", instructor: "Nabonsi Niguse",
    assignment_score: 88, quiz_score: 82, attendance_score: 95, progress_score: 88,
    final_grade: calcFinal(88, 82, 95, 88),
    grade_letter: letterGrade(calcFinal(88, 82, 95, 88)),
    status: "passing", last_active: "5 hours ago",
  },
  {
    student_id: "s11", student_name: "John Wabskill", student_avatar: "JW",
    course_id: "c1", course_title: "Modern Web Development", instructor: "Nabonsi Niguse",
    assignment_score: 40, quiz_score: 35, attendance_score: 50, progress_score: 30,
    final_grade: calcFinal(40, 35, 50, 30),
    grade_letter: letterGrade(calcFinal(40, 35, 50, 30)),
    status: "failing", last_active: "1 week ago",
  },
  // UI/UX Design Foundations (Lemi Melkamu)
  {
    student_id: "u3", student_name: "Keab Niguse", student_avatar: "KN",
    course_id: "c2", course_title: "UI/UX Design Foundations", instructor: "Lemi Melkamu",
    assignment_score: 88, quiz_score: 75, attendance_score: 85, progress_score: 32,
    final_grade: calcFinal(88, 75, 85, 32),
    grade_letter: letterGrade(calcFinal(88, 75, 85, 32)),
    status: "passing", last_active: "2 hours ago",
  },
  {
    student_id: "u6", student_name: "Mikiyas Niguse", student_avatar: "MN",
    course_id: "c2", course_title: "UI/UX Design Foundations", instructor: "Lemi Melkamu",
    assignment_score: 88, quiz_score: 90, attendance_score: 88, progress_score: 70,
    final_grade: calcFinal(88, 90, 88, 70),
    grade_letter: letterGrade(calcFinal(88, 90, 88, 70)),
    status: "passing", last_active: "Yesterday",
  },
];

// ---------------------------------------------------------------------------
// Grade Corrections & Appeals mock data
// ---------------------------------------------------------------------------
export type AppealStatus = "pending" | "reviewed" | "escalated" | "approved" | "rejected";

export interface GradeCorrection {
  id: string;
  submission_id: string;
  assignment_id: string;
  student_id: string;
  student_name: string;
  student_avatar: string;
  corrected_by: string;
  corrected_by_role: "teacher" | "super_admin";
  old_score: number | null;
  new_score: number;
  reason: string;
  created_at: string;
}

export interface GradeAppeal {
  id: string;
  submission_id: string;
  assignment_id: string;
  student_id: string;
  student_name: string;
  student_avatar: string;
  reason: string;
  status: AppealStatus;
  teacher_response: string;
  teacher_reviewed_by: string | null;
  teacher_reviewed_at: string | null;
  override_score: number | null;
  override_reason: string;
  override_by: string | null;
  override_at: string | null;
  created_at: string;
  updated_at: string;
}

export const mockGradeCorrections: GradeCorrection[] = [
  {
    id: "gc1",
    submission_id: "sub2",
    assignment_id: "asgn1",
    student_id: "u4", student_name: "Eyob Haile", student_avatar: "EH",
    corrected_by: "Nabonsi Niguse",
    corrected_by_role: "teacher",
    old_score: 92,
    new_score: 88,
    reason: "Deducted 4 points — submission was missing the error boundary requirement per rubric.",
    created_at: daysAgo(1),
  },
];

export const mockGradeAppeals: GradeAppeal[] = [
  {
    id: "ap1",
    submission_id: "sub2",
    assignment_id: "asgn1",
    student_id: "u4", student_name: "Eyob Haile", student_avatar: "EH",
    reason: "I believe the deduction was unfair. The rubric did not explicitly require error boundaries for this assignment level. Please review.",
    status: "pending",
    teacher_response: "",
    teacher_reviewed_by: null,
    teacher_reviewed_at: null,
    override_score: null,
    override_reason: "",
    override_by: null,
    override_at: null,
    created_at: daysAgo(0),
    updated_at: daysAgo(0),
  },
  {
    id: "ap2",
    submission_id: "sub4",
    assignment_id: "asgn3",
    student_id: "u6", student_name: "Mikiyas Niguse", student_avatar: "MN",
    reason: "My Figma prototype had consistent spacing — I used an 8pt grid throughout. I'd like this reviewed.",
    status: "escalated",
    teacher_response: "I reviewed the submission again. The spacing inconsistency was in the mobile breakpoint, not the desktop view. I'm escalating for a second opinion.",
    teacher_reviewed_by: "Lemi Melkamu",
    teacher_reviewed_at: daysAgo(1),
    override_score: null,
    override_reason: "",
    override_by: null,
    override_at: null,
    created_at: daysAgo(2),
    updated_at: daysAgo(1),
  },
];

// ---------------------------------------------------------------------------
// Shared in-memory appeals store
// Both the Results page (student submit) and Grade Management page (teacher/
// admin view) read and write to this same array so appeals appear immediately.
// ---------------------------------------------------------------------------
const _appealsStore: GradeAppeal[] = [...mockGradeAppeals];

export const appealsStore = {
  getAll: (): GradeAppeal[] => [..._appealsStore],
  add: (appeal: GradeAppeal) => { _appealsStore.unshift(appeal); },
  update: (id: string, patch: Partial<GradeAppeal>) => {
    const idx = _appealsStore.findIndex((a) => a.id === id);
    if (idx !== -1) _appealsStore[idx] = { ..._appealsStore[idx], ...patch };
  },
};

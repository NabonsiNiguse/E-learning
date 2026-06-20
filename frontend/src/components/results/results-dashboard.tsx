import { useState, useEffect, useMemo } from 'react';
import {
  Plus, Search, Edit2, Trash2, ChevronLeft, ChevronRight, Filter,
  AlertCircle, CheckCircle, X, Loader, TrendingUp, Users, Award, BookOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { getResults, createResult, updateResult, deleteResult } from '@/lib/api-results';

// ─────────────────────────────────────────────────────────────────────────
// Types & Interfaces
// ─────────────────────────────────────────────────────────────────────────

interface StudentResult {
  id: string;
  name: string;
  rollNumber: string;
  subject: string;
  score: number; // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  teacherName: string;
  dateUpdated: string;
}

type SortField = 'name' | 'score' | 'subject' | 'dateUpdated';
type SortOrder = 'asc' | 'desc';

interface FormData {
  name: string;
  rollNumber: string;
  subject: string;
  score: number;
  teacherName: string;
}

interface Alert {
  type: 'success' | 'error' | 'info';
  message: string;
}

// ─────────────────────────────────────────────────────────────────────────
// Mock Data
// ─────────────────────────────────────────────────────────────────────────

const INITIAL_STUDENTS: StudentResult[] = [
  {
    id: '1',
    name: 'Aarav Sharma',
    rollNumber: 'S001',
    subject: 'Mathematics',
    score: 92,
    grade: 'A',
    teacherName: 'Dr. Rajesh Kumar',
    dateUpdated: '2026-06-15',
  },
  {
    id: '2',
    name: 'Priya Patel',
    rollNumber: 'S002',
    subject: 'Physics',
    score: 88,
    grade: 'B',
    teacherName: 'Prof. Anjali Singh',
    dateUpdated: '2026-06-14',
  },
  {
    id: '3',
    name: 'Arjun Gupta',
    rollNumber: 'S003',
    subject: 'Chemistry',
    score: 78,
    grade: 'C',
    teacherName: 'Dr. Vikram Patel',
    dateUpdated: '2026-06-10',
  },
  {
    id: '4',
    name: 'Anaya Verma',
    rollNumber: 'S004',
    subject: 'English',
    score: 95,
    grade: 'A',
    teacherName: 'Ms. Neha Srivastava',
    dateUpdated: '2026-06-18',
  },
  {
    id: '5',
    name: 'Rohan Singh',
    rollNumber: 'S005',
    subject: 'Mathematics',
    score: 65,
    grade: 'D',
    teacherName: 'Dr. Rajesh Kumar',
    dateUpdated: '2026-06-12',
  },
  {
    id: '6',
    name: 'Zara Khan',
    rollNumber: 'S006',
    subject: 'Physics',
    score: 45,
    grade: 'F',
    teacherName: 'Prof. Anjali Singh',
    dateUpdated: '2026-06-09',
  },
  {
    id: '7',
    name: 'Devika Nair',
    rollNumber: 'S007',
    subject: 'Chemistry',
    score: 87,
    grade: 'B',
    teacherName: 'Dr. Vikram Patel',
    dateUpdated: '2026-06-17',
  },
  {
    id: '8',
    name: 'Karan Mehta',
    rollNumber: 'S008',
    subject: 'English',
    score: 72,
    grade: 'C',
    teacherName: 'Ms. Neha Srivastava',
    dateUpdated: '2026-06-11',
  },
];

const SUBJECTS = ['Mathematics', 'Physics', 'Chemistry', 'English', 'Biology', 'History'];
const GRADES = ['A', 'B', 'C', 'D', 'F'];
const ITEMS_PER_PAGE = 5;

// ─────────────────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────────────────

/**
 * Calculate grade based on score
 */
const calculateGrade = (score: number): StudentResult['grade'] => {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
};

/**
 * Generate unique ID
 */
const generateId = () => Math.random().toString(36).substr(2, 9);

/**
 * Get color for grade badge
 */
const getGradeColor = (grade: StudentResult['grade']): string => {
  const colors: Record<StudentResult['grade'], string> = {
    A: 'bg-emerald-500/10 text-emerald-700 border-emerald-200',
    B: 'bg-sky-500/10 text-sky-700 border-sky-200',
    C: 'bg-amber-500/10 text-amber-700 border-amber-200',
    D: 'bg-orange-500/10 text-orange-700 border-orange-200',
    F: 'bg-red-500/10 text-red-700 border-red-200',
  };
  return colors[grade];
};

/**
 * Format date for display
 */
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

// ─────────────────────────────────────────────────────────────────────────
// Subcomponents
// ─────────────────────────────────────────────────────────────────────────

/**
 * Summary Card Component
 */
interface SummaryCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: 'blue' | 'emerald' | 'purple' | 'amber';
}

const SummaryCard: React.FC<SummaryCardProps> = ({ icon, label, value, color }) => {
  const colorClasses: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-100 text-blue-600',
    emerald: 'bg-emerald-50 border-emerald-100 text-emerald-600',
    purple: 'bg-purple-50 border-purple-100 text-purple-600',
    amber: 'bg-amber-50 border-amber-100 text-amber-600',
  };

  return (
    <div className={cn('rounded-lg border p-4 sm:p-6', colorClasses[color])}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs sm:text-sm font-medium opacity-75">{label}</p>
          <p className="text-2xl sm:text-3xl font-bold mt-1">{value}</p>
        </div>
        <div className="h-10 w-10 sm:h-12 sm:w-12 opacity-20 flex items-center justify-center">
          {icon}
        </div>
      </div>
    </div>
  );
};

/**
 * Add/Edit Form Modal
 */
interface FormModalProps {
  isOpen: boolean;
  editingId: string | null;
  editingData: FormData;
  onClose: () => void;
  onSubmit: (data: FormData) => void;
  onChange: (field: keyof FormData, value: string | number) => void;
}

const FormModal: React.FC<FormModalProps> = ({
  isOpen,
  editingId,
  editingData,
  onClose,
  onSubmit,
  onChange,
}) => {
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  const validateForm = () => {
    const newErrors: typeof errors = {};
    if (!editingData.name.trim()) newErrors.name = 'Name is required';
    if (!editingData.rollNumber.trim()) newErrors.rollNumber = 'Roll Number is required';
    if (!editingData.subject.trim()) newErrors.subject = 'Subject is required';
    if (editingData.score < 0 || editingData.score > 100) newErrors.score = 'Score must be 0-100';
    if (!editingData.teacherName.trim()) newErrors.teacherName = 'Teacher Name is required';
    return newErrors;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    onSubmit(editingData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingId ? 'Edit Student Result' : 'Add New Student Result'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium">Student Name *</label>
            <Input
              value={editingData.name}
              onChange={(e) => onChange('name', e.target.value)}
              placeholder="e.g., Aarav Sharma"
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && <p className="text-xs text-red-600">{errors.name}</p>}
          </div>

          {/* Roll Number */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium">Roll Number *</label>
            <Input
              value={editingData.rollNumber}
              onChange={(e) => onChange('rollNumber', e.target.value)}
              placeholder="e.g., S001"
              className={errors.rollNumber ? 'border-red-500' : ''}
            />
            {errors.rollNumber && <p className="text-xs text-red-600">{errors.rollNumber}</p>}
          </div>

          {/* Subject */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium">Subject *</label>
            <select
              value={editingData.subject}
              onChange={(e) => onChange('subject', e.target.value)}
              className={cn(
                'w-full px-3 py-2 rounded-md border bg-background text-sm',
                errors.subject ? 'border-red-500' : 'border-input'
              )}
            >
              <option value="">Select a subject...</option>
              {SUBJECTS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            {errors.subject && <p className="text-xs text-red-600">{errors.subject}</p>}
          </div>

          {/* Score */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium">Score (0-100) *</label>
            <Input
              type="number"
              min="0"
              max="100"
              value={editingData.score}
              onChange={(e) => onChange('score', parseInt(e.target.value) || 0)}
              placeholder="e.g., 85"
              className={errors.score ? 'border-red-500' : ''}
            />
            {errors.score && <p className="text-xs text-red-600">{errors.score}</p>}
          </div>

          {/* Teacher Name */}
          <div className="space-y-1.5">
            <label className="block text-sm font-medium">Teacher Name *</label>
            <Input
              value={editingData.teacherName}
              onChange={(e) => onChange('teacherName', e.target.value)}
              placeholder="e.g., Dr. Rajesh Kumar"
              className={errors.teacherName ? 'border-red-500' : ''}
            />
            {errors.teacherName && <p className="text-xs text-red-600">{errors.teacherName}</p>}
          </div>

          <DialogFooter className="gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">{editingId ? 'Update' : 'Add'} Result</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

/**
 * Delete Confirmation Modal
 */
interface DeleteConfirmProps {
  isOpen: boolean;
  studentName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const DeleteConfirmModal: React.FC<DeleteConfirmProps> = ({
  isOpen,
  studentName,
  onConfirm,
  onCancel,
}) => (
  <Dialog open={isOpen} onOpenChange={onCancel}>
    <DialogContent className="max-w-sm">
      <DialogHeader>
        <DialogTitle>Delete Result?</DialogTitle>
      </DialogHeader>
      <p className="text-sm text-muted-foreground">
        Are you sure you want to delete the result for <span className="font-semibold">{studentName}</span>? This action cannot be undone.
      </p>
      <DialogFooter className="gap-2 pt-4">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="destructive" onClick={onConfirm}>
          Delete
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

/**
 * Alert Component
 */
interface AlertProps {
  alert: Alert | null;
  onClose: () => void;
}

const AlertComponent: React.FC<AlertProps> = ({ alert, onClose }) => {
  useEffect(() => {
    if (!alert) return;
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [alert, onClose]);

  if (!alert) return null;

  const isSuccess = alert.type === 'success';
  const bgColor = isSuccess ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200';
  const textColor = isSuccess ? 'text-emerald-700' : 'text-red-700';
  const Icon = isSuccess ? CheckCircle : AlertCircle;

  return (
    <div className={cn('fixed top-4 right-4 rounded-lg border p-4 flex items-center gap-3 max-w-sm', bgColor, textColor)}>
      <Icon className="h-4 w-4 shrink-0" />
      <p className="text-sm">{alert.message}</p>
      <button onClick={onClose} className="ml-auto shrink-0">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

/**
 * Loading Spinner
 */
const LoadingSpinner = () => (
  <div className="flex items-center justify-center py-12">
    <div className="text-center">
      <Loader className="h-8 w-8 animate-spin mx-auto text-primary mb-2" />
      <p className="text-sm text-muted-foreground">Loading results...</p>
    </div>
  </div>
);

/**
 * Empty State
 */
interface EmptyStateProps {
  onAddClick: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ onAddClick }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <Users className="h-12 w-12 text-muted-foreground/20 mb-3" />
    <p className="text-sm text-muted-foreground mb-4">No student results found</p>
    <Button onClick={onAddClick} size="sm">
      <Plus className="h-4 w-4 mr-2" />
      Add First Result
    </Button>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────
// Main Dashboard Component
// ─────────────────────────────────────────────────────────────────────────

export function ResultsDashboard() {
  // ─── State ───────────────────────────────────────────────────────────
  const [students, setStudents] = useState<StudentResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterGrade, setFilterGrade] = useState('');

  // Sorting
  const [sortField, setSortField] = useState<SortField>('dateUpdated');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Form Modal
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    rollNumber: '',
    subject: '',
    score: 0,
    teacherName: '',
  });

  // Delete Modal
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');

  // Alert
  const [alert, setAlert] = useState<Alert | null>(null);

  // ─── Lifecycle ───────────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true;
    setIsLoading(true);
    setFetchError(null);
    (async () => {
      try {
        const data = await getResults();
        if (!mounted) return;
        const list: StudentResult[] = Array.isArray(data) ? data : (data as any)?.results ?? [];
        setStudents(list as StudentResult[]);
      } catch (err: any) {
        console.error('Failed to fetch results', err);
        setFetchError(err?.message ?? 'Failed to load results');
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const refetchResults = async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const data = await getResults();
      const list: StudentResult[] = Array.isArray(data) ? data : (data as any)?.results ?? [];
      setStudents(list as StudentResult[]);
    } catch (err: any) {
      console.error('Refetch failed', err);
      setFetchError(err?.message ?? 'Failed to load results');
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Handlers ────────────────────────────────────────────────────────

  const handleAddClick = () => {
    setEditingId(null);
    setFormData({
      name: '',
      rollNumber: '',
      subject: '',
      score: 0,
      teacherName: '',
    });
    setIsFormOpen(true);
  };

  const handleEditClick = (student: StudentResult) => {
    setEditingId(student.id);
    setFormData({
      name: student.name,
      rollNumber: student.rollNumber,
      subject: student.subject,
      score: student.score,
      teacherName: student.teacherName,
    });
    setIsFormOpen(true);
  };

  const handleFormSubmit = (data: FormData) => {
    setIsFormOpen(false);
    setCurrentPage(1); // Reset to first page

    (async () => {
      try {
        if (editingId) {
          // Optimistically update UI
          setStudents((prev) =>
            prev.map((s) =>
              s.id === editingId
                ? { ...s, ...data, grade: calculateGrade(data.score), dateUpdated: new Date().toISOString().split('T')[0] }
                : s
            )
          );
          await updateResult(editingId, {
            raw_score: data.score,
            name: data.name,
            rollNumber: data.rollNumber,
            subject: data.subject,
            teacherName: data.teacherName,
          });
          setAlert({ type: 'success', message: 'Result updated successfully!' });
        } else {
          const payload = {
            raw_score: data.score,
            name: data.name,
            rollNumber: data.rollNumber,
            subject: data.subject,
            teacherName: data.teacherName,
          };
          const created = await createResult(payload);
          const createdObj: StudentResult = (created && (created as any).id)
            ? (created as any)
            : {
                id: generateId(),
                ...data,
                grade: calculateGrade(data.score),
                dateUpdated: new Date().toISOString().split('T')[0],
              };
          setStudents((prev) => [createdObj, ...prev]);
          setAlert({ type: 'success', message: 'Result added successfully!' });
        }
      } catch (err: any) {
        console.error('Save failed', err);
        setAlert({ type: 'error', message: err?.message ?? 'Failed to save result' });
      }
    })();
  };

  const handleFormChange = (field: keyof FormData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleDeleteClick = (id: string, name: string) => {
    setDeleteConfirmId(id);
    setDeleteConfirmName(name);
  };

  const handleDeleteConfirm = () => {
    if (!deleteConfirmId) return;
    const idToDelete = deleteConfirmId;
    const previous = students;
    // Optimistically remove
    setStudents((prev) => prev.filter((s) => s.id !== idToDelete));
    setDeleteConfirmId(null);
    setCurrentPage(1);
    (async () => {
      try {
        await deleteResult(idToDelete);
        setAlert({ type: 'success', message: 'Result deleted successfully!' });
      } catch (err: any) {
        console.error('Delete failed', err);
        setAlert({ type: 'error', message: err?.message ?? 'Failed to delete' });
        // rollback
        setStudents(previous);
      }
    })();
  };

  // ─── Computed Values ─────────────────────────────────────────────────

  // Filter students
  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const matchesSearch =
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.rollNumber.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSubject = !filterSubject || student.subject === filterSubject;
      const matchesGrade = !filterGrade || student.grade === filterGrade;
      return matchesSearch && matchesSubject && matchesGrade;
    });
  }, [students, searchQuery, filterSubject, filterGrade]);

  // Sort students
  const sortedStudents = useMemo(() => {
    const sorted = [...filteredStudents].sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];

      if (sortField === 'score') {
        aVal = a.score;
        bVal = b.score;
      }

      if (typeof aVal === 'string') aVal = aVal.toLowerCase();
      if (typeof bVal === 'string') bVal = bVal.toLowerCase();

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
    return sorted;
  }, [filteredStudents, sortField, sortOrder]);

  // Paginate
  const totalPages = Math.ceil(sortedStudents.length / ITEMS_PER_PAGE);
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedStudents.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedStudents, currentPage]);

  // Summary stats
  const stats = useMemo(() => {
    if (students.length === 0) return { totalStudents: 0, avgGrade: 0, topClass: '—', activeTeachers: 0 };
    
    const avgGrade = (students.reduce((sum, s) => sum + s.score, 0) / students.length).toFixed(1);
    const subjectCounts = students.reduce((acc, s) => {
      acc[s.subject] = (acc[s.subject] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const topClass = Object.entries(subjectCounts).sort(([, a], [, b]) => b - a)[0]?.[0] || '—';
    const uniqueTeachers = new Set(students.map((s) => s.teacherName)).size;

    return {
      totalStudents: students.length,
      avgGrade: parseFloat(avgGrade),
      topClass,
      activeTeachers: uniqueTeachers,
    };
  }, [students]);

  // ─────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Results Dashboard</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">Manage student academic performance</p>
        </div>

        {/* Loading State */}
        {isLoading && <LoadingSpinner />}

        {!isLoading && (
          <>
                {/* Error Banner */}
                {fetchError && (
                  <div className="mb-4 rounded-md border bg-red-50 border-red-100 p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="h-5 w-5 text-red-600" />
                      <div>
                        <p className="text-sm font-medium text-red-700">Failed to load results</p>
                        <p className="text-xs text-red-600">{fetchError}</p>
                      </div>
                    </div>
                    <div>
                      <Button onClick={refetchResults} size="sm">Retry</Button>
                    </div>
                  </div>
                )}

                {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <SummaryCard
                icon={<Users className="h-6 w-6" />}
                label="Total Students"
                value={stats.totalStudents}
                color="blue"
              />
              <SummaryCard
                icon={<TrendingUp className="h-6 w-6" />}
                label="Average Score"
                value={`${stats.avgGrade}%`}
                color="emerald"
              />
              <SummaryCard
                icon={<BookOpen className="h-6 w-6" />}
                label="Top Subject"
                value={stats.topClass}
                color="purple"
              />
              <SummaryCard
                icon={<Award className="h-6 w-6" />}
                label="Active Teachers"
                value={stats.activeTeachers}
                color="amber"
              />
            </div>

            {/* Toolbar */}
            <div className="bg-white rounded-lg border p-4 sm:p-6 mb-6 space-y-4">
              {/* Search & Add Button */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or roll number..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-10"
                  />
                </div>
                <Button onClick={handleAddClick} className="gap-2 whitespace-nowrap">
                  <Plus className="h-4 w-4" />
                  Add Result
                </Button>
              </div>

              {/* Filters & Sorting */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Subject Filter */}
                <select
                  value={filterSubject}
                  onChange={(e) => {
                    setFilterSubject(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 rounded-md border border-input bg-background text-sm"
                >
                  <option value="">All Subjects</option>
                  {SUBJECTS.map((subject) => (
                    <option key={subject} value={subject}>
                      {subject}
                    </option>
                  ))}
                </select>

                {/* Grade Filter */}
                <select
                  value={filterGrade}
                  onChange={(e) => {
                    setFilterGrade(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="px-3 py-2 rounded-md border border-input bg-background text-sm"
                >
                  <option value="">All Grades</option>
                  {GRADES.map((grade) => (
                    <option key={grade} value={grade}>
                      Grade {grade}
                    </option>
                  ))}
                </select>

                {/* Sort */}
                <div className="flex gap-2">
                  <select
                    value={sortField}
                    onChange={(e) => setSortField(e.target.value as SortField)}
                    className="flex-1 px-3 py-2 rounded-md border border-input bg-background text-sm"
                  >
                    <option value="dateUpdated">Latest</option>
                    <option value="score">Score</option>
                    <option value="name">Name</option>
                    <option value="subject">Subject</option>
                  </select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                    title={`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
                  >
                    {sortOrder === 'asc' ? '↑' : '↓'}
                  </Button>
                </div>
              </div>

              {/* Active Filters Summary */}
              {(searchQuery || filterSubject || filterGrade) && (
                <div className="flex flex-wrap gap-2 items-center text-xs text-muted-foreground">
                  <Filter className="h-3 w-3" />
                  <span>
                    Showing {paginatedStudents.length} of {filteredStudents.length} results
                  </span>
                </div>
              )}
            </div>

            {/* Results Table / List */}
            <div className="bg-white rounded-lg border">
              {sortedStudents.length === 0 ? (
                <EmptyState onAddClick={handleAddClick} />
              ) : (
                <>
                  {/* Desktop Table */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full">
                      <thead className="border-b bg-slate-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Name</th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Roll No.</th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Subject</th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Score</th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Grade</th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Teacher</th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Updated</th>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {paginatedStudents.map((student) => (
                          <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-3 text-sm font-medium">{student.name}</td>
                            <td className="px-6 py-3 text-sm text-muted-foreground">{student.rollNumber}</td>
                            <td className="px-6 py-3 text-sm">{student.subject}</td>
                            <td className="px-6 py-3 text-sm font-semibold">{student.score}%</td>
                            <td className="px-6 py-3">
                              <Badge
                                variant="outline"
                                className={cn('font-bold text-xs', getGradeColor(student.grade))}
                              >
                                {student.grade}
                              </Badge>
                            </td>
                            <td className="px-6 py-3 text-sm text-muted-foreground">{student.teacherName}</td>
                            <td className="px-6 py-3 text-sm text-muted-foreground">
                              {formatDate(student.dateUpdated)}
                            </td>
                            <td className="px-6 py-3">
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleEditClick(student)}
                                  title="Edit"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteClick(student.id, student.name)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  title="Delete"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Card List */}
                  <div className="md:hidden space-y-3 p-4 sm:p-6">
                    {paginatedStudents.map((student) => (
                      <div key={student.id} className="rounded-lg border p-4 space-y-3 hover:bg-slate-50 transition-colors">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm truncate">{student.name}</p>
                            <p className="text-xs text-muted-foreground">{student.rollNumber}</p>
                          </div>
                          <Badge
                            variant="outline"
                            className={cn('font-bold text-xs shrink-0', getGradeColor(student.grade))}
                          >
                            {student.grade}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <p className="text-muted-foreground">Subject</p>
                            <p className="font-medium">{student.subject}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Score</p>
                            <p className="font-semibold">{student.score}%</p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-muted-foreground">Teacher</p>
                            <p className="font-medium">{student.teacherName}</p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-muted-foreground">Updated</p>
                            <p className="font-medium">{formatDate(student.dateUpdated)}</p>
                          </div>
                        </div>

                        <div className="flex gap-2 pt-2 border-t">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditClick(student)}
                            className="flex-1"
                          >
                            <Edit2 className="h-3.5 w-3.5 mr-2" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteClick(student.id, student.name)}
                            className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-3.5 w-3.5 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="border-t px-6 py-4 flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        Page {currentPage} of {totalPages} • {sortedStudents.length} total results
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4 mr-1" />
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                        >
                          Next
                          <ChevronRight className="h-4 w-4 ml-1" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* Modals & Alerts */}
      <FormModal
        isOpen={isFormOpen}
        editingId={editingId}
        editingData={formData}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        onChange={handleFormChange}
      />

      <DeleteConfirmModal
        isOpen={deleteConfirmId !== null}
        studentName={deleteConfirmName}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirmId(null)}
      />

      <AlertComponent alert={alert} onClose={() => setAlert(null)} />
    </div>
  );
}

export default ResultsDashboard;

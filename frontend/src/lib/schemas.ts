/**
 * Zod validation schemas — shared between Login, Register, Profile, and
 * content-creation forms.
 *
 * Why client-side validation?
 * ───────────────────────────
 * • Gives instant, user-friendly error feedback before a network round-trip.
 * • Prevents obviously malformed payloads from ever hitting the server,
 *   reducing noise in server logs.
 * • Does NOT replace server-side validation — the Django serializers are
 *   the authoritative source of truth.
 */

import { z } from "zod";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Rejects strings that contain HTML tags or JS-injection patterns. */
const noHtml = z
  .string()
  .refine(
    (v) => !/<[^>]+>|javascript\s*:|on\w+\s*=/i.test(v),
    { message: "Input must not contain HTML or script content." }
  );

const shortText  = noHtml.max(255, "Must be 255 characters or fewer.");
const longText   = noHtml.max(5000, "Must be 5000 characters or fewer.");
const emailField = z
  .string()
  .min(1, "Email is required.")
  .max(254, "Email too long.")
  .email("Enter a valid email address.");

const passwordField = z
  .string()
  .min(8,  "Password must be at least 8 characters.")
  .max(128, "Password is too long.")
  .regex(/[A-Z]/,       "Must contain at least one uppercase letter.")
  .regex(/[0-9]/,       "Must contain at least one number.")
  .regex(/[^A-Za-z0-9]/, "Must contain at least one special character.");

// ─── Auth schemas ─────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  email:    emailField,
  password: z.string().min(1, "Password is required."),
});
export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    first_name: shortText.min(1, "First name is required."),
    last_name:  shortText.min(1, "Last name is required."),
    email:      emailField,
    password:   passwordField,
    password2:  z.string().min(1, "Please confirm your password."),
    role:       z.enum(["student", "teacher"], {
      errorMap: () => ({ message: "Select a valid role." }),
    }),
    terms:      z.literal(true, {
      errorMap: () => ({ message: "You must accept the Terms and Privacy Policy." }),
    }),
  })
  .refine((d) => d.password === d.password2, {
    message: "Passwords don't match.",
    path:    ["password2"],
  });
export type RegisterFormData = z.infer<typeof registerSchema>;

// ─── Profile / account schemas ───────────────────────────────────────────────

export const profileSchema = z.object({
  first_name:      shortText.min(1, "First name is required."),
  last_name:       shortText.min(1, "Last name is required."),
  teacher_profile: z
    .object({
      bio:       longText.optional(),
      expertise: shortText.optional(),
      website:   z.string().url("Enter a valid URL.").or(z.literal("")).optional(),
    })
    .optional(),
  student_profile: z
    .object({
      bio: longText.optional(),
    })
    .optional(),
});
export type ProfileFormData = z.infer<typeof profileSchema>;

export const changePasswordSchema = z
  .object({
    old_password: z.string().min(1, "Current password is required."),
    new_password: passwordField,
    confirm:      z.string().min(1, "Please confirm your new password."),
  })
  .refine((d) => d.new_password === d.confirm, {
    message: "Passwords don't match.",
    path:    ["confirm"],
  });
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;

// ─── Course / content schemas ─────────────────────────────────────────────────

export const courseCreateSchema = z.object({
  title:       shortText.min(3, "Title must be at least 3 characters."),
  description: longText.min(10, "Description must be at least 10 characters."),
  category:    shortText.optional(),
  tags:        shortText.optional(),
  is_premium:  z.boolean().optional(),
  price:       z.number().min(0).max(9999).optional(),
});
export type CourseCreateFormData = z.infer<typeof courseCreateSchema>;

export const assignmentCreateSchema = z.object({
  title:        shortText.min(3, "Title must be at least 3 characters."),
  description:  shortText.optional(),
  instructions: longText.optional(),
  due_date:     z.string().min(1, "Due date is required."),
  max_score:    z.number().int().min(1).max(1000),
});
export type AssignmentCreateFormData = z.infer<typeof assignmentCreateSchema>;

export const questionSchema = z.object({
  title: shortText.min(5, "Question title must be at least 5 characters."),
  body:  longText.min(10, "Please provide more detail (at least 10 characters)."),
});
export type QuestionFormData = z.infer<typeof questionSchema>;

export const answerSchema = z.object({
  body: longText.min(5, "Answer must be at least 5 characters."),
});
export type AnswerFormData = z.infer<typeof answerSchema>;

// ─── Helper: format Zod errors for display ────────────────────────────────────

/** Returns a flat { fieldName: "first error message" } map from a ZodError. */
export function flattenZodErrors(
  error: z.ZodError
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

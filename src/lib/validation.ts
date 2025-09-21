import { z } from "zod";

// Common validation schemas
export const emailSchema = z
  .string()
  .min(1, "Email is required")
  .email("Please enter a valid email address");

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must contain at least one special character");

export const nameSchema = z
  .string()
  .min(1, "Name is required")
  .min(2, "Name must be at least 2 characters")
  .max(50, "Name must be less than 50 characters");

export const urlSchema = z
  .string()
  .url("Please enter a valid URL")
  .optional()
  .or(z.literal(""));

// Authentication schemas
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  fullName: z.string().min(1, "Full name is required").max(100, "Full name must be less than 100 characters"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Profile schemas
export const profileSchema = z.object({
  full_name: nameSchema.optional(),
  career_focus: z.string().max(100, "Career focus must be less than 100 characters").optional(),
  skills: z.array(z.string()).optional(),
  experience: z.string().max(1000, "Experience must be less than 1000 characters").optional(),
  current_status: z.string().max(100, "Current status must be less than 100 characters").optional(),
  portfolio: urlSchema,
});

export const profileSectionSchema = z.object({
  key: z.string().min(1, "Section key is required"),
  title: z.string().min(1, "Section title is required"),
  type: z.string().min(1, "Section type is required"),
  position: z.number().int().min(0),
  content: z.record(z.string(), z.unknown()),
});

// Project schemas
export const projectSchema = z.object({
  name: z.string().min(1, "Project name is required").max(100, "Project name must be less than 100 characters"),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
  status: z.enum(["planning", "active", "completed", "on-hold"]),
  client_name: z.string().max(100, "Client name must be less than 100 characters").optional(),
  client_email: emailSchema.optional(),
  client_company: z.string().max(100, "Company name must be less than 100 characters").optional(),
  client_phone: z.string().max(20, "Phone number must be less than 20 characters").optional(),
  client_notes: z.string().max(500, "Client notes must be less than 500 characters").optional(),
});

export const clientSchema = z.object({
  name: z.string().min(1, "Client name is required").max(100, "Client name must be less than 100 characters"),
  email: emailSchema.optional(),
  company: z.string().max(100, "Company name must be less than 100 characters").optional(),
  phone: z.string().max(20, "Phone number must be less than 20 characters").optional(),
  notes: z.string().max(500, "Notes must be less than 500 characters").optional(),
});

// Learning resource schemas
export const learningResourceSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title must be less than 200 characters"),
  description: z.string().max(500, "Description must be less than 500 characters").optional(),
  url: z.string().url("Please enter a valid URL"),
  category: z.enum(["programming", "design", "business", "marketing", "data-science", "devops", "other"]),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  estimated_time: z.number().int().min(1, "Estimated time must be at least 1 minute").max(10080, "Estimated time must be less than 1 week"),
  tags: z.array(z.string()).optional(),
  rating: z.number().int().min(0).max(5).optional(),
});

// Hours/Calendar schemas
export const calendarAvailabilitySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  start_time: z.string().regex(/^\d{2}:\d{2}$/, "Start time must be in HH:MM format"),
  end_time: z.string().regex(/^\d{2}:\d{2}$/, "End time must be in HH:MM format"),
  title: z.string().max(100, "Title must be less than 100 characters").optional(),
  notes: z.string().max(500, "Notes must be less than 500 characters").optional(),
  availability_type: z.enum(["available", "busy", "tentative"]),
}).refine((data) => {
  const start = new Date(`2000-01-01T${data.start_time}:00`);
  const end = new Date(`2000-01-01T${data.end_time}:00`);
  return end > start;
}, {
  message: "End time must be after start time",
  path: ["end_time"],
});

// Task schemas
export const taskSchema = z.object({
  title: z.string().min(1, "Task title is required").max(200, "Task title must be less than 200 characters"),
  description: z.string().max(1000, "Description must be less than 1000 characters").optional(),
  status: z.enum(["todo", "in-progress", "completed"]),
  priority: z.enum(["low", "medium", "high"]),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Due date must be in YYYY-MM-DD format").optional(),
  assigned_to: z.string().uuid("Invalid user ID").optional(),
});

// Message schemas
export const messageSchema = z.object({
  content: z.string().min(1, "Message content is required").max(1000, "Message must be less than 1000 characters"),
});

// File upload schemas
export const fileUploadSchema = z.object({
  filename: z.string().min(1, "Filename is required"),
  file_size: z.number().int().min(1, "File size must be greater than 0").max(50 * 1024 * 1024, "File size must be less than 50MB"),
  file_type: z.string().min(1, "File type is required"),
});

// Utility functions
export function validateEmail(email: string): { isValid: boolean; error?: string } {
  try {
    emailSchema.parse(email);
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { isValid: false, error: error.issues[0].message };
    }
    return { isValid: false, error: "Invalid email" };
  }
}

export function validatePassword(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push("Password must be at least 8 characters");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number");
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateUrl(url: string): { isValid: boolean; error?: string } {
  try {
    urlSchema.parse(url);
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { isValid: false, error: error.issues[0].message };
    }
    return { isValid: false, error: "Invalid URL" };
  }
}

// Form validation helper
export function validateForm<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean;
  data?: T;
  errors?: Record<string, string[]>;
} {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string[]> = {};
      error.issues.forEach((err) => {
        const path = err.path.join(".");
        if (!errors[path]) {
          errors[path] = [];
        }
        errors[path].push(err.message);
      });
      return { success: false, errors };
    }
    return { success: false, errors: { general: ["Validation failed"] } };
  }
}

// Real-time validation hook
export function useValidation<T>(schema: z.ZodSchema<T>) {
  const [errors, setErrors] = React.useState<Record<string, string[]>>({});
  const [isValid, setIsValid] = React.useState(false);

  const validate = React.useCallback((data: unknown) => {
    const result = validateForm(schema, data);
    setErrors(result.errors || {});
    setIsValid(result.success);
    return result;
  }, [schema]);

  const clearErrors = React.useCallback(() => {
    setErrors({});
    setIsValid(false);
  }, []);

  return {
    errors,
    isValid,
    validate,
    clearErrors,
  };
}

// Import React for the hook
import React from "react";

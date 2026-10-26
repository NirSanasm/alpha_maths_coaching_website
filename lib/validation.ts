import { z } from "zod";

const indianPhoneRegex = /^(?:\+91|91)?[6-9]\d{9}$/;

export function normalizePhoneNumber(phone: string): string {
  const cleaned = phone.replace(/[\s\-()]/g, "");
  if (cleaned.startsWith("+91")) {
    return cleaned.slice(3);
  }
  if (cleaned.startsWith("91") && cleaned.length === 12) {
    return cleaned.slice(2);
  }
  return cleaned;
}

export const admissionFormSchema = z.object({
  fullName: z
    .string()
    .min(2, "Full name is required (minimum 2 characters)")
    .max(100, "Full name cannot exceed 100 characters")
    .transform((val) => val.trim().toUpperCase()),
  dob: z
    .string()
    .min(1, "Date of birth is required")
    .refine((val) => {
      const date = new Date(val);
      if (isNaN(date.getTime())) return false;
      const today = new Date();
      const age = today.getFullYear() - date.getFullYear();
      return age >= 8 && age <= 25;
    }, "Please provide a valid date of birth (student age 8-25)"),
  gender: z.enum(["Male", "Female", "Other"], {
    message: "Please select a gender",
  }),
  fatherName: z
    .string()
    .min(2, "Father's name is required")
    .max(100, "Father's name cannot exceed 100 characters")
    .transform((val) => val.trim()),
  guardianName: z
    .string()
    .max(100, "Guardian's name cannot exceed 100 characters")
    .optional()
    .transform((val) => (val ? val.trim() : "")),
  address: z
    .string()
    .min(5, "Complete address is required")
    .max(300, "Address cannot exceed 300 characters")
    .transform((val) => val.trim()),
  currentClass: z
    .string()
    .min(1, "Current class is required")
    .max(50, "Class cannot exceed 50 characters")
    .transform((val) => val.trim()),
  school: z
    .string()
    .min(2, "School name is required")
    .max(150, "School name cannot exceed 150 characters")
    .transform((val) => val.trim()),
  contactNumber: z
    .string()
    .min(1, "Contact number is required")
    .refine(
      (val) => indianPhoneRegex.test(val.replace(/[\s\-()]/g, "")),
      "Enter a valid 10-digit Indian mobile number"
    )
    .transform(normalizePhoneNumber),
  whatsappNumber: z
    .string()
    .min(1, "WhatsApp number is required")
    .refine(
      (val) => indianPhoneRegex.test(val.replace(/[\s\-()]/g, "")),
      "Enter a valid 10-digit WhatsApp mobile number"
    )
    .transform(normalizePhoneNumber),
  courseCategory: z.enum(["A - Class IX", "B - Class X"], {
    message: "Please select course category A or B",
  }),
  declaration: z.boolean().refine((val) => val === true, {
    message: "You must accept the declaration to submit your application",
  }),
  honeypot: z.string().optional(),
});

export type AdmissionFormValues = z.infer<typeof admissionFormSchema>;

export const adminLoginSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

export const updateSubmissionSchema = z.object({
  status: z.enum(["New", "Contacted", "Admitted", "Rejected"]),
  adminNotes: z.string().max(1000).optional(),
});

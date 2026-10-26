export type SubmissionStatus = "New" | "Contacted" | "Admitted" | "Rejected";
export type CourseCategory = "A - Class IX" | "B - Class X";

export interface Submission {
  id: string;
  form_no: string;
  full_name: string;
  dob: string;
  gender: string;
  father_name: string;
  guardian_name?: string | null;
  address: string;
  current_class: string;
  school: string;
  contact_number: string;
  whatsapp_number: string;
  course_category: CourseCategory;
  photo_key?: string | null;
  photo_mime?: string | null;
  photo_size?: number | null;
  status: SubmissionStatus;
  admin_notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AdminStats {
  total: number;
  classIX: number;
  classX: number;
  statusNew: number;
  statusContacted: number;
  statusAdmitted: number;
  statusRejected: number;
}

import { createClient } from "@supabase/supabase-js";

// —— Students database (first Supabase project) ——
const studentsUrl =
  import.meta.env.VITE_SUPABASE_STUDENTS_URL ?? "https://twygdynogtjqulkobhsv.supabase.co";
const studentsKey =
  import.meta.env.VITE_SUPABASE_STUDENTS_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3eWdkeW5vZ3RqcXVsa29iaHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA0NTA5NDksImV4cCI6MjA4NjAyNjk0OX0.9WFWafcYC7fUC8wCgnHLLzgKzdvtAiPBjBNLMjCxRf8";

export const supabaseStudents = createClient(studentsUrl, studentsKey);

// —— Teachers database (second Supabase project) ——
const teachersUrl =
  import.meta.env.VITE_SUPABASE_TEACHERS_URL ?? "https://suzfqdinxinywbnmdxfx.supabase.co";
const teachersKey =
  import.meta.env.VITE_SUPABASE_TEACHERS_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN1emZxZGlueGlueXdibm1keGZ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3NDI2NDMsImV4cCI6MjA4NjMxODY0M30.96g5KWq26xztjUfTfBi5Z4xBo0r4LdTp3ZuPofqcTWU";

export const supabaseTeachers = createClient(teachersUrl, teachersKey);

// Table names – must match your Supabase schema
export const TABLES = {
  students: "students",
  teachers: "teachers",
  // Students-per-month per teacher (your table: teacher_month_students)
  monthly_records: "teacher_month_students",
} as const;

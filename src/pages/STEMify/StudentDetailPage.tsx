import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../components/ui/table";
import { supabaseStudents, supabaseTeachers, TABLES } from "../../lib/supabase";

type SubscriptionRow = {
  teacher_id: string;
  teacher_name: string | null;
  month_number: number;
  grade?: number;
  created_at?: string | null;
};

const MONTH_NAMES: Record<number, string> = {
  1: "1st",
  2: "2nd",
  3: "3rd",
  4: "4th",
  5: "5th",
  6: "6th",
  7: "7th",
  8: "8th",
  9: "9th",
  10: "10th",
  11: "11th",
  12: "12th",
};

function monthLabel(monthNumber: number): string {
  return MONTH_NAMES[monthNumber] ?? `Month ${monthNumber}`;
}

export default function StudentDetailPage() {
  const { studentId } = useParams<{ studentId: string }>();
  const [studentName, setStudentName] = useState<string | null>(null);
  const [subscriptions, setSubscriptions] = useState<SubscriptionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!studentId) return;

    (async () => {
      setError(null);
      try {
        const decodedId = decodeURIComponent(studentId);

        const { data: studentData } = await supabaseStudents
          .from(TABLES.students)
          .select("name, student_id")
          .eq("student_id", decodedId)
          .maybeSingle();

        if (studentData?.name) setStudentName(studentData.name);

        const { data: rows, error: e } = await supabaseTeachers
          .from(TABLES.monthly_records)
          .select("teacher_id, teacher_name, month_number, grade, created_at")
          .eq("student_id", decodedId)
          .order("month_number", { ascending: true });

        if (e) {
          setError(e.message);
          setLoading(false);
          return;
        }

        setSubscriptions((rows ?? []) as SubscriptionRow[]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, [studentId]);

  const displayName = studentName ?? (studentId ? `Student ${decodeURIComponent(studentId)}` : "Student");

  return (
    <>
      <PageMeta title={`${displayName} · Subscriptions | STEMify Admin`} description="Student subscriptions" />
      <PageBreadcrumb pageTitle={`${displayName} — Subscriptions`} />
      <div className="space-y-6">
        <ComponentCard
          title="Teachers & months subscribed"
          desc="Teachers this student is subscribed with and the month for each subscription."
        >
          {error && (
            <p className="mb-4 text-sm text-red-500 dark:text-red-400">{error}</p>
          )}
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="max-w-full overflow-x-auto">
              <Table>
                <TableHeader className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
                  <TableRow>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Teacher</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Month</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Grade</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={3} className="px-5 py-8 text-center text-gray-500 dark:text-gray-400">
                        Loading…
                      </TableCell>
                    </TableRow>
                  ) : subscriptions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="px-5 py-8 text-center text-gray-500 dark:text-gray-400">
                        No subscriptions found for this student.
                      </TableCell>
                    </TableRow>
                  ) : (
                    subscriptions.map((sub, i) => (
                      <TableRow key={`${sub.teacher_id}-${sub.month_number}-${i}`}>
                        <TableCell className="px-5 py-4 text-start text-theme-sm dark:text-white/90">{sub.teacher_name ?? "—"}</TableCell>
                        <TableCell className="px-5 py-4 text-start text-theme-sm dark:text-gray-400">{monthLabel(sub.month_number)}</TableCell>
                        <TableCell className="px-5 py-4 text-start text-theme-sm dark:text-gray-400">{sub.grade ?? "—"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </ComponentCard>

        <p>
          <Link to="/TailAdmin/students" className="text-brand-500 hover:underline text-sm">
            ← Back to students
          </Link>
        </p>
      </div>
    </>
  );
}

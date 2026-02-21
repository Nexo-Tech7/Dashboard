import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../components/ui/table";
import { supabaseTeachers, TABLES } from "../../lib/supabase";
import { getPriceForTeacher } from "../../lib/pricePerTeacher";

type RecordRow = {
  id?: number;
  student_id: string | null;
  teacher_name: string | null;
  grade?: string | number | null;
  created_at: string | null;
};

export default function MonthDetailPage() {
  const { teacherId, monthNumber } = useParams<{ teacherId: string; monthNumber: string }>();
  const [rows, setRows] = useState<RecordRow[]>([]);
  const [teacherName, setTeacherName] = useState<string | null>(null);
  const [price, setPrice] = useState(getPriceForTeacher(teacherId ?? ""));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const monthNum = monthNumber ? parseInt(monthNumber, 10) : 0;

  useEffect(() => {
    if (!teacherId || !monthNumber) return;

    (async () => {
      setError(null);
      try {
        const [recordsRes, teacherRes] = await Promise.all([
          supabaseTeachers
            .from(TABLES.monthly_records)
            .select("id, student_id, teacher_name, grade, created_at")
            .eq("teacher_id", teacherId)
            .eq("month_number", monthNum)
            .order("created_at", { ascending: false }),
          supabaseTeachers.from(TABLES.teachers).select("price_per_student").or(`user_id.eq.${teacherId},id.eq.${teacherId}`).maybeSingle(),
        ]);

        if (recordsRes.error) {
          setError(recordsRes.error.message);
          setLoading(false);
          return;
        }

        const arr = (recordsRes.data ?? []) as RecordRow[];
        setRows(arr);
        if (arr.length > 0 && arr[0].teacher_name) setTeacherName(arr[0].teacher_name);

        const teacherData = teacherRes.data as { price_per_student?: number | null } | null;
        if (teacherData?.price_per_student != null && teacherData.price_per_student >= 0) setPrice(teacherData.price_per_student);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, [teacherId, monthNumber]);

  const handlePriceChange = async (v: number) => {
    if (Number.isNaN(v) || v < 0 || !teacherId) return;
    setPrice(v);
    await supabaseTeachers.from(TABLES.teachers).update({ price_per_student: v }).or(`user_id.eq.${teacherId},id.eq.${teacherId}`);
  };

  const studentCount = rows.length;
  const totalMoney = studentCount * price;
  const displayName = teacherName ?? `Teacher ${teacherId}`;

  return (
    <>
      <PageMeta title={`Month ${monthNum} · ${displayName} | STEMify Admin`} description="Month details" />
      <PageBreadcrumb pageTitle={`Month ${monthNum} — ${displayName}`} />
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
            <span className="text-sm text-gray-500 dark:text-gray-400">Students in this month</span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">{loading ? "…" : studentCount}</h4>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
            <span className="text-sm text-gray-500 dark:text-gray-400">Price per one student (this teacher)</span>
            <input
              type="number"
              min={0}
              step={1}
              value={price}
              onChange={(e) => handlePriceChange(Number(e.target.value))}
              className="mt-2 block h-10 w-32 rounded-lg border border-gray-200 px-3 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
            />
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
            <span className="text-sm text-gray-500 dark:text-gray-400">Total (students × price)</span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">{loading ? "…" : totalMoney.toLocaleString()}</h4>
          </div>
        </div>

        <ComponentCard title={`Students in Month ${monthNum}`}>
          {error && (
            <p className="mb-4 text-sm text-red-500 dark:text-red-400">{error}</p>
          )}
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="max-w-full overflow-x-auto">
              <Table>
                <TableHeader className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
                  <TableRow>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Student ID</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Grade</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Created</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={3} className="px-5 py-8 text-center text-gray-500 dark:text-gray-400">
                        Loading…
                      </TableCell>
                    </TableRow>
                  ) : rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="px-5 py-8 text-center text-gray-500 dark:text-gray-400">
                        No records
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((r, i) => (
                      <TableRow key={r.id ?? i}>
                        <TableCell className="px-5 py-4 text-start text-theme-sm dark:text-white/90">{r.student_id ?? "—"}</TableCell>
                        <TableCell className="px-5 py-4 text-start text-theme-sm dark:text-gray-400">{r.grade != null ? String(r.grade) : "—"}</TableCell>
                        <TableCell className="px-5 py-4 text-start text-theme-sm dark:text-gray-400">
                          {r.created_at ? new Date(r.created_at).toLocaleDateString(undefined, { dateStyle: "short" }) : "—"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </ComponentCard>

        <p>
          <Link to={`/teachers/${encodeURIComponent(teacherId ?? "")}`} className="text-brand-500 hover:underline text-sm">
            ← Back to teacher months
          </Link>
        </p>
      </div>
    </>
  );
}

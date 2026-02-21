import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../components/ui/table";
import { supabaseTeachers, TABLES } from "../../lib/supabase";
import { getPriceForTeacher } from "../../lib/pricePerTeacher";

type MonthRow = { month_number: number; teacher_name: string | null; count: number };

export default function TeacherDetailPage() {
  const { teacherId } = useParams<{ teacherId: string }>();
  const [teacherName, setTeacherName] = useState<string | null>(null);
  const [months, setMonths] = useState<MonthRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [price, setPrice] = useState(getPriceForTeacher(teacherId ?? ""));

  useEffect(() => {
    if (!teacherId) return;

    (async () => {
      setError(null);
      try {
        let teacherData: { name?: string; price_per_student?: number | null } | null = null;
        const byUserId = await supabaseTeachers.from(TABLES.teachers).select("name, price_per_student").eq("user_id", teacherId).maybeSingle();
        if (byUserId.data) teacherData = byUserId.data;
        if (!teacherData?.name) {
          const byId = await supabaseTeachers.from(TABLES.teachers).select("name, price_per_student").eq("id", teacherId).maybeSingle();
          if (byId.data) teacherData = byId.data;
        }

        if (teacherData?.name) setTeacherName(teacherData.name);
        if (teacherData?.price_per_student != null && teacherData.price_per_student >= 0) setPrice(teacherData.price_per_student);

        const { data: rows, error: e } = await supabaseTeachers
          .from(TABLES.monthly_records)
          .select("month_number, teacher_name")
          .eq("teacher_id", teacherId);

        if (e) {
          setError(e.message);
          setLoading(false);
          return;
        }

        const list = (rows ?? []) as { month_number: number; teacher_name: string | null }[];
        const byMonth = new Map<number, { teacher_name: string | null; count: number }>();
        list.forEach((r) => {
          const m = r.month_number ?? 0;
          const cur = byMonth.get(m) ?? { teacher_name: r.teacher_name, count: 0 };
          cur.count += 1;
          byMonth.set(m, cur);
        });
        const arr: MonthRow[] = Array.from(byMonth.entries())
          .map(([month_number, v]) => ({ month_number, teacher_name: v.teacher_name, count: v.count }))
          .sort((a, b) => a.month_number - b.month_number);
        setMonths(arr);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    })();
  }, [teacherId]);

  const displayName = teacherName ?? (teacherId ? `Teacher ${teacherId}` : "Teacher");

  const handlePriceChange = async (v: number) => {
    if (Number.isNaN(v) || v < 0 || !teacherId) return;
    setPrice(v);
    await supabaseTeachers.from(TABLES.teachers).update({ price_per_student: v }).or(`user_id.eq.${teacherId},id.eq.${teacherId}`);
  };

  return (
    <>
      <PageMeta title={`${displayName} · Months | STEMify Admin`} description="Teacher months" />
      <PageBreadcrumb pageTitle={`${displayName} — Months`} />
      <div className="space-y-6">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <h3 className="text-sm font-medium text-gray-800 dark:text-white/90">Price per student per month (this teacher)</h3>
          <input
            type="number"
            min={0}
            step={1}
            value={price}
            onChange={(e) => handlePriceChange(Number(e.target.value))}
            className="mt-2 h-10 w-32 rounded-lg border border-gray-200 px-3 py-1.5 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
          />
        </div>
        <ComponentCard title={`Months by ${displayName}`}>
          {error && (
            <p className="mb-4 text-sm text-red-500 dark:text-red-400">{error}</p>
          )}
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="max-w-full overflow-x-auto">
              <Table>
                <TableHeader className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
                  <TableRow>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Month</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Students in month</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Actions</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={3} className="px-5 py-8 text-center text-gray-500 dark:text-gray-400">
                        Loading…
                      </TableCell>
                    </TableRow>
                  ) : months.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="px-5 py-8 text-center text-gray-500 dark:text-gray-400">
                        No months
                      </TableCell>
                    </TableRow>
                  ) : (
                    months.map((m) => (
                      <TableRow key={m.month_number}>
                        <TableCell className="px-5 py-4 text-start text-theme-sm dark:text-white/90">
                          Month {m.month_number}
                        </TableCell>
                        <TableCell className="px-5 py-4 text-start text-theme-sm dark:text-gray-400">{m.count}</TableCell>
                        <TableCell className="px-5 py-4 text-start text-theme-sm dark:text-gray-400">
                          <Link
                            to={`/TailAdmin/teachers/${encodeURIComponent(teacherId ?? "")}/month/${m.month_number}`}
                            className="text-brand-500 hover:underline text-theme-sm"
                          >
                            View details
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </ComponentCard>
      </div>
    </>
  );
}

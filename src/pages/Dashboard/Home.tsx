import { useEffect, useState } from "react";
import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import { GroupIcon, BoxIconLine, UserCircleIcon, DollarLineIcon } from "../../icons";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import { supabaseStudents, supabaseTeachers, TABLES } from "../../lib/supabase";
import { getPriceForTeacher } from "../../lib/pricePerTeacher";

type TeacherRow = { id?: string; user_id?: string; name?: string | null; price_per_student?: number | null };
type MonthRecord = { teacher_id?: string; teacher_name?: string | null; month_number?: number };

export default function Home() {
  const [studentCount, setStudentCount] = useState<number | null>(null);
  const [teacherCount, setTeacherCount] = useState<number | null>(null);
  const [monthCount, setMonthCount] = useState<number | null>(null);
  const [totalMoney, setTotalMoney] = useState<number | null>(null);
  const [teachers, setTeachers] = useState<TeacherRow[]>([]);
  const [monthRecords, setMonthRecords] = useState<MonthRecord[]>([]);
  const [monthRevenueMap, setMonthRevenueMap] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setError(null);
      try {
        const [studentsRes, teachersRes, monthsRes] = await Promise.all([
          supabaseStudents.from(TABLES.students).select("*"),
          supabaseTeachers.from(TABLES.teachers).select("*"),
          supabaseTeachers.from(TABLES.monthly_records).select("teacher_id, teacher_name, month_number"),
        ]);

        if (cancelled) return;

        const studentList = studentsRes.data ?? [];
        const sCount = studentsRes.count ?? studentList.length;
        const teacherList = (teachersRes.data ?? []) as TeacherRow[];
        const tCount = teacherList.length;
        setTeachers(teacherList);

        const rows = (monthsRes.data ?? []) as MonthRecord[];
        setMonthRecords(rows);

        setStudentCount(sCount);
        setTeacherCount(tCount);

        const seenMonths = new Set<string>();
        rows.forEach((r) => {
          seenMonths.add(`${r.teacher_id ?? ""}-${r.month_number ?? ""}`);
        });
        setMonthCount(seenMonths.size);

        // Price from Supabase (teachers table) or fallback
        const priceByTeacherId: Record<string, number> = {};
        teacherList.forEach((t) => {
          const tid = t.user_id ?? (t.id != null ? String(t.id) : "");
          if (tid) {
            const p = t.price_per_student;
            priceByTeacherId[tid] = typeof p === "number" && p >= 0 ? p : getPriceForTeacher(tid);
          }
        });

        // Revenue per month = for each (teacher_id, month_number), count × teacher price; then sum by month
        const monthRevenue: Record<number, number> = {};
        const keyCount: Record<string, number> = {};
        const SEP = "|";
        rows.forEach((r) => {
          const key = `${r.teacher_id ?? ""}${SEP}${r.month_number ?? ""}`;
          keyCount[key] = (keyCount[key] ?? 0) + 1;
        });
        let total = 0;
        Object.entries(keyCount).forEach(([key, count]) => {
          const idx = key.lastIndexOf(SEP);
          const tid = idx >= 0 ? key.slice(0, idx) : "";
          const month = idx >= 0 ? parseInt(key.slice(idx + 1), 10) || 0 : 0;
          const p = priceByTeacherId[tid] ?? getPriceForTeacher(tid);
          const rev = count * p;
          monthRevenue[month] = (monthRevenue[month] ?? 0) + rev;
          total += rev;
        });
        setMonthRevenueMap(monthRevenue);
        setTotalMoney(total);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  const formatMoney = (n: number) => (n ?? 0).toLocaleString();

  // Chart: Revenue by teacher (use price from teachers table)
  const teacherIds = teachers.map((t) => t.user_id ?? (t.id != null ? String(t.id) : "")).filter(Boolean);
  const teacherNames = teachers.map((t) => t.name || "—");
  const revenueByTeacher = teacherIds.map((tid) => {
    const count = monthRecords.filter((r) => (r.teacher_id ?? "") === tid).length;
    const t = teachers.find((x) => (x.user_id ?? (x.id != null ? String(x.id) : "")) === tid);
    const price = (t && typeof t.price_per_student === "number" && t.price_per_student >= 0) ? t.price_per_student : getPriceForTeacher(tid);
    return count * price;
  });

  // Chart: Students per month (all teachers combined)
  const monthNumbers = Array.from(new Set(monthRecords.map((r) => r.month_number ?? 0).filter(Boolean))).sort((a, b) => a - b);
  const studentsPerMonth = monthNumbers.map((m) => monthRecords.filter((r) => (r.month_number ?? 0) === m).length);

  const barOptions: ApexOptions = {
    colors: ["#0ea5e9", "#8b5cf6", "#10b981", "#f59e0b"],
    chart: { fontFamily: "Outfit, sans-serif", toolbar: { show: false } },
    plotOptions: {
      bar: { horizontal: false, columnWidth: "55%", borderRadius: 6, borderRadiusApplication: "end" },
    },
    dataLabels: { enabled: false },
    stroke: { show: true, width: 2, colors: ["transparent"] },
    xaxis: {
      categories: teacherNames.length ? teacherNames : ["No data"],
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: { labels: { style: { colors: "#6b7280" } } },
    grid: { yaxis: { lines: { show: true } }, xaxis: { lines: { show: false } } },
    fill: { opacity: 1 },
    tooltip: { y: { formatter: (v: number) => `${v}` } },
  };

  const monthBarOptions: ApexOptions = {
    colors: ["#0ea5e9"],
    chart: { fontFamily: "Outfit, sans-serif", toolbar: { show: false } },
    plotOptions: {
      bar: { horizontal: false, columnWidth: "65%", borderRadius: 6, borderRadiusApplication: "end" },
    },
    dataLabels: { enabled: false },
    stroke: { show: true, width: 2, colors: ["transparent"] },
    xaxis: {
      categories: monthNumbers.length ? monthNumbers.map((m) => `Month ${m}`) : ["No data"],
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: { labels: { style: { colors: "#6b7280" } } },
    grid: { yaxis: { lines: { show: true } }, xaxis: { lines: { show: false } } },
    fill: { opacity: 1 },
    tooltip: { y: { formatter: (v: number) => `${v} students` } },
  };

  return (
    <>
      <PageMeta
        title="STEMify Admin Dashboard"
        description="STEMify admin overview: students, teachers, months, and revenue"
      />
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        {/* Stats */}
        <div className="col-span-12">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6 lg:grid-cols-4">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-sky-100 dark:bg-sky-900/30">
                <GroupIcon className="size-6 text-sky-600 dark:text-sky-400" />
              </div>
              <div className="mt-5">
                <span className="text-sm text-gray-500 dark:text-gray-400">Students</span>
                <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
                  {loading ? "…" : error ? "—" : (studentCount ?? 0).toLocaleString()}
                </h4>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-violet-100 dark:bg-violet-900/30">
                <BoxIconLine className="size-6 text-violet-600 dark:text-violet-400" />
              </div>
              <div className="mt-5">
                <span className="text-sm text-gray-500 dark:text-gray-400">Months</span>
                <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
                  {loading ? "…" : error ? "—" : (monthCount ?? 0).toLocaleString()}
                </h4>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30">
                <UserCircleIcon className="size-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="mt-5">
                <span className="text-sm text-gray-500 dark:text-gray-400">Teachers</span>
                <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
                  {loading ? "…" : error ? "—" : (teacherCount ?? 0).toLocaleString()}
                </h4>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-white/[0.03] md:p-6">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-900/30">
                <DollarLineIcon className="size-6 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="mt-5">
                <span className="text-sm text-gray-500 dark:text-gray-400">Total revenue</span>
                <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
                  {loading ? "…" : error ? "—" : formatMoney(totalMoney ?? 0)}
                </h4>
              </div>
            </div>
          </div>

          {error && (
            <p className="mt-4 text-sm text-red-500 dark:text-red-400">{error}</p>
          )}
        </div>

        {/* Price note */}
        <div className="col-span-12">
          <div className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Set <strong>price per one student</strong> for each teacher in the <strong>Teachers</strong> table (Price/month column). When you open a teacher → select a month, you see (number of students × that price). Total revenue below is the sum of each month’s revenue.
            </p>
          </div>
        </div>

        {/* Revenue by month — total = sum of each month */}
        <div className="col-span-12">
          <ComponentCard title="Revenue by month" desc="Each month’s total (students × price per teacher); total money = sum of these.">
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/[0.03]">
              <div className="max-w-full overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
                    <tr>
                      <th className="px-5 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Month</th>
                      <th className="px-5 py-3 text-right font-medium text-gray-500 dark:text-gray-400">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                    {Object.entries(monthRevenueMap)
                      .sort(([a], [b]) => Number(a) - Number(b))
                      .map(([month, rev]) => (
                        <tr key={month}>
                          <td className="px-5 py-3 text-gray-800 dark:text-white/90">Month {month}</td>
                          <td className="px-5 py-3 text-right font-medium text-gray-800 dark:text-white/90">{rev.toLocaleString()}</td>
                        </tr>
                      ))}
                    {Object.keys(monthRevenueMap).length === 0 && !loading && (
                      <tr>
                        <td colSpan={2} className="px-5 py-6 text-center text-gray-500 dark:text-gray-400">No month data yet</td>
                      </tr>
                    )}
                    {Object.keys(monthRevenueMap).length > 0 && (
                      <tr className="border-t-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30">
                        <td className="px-5 py-3 font-semibold text-gray-800 dark:text-white/90">Total</td>
                        <td className="px-5 py-3 text-right font-semibold text-gray-800 dark:text-white/90">
                          {(totalMoney ?? 0).toLocaleString()}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </ComponentCard>
        </div>

        {/* Charts */}
        <div className="col-span-12 lg:col-span-6">
          <ComponentCard title="Revenue by teacher">
            <div className="min-h-[280px]">
              <Chart
                options={barOptions}
                series={[{ name: "Revenue", data: revenueByTeacher.length ? revenueByTeacher : [0] }]}
                type="bar"
                height={280}
              />
            </div>
          </ComponentCard>
        </div>
        <div className="col-span-12 lg:col-span-6">
          <ComponentCard title="Students per month">
            <div className="min-h-[280px]">
              <Chart
                options={monthBarOptions}
                series={[{ name: "Students", data: studentsPerMonth.length ? studentsPerMonth : [0] }]}
                type="bar"
                height={280}
              />
            </div>
          </ComponentCard>
        </div>
      </div>
    </>
  );
}

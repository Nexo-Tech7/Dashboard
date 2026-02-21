import { useEffect, useState } from "react";
import { Link } from "react-router";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../components/ui/table";
import { supabaseTeachers, TABLES } from "../../lib/supabase";
import { getPriceForTeacher } from "../../lib/pricePerTeacher";

type TeacherRow = {
  id?: string | number;
  user_id?: string | null;
  name?: string | null;
  email?: string | null;
  school?: string | null;
  subject?: string | null;
  price_per_student?: number | null;
  created_at?: string | null;
};

export default function TeachersPage() {
  const [rows, setRows] = useState<TeacherRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabaseTeachers
      .from(TABLES.teachers)
      .select("*")
      .then(({ data, error: e }) => {
        setLoading(false);
        if (e) {
          setError(e.message + " (Check table name and RLS policies in Supabase.)");
          return;
        }
        const list = (data ?? []) as TeacherRow[];
        list.sort((a, b) => {
          const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
          const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
          return tb - ta;
        });
        setRows(list);
      });
  }, []);

  const formatDate = (s: string | null) =>
    s ? new Date(s).toLocaleDateString(undefined, { dateStyle: "short" }) : "—";

  const downloadCSV = () => {
    const escape = (v: string | number | null | undefined) => {
      const s = String(v ?? "");
      if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };
    const headers = ["Name", "Email", "School", "Subject", "Price/month", "Created"];
    const rowData = rows.map((r) => {
      const tid = r.user_id ?? (r.id != null ? String(r.id) : "");
      const price = r.price_per_student != null && r.price_per_student >= 0 ? r.price_per_student : getPriceForTeacher(tid);
      return [
        r.name ?? "",
        r.email ?? "",
        r.school ?? "",
        r.subject ?? "",
        price,
        r.created_at ? formatDate(r.created_at) : "",
      ];
    });
    const csv = [headers.map(escape).join(","), ...rowData.map((row) => row.map(escape).join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `teachers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <PageMeta title="Teachers | STEMify Admin" description="Teachers list" />
      <PageBreadcrumb pageTitle="Teachers" />
      <div className="space-y-6">
        <ComponentCard title="Teachers" desc="Set price per one student for each teacher. When you open a teacher and select a month, revenue = number of students × this price.">
          <div className="flex justify-end mb-4">
            <button
              type="button"
              onClick={downloadCSV}
              disabled={loading || rows.length === 0}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download CSV
            </button>
          </div>
          {error && (
            <p className="mb-4 text-sm text-red-500 dark:text-red-400">{error}</p>
          )}
          <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-white/[0.03]">
            <div className="max-w-full overflow-x-auto">
              <Table>
                <TableHeader className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
                  <TableRow>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Name</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Email</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">School</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Subject</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Price/month</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Created</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Actions</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="px-5 py-8 text-center text-gray-500 dark:text-gray-400">
                        Loading…
                      </TableCell>
                    </TableRow>
                  ) : rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="px-5 py-8 text-center text-gray-500 dark:text-gray-400">
                        No teachers. Enable read access in the Teachers Supabase project — run supabase_teachers_rls.sql in SQL Editor.
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((r, i) => {
                      const tid = r.user_id ?? (r.id != null ? String(r.id) : "");
                      return (
                        <TableRow key={r.id ?? r.user_id ?? i}>
                          <TableCell className="px-5 py-4 text-start text-theme-sm dark:text-white/90">{r.name ?? "—"}</TableCell>
                          <TableCell className="px-5 py-4 text-start text-theme-sm dark:text-gray-400">{r.email ?? "—"}</TableCell>
                          <TableCell className="px-5 py-4 text-start text-theme-sm dark:text-gray-400">{r.school ?? "—"}</TableCell>
                          <TableCell className="px-5 py-4 text-start text-theme-sm dark:text-gray-400">{r.subject ?? "—"}</TableCell>
                          <TableCell className="px-5 py-4 text-start text-theme-sm dark:text-gray-400">
                            <input
                              type="number"
                              min={0}
                              step={1}
                              value={r.price_per_student != null && r.price_per_student >= 0 ? r.price_per_student : getPriceForTeacher(tid)}
                              onChange={(e) => {
                                const v = Number(e.target.value);
                                if (Number.isNaN(v) || v < 0) return;
                                setRows((prev) =>
                                  prev.map((row) =>
                                    (row.user_id ?? (row.id != null ? String(row.id) : "")) === tid
                                      ? { ...row, price_per_student: v }
                                      : row
                                  )
                                );
                              }}
                              onBlur={async (e) => {
                                const v = Number(e.target.value);
                                if (Number.isNaN(v) || v < 0) return;
                                await supabaseTeachers
                                  .from(TABLES.teachers)
                                  .update({ price_per_student: v })
                                  .or(`user_id.eq.${tid},id.eq.${tid}`);
                              }}
                              className="w-20 rounded border border-gray-200 px-2 py-1 text-sm dark:border-gray-700 dark:bg-gray-900 dark:text-white/90"
                            />
                          </TableCell>
                          <TableCell className="px-5 py-4 text-start text-theme-sm dark:text-gray-400">{formatDate(r.created_at)}</TableCell>
                          <TableCell className="px-5 py-4 text-start text-theme-sm dark:text-gray-400">
                            <Link
                              to={`/TailAdmin/teachers/${encodeURIComponent(tid)}`}
                              className="text-brand-500 hover:underline text-theme-sm"
                            >
                              View months
                            </Link>
                          </TableCell>
                        </TableRow>
                      );
                    })
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

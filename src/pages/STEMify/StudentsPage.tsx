import { useEffect, useState } from "react";
import { Link } from "react-router";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "../../components/ui/table";
import { supabaseStudents, TABLES } from "../../lib/supabase";

type StudentRow = {
  id?: number;
  student_id?: string | null;
  user_id?: string | null;
  name?: string | null;
  number?: string | null;
  parent_name?: string | null;
  parent_number?: string | null;
  email?: string | null;
  school?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export default function StudentsPage() {
  const [rows, setRows] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabaseStudents
      .from(TABLES.students)
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data, error: e }) => {
        setLoading(false);
        if (e) {
          setError(e.message);
          return;
        }
        setRows((data as StudentRow[]) ?? []);
      });
  }, []);

  const formatDate = (s: string | null | undefined) =>
    s ? new Date(s).toLocaleDateString(undefined, { dateStyle: "short" }) : "—";

  const downloadCSV = () => {
    const escape = (v: string | number | null | undefined) => {
      const s = String(v ?? "");
      if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };
    const headers = ["Student ID", "User ID", "Name", "Number", "Parent name", "Parent number", "Email", "School", "Created"];
    const rowData = rows.map((r) => [
      r.student_id ?? "",
      r.user_id ?? "",
      r.name ?? "",
      r.number ?? "",
      r.parent_name ?? "",
      r.parent_number ?? "",
      r.email ?? "",
      r.school ?? "",
      r.created_at ? formatDate(r.created_at) : "",
    ]);
    const csv = [headers.map(escape).join(","), ...rowData.map((row) => row.map(escape).join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `students-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <PageMeta title="Students | STEMify Admin" description="Students list" />
      <PageBreadcrumb pageTitle="Students" />
      <div className="space-y-6">
        <ComponentCard title="Students" desc="All data from your students database.">
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
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Student ID</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Name</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Actions</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Number</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Parent name</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Parent number</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Email</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">School</TableCell>
                    <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">Created</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={10} className="px-5 py-8 text-center text-gray-500 dark:text-gray-400">
                        Loading…
                      </TableCell>
                    </TableRow>
                  ) : rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="px-5 py-8 text-center text-gray-500 dark:text-gray-400">
                        No students
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((r, i) => {
                      const sid = r.student_id ?? (r.id != null ? String(r.id) : "");
                      return (
                        <TableRow key={r.id ?? r.student_id ?? i}>
                          <TableCell className="px-5 py-4 text-start text-theme-sm dark:text-white/90">{r.student_id ?? "—"}</TableCell>
                          <TableCell className="px-5 py-4 text-start text-theme-sm dark:text-white/90">{r.name ?? "—"}</TableCell>
                          <TableCell className="px-5 py-4 text-start text-theme-sm dark:text-gray-400">
                            {sid ? (
                              <Link
                                to={`/students/${encodeURIComponent(sid)}`}
                                className="text-brand-500 hover:underline text-theme-sm"
                              >
                                View subscriptions
                              </Link>
                            ) : (
                              "—"
                            )}
                          </TableCell>
                          <TableCell className="px-5 py-4 text-start text-theme-sm dark:text-gray-400">{r.number ?? "—"}</TableCell>
                          <TableCell className="px-5 py-4 text-start text-theme-sm dark:text-gray-400">{r.parent_name ?? "—"}</TableCell>
                          <TableCell className="px-5 py-4 text-start text-theme-sm dark:text-gray-400">{r.parent_number ?? "—"}</TableCell>
                          <TableCell className="px-5 py-4 text-start text-theme-sm dark:text-gray-400">{r.email ?? "—"}</TableCell>
                          <TableCell className="px-5 py-4 text-start text-theme-sm dark:text-gray-400">{r.school ?? "—"}</TableCell>
                          <TableCell className="px-5 py-4 text-start text-theme-sm dark:text-gray-400">{formatDate(r.created_at)}</TableCell>
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

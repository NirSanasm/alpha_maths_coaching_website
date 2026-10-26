"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Submission, AdminStats, SubmissionStatus } from "@/lib/types";
import {
  Search,
  Download,
  LogOut,
  ExternalLink,
  Phone,
  MessageCircle,
  Trash2,
  Eye,
  RefreshCw,
} from "lucide-react";

export default function AdminDashboard() {
  const router = useRouter();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Pagination
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("desc");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalSubmissions, setTotalSubmissions] = useState(0);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<Submission | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchSubmissions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        search,
        category,
        status,
        sort,
        page: String(page),
        limit: "15",
      });

      const res = await fetch(`/api/admin/submissions?${params.toString()}`);
      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to load submissions");
      }

      setSubmissions(data.submissions || []);
      setStats(data.stats || null);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalSubmissions(data.pagination?.total || 0);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Error connecting to server");
      }
    } finally {
      setLoading(false);
    }
  }, [search, category, status, sort, page, router]);

  useEffect(() => {
    let ignore = false;
    async function load() {
      if (!ignore) {
        await fetchSubmissions();
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [fetchSubmissions]);

  const handleStatusChange = async (id: string, newStatus: SubmissionStatus) => {
    try {
      const res = await fetch(`/api/admin/submissions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        throw new Error("Failed to update status");
      }

      setSubmissions((prev) =>
        prev.map((sub) => (sub.id === id ? { ...sub, status: newStatus } : sub))
      );
      fetchSubmissions();
    } catch (err) {
      console.error(err);
      alert("Failed to update status.");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/submissions/${deleteTarget.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to delete submission");
      }

      setDeleteTarget(null);
      fetchSubmissions();
    } catch (err) {
      console.error(err);
      alert("Failed to delete submission.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };

  const handleExportCsv = () => {
    const params = new URLSearchParams({ search, category, status });
    const link = document.createElement("a");
    link.href = `/api/admin/submissions/export?${params.toString()}`;
    link.setAttribute("download", `AMA_Submissions_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getStatusBadge = (s: SubmissionStatus) => {
    switch (s) {
      case "New":
        return "bg-sky-500/10 text-sky-400 border-sky-500/30";
      case "Contacted":
        return "bg-amber-500/10 text-amber-400 border-amber-500/30";
      case "Admitted":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
      case "Rejected":
        return "bg-rose-500/10 text-rose-400 border-rose-500/30";
      default:
        return "bg-slate-700 text-slate-300 border-slate-600";
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 antialiased pb-16">
      {/* Top Admin Bar */}
      <header className="border-b border-indigo-900/40 bg-slate-900/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white shadow-md shadow-indigo-600/30">
              α
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-wide">
                ALPHA MATHEMATICS ACADEMY — ADMIN
              </h1>
              <p className="text-xs text-indigo-300 font-meetei">
                ꯑꯜꯐꯥꯃꯦꯊꯦꯃꯦꯇꯤꯛꯁ ꯑꯦꯀꯥꯗꯦꯃꯤ (ꯕꯤꯁ꯭ꯅꯨꯄꯨꯔ)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/"
              target="_blank"
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1.5 border border-slate-700 transition-colors"
            >
              <span>Public Form</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 text-xs flex items-center gap-1.5 border border-rose-800/50 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 sm:py-8 space-y-6">
        {/* Metric Cards */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
              <p className="text-[11px] font-semibold text-slate-400">Total Forms</p>
              <p className="text-xl font-bold text-white mt-1">{stats.total}</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-indigo-900/50">
              <p className="text-[11px] font-semibold text-indigo-300">Class IX</p>
              <p className="text-xl font-bold text-indigo-400 mt-1">{stats.classIX}</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-sky-900/50">
              <p className="text-[11px] font-semibold text-sky-300">Class X</p>
              <p className="text-xl font-bold text-sky-400 mt-1">{stats.classX}</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-sky-900/30">
              <p className="text-[11px] font-semibold text-sky-400">New</p>
              <p className="text-xl font-bold text-sky-300 mt-1">{stats.statusNew}</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-amber-900/30">
              <p className="text-[11px] font-semibold text-amber-400">Contacted</p>
              <p className="text-xl font-bold text-amber-300 mt-1">{stats.statusContacted}</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-emerald-900/30">
              <p className="text-[11px] font-semibold text-emerald-400">Admitted</p>
              <p className="text-xl font-bold text-emerald-300 mt-1">{stats.statusAdmitted}</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-rose-900/30">
              <p className="text-[11px] font-semibold text-rose-400">Rejected</p>
              <p className="text-xl font-bold text-rose-300 mt-1">{stats.statusRejected}</p>
            </div>
          </div>
        )}

        {/* Search, Filter & Action Bar */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between gap-3">
          <div className="flex flex-1 flex-col sm:flex-row items-center gap-2.5">
            {/* Search */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search name, phone, form no..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Category Filter */}
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              className="w-full sm:w-auto px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">All Categories</option>
              <option value="A - Class IX">A - Class IX</option>
              <option value="B - Class X">B - Class X</option>
            </select>

            {/* Status Filter */}
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="w-full sm:w-auto px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="">All Statuses</option>
              <option value="New">New</option>
              <option value="Contacted">Contacted</option>
              <option value="Admitted">Admitted</option>
              <option value="Rejected">Rejected</option>
            </select>

            {/* Sort Order */}
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value);
                setPage(1);
              }}
              className="w-full sm:w-auto px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>

          <div className="flex items-center gap-2 justify-end">
            <button
              onClick={() => fetchSubmissions()}
              title="Refresh list"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={handleExportCsv}
              className="px-3.5 py-2 rounded-xl bg-emerald-700/80 hover:bg-emerald-600 text-emerald-100 text-xs font-semibold flex items-center gap-1.5 border border-emerald-600/40 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Submissions Table */}
        <div className="rounded-2xl bg-slate-900/90 border border-slate-800 overflow-hidden shadow-xl">
          {error && (
            <div className="p-4 bg-rose-950/80 border-b border-rose-800 text-rose-200 text-xs">
              {error}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4 font-semibold">Form No</th>
                  <th className="py-3 px-4 font-semibold">Full Name</th>
                  <th className="py-3 px-4 font-semibold">Course Category</th>
                  <th className="py-3 px-4 font-semibold">Contact / Phone</th>
                  <th className="py-3 px-4 font-semibold">WhatsApp</th>
                  <th className="py-3 px-4 font-semibold">Submitted</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading && submissions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500">
                      <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      Loading submissions...
                    </td>
                  </tr>
                ) : submissions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500">
                      No admission submissions match your search or filter criteria.
                    </td>
                  </tr>
                ) : (
                  submissions.map((sub) => (
                    <tr
                      key={sub.id}
                      className="hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <Link
                          href={`/admin/submissions/${sub.id}`}
                          className="font-mono font-bold text-indigo-400 hover:text-indigo-300 underline"
                        >
                          {sub.form_no}
                        </Link>
                      </td>
                      <td className="py-3 px-4 font-medium text-white">
                        {sub.full_name}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-sky-300 text-[11px]">
                          {sub.course_category}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <a
                          href={`tel:+91${sub.contact_number}`}
                          className="text-slate-300 hover:text-white flex items-center gap-1 font-mono"
                        >
                          <Phone className="w-3 h-3 text-slate-500" />
                          <span>{sub.contact_number}</span>
                        </a>
                      </td>
                      <td className="py-3 px-4">
                        <a
                          href={`https://wa.me/91${sub.whatsapp_number}?text=${encodeURIComponent(
                            `Hello ${sub.full_name}, this is Alpha Mathematics Academy regarding your admission Form No: ${sub.form_no}.`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-mono"
                        >
                          <MessageCircle className="w-3 h-3" />
                          <span>{sub.whatsapp_number}</span>
                        </a>
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-[11px]">
                        {new Date(sub.created_at).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={sub.status}
                          onChange={(e) =>
                            handleStatusChange(sub.id, e.target.value as SubmissionStatus)
                          }
                          className={`text-xs px-2 py-1 rounded-lg border font-semibold bg-slate-950 focus:outline-none ${getStatusBadge(
                            sub.status
                          )}`}
                        >
                          <option value="New">New</option>
                          <option value="Contacted">Contacted</option>
                          <option value="Admitted">Admitted</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link
                            href={`/admin/submissions/${sub.id}`}
                            title="View Full Detail"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(sub)}
                            title="Delete Submission"
                            className="p-1.5 rounded-lg bg-rose-950/50 hover:bg-rose-900 text-rose-300 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="px-4 py-3 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <div>
              Showing {submissions.length} of {totalSubmissions} submissions
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <span className="text-slate-300 font-medium">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">Confirm Deletion</h3>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              Are you sure you want to permanently delete submission{" "}
              <strong className="text-rose-400 font-mono">{deleteTarget.form_no}</strong> for student{" "}
              <strong className="text-white">{deleteTarget.full_name}</strong>?
              This will also purge the student&apos;s photo from Neon Object Storage.
            </p>
            <div className="flex justify-end gap-2.5">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                {isDeleting ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

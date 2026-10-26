"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Submission, SubmissionStatus } from "@/lib/types";
import {
  ArrowLeft,
  Printer,
  Phone,
  MessageCircle,
  User,
  Save,
  Trash2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";


function SubmissionDetailContent() {
  const router = useRouter();
  const routeParams = useParams();
  const id = routeParams?.id as string;

  const [submission, setSubmission] = useState<Submission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<SubmissionStatus>("New");
  const [adminNotes, setAdminNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/admin/submissions/${id}`);
        if (res.status === 401) {
          router.push("/admin/login");
          return;
        }
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to load submission");
        }
        setSubmission(data.submission);
        setStatus(data.submission.status);
        setAdminNotes(data.submission.admin_notes || "");
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Failed to fetch record");
        }
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id, router]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    try {
      const res = await fetch(`/api/admin/submissions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, adminNotes }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save updates");
      }
      setSaveMessage("Status and notes updated successfully!");
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err) {
      console.error(err);
      alert("Failed to save changes.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete form ${submission?.form_no}? This will also delete the student's photo from storage.`)) {
      return;
    }
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/submissions/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      router.push("/admin");
    } catch (err) {
      console.error(err);
      alert("Failed to delete submission.");
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mr-3" />
        Loading admission form details...
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="min-h-screen bg-slate-950 p-6 flex flex-col items-center justify-center text-center">
        <AlertCircle className="w-10 h-10 text-rose-500 mb-2" />
        <h2 className="text-xl font-bold text-white mb-2">Record Not Found</h2>
        <p className="text-sm text-slate-400 mb-4">{error || "Unable to locate this submission record."}</p>
        <Link
          href="/admin"
          className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
        >
          &larr; Back to Submissions
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 antialiased pb-20">
      {/* Top Nav (Hidden in Print) */}
      <div className="no-print border-b border-indigo-900/40 bg-slate-900/80 sticky top-0 z-30 backdrop-blur-md px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link
            href="/admin"
            className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Paper Form</span>
            </button>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-3.5 py-1.5 rounded-xl bg-rose-950/60 hover:bg-rose-900 text-rose-300 text-xs font-semibold flex items-center gap-1.5 border border-rose-800/50 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isDeleting ? "Deleting..." : "Delete"}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-6">
        {/* Admin Controls Card (Hidden in Print) */}
        <div className="no-print p-5 rounded-2xl bg-slate-900/90 border border-indigo-900/50 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Admission Status Workflow</span>
              </h2>
              <p className="text-xs text-slate-400">
                Update student status and maintain internal counseling notes.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as SubmissionStatus)}
                className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="New">New</option>
                <option value="Contacted">Contacted</option>
                <option value="Admitted">Admitted</option>
                <option value="Rejected">Rejected</option>
              </select>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-md shadow-emerald-600/30 cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? "Saving..." : "Save"}</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Internal Admin Notes / Counseling Remarks:
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Called parents on Oct 27, agreed to join Class X morning batch."
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {saveMessage && (
            <p className="text-xs text-emerald-400 font-medium flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>{saveMessage}</span>
            </p>
          )}
        </div>

        {/* Paper Form Layout (Print friendly & Web rendered) */}
        <div className="print-container bg-white text-black p-6 sm:p-10 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200">
          {/* Form Header */}
          <div className="border-b-2 border-slate-900 pb-4 mb-6 text-center">
            <div className="flex justify-between items-start">
              <div className="text-left">
                <span className="inline-block px-2.5 py-1 rounded bg-slate-100 border border-slate-300 font-mono text-xs font-bold text-slate-800">
                  FORM NO: {submission.form_no}
                </span>
                <p className="text-[11px] text-slate-600 mt-1">
                  Submitted: {new Date(submission.created_at).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })}
                </p>
              </div>

              <div className="flex-1 text-center px-4">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 uppercase">
                  ALPHA MATHEMATICS ACADEMY
                </h1>
                <p className="text-sm font-meetei font-bold text-slate-700 mt-0.5">
                  ꯑꯜꯐꯥꯃꯦꯊꯦꯃꯦꯇꯤꯛꯁ ꯑꯦꯀꯥꯗꯦꯃꯤ
                </p>
                <p className="text-xs italic text-slate-600 font-medium mt-1">
                  &ldquo;An academy of mathematics where we will nurture you with the beauty of mathematics&rdquo;
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Bishnupur, Near Mahei Leikol School, Manipur | Mob: +91 9366285519 / +91 84148 61984
                </p>
              </div>

              <div className="text-right">
                <span className="inline-block px-3 py-1 rounded bg-indigo-50 border border-indigo-200 text-indigo-900 font-bold text-xs">
                  {submission.course_category}
                </span>
                <p className="text-[11px] text-slate-600 mt-1 font-semibold">
                  Status: {submission.status}
                </p>
              </div>
            </div>
            <div className="mt-4 pt-2 border-t border-dashed border-slate-300">
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-800">
                ADMISSION APPLICATION FORM (SESSION 2027)
              </h2>
            </div>
          </div>

          {/* Form Body with Photo */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Student Photo */}
            <div className="md:col-span-1 flex flex-col items-center">
              <div className="w-32 h-40 border-2 border-slate-400 rounded-lg overflow-hidden bg-slate-50 flex items-center justify-center shadow-sm">
                {submission.photo_key ? (
                  // Authenticated photo stream route
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`/api/admin/photo/${submission.photo_key}`}
                    alt={`${submission.full_name}'s photo`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-2 text-slate-400 text-xs">
                    <User className="w-8 h-8 mx-auto mb-1 opacity-40" />
                    <span>No photo uploaded</span>
                  </div>
                )}
              </div>
              <p className="text-[10px] text-slate-500 mt-1 text-center">
                Passport Photograph
              </p>
            </div>

            {/* Student Details Fields */}
            <div className="md:col-span-3 space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 border-b border-slate-200 pb-2">
                <span className="font-bold text-slate-600 uppercase">1. Full Name:</span>
                <span className="sm:col-span-2 font-bold text-sm text-slate-900 uppercase">
                  {submission.full_name}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 border-b border-slate-200 pb-2">
                <span className="font-bold text-slate-600 uppercase">2. Date of Birth:</span>
                <span className="font-semibold text-slate-900">
                  {submission.dob ? new Date(submission.dob).toLocaleDateString("en-IN") : "N/A"}
                </span>
                <div className="flex gap-2">
                  <span className="font-bold text-slate-600 uppercase">Gender:</span>
                  <span className="font-semibold text-slate-900">{submission.gender}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 border-b border-slate-200 pb-2">
                <span className="font-bold text-slate-600 uppercase">3. Father&apos;s Name:</span>
                <span className="sm:col-span-2 font-semibold text-slate-900">
                  {submission.father_name}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 border-b border-slate-200 pb-2">
                <span className="font-bold text-slate-600 uppercase">4. Guardian&apos;s Name:</span>
                <span className="sm:col-span-2 font-semibold text-slate-900">
                  {submission.guardian_name || "—"}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 border-b border-slate-200 pb-2">
                <span className="font-bold text-slate-600 uppercase">5. Permanent Address:</span>
                <span className="sm:col-span-2 text-slate-900 font-medium leading-relaxed">
                  {submission.address}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 border-b border-slate-200 pb-2">
                <span className="font-bold text-slate-600 uppercase">6. Present Class:</span>
                <span className="font-semibold text-slate-900">{submission.current_class}</span>
                <div className="flex gap-2">
                  <span className="font-bold text-slate-600 uppercase">School:</span>
                  <span className="font-semibold text-slate-900">{submission.school}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 border-b border-slate-200 pb-2">
                <span className="font-bold text-slate-600 uppercase">7. Contact Number:</span>
                <span className="font-mono font-bold text-slate-900">
                  +91 {submission.contact_number}
                </span>
                <div className="flex gap-2">
                  <span className="font-bold text-slate-600 uppercase">WhatsApp:</span>
                  <span className="font-mono font-bold text-emerald-700">
                    +91 {submission.whatsapp_number}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 border-b border-slate-200 pb-2">
                <span className="font-bold text-slate-600 uppercase">8. Applied Category:</span>
                <span className="sm:col-span-2 font-bold text-indigo-900">
                  {submission.course_category} (Batch Commencement: 11-01-2027)
                </span>
              </div>
            </div>
          </div>

          {/* Declaration Section */}
          <div className="mt-8 pt-4 border-t-2 border-slate-800 text-[11px] text-slate-700 space-y-4">
            <p className="italic leading-relaxed">
              &ldquo;I hereby declare that the information provided is true and correct. I agree to abide by the rules &amp; regulations and decisions of the coaching center.&rdquo;
            </p>

            <div className="pt-8 flex justify-between items-end text-xs font-semibold text-slate-800">
              <div className="border-t border-slate-400 pt-1 text-center w-40">
                Signature of Parent / Guardian
              </div>
              <div className="border-t border-slate-400 pt-1 text-center w-40">
                Signature of Student
              </div>
              <div className="border-t border-slate-400 pt-1 text-center w-44">
                Authorized Signatory / Center Seal
              </div>
            </div>
          </div>

          {/* Quick Contact Bar for Admin */}
          <div className="no-print mt-8 pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <a
                href={`tel:+91${submission.contact_number}`}
                className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold flex items-center gap-1.5 transition-colors border border-indigo-200"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call +91 {submission.contact_number}</span>
              </a>
              <a
                href={`https://wa.me/91${submission.whatsapp_number}?text=${encodeURIComponent(
                  `Hello ${submission.full_name}, this is Alpha Mathematics Academy, Bishnupur, regarding your admission Form No: ${submission.form_no}.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold flex items-center gap-1.5 transition-colors border border-emerald-200"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Chat on WhatsApp</span>
              </a>
            </div>

            {submission.admin_notes && (
              <p className="text-slate-500 italic">
                Note: {submission.admin_notes}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SubmissionDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm">
          Loading submission details...
        </div>
      }
    >
      <SubmissionDetailContent />
    </Suspense>
  );
}

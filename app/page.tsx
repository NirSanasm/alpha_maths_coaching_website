"use client";

import React, { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { admissionFormSchema, AdmissionFormValues } from "@/lib/validation";
import {
  Phone,
  MessageCircle,
  MapPin,
  BookOpen,
  Upload,
  CheckCircle2,
  AlertCircle,
  Clock,
  Printer,
  X,
  Sparkles,
} from "lucide-react";

export default function HomePage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<{
    formNo: string;
    submissionDate: string;
    fullName: string;
    courseCategory: string;
  } | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [compressedPhotoBlob, setCompressedPhotoBlob] = useState<Blob | null>(null);
  const [isAdmissionsClosed, setIsAdmissionsClosed] = useState(false);

  // Check deadline (25-12-2026)
  useEffect(() => {
    const deadline = new Date("2026-12-25T23:59:59.999Z");
    if (new Date() > deadline) {
      setIsAdmissionsClosed(true);
    }
  }, []);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    reset,
  } = useForm<AdmissionFormValues>({
    resolver: zodResolver(admissionFormSchema),
    defaultValues: {
      fullName: "",
      dob: "",
      gender: undefined,
      fatherName: "",
      guardianName: "",
      address: "",
      currentClass: "",
      school: "",
      contactNumber: "",
      whatsappNumber: "",
      courseCategory: undefined,
      declaration: false,
      honeypot: "",
    },
  });

  const contactNumber = watch("contactNumber");
  const [sameAsContact, setSameAsContact] = useState(false);

  const handleSameAsContactToggle = (checked: boolean) => {
    setSameAsContact(checked);
    if (checked && contactNumber) {
      setValue("whatsappNumber", contactNumber, { shouldValidate: true });
    }
  };

  useEffect(() => {
    if (sameAsContact && contactNumber) {
      setValue("whatsappNumber", contactNumber, { shouldValidate: true });
    }
  }, [contactNumber, sameAsContact, setValue]);

  // Client-side photo resizing to ~600px wide
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setPhotoPreview(null);
      setCompressedPhotoBlob(null);
      return;
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setServerError("Please select a valid image file (JPG, PNG, or WebP).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const maxWidth = 600;
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              if (blob) {
                setCompressedPhotoBlob(blob);
                setPhotoPreview(URL.createObjectURL(blob));
                setServerError(null);
              }
            },
            "image/jpeg",
            0.85
          );
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    setPhotoPreview(null);
    setCompressedPhotoBlob(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const onSubmit = async (data: AdmissionFormValues) => {
    setIsSubmitting(true);
    setServerError(null);

    try {
      const formData = new FormData();
      formData.append("fullName", data.fullName.toUpperCase());
      formData.append("dob", data.dob);
      formData.append("gender", data.gender);
      formData.append("fatherName", data.fatherName);
      formData.append("guardianName", data.guardianName || "");
      formData.append("address", data.address);
      formData.append("currentClass", data.currentClass);
      formData.append("school", data.school);
      formData.append("contactNumber", data.contactNumber);
      formData.append("whatsappNumber", data.whatsappNumber);
      formData.append("courseCategory", data.courseCategory);
      formData.append("declaration", String(data.declaration));
      formData.append("website", data.honeypot || "");

      if (compressedPhotoBlob) {
        formData.append("photo", compressedPhotoBlob, "passport_photo.jpg");
      }

      const res = await fetch("/api/admissions", {
        method: "POST",
        body: formData,
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Failed to submit form. Please check your entries.");
      }

      setSubmissionSuccess({
        formNo: result.formNo,
        submissionDate: result.submissionDate,
        fullName: data.fullName.toUpperCase(),
        courseCategory: data.courseCategory,
      });
      reset();
      setPhotoPreview(null);
      setCompressedPhotoBlob(null);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setServerError(err.message);
      } else {
        setServerError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 text-slate-100 antialiased pb-20">
      {/* Top Banner Navigation */}
      <header className="border-b border-indigo-900/40 bg-slate-950/70 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-3 sm:py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-sky-400 flex items-center justify-center font-bold text-xl text-white shadow-lg shadow-indigo-500/30">
              α
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-extrabold tracking-tight text-white flex items-center gap-2">
                ALPHA MATHEMATICS ACADEMY
              </h1>
              <p className="text-xs text-indigo-300 font-meetei">
                ꯑꯜꯐꯥꯃꯦꯊꯦꯃꯦꯇꯤꯛꯁ ꯑꯦꯀꯥꯗꯦꯃꯤ
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <a
              href="tel:+919366285519"
              className="px-3 py-1.5 rounded-lg bg-indigo-900/60 hover:bg-indigo-800 text-indigo-200 border border-indigo-700/50 flex items-center gap-1.5 transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-indigo-400" />
              <span>+91 9366285519</span>
            </a>
            <a
              href="https://wa.me/919366285519"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-lg bg-emerald-700/80 hover:bg-emerald-600 text-emerald-100 border border-emerald-500/40 flex items-center gap-1.5 transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </a>
            <a
              href="/admin/login"
              className="px-2.5 py-1.5 text-slate-400 hover:text-slate-200 text-xs transition-colors"
            >
              Admin
            </a>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-8 pb-10 px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium mb-4">
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            <span>Admission Open for Academic Session 2027</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white mb-3">
            ALPHA MATHEMATICS ACADEMY
          </h2>
          <p className="text-xl sm:text-2xl font-meetei font-bold text-sky-400 mb-4 tracking-wide">
            ꯑꯜꯐꯥꯃꯦꯊꯦꯃꯦꯇꯤꯛꯁ ꯑꯦꯀꯥꯗꯦꯃꯤ
          </p>
          <p className="max-w-2xl mx-auto text-sm sm:text-base text-indigo-200/90 italic font-medium mb-6">
            &ldquo;An academy of mathematics where we will nurture you with the beauty of mathematics&rdquo;
          </p>

          {/* Key Dates & Highlights Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-3xl mx-auto mt-6 text-left">
            <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-indigo-900/50 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-indigo-400 text-xs font-semibold mb-1">
                <BookOpen className="w-4 h-4 text-sky-400" />
                <span>OFFERED COURSES</span>
              </div>
              <p className="text-sm font-bold text-white">Class IX &amp; Class X</p>
              <p className="text-xs text-slate-400">Foundation &amp; Board Mastery</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-indigo-900/50 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold mb-1">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>SUBMISSION DEADLINE</span>
              </div>
              <p className="text-sm font-bold text-white">25-12-2026</p>
              <p className="text-xs text-slate-400">Classes start: 11-01-2027</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/70 border border-indigo-900/50 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold mb-1">
                <MapPin className="w-4 h-4 text-emerald-400" />
                <span>LOCATION</span>
              </div>
              <p className="text-sm font-bold text-white">Bishnupur, Manipur</p>
              <p className="text-xs text-slate-400">Near Mahei Leikol School</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Container */}
      <div className="max-w-3xl mx-auto px-4">
        {/* Admissions Closed Alert if applicable */}
        {isAdmissionsClosed && (
          <div className="mb-8 p-6 rounded-2xl bg-rose-950/60 border border-rose-800/80 text-center text-rose-200">
            <AlertCircle className="w-10 h-10 text-rose-400 mx-auto mb-2" />
            <h3 className="text-xl font-bold text-white mb-1">Admissions Closed</h3>
            <p className="text-sm">
              The last date of submission (25-12-2026) for the upcoming batch has passed. For inquiries, please contact the academy directly.
            </p>
          </div>
        )}

        {/* Success Screen Card */}
        {submissionSuccess && (
          <div className="mb-10 p-6 sm:p-8 rounded-3xl bg-gradient-to-b from-indigo-950/90 to-slate-900 border-2 border-emerald-500/50 shadow-2xl shadow-emerald-500/10 text-center animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <h3 className="text-2xl sm:text-3xl font-black text-white mb-1">
              Admission Form Submitted!
            </h3>
            <p className="text-sm text-indigo-200 mb-6 font-meetei">
              ꯑꯜꯐꯥꯃꯦꯊꯦꯃꯦꯇꯤꯛꯁ ꯑꯦꯀꯥꯗꯦꯃꯤꯗ ꯐꯣꯔꯝ ꯃꯥꯌꯄꯥꯛꯅ ꯁꯕꯃꯤꯠ ꯇꯧꯔꯦ
            </p>

            <div className="max-w-md mx-auto p-4 rounded-2xl bg-slate-950/80 border border-indigo-900/60 text-left mb-6 space-y-2.5">
              <div className="flex justify-between items-center text-sm border-b border-slate-800 pb-2">
                <span className="text-slate-400">Form Number:</span>
                <span className="font-mono font-bold text-emerald-400 text-base">
                  {submissionSuccess.formNo}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-slate-800 pb-2">
                <span className="text-slate-400">Student Name:</span>
                <span className="font-semibold text-white">{submissionSuccess.fullName}</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-slate-800 pb-2">
                <span className="text-slate-400">Course Category:</span>
                <span className="font-medium text-sky-300">{submissionSuccess.courseCategory}</span>
              </div>
              <div className="flex justify-between items-center text-xs text-slate-400 pt-1">
                <span>Submitted Date:</span>
                <span>{new Date(submissionSuccess.submissionDate).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-600/40 text-left text-xs text-amber-200 mb-6">
              <p className="font-bold text-amber-300 mb-1">Next Step for Center Visit:</p>
              Please note down your Form Number (<strong className="text-amber-100">{submissionSuccess.formNo}</strong>). Bring a photocopy of School ID, two passport-size photos, and Aadhaar card when you visit the coaching center for verification.
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <a
                href={`https://wa.me/919366285519?text=${encodeURIComponent(
                  `Hello Alpha Mathematics Academy! I have submitted my admission form. Form No: ${submissionSuccess.formNo}, Name: ${submissionSuccess.fullName}, Category: ${submissionSuccess.courseCategory}.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all text-sm"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Chat on WhatsApp</span>
              </a>
              <button
                type="button"
                onClick={() => window.print()}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium flex items-center justify-center gap-2 border border-slate-700 transition-all text-sm"
              >
                <Printer className="w-4 h-4" />
                <span>Print / Save Receipt</span>
              </button>
              <button
                type="button"
                onClick={() => setSubmissionSuccess(null)}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-indigo-950 hover:bg-indigo-900 text-indigo-300 font-medium text-sm transition-all"
              >
                Fill Another Form
              </button>
            </div>
          </div>
        )}

        {/* Admission Form Card */}
        {!submissionSuccess && (
          <div className="rounded-3xl bg-slate-900/90 border border-indigo-900/60 p-6 sm:p-8 md:p-10 shadow-2xl backdrop-blur-xl">
            <div className="border-b border-indigo-900/50 pb-5 mb-6">
              <h3 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
                <span>Online Admission &amp; Contact Form</span>
              </h3>
              <p className="text-xs sm:text-sm text-indigo-300 mt-1">
                Please complete all required fields carefully in BLOCK LETTERS.
              </p>
            </div>

            {serverError && (
              <div className="mb-6 p-4 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-200 flex items-start gap-3 text-sm">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-rose-100">Submission Error</p>
                  <p>{serverError}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Honeypot field (hidden from real users) */}
              <div className="hidden" aria-hidden="true">
                <input
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  {...register("honeypot")}
                />
              </div>

              {/* Course Category */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-indigo-300 mb-2">
                  Select Course Category <span className="text-rose-400">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    className={`relative flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                      watch("courseCategory") === "A - Class IX"
                        ? "bg-indigo-600/20 border-indigo-500 text-white shadow-md shadow-indigo-500/10"
                        : "bg-slate-950/50 border-slate-800 hover:border-slate-700 text-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      value="A - Class IX"
                      {...register("courseCategory")}
                      className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <p className="font-bold text-sm">Category A — Class IX</p>
                      <p className="text-xs text-slate-400">Class 9 Academic Mathematics</p>
                    </div>
                  </label>

                  <label
                    className={`relative flex items-center gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                      watch("courseCategory") === "B - Class X"
                        ? "bg-indigo-600/20 border-indigo-500 text-white shadow-md shadow-indigo-500/10"
                        : "bg-slate-950/50 border-slate-800 hover:border-slate-700 text-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      value="B - Class X"
                      {...register("courseCategory")}
                      className="w-4 h-4 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <p className="font-bold text-sm">Category B — Class X</p>
                      <p className="text-xs text-slate-400">Class 10 Board Exam Mastery</p>
                    </div>
                  </label>
                </div>
                {errors.courseCategory && (
                  <p className="text-xs text-rose-400 mt-1.5">{errors.courseCategory.message}</p>
                )}
              </div>

              {/* Student Full Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-indigo-300 mb-1.5">
                  Full Name (Block Letters) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. LAISHRAM TOMBA SINGH"
                  {...register("fullName")}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-white uppercase placeholder:normal-case placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium"
                />
                {errors.fullName && (
                  <p className="text-xs text-rose-400 mt-1.5">{errors.fullName.message}</p>
                )}
              </div>

              {/* DOB & Gender */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-indigo-300 mb-1.5">
                    Date of Birth <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="date"
                    {...register("dob")}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                  {errors.dob && (
                    <p className="text-xs text-rose-400 mt-1.5">{errors.dob.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-indigo-300 mb-1.5">
                    Gender <span className="text-rose-400">*</span>
                  </label>
                  <select
                    {...register("gender")}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.gender && (
                    <p className="text-xs text-rose-400 mt-1.5">{errors.gender.message}</p>
                  )}
                </div>
              </div>

              {/* Father & Guardian Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-indigo-300 mb-1.5">
                    Father&apos;s Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Father's full name"
                    {...register("fatherName")}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                  {errors.fatherName && (
                    <p className="text-xs text-rose-400 mt-1.5">{errors.fatherName.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-indigo-300 mb-1.5">
                    Guardian&apos;s Name <span className="text-slate-500 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Guardian's name if applicable"
                    {...register("guardianName")}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                  {errors.guardianName && (
                    <p className="text-xs text-rose-400 mt-1.5">{errors.guardianName.message}</p>
                  )}
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-indigo-300 mb-1.5">
                  Permanent / Residential Address <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Ward No. 3, Bishnupur Near Bazar, Manipur - 795126"
                  {...register("address")}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                />
                {errors.address && (
                  <p className="text-xs text-rose-400 mt-1.5">{errors.address.message}</p>
                )}
              </div>

              {/* Current Class & School */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-indigo-300 mb-1.5">
                    Class (Currently Studying) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Class IX (Going to X) or Class VIII"
                    {...register("currentClass")}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                  {errors.currentClass && (
                    <p className="text-xs text-rose-400 mt-1.5">{errors.currentClass.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-indigo-300 mb-1.5">
                    Present School <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Mahei Leikol / Bishnupur Higher Sec"
                    {...register("school")}
                    className="w-full px-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  />
                  {errors.school && (
                    <p className="text-xs text-rose-400 mt-1.5">{errors.school.message}</p>
                  )}
                </div>
              </div>

              {/* Contact Number & WhatsApp */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-indigo-300 mb-1.5">
                    Contact Number (10-digit Mobile) <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3 text-slate-500 text-sm font-semibold">
                      +91
                    </span>
                    <input
                      type="tel"
                      placeholder="9366285519"
                      {...register("contactNumber")}
                      className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                  </div>
                  {errors.contactNumber && (
                    <p className="text-xs text-rose-400 mt-1.5">{errors.contactNumber.message}</p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                      WhatsApp Number <span className="text-rose-400">*</span>
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer hover:text-indigo-300">
                      <input
                        type="checkbox"
                        checked={sameAsContact}
                        onChange={(e) => handleSameAsContactToggle(e.target.checked)}
                        className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>Same as contact</span>
                    </label>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3 text-slate-500 text-sm font-semibold">
                      +91
                    </span>
                    <input
                      type="tel"
                      placeholder="9366285519"
                      {...register("whatsappNumber")}
                      className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-950/80 border border-slate-800 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                  </div>
                  {errors.whatsappNumber && (
                    <p className="text-xs text-rose-400 mt-1.5">{errors.whatsappNumber.message}</p>
                  )}
                </div>
              </div>

              {/* Photo Upload with Client-Side Compression & Preview */}
              <div className="p-4 rounded-2xl bg-slate-950/60 border border-indigo-900/40">
                <label className="block text-xs font-bold uppercase tracking-wider text-indigo-300 mb-1">
                  Passport-Size Photo <span className="text-slate-500 font-normal">(Optional, max 2MB)</span>
                </label>
                <p className="text-xs text-slate-400 mb-3">
                  Upload a clear passport photo. Image will automatically be optimized for upload.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {photoPreview ? (
                    <div className="relative w-28 h-36 rounded-xl overflow-hidden border-2 border-indigo-500 shadow-md bg-slate-800 shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={photoPreview}
                        alt="Passport preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={removePhoto}
                        className="absolute top-1 right-1 p-1 rounded-full bg-slate-900/80 hover:bg-rose-600 text-white transition-colors"
                        title="Remove photo"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-28 h-36 rounded-xl border-2 border-dashed border-slate-700 flex flex-col items-center justify-center text-slate-500 text-xs shrink-0 bg-slate-900/40">
                      <Upload className="w-6 h-6 mb-1 text-slate-400" />
                      <span>Photo Preview</span>
                    </div>
                  )}

                  <div className="w-full">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handlePhotoChange}
                      className="block w-full text-xs text-slate-400 file:mr-3 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-900/80 file:text-indigo-200 hover:file:bg-indigo-800 file:cursor-pointer cursor-pointer"
                    />
                    <p className="text-[11px] text-slate-500 mt-2">
                      Formats: JPG, PNG, WebP. Resized client-side to ~600px width.
                    </p>
                  </div>
                </div>
              </div>

              {/* Crucial Center Note */}
              <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-600/40 text-amber-200 text-xs space-y-1">
                <p className="font-bold text-amber-300 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Important Instructions for Center Visit</span>
                </p>
                <p>
                  Bring a photocopy of School ID, two passport-size photos, and AADHAAR when you visit the center.
                </p>
                <p className="font-semibold text-amber-100">
                  Do not upload Aadhaar or ID documents here. We do not collect Aadhaar or ID copies online.
                </p>
              </div>

              {/* Declaration Checkbox */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register("declaration")}
                    className="mt-1 w-4 h-4 rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-xs text-slate-300 leading-relaxed">
                    I hereby declare that the information provided is true and correct. I agree to abide by the rules &amp; regulations and decisions of the coaching center. <span className="text-rose-400">*</span>
                  </span>
                </label>
                {errors.declaration && (
                  <p className="text-xs text-rose-400 mt-2">{errors.declaration.message}</p>
                )}
              </div>

              {/* Submit Button */}
              <div>
                <button
                  type="submit"
                  disabled={isSubmitting || isAdmissionsClosed}
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 to-sky-500 hover:from-indigo-500 hover:to-sky-400 text-white font-bold text-base shadow-xl shadow-indigo-600/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Submitting Admission Form...</span>
                    </>
                  ) : isAdmissionsClosed ? (
                    <span>Admissions Closed (Deadline Passed)</span>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      <span>Submit Admission Application</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Footer Contact & Map Reference */}
        <footer className="mt-16 pt-8 border-t border-indigo-900/40 text-center text-xs text-slate-400 space-y-3">
          <p className="font-bold text-slate-300 text-sm">
            ALPHA MATHEMATICS ACADEMY • ꯑꯜꯐꯥꯃꯦꯊꯦꯃꯦꯇꯤꯛꯁ ꯑꯦꯀꯥꯗꯦꯃꯤ
          </p>
          <p>Bishnupur, Near Mahei Leikol School, Manipur - 795126</p>
          <div className="flex justify-center items-center gap-4 text-indigo-300">
            <a href="tel:+919366285519" className="hover:underline">
              +91 9366285519
            </a>
            <span>•</span>
            <a href="tel:+918414861984" className="hover:underline">
              +91 84148 61984
            </a>
            <span>•</span>
            <a
              href="https://wa.me/919366285519"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:underline"
            >
              WhatsApp Us
            </a>
          </div>
          <p className="text-[11px] text-slate-500 pt-4">
            &copy; 2026-2027 Alpha Mathematics Academy. Built with Lakebase Postgres &amp; Object Storage on Neon.
          </p>
        </footer>
      </div>
    </main>
  );
}

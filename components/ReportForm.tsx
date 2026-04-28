"use client";

import { useEffect, useRef, useState } from "react";
import { Resource, ResourceStatus } from "@/types";

interface Props {
  resource: Resource;
  onClose: () => void;
  onSuccess: () => void;
}

const STATUS_OPTIONS: { value: ResourceStatus; label: string; icon: string }[] = [
  { value: "open",    label: "Open",    icon: "✅" },
  { value: "limited", label: "Limited", icon: "⚠️" },
  { value: "closed",  label: "Closed",  icon: "🚫" },
];

export default function ReportForm({ resource, onClose, onSuccess }: Props) {
  const [statusReported, setStatusReported] = useState<ResourceStatus>("open");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  function handleBackdropClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === backdropRef.current) onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resourceId: resource.id,
          resourceName: resource.name,
          resourceType: resource.type,
          resourceAddress: resource.address,
          resourceLocation: resource.location,
          resourceServices: resource.services,
          statusReported,
          note: note.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      setSuccessMsg("Thanks for your report! The map will refresh.");
      setTimeout(() => onSuccess(), 1500);
    } catch {
      setErrorMsg("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      ref={backdropRef}
      onClick={handleBackdropClick}
      className="animate-fade-in fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0"
      style={{ background: "rgba(15,23,42,0.65)", backdropFilter: "blur(4px)" }}
    >
      <div
        className="animate-fade-in-up relative w-full max-w-md rounded-2xl shadow-2xl p-6 border border-white/10"
        style={{ background: "rgba(255,255,255,0.98)" }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-form-title"
      >
        {/* Header gradient strip */}
        <div
          className="absolute top-0 left-0 right-0 h-1 rounded-t-2xl"
          style={{ background: "linear-gradient(90deg, #06B6D4, #6366F1)" }}
        />

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all text-lg leading-none"
          aria-label="Close"
        >
          ×
        </button>

        {/* Header */}
        <div className="mb-5 pt-1">
          <h2 id="report-form-title" className="text-base font-bold text-slate-900 pr-8 leading-snug">
            Report Status
          </h2>
          <p className="text-xs text-slate-400 mt-1 truncate font-medium" title={resource.name}>
            {resource.name}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Status radio group */}
          <fieldset>
            <legend className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
              Current status
            </legend>
            <div className="flex gap-2.5">
              {STATUS_OPTIONS.map(({ value, label, icon }) => (
                <label
                  key={value}
                  className={`flex-1 flex flex-col items-center justify-center gap-1 border rounded-xl py-3 cursor-pointer text-sm font-semibold transition-all duration-150 ${
                    statusReported === value
                      ? value === "open"
                        ? "bg-emerald-50 border-emerald-400 text-emerald-700 shadow-sm"
                        : value === "limited"
                        ? "bg-amber-50 border-amber-400 text-amber-700 shadow-sm"
                        : "bg-red-50 border-red-400 text-red-700 shadow-sm"
                      : "bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="statusReported"
                    value={value}
                    checked={statusReported === value}
                    onChange={() => setStatusReported(value)}
                    className="sr-only"
                  />
                  <span className="text-base">{icon}</span>
                  <span className="text-xs">{label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          {/* Note textarea */}
          <div>
            <label
              htmlFor="report-note"
              className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2"
            >
              Notes{" "}
              <span className="normal-case font-normal text-slate-400">(optional)</span>
            </label>
            <textarea
              id="report-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What did you see? Any useful details..."
              rows={3}
              className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-cyan-400/50 focus:border-cyan-400 transition-all"
            />
          </div>

          {/* Success message */}
          {successMsg && (
            <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-3.5 py-2.5">
              <span>✅</span>
              {successMsg}
            </div>
          )}

          {/* Error message */}
          {errorMsg && (
            <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3.5 py-2.5">
              <span>⚠️</span>
              {errorMsg}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting || successMsg !== null}
            className="w-full text-white text-sm font-bold py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:-translate-y-px hover:shadow-md"
            style={{ background: "linear-gradient(135deg, #0F172A, #1E293B)" }}
          >
            {submitting ? "Submitting…" : "Submit Report"}
          </button>
        </form>
      </div>
    </div>
  );
}

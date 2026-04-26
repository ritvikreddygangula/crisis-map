"use client";

import { useEffect, useRef, useState } from "react";
import { Resource, ResourceStatus } from "@/types";

interface Props {
  resource: Resource;
  onClose: () => void;
  onSuccess: () => void;
}

const STATUS_OPTIONS: { value: ResourceStatus; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "limited", label: "Limited" },
  { value: "closed", label: "Closed" },
];

export default function ReportForm({ resource, onClose, onSuccess }: Props) {
  const [statusReported, setStatusReported] = useState<ResourceStatus>("open");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const backdropRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
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
          // Send enough metadata so the API can seed the resource into MongoDB
          // on first report if it isn't already there (Wi-Fi and medical resources).
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

      setTimeout(() => {
        onSuccess();
      }, 1500);
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
    >
      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-xl p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-form-title"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl leading-none"
          aria-label="Close"
        >
          &times;
        </button>

        {/* Header */}
        <h2
          id="report-form-title"
          className="text-base font-bold text-gray-900 pr-6 leading-snug mb-1"
        >
          Report Status
        </h2>
        <p className="text-sm text-gray-500 mb-5 truncate" title={resource.name}>
          {resource.name}
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Status radio group */}
          <fieldset>
            <legend className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
              Current status
            </legend>
            <div className="flex gap-3">
              {STATUS_OPTIONS.map(({ value, label }) => (
                <label
                  key={value}
                  className={`flex-1 flex items-center justify-center gap-2 border rounded-xl py-2.5 cursor-pointer text-sm font-medium transition-colors ${
                    statusReported === value
                      ? value === "open"
                        ? "bg-green-50 border-green-400 text-green-700"
                        : value === "limited"
                        ? "bg-amber-50 border-amber-400 text-amber-700"
                        : "bg-red-50 border-red-400 text-red-700"
                      : "bg-white border-gray-200 text-gray-600 hover:border-gray-400"
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
                  <span
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      value === "open"
                        ? "bg-green-500"
                        : value === "limited"
                        ? "bg-amber-500"
                        : "bg-red-500"
                    }`}
                  />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>

          {/* Note textarea */}
          <div>
            <label
              htmlFor="report-note"
              className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-2"
            >
              Notes <span className="normal-case font-normal text-gray-400">(optional)</span>
            </label>
            <textarea
              id="report-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What did you see?"
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 placeholder-gray-400 resize-none focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent transition"
            />
          </div>

          {/* Inline success message */}
          {successMsg && (
            <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-3 py-2">
              {successMsg}
            </div>
          )}

          {/* Inline error message */}
          {errorMsg && (
            <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              {errorMsg}
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={submitting || successMsg !== null}
            className="w-full bg-gray-900 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? "Submitting…" : "Submit Report"}
          </button>
        </form>
      </div>
    </div>
  );
}

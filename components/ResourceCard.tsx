import { Resource, ResourceStatus } from "@/types";
import ServiceTag from "./ServiceTag";

const STATUS_CONFIG: Record<ResourceStatus, { label: string; dot: string; bg: string; text: string; border: string }> = {
  open:    { label: "Open",    dot: "bg-emerald-500", bg: "bg-emerald-50",  text: "text-emerald-700", border: "border-emerald-200" },
  limited: { label: "Limited", dot: "bg-amber-500",   bg: "bg-amber-50",    text: "text-amber-700",   border: "border-amber-200" },
  closed:  { label: "Closed",  dot: "bg-red-500",     bg: "bg-red-50",      text: "text-red-700",     border: "border-red-200" },
  unknown: { label: "Unknown", dot: "bg-slate-400",   bg: "bg-slate-50",    text: "text-slate-600",   border: "border-slate-200" },
};

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diff < 1) return "just now";
  if (diff < 60) return `${diff}m ago`;
  return `${Math.floor(diff / 60)}h ago`;
}

function TrustBar({ score }: { score: number }) {
  const gradient =
    score >= 80
      ? "linear-gradient(90deg, #10B981, #34D399)"
      : score >= 60
      ? "linear-gradient(90deg, #F59E0B, #FBBF24)"
      : "linear-gradient(90deg, #EF4444, #F87171)";

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${score}%`, background: gradient }}
        />
      </div>
      <span className="text-xs font-semibold text-slate-500 tabular-nums w-6 text-right">{score}</span>
    </div>
  );
}

interface Props {
  resource: Resource;
  isBestPick?: boolean;
  isSelected?: boolean;
  isHovered?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onReport?: () => void;
}

export default function ResourceCard({
  resource,
  isBestPick = false,
  isSelected = false,
  isHovered = false,
  onMouseEnter,
  onMouseLeave,
  onReport,
}: Props) {
  const status = STATUS_CONFIG[resource.status];

  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={[
        "relative rounded-2xl p-5 flex flex-col gap-3 cursor-pointer transition-all duration-200",
        "border bg-white",
        isBestPick
          ? "border-cyan-400 shadow-md shadow-cyan-100 ring-1 ring-cyan-400/30"
          : "border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5",
        isSelected ? "ring-2 ring-blue-500 ring-offset-2 border-blue-400" : "",
        isHovered && !isSelected && !isBestPick ? "ring-2 ring-cyan-300 border-cyan-300" : "",
      ].join(" ")}
    >
      {/* Best pick top bar */}
      {isBestPick && (
        <div
          className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl"
          style={{ background: "linear-gradient(90deg, #06B6D4, #6366F1)" }}
        />
      )}

      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          {isBestPick && (
            <div className="inline-flex items-center gap-1 mb-1.5 px-2 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-cyan-50 to-indigo-50 border border-cyan-200 text-cyan-700">
              ⭐ Best Match
            </div>
          )}
          <h3 className="font-bold text-slate-900 leading-tight text-sm">{resource.name}</h3>
          <p className="text-xs text-slate-400 mt-0.5 font-medium">{resource.type}</p>
        </div>

        {/* Status badge */}
        <span
          className={`flex-shrink-0 inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border ${status.bg} ${status.text} ${status.border}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
          {status.label}
        </span>
      </div>

      {/* Address + distance */}
      <div className="flex items-start gap-1.5 text-xs text-slate-500">
        <span className="mt-0.5 flex-shrink-0">📍</span>
        <div className="min-w-0">
          <span className="leading-snug">{resource.address}</span>
          {resource.distanceMiles !== undefined && (
            <span className="ml-2 font-bold text-slate-700">
              · {resource.distanceMiles} mi
            </span>
          )}
        </div>
      </div>

      {/* Services */}
      <div className="flex flex-wrap gap-1.5">
        {resource.services.map((s) => (
          <ServiceTag key={s} service={s} small />
        ))}
      </div>

      {/* Notes */}
      {resource.notes && (
        <p className="text-xs text-slate-500 leading-relaxed border-t border-slate-100 pt-2.5">
          {resource.notes}
        </p>
      )}

      {/* Footer: trust + meta */}
      <div className="flex items-end justify-between gap-4 pt-0.5">
        <div className="flex-1 min-w-0">
          <div className="text-xs text-slate-400 mb-1.5 font-medium">Trust score</div>
          <TrustBar score={resource.trustScore} />
        </div>

        <div className="flex-shrink-0 flex flex-col items-end gap-1.5">
          <div className="text-xs text-slate-400">
            {timeAgo(resource.lastUpdated)}
          </div>
          {onReport && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onReport();
              }}
              className="text-xs font-medium text-cyan-600 hover:text-cyan-800 hover:underline transition-colors"
            >
              Report status
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

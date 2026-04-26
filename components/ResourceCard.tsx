import { Resource, ResourceStatus } from "@/types";
import ServiceTag from "./ServiceTag";

const STATUS_CONFIG: Record<ResourceStatus, { label: string; dot: string; text: string }> = {
  open:    { label: "Open",    dot: "bg-green-500",  text: "text-green-700" },
  limited: { label: "Limited", dot: "bg-amber-500",  text: "text-amber-700" },
  closed:  { label: "Closed",  dot: "bg-red-500",    text: "text-red-700" },
  unknown: { label: "Unknown", dot: "bg-gray-400",   text: "text-gray-600" },
};

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diff < 1) return "just now";
  if (diff < 60) return `${diff}m ago`;
  const h = Math.floor(diff / 60);
  return `${h}h ago`;
}

function TrustBar({ score }: { score: number }) {
  const color =
    score >= 80 ? "bg-green-500" : score >= 60 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs text-gray-500 tabular-nums">{score}</span>
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
}

export default function ResourceCard({
  resource,
  isBestPick = false,
  isSelected = false,
  isHovered = false,
  onMouseEnter,
  onMouseLeave,
}: Props) {
  const status = STATUS_CONFIG[resource.status];

  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`bg-white rounded-2xl border shadow-sm p-5 flex flex-col gap-3 transition-shadow hover:shadow-md cursor-pointer ${
        isBestPick ? "border-red-400 ring-2 ring-red-100" : "border-gray-200"
      } ${isSelected ? "ring-2 ring-blue-500 ring-offset-2" : ""} ${
        isHovered && !isSelected && !isBestPick ? "ring-2 ring-blue-400" : ""
      }`}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          {isBestPick && (
            <div className="flex items-center gap-1 mb-1">
              <span className="text-xs font-semibold text-red-600 uppercase tracking-wide">
                ⭐ Best Match
              </span>
            </div>
          )}
          <h3 className="font-semibold text-gray-900 leading-tight">{resource.name}</h3>
          <p className="text-xs text-gray-500 mt-0.5">{resource.type}</p>
        </div>

        {/* Status badge */}
        <span
          className={`flex-shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${
            resource.status === "open"
              ? "bg-green-50 border-green-200 text-green-700"
              : resource.status === "limited"
              ? "bg-amber-50 border-amber-200 text-amber-700"
              : resource.status === "closed"
              ? "bg-red-50 border-red-200 text-red-600"
              : "bg-gray-50 border-gray-200 text-gray-600"
          }`}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
          {status.label}
        </span>
      </div>

      {/* Address + distance */}
      <div className="flex items-start gap-1.5 text-sm text-gray-600">
        <span className="mt-0.5">📍</span>
        <div>
          <span>{resource.address}</span>
          {resource.distanceMiles !== undefined && (
            <span className="ml-2 font-medium text-gray-900">
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
        <p className="text-xs text-gray-500 leading-relaxed border-t border-gray-100 pt-2">
          {resource.notes}
        </p>
      )}

      {/* Footer: trust + updated */}
      <div className="flex items-center justify-between gap-4 pt-1">
        <div className="flex-1">
          <div className="text-xs text-gray-400 mb-1">Trust score</div>
          <TrustBar score={resource.trustScore} />
        </div>
        <div className="text-right text-xs text-gray-400 flex-shrink-0">
          Updated {timeAgo(resource.lastUpdated)}
        </div>
      </div>
    </div>
  );
}

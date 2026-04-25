"use client";

import { useState } from "react";
import type { HeatAlert } from "@/app/api/heat-alerts/route";

interface Props {
  alerts: HeatAlert[];
}

export default function HeatAlertBanner({ alerts }: Props) {
  const [dismissed, setDismissed] = useState(false);

  if (!alerts.length || dismissed) return null;

  const top = alerts[0];
  const isExtreme = top.severity === "Extreme";

  return (
    <div
      className={`flex items-center justify-between gap-3 px-4 py-3 text-sm font-medium ${
        isExtreme ? "bg-red-600 text-white" : "bg-orange-500 text-white"
      }`}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <span className="flex-shrink-0 text-base">🌡️</span>
        <span className="font-bold flex-shrink-0">{top.event}:</span>
        <span className="truncate">{top.headline}</span>
        {alerts.length > 1 && (
          <span className="flex-shrink-0 text-xs bg-white/20 rounded-full px-1.5 py-0.5">
            +{alerts.length - 1} more
          </span>
        )}
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="flex-shrink-0 text-white/80 hover:text-white text-xl leading-none"
        aria-label="Dismiss alert"
      >
        ×
      </button>
    </div>
  );
}

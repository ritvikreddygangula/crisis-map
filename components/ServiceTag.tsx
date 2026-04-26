import { ServiceType } from "@/types";

const SERVICE_CONFIG: Record<ServiceType, { label: string; icon: string; color: string }> = {
  shelter: { label: "Shelter",   icon: "🏠", color: "bg-purple-100 text-purple-800" },
  wifi:    { label: "Wi-Fi",     icon: "📶", color: "bg-blue-100 text-blue-800" },
  water:   { label: "Water",     icon: "💧", color: "bg-cyan-100 text-cyan-800" },
  medical: { label: "Medical",   icon: "🏥", color: "bg-red-100 text-red-800" },
  food:    { label: "Food",      icon: "🍽️", color: "bg-orange-100 text-orange-800" },
};

interface Props {
  service: ServiceType;
  small?: boolean;
}

export default function ServiceTag({ service, small = false }: Props) {
  const config = SERVICE_CONFIG[service];
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${config.color} ${
        small ? "text-xs px-2 py-0.5" : "text-sm px-2.5 py-1"
      }`}
    >
      <span>{config.icon}</span>
      {config.label}
    </span>
  );
}

export { SERVICE_CONFIG };

export type ResourceStatus = "open" | "limited" | "closed" | "unknown";

export type ServiceType =
  | "shelter"
  | "wifi"
  | "water"
  | "medical"
  | "food";

export type EmergencyType =
  | "power_outage"
  | "wildfire"
  | "heat_wave"
  | "flood"
  | "earthquake";

export interface Resource {
  id: string;
  name: string;
  type: string;
  address: string;
  location: {
    lat: number;
    lng: number;
  };
  status: ResourceStatus;
  services: ServiceType[];
  capacity: number | null;
  trustScore: number; // 0–100
  lastUpdated: string; // ISO date string
  notes: string;
  distanceMiles?: number;
  recommendationScore?: number;
}

export interface Report {
  id: string;
  resourceId: string;
  userId: string;
  statusReported: ResourceStatus;
  servicesAvailable: ServiceType[];
  crowdLevel: "empty" | "moderate" | "crowded";
  note: string;
  createdAt: string;
}

export interface EmergencyScenario {
  id: EmergencyType;
  label: string;
  icon: string;
  description: string;
  defaultNeeds: ServiceType[];
}

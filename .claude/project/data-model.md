# ReliefRoute Data Model

## Resource

```ts
type Resource = {
  _id: string;
  name: string;
  type: "shelter" | "cooling_center" | "charging_station" | "wifi" | "water" | "clinic";
  address: string;
  location: {
    type: "Point";
    coordinates: [number, number]; // [lng, lat]
  };
  status: "open" | "limited" | "full" | "closed" | "unknown";
  services: string[];
  capacity?: "low" | "medium" | "high" | "unknown";
  trustScore: number;
  lastUpdated: string;
  notes?: string;
};
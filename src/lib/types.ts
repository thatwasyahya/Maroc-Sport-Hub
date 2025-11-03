export type UserRole = "super_admin" | "admin" | "user";

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string;
  role: UserRole;
  createdAt: any; // Can be a server timestamp
  updatedAt: any; // Can be a server timestamp
}

export interface Equipment {
  id: string;
  name: string;
  rentalCost: number;
  depositCost: number;
  facilityId: string; // Reference to the facility it belongs to
}

export interface Facility {
  id: string;
  adminId?: string;
  external_id?: string;
  name: string;
  region: string;
  city: string;
  address: string;
  location: {
    lat: number;
    lng: number;
  };
  sports: string[];
  type: "indoor" | "outdoor";
  accessible: boolean;
  description: string;
  photos: string[];
  equipmentIds: string[]; // List of equipment IDs
  availability: Record<string, string[]>;
  rentalCost: number; // Cost per hour
  depositCost: number;
}

export interface Reservation {
  id: string;
  facilityId: string;
  userId: string;
  userEmail: string; // Denormalized for easy display
  startTime: any; // Can be a server timestamp or string
  endTime: any; // Can be a server timestamp or string
  status: "confirmed" | "cancelled" | "pending";
  createdAt: any; // Can be a server timestamp
  updatedAt: any; // Can be a server timestamp
  totalCost: number;
}

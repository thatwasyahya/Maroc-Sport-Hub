export type UserRole = "super_admin" | "admin" | "user";

export interface User {
  id: string;
  name: string; // Full name
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
  quantity: number;
}

export interface Facility {
  id: string;
  adminId: string;
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

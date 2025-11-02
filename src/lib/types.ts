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
  quantity: number;
}

export interface Facility {
  id: string;
  external_id: string;
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
  equipments: Equipment[];
  availability: Record<string, string[]>; // Date -> Array of available time slots
  pricePerHour: number;
  deposit: number;
}

export interface Reservation {
  id: string;
  facilityId: string;
  userId: string;
  date: string;
  timeSlot: string;
  status: "confirmed" | "cancelled";
  createdAt: Date;
}

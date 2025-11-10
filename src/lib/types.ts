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

export interface EquipmentItem {
  name: string;
  quantity: string; // Can be a number or 'X'
}

export interface Facility {
  id:string;
  adminId: string;
  external_id?: string;
  name: string;
  region: string;
  city: string;
  address: string;
  sports: string[];
  type: "indoor" | "outdoor";
  accessible: boolean;
  description: string;
  photos?: string[],
  location: {
    lat: number;
    lng: number;
  };
  equipments?: EquipmentItem[];
}

export type RequestStatus = 'pending' | 'approved' | 'rejected';

export interface FacilityRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  status: RequestStatus;
  rejectionReason?: string;
  name: string;
  description: string;
  address: string;
  region: string;
  city: string;
  sports: string[];
  equipments?: EquipmentItem[];
  type: 'indoor' | 'outdoor';
  accessible: boolean;
  createdAt: any;
  updatedAt: any;
  location: {
    lat: number;
    lng: number;
  };
  attachmentUrl?: string; // URL to the file in Firebase Storage
}

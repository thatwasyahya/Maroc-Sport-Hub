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

export type EstablishmentState = 'Opérationnel' | 'En arrêt' | 'Prêt' | 'En cours de transformation' | 'En cours de construction' | 'Non défini';
export type BuildingState = 'Bon' | 'Moyen' | 'Mauvais' | 'Médiocre' | 'Non défini';
export type EquipmentState = 'Non équipé' | 'Bon' | 'Moyen' | 'Mauvais' | 'Médiocre' | 'Non défini';


export interface Facility {
  id:string;
  adminId: string;
  
  // New fields from spreadsheet
  reference_region?: string;
  province?: string;
  commune?: string;
  milieu?: 'Urbain' | 'Rural';
  category?: string;
  ownership?: string;
  managing_entity?: string;
  last_renovation_date?: any;
  surface_area?: number;
  capacity?: number;
  staff_count?: number;
  establishment_state?: EstablishmentState;
  developed_space?: string;
  building_state?: BuildingState;
  equipment_state?: EquipmentState;
  sports_staff_count?: number;
  hr_needs?: string;
  rehabilitation_plan?: string;
  development_basin?: string;
  equipment_basin?: string;
  beneficiaries?: string;
  observations?: string;
  // End of new fields

  name: string;
  region: string;
  city: string;
  address: string;
  sports: string[];
  type: "indoor" | "outdoor";
  accessible: boolean;
  description: string;
  photoUrl?: string;
  location: {
    lat: number;
    lng: number;
  };
  equipments?: EquipmentItem[];
  createdAt?: any;
  updatedAt?: any;
}

export type RequestStatus = 'pending' | 'approved' | 'rejected';

export interface FacilityRequest extends Omit<Facility, 'id' | 'adminId' | 'createdAt' | 'updatedAt'> {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  status: RequestStatus;
  rejectionReason?: string;
  createdAt: any;
  updatedAt: any;
}

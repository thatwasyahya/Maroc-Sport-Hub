
export type UserRole = "super_admin" | "admin" | "user";

export interface User {
  id: string;
  name: string; // Full name
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string | null;
  gender?: 'Male' | 'Female' | null;
  birthDate?: any; // Can be a server timestamp or Date object
  role: UserRole;
  jobTitle?: string;
  city?: string;
  favoriteSports?: string[];
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
  id: string;
  adminId: string;

  // New fields from spreadsheet
  reference_region?: string;
  province?: string;
  commune?: string;
  milieu?: 'Urbain' | 'Rural';
  installations_sportives?: string; // Was category
  categorie_abregee?: string;
  name: string; // Was nom_etablissement
  address: string; // Was localisation
  location?: {
    lat: number; // was latitude
    lng: number; // was longitude
  };
  ownership?: string; // was propriete
  managing_entity?: string; // was entite_gestionnaire
  last_renovation_date?: any; // was date_derniere_renovation
  surface_area?: number; // was superficie
  capacity?: number; // was capacite_accueil
  staff_count?: number; // was effectif
  establishment_state?: EstablishmentState;
  developed_space?: boolean; // was espace_amenage
  titre_foncier_numero?: string;
  building_state?: BuildingState; // was etat_batiment
  equipment_state?: EquipmentState; // was etat_equipements
  sports_staff_count?: number; // was nombre_personnel_sport
  hr_needs?: boolean; // was besoin_rh
  rehabilitation_plan?: string; // was prise_en_compte_prog_rehabilitation_annee
  besoin_amenagement?: boolean;
  besoin_equipements?: boolean;
  observations?: string; // was observation_reouverture
  beneficiaries?: number; // was beneficiaires
  // End of new fields
  
  region: string;
  city: string; // Not in new schema, but useful
  sports: string[];
  type: "indoor" | "outdoor"; // Not in new schema
  accessible: boolean; // Not in new schema
  description: string;
  photoUrl?: string;
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

export interface FooterLink {
  label: string | Record<string, string>;
  url: string;
}

export interface Settings {
  appName: string | Record<string, string>;
  footerDescription: string | Record<string, string>;
  heroTitle: string | Record<string, string>;
  heroSubtitle: string | Record<string, string>;
  footerLinks?: FooterLink[];
  contactEmail?: string;
  contactPhone?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  twitterUrl?: string;
}

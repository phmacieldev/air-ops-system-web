export type Role = "TRAINEE" | "PILOT" | "INSTRUCTOR" | "SUPERVISOR" | "LEAD" | "ADM";

export type PilotStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED" | "TRAINING";

export type FlightStatus = "PENDING" | "APPROVED" | "REJECTED";

export type ReportStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
}

export interface Pilot {
  id: string;
  userId: string;
  fullName: string;
  callsign: string;
  profileImageUrl: string | null;
  flightMinutes: number;
  accumulatedScore: number;
  status: PilotStatus;
  discordId: string;
  rankName: string;
  grupo: string;
  certifications: string[];
}

export interface FlightLog {
  id: string;
  pilotName: string;
  pilotCallsign: string;
  aircraft: string;
  flightType: string;
  flightStatus: FlightStatus;
  startedAt: string;
  endAt: string | null;
  approvedBy: string | null;
  createdAt: string;
  notes: string | null;
}

export interface PerformanceReport {
  id: string;
  pilotName: string;
  pilotCallsign: string;
  pilotRank: string;
  pilotAccumulatedScore: number;
  flightId: string;
  seizures: number;
  chases: number;
  operations: number;
  accidents: number;
  score: number;
  status: ReportStatus;
  reviewedBy: string | null;
  createdAt: string;
}

export interface Document {
  id: string;
  title: string;
  url: string;
  category: string;
  updatedAt: string;
}

export interface Rank {
  id: string;
  name: string;
  hierarchyLevel: number;
  description: string;
}

export type CertificateType = "PURSUIT" | "OPERATIONAL" | "SCENE_CONTROL" | "COPILOT" | "TRANSPORT";
export type HolderType     = "MEMBER" | "EXTERNAL";

export interface Certification {
  id: string;
  holderType: HolderType;
  memberId: string | null;
  memberCallsign: string | null;
  memberProfileImageUrl: string | null;
  fullName: string;
  discordId: string | null;
  externalCallsign: string | null;
  externalRank: string | null;
  externalUnit: string | null;
  certificateType: CertificateType;
  issuedByCallsign: string;
  issuedAt: string;
  notes: string | null;
}

export interface Aviso {
  id: string;
  content: string;
  createdBy: string;
  createdAt: string;
}

export interface UnitAviso {
  id: string;
  unit: string;
  content: string;
  createdBy: string;
  createdAt: string;
}

export interface Mandado {
  id: string;
  suspectName: string;
  description: string;
  status: "ACTIVE" | "EXECUTED" | "CANCELLED";
  createdBy: string;
  createdAt: string;
}

export interface Briefing {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  announcements: string[];
  topics: string[];
  notices: string[];
  createdBy: string;
  createdAt: string;
}

export type PoliceRank =
  | "CADET" | "SOLO_CADET" | "OFFICER" | "OFFICER_1" | "OFFICER_2" | "OFFICER_3"
  | "SENIOR_OFFICER" | "CORPORAL" | "SERGEANT" | "LIEUTENANT" | "CAPTAIN"
  | "ASSISTANT_CHIEF" | "CHIEF" | "COMMISSIONER";

export type PoliceUnit = "CID" | "HEAT" | "ASD" | "METRO" | "MU" | "FTO";

export type OfficerStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED" | "TRAINING";

export interface OfficerWeapon {
  class: "CLASSE_1" | "CLASSE_2" | "CLASSE_3" | "TASER";
  serial: string;
}

export interface UnitMembership {
  unit: string;
  unitRankId: string | null;
  unitRankName: string | null;
}

export interface UnitRank {
  id: string;
  name: string;
  hierarchyLevel: number;
  description: string;
  unit: string;
}

export interface Officer {
  id: string;
  fullName: string;
  callsign: string;
  profileImageUrl: string | null;
  rank: PoliceRank;
  units: UnitMembership[];
  unitNames: string[];
  status: OfficerStatus;
  discordId: string;
  badgeNumber: number | null;
  phone: string | null;
  dna: string | null;
  fingerprint: string | null;
  weapons: OfficerWeapon[];
  notes: string | null;
  employer: string;
  asd: AsdProfile | null;
}

export interface AsdProfile {
  pilotId: string;
  asdRank: string | null;
  asdCallsign: string | null;
  flightMinutes: number;
  accumulatedScore: number;
  asdStatus: string | null;
}

export type RoleCallType   = "PROMOTION" | "UNIT" | "BADGE" | "STATUS";
export type RoleCallStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface RoleCallRequest {
  id: string;
  officerId: string;
  officerName: string;
  officerCallsign: string;
  officerProfileImageUrl: string | null;
  type: RoleCallType;
  requestedValue: string;
  currentValue: string | null;
  status: RoleCallStatus;
  reason: string | null;
  reviewNote: string | null;
  reviewedBy: string | null;
  createdAt: string;
  reviewedAt: string | null;
}

export interface PagedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    size: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiError {
  status: number;
  error: string;
  message: string;
}

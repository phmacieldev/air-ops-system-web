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
  fullName: string;
  discordId: string;
  externalRank: string | null;
  externalUnit: string | null;
  certificateType: CertificateType;
  issuedByCallsign: string;
  issuedAt: string;
  notes: string | null;
}

export interface ApiError {
  status: number;
  error: string;
  message: string;
}

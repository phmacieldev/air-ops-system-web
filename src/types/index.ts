export type Role = "TRAINEE" | "PILOT" | "INSTRUCTOR" | "SUPERVISOR" | "LEAD";

export type PilotStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED" | "TRAINING";

export type FlightStatus = "PENDING" | "APPROVED" | "REJECTED";

export type ReportStatus = "PENDING" | "APPROVED";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  createdAt: string;
}

export interface Pilot {
  id: string;
  fullName: string;
  callsign: string;
  profileImageUrl: string | null;
  flightMinutes: number;
  accumulatedScore: number;
  status: PilotStatus;
  discordId: string;
  rankName: string;
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

export interface ApiError {
  status: number;
  error: string;
  message: string;
}

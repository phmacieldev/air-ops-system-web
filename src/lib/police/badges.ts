import { PoliceRank } from "@/types";

export interface BadgeTier {
  label: string;
  ranks: PoliceRank[];
  min: number;
  max: number;
  accent: string;
}

export const BADGE_TIERS: BadgeTier[] = [
  {
    label: "Commissioner · Chief · Asst. Chief",
    ranks: ["COMMISSIONER", "CHIEF", "ASSISTANT_CHIEF"],
    min: 100, max: 199,
    accent: "#c084fc",
  },
  {
    label: "Captain",
    ranks: ["CAPTAIN"],
    min: 200, max: 299,
    accent: "#e8c97e",
  },
  {
    label: "Lieutenant",
    ranks: ["LIEUTENANT"],
    min: 300, max: 399,
    accent: "#e8c97e",
  },
  {
    label: "Sergeant",
    ranks: ["SERGEANT"],
    min: 400, max: 499,
    accent: "#4a90e2",
  },
  {
    label: "Corporal",
    ranks: ["CORPORAL"],
    min: 500, max: 599,
    accent: "#4a90e2",
  },
  {
    label: "Senior Officer",
    ranks: ["SENIOR_OFFICER"],
    min: 600, max: 699,
    accent: "#3dd68c",
  },
  {
    label: "Officer · Officer I · II · III",
    ranks: ["OFFICER", "OFFICER_1", "OFFICER_2", "OFFICER_3"],
    min: 700, max: 799,
    accent: "#5a8ab8",
  },
  {
    label: "Solo Cadet",
    ranks: ["SOLO_CADET"],
    min: 800, max: 899,
    accent: "#8a9ab8",
  },
  {
    label: "Cadet",
    ranks: ["CADET"],
    min: 900, max: 999,
    accent: "#8a9ab8",
  },
];

/** Retorna o tier válido para um rank, ou null se não mapeado */
export function tierForRank(rank: PoliceRank): BadgeTier | null {
  return BADGE_TIERS.find((t) => t.ranks.includes(rank)) ?? null;
}

/** Valida se um número de badge é compatível com o rank */
export function badgeValidForRank(badge: number, rank: PoliceRank): boolean {
  const tier = tierForRank(rank);
  if (!tier) return false;
  return badge >= tier.min && badge <= tier.max;
}

"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { PoliceRank, PoliceUnit } from "@/types";
import { useAuth } from "./AuthContext";

const RANK_ORDER: Record<string, number> = {
  CADET: 1, SOLO_CADET: 2, OFFICER: 3, OFFICER_1: 4, OFFICER_2: 5,
  OFFICER_3: 6, SENIOR_OFFICER: 7, CORPORAL: 8, SERGEANT: 9,
  LIEUTENANT: 10, CAPTAIN: 11, ASSISTANT_CHIEF: 12, CHIEF: 13, COMMISSIONER: 14,
};

// Badges with full system access
export const COMMAND_BADGES = [100, 200, 300];

interface OfficerCtx {
  officerId: string | null;
  rank: PoliceRank | null;
  units: PoliceUnit[];
  badgeNumber: number | null;
  canApprove: boolean;
  isCommand: boolean;   // badge 100 / 200 / 300 → acesso total
  loading: boolean;
  refresh: () => void;
}

const Ctx = createContext<OfficerCtx>({
  officerId: null, rank: null, units: [], badgeNumber: null,
  canApprove: false, isCommand: false, loading: true, refresh: () => {},
});

export function OfficerProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const [state, setState] = useState<Omit<OfficerCtx, "refresh">>({
    officerId: null, rank: null, units: [], badgeNumber: null,
    canApprove: false, isCommand: false, loading: true,
  });

  function load() {
    if (!token) { setState(s => ({ ...s, loading: false })); return; }
    api.get<{ id: string; rank: PoliceRank; unitNames: string[]; badgeNumber: number | null }>("/officers/me", 60)
      .then((o) => setState({
        officerId:   o.id,
        rank:        o.rank,
        units:       (o.unitNames ?? []) as PoliceUnit[],
        badgeNumber: o.badgeNumber,
        canApprove:  (RANK_ORDER[o.rank] ?? 0) >= 10,
        isCommand:   o.badgeNumber != null && COMMAND_BADGES.includes(o.badgeNumber),
        loading:     false,
      }))
      .catch(() => setState(s => ({ ...s, loading: false })));
  }

  useEffect(() => { load(); }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  return <Ctx.Provider value={{ ...state, refresh: load }}>{children}</Ctx.Provider>;
}

export const useOfficer = () => useContext(Ctx);

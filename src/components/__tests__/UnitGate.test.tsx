import React from "react";
import { render, screen } from "@testing-library/react";
import { UnitGate } from "../UnitGate";

// ── Mocks ─────────────────────────────────────────────────────────────────

const mockReplace = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

let mockOfficerState = {
  units: [] as string[],
  isCommand: false,
  loading: false,
};

jest.mock("@/context/OfficerContext", () => ({
  useOfficer: () => mockOfficerState,
}));

// ── Tests ─────────────────────────────────────────────────────────────────

describe("UnitGate", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockOfficerState = { units: [], isCommand: false, loading: false };
  });

  it("renders children when officer belongs to the unit", () => {
    mockOfficerState.units = ["CID"];

    render(
      <UnitGate unit="CID">
        <p>CID Dashboard</p>
      </UnitGate>
    );

    expect(screen.getByText("CID Dashboard")).toBeInTheDocument();
  });

  it("renders children when officer is command (full access)", () => {
    mockOfficerState.isCommand = true;
    mockOfficerState.units = [];

    render(
      <UnitGate unit="HEAT">
        <p>HEAT Content</p>
      </UnitGate>
    );

    expect(screen.getByText("HEAT Content")).toBeInTheDocument();
  });

  it("renders nothing while loading", () => {
    mockOfficerState.loading = true;
    mockOfficerState.units = ["CID"];

    const { container } = render(
      <UnitGate unit="CID">
        <p>Should not render</p>
      </UnitGate>
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("renders nothing and redirects when officer lacks unit access", () => {
    mockOfficerState.units = ["CID"];

    const { container } = render(
      <UnitGate unit="HEAT">
        <p>HEAT Secret Content</p>
      </UnitGate>
    );

    expect(container).toBeEmptyDOMElement();
    expect(mockReplace).toHaveBeenCalledWith("/police/dashboard");
  });

  it("does not redirect while still loading", () => {
    mockOfficerState.loading = true;
    mockOfficerState.units = [];

    render(
      <UnitGate unit="MU">
        <p>MU Content</p>
      </UnitGate>
    );

    expect(mockReplace).not.toHaveBeenCalled();
  });

  it("does not redirect when command flag overrides unit restriction", () => {
    mockOfficerState.isCommand = true;
    mockOfficerState.units = [];

    render(
      <UnitGate unit="FTO">
        <p>Command can see FTO</p>
      </UnitGate>
    );

    expect(mockReplace).not.toHaveBeenCalled();
    expect(screen.getByText("Command can see FTO")).toBeInTheDocument();
  });
});

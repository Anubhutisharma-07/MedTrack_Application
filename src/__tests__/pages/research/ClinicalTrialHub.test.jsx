import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import ClinicalTrialHub from "../../../pages/research/ClinicalTrialHub";

describe("ClinicalTrialHub", () => {
  it("renders biomarker cards with relevance badges without crashing", () => {
    render(<ClinicalTrialHub />);

    expect(screen.getByText("Biomarker Explorer")).toBeInTheDocument();
    expect(screen.getByText("PD-L1")).toBeInTheDocument();
    // The relevance badge used to index SEVERITY_META with the relevance tone
    // (emerald/sky/amber), which is not a key of that map, crashing the whole
    // page with "Cannot read properties of undefined (reading 'border')".
    expect(screen.getAllByText("Approved companion").length).toBeGreaterThan(0);
  });

  it("renders the trial portfolio tab", () => {
    render(<ClinicalTrialHub />);
    expect(screen.getByText("Trial Portfolio")).toBeInTheDocument();
  });
});

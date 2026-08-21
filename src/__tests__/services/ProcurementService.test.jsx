import { describe, it, expect, vi, beforeEach } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

const B = "http://localhost:8081";
const P = "/api/procurement";
const server = setupServer(
  http.get(`${B}${P}/requests`, () => HttpResponse.json([{ id: "PR-1" }])),
  http.get(`${B}${P}/requests/:id`, ({ params }) => HttpResponse.json({ id: params.id })),
  http.post(`${B}${P}/requests`, () => HttpResponse.json({ id: "PR-NEW" })),
  http.post(`${B}${P}/requests/:id/cancel`, () => HttpResponse.json({ message: "Cancelled" })),
  http.post(`${B}${P}/steps/:stepId/decision`, () => HttpResponse.json({ message: "Decided" })),
  http.get(`${B}${P}/approval-inbox`, () => HttpResponse.json([{ id: "IN-1" }])),
  http.get(`${B}${P}/policies`, () => HttpResponse.json([{ id: "POL-1" }])),
  http.post(`${B}${P}/policies`, () => HttpResponse.json({ id: "POL-NEW" })),
  http.put(`${B}${P}/policies/:id`, ({ params }) => HttpResponse.json({ id: params.id })),
  http.post(`${B}${P}/policies/:id/steps`, () => HttpResponse.json({ id: "STEP-NEW" })),
  http.delete(`${B}${P}/policies/:id/steps/:stepId`, () => HttpResponse.json({ message: "Step removed" })),
  http.delete(`${B}${P}/policies/:id`, () => HttpResponse.json({ message: "Policy deleted" })),
  http.post(`${B}${P}/requests/:requestId/quotes`, () => HttpResponse.json({ id: "Q-NEW" })),
  http.get(`${B}${P}/requests/:requestId/quotes`, () => HttpResponse.json([{ id: "Q-1" }])),
  http.get(`${B}${P}/quotes/mine`, () => HttpResponse.json([{ id: "Q-MINE" }])),
  http.post(`${B}${P}/requests/:requestId/quotes/:quoteId/accept`, () => HttpResponse.json({ message: "Accepted" })),
  http.post(`${B}${P}/requests/:requestId/receiving`, () => HttpResponse.json({ id: "REC-1" })),
  http.get(`${B}${P}/requests/:requestId/receiving`, () => HttpResponse.json([])),
  http.post(`${B}${P}/requests/:requestId/invoice-match`, () => HttpResponse.json({ id: "INV-1" })),
  http.get(`${B}${P}/requests/:requestId/invoice-match`, () => HttpResponse.json([])),
  http.get(`${B}${P}/requests/:requestId/audit`, () => HttpResponse.json([])),
  http.get(`${B}${P}/budget`, () => HttpResponse.json({ total: 100000 })),
);
beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
beforeEach(() => { sessionStorage.clear(); });
async function load() { return import("../../services/ProcurementService"); }

describe("ProcurementService - Requests", () => {
  it("creates a request", async () => {
    const result = await (await load()).createProcurementRequest({});
    expect(result.id).toBe("PR-NEW");
  });
  it("lists requests", async () => {
    const result = await (await load()).listProcurementRequests();
    expect(result).toHaveLength(1);
  });
  it("lists with status filter", async () => {
    const result = await (await load()).listProcurementRequests("APPROVED");
    expect(result).toBeDefined();
  });
  it("gets a request", async () => {
    const result = await (await load()).getProcurementRequest("PR-1");
    expect(result.id).toBe("PR-1");
  });
  it("cancels a request", async () => {
    const result = await (await load()).cancelProcurementRequest("PR-1");
    expect(result.message).toBe("Cancelled");
  });
});
describe("ProcurementService - Approval Steps", () => {
  it("decides a step", async () => {
    const result = await (await load()).decideApprovalStep("S-1", true, "LGTM");
    expect(result.message).toBe("Decided");
  });
  it("gets approval inbox", async () => {
    const result = await (await load()).getApprovalInbox();
    expect(result).toHaveLength(1);
  });
});
describe("ProcurementService - Policies", () => {
  it("lists policies", async () => {
    const result = await (await load()).listApprovalPolicies();
    expect(result).toHaveLength(1);
  });
  it("creates a policy", async () => {
    const result = await (await load()).createApprovalPolicy({});
    expect(result.id).toBe("POL-NEW");
  });
  it("updates a policy", async () => {
    const result = await (await load()).updateApprovalPolicy("POL-1", {});
    expect(result.id).toBe("POL-1");
  });
  it("adds a step", async () => {
    const result = await (await load()).addPolicyStep("POL-1", {});
    expect(result.id).toBe("STEP-NEW");
  });
  it("removes a step", async () => {
    const result = await (await load()).removePolicyStep("POL-1", "S-1");
    expect(result.message).toBe("Step removed");
  });
  it("deletes a policy", async () => {
    const result = await (await load()).deleteApprovalPolicy("POL-1");
    expect(result.message).toBe("Policy deleted");
  });
});
describe("ProcurementService - Quotes", () => {
  it("submits a quote", async () => {
    const result = await (await load()).submitSupplierQuote("PR-1", {});
    expect(result.id).toBe("Q-NEW");
  });
  it("lists quotes for request", async () => {
    const result = await (await load()).listQuotesForRequest("PR-1");
    expect(result).toHaveLength(1);
  });
  it("lists my quotes", async () => {
    const result = await (await load()).listMyQuotes();
    expect(result).toHaveLength(1);
  });
  it("accepts a quote", async () => {
    const result = await (await load()).acceptQuote("PR-1", "Q-1");
    expect(result.message).toBe("Accepted");
  });
});
describe("ProcurementService - Receiving & Invoice", () => {
  it("records receiving", async () => {
    const result = await (await load()).recordReceiving("PR-1", {});
    expect(result.id).toBe("REC-1");
  });
  it("lists receiving records", async () => {
    const result = await (await load()).listReceivingRecords("PR-1");
    expect(result).toHaveLength(0);
  });
  it("records invoice match", async () => {
    const result = await (await load()).recordInvoiceMatch("PR-1", {});
    expect(result.id).toBe("INV-1");
  });
  it("lists invoice matches", async () => {
    const result = await (await load()).listInvoiceMatches("PR-1");
    expect(result).toHaveLength(0);
  });
});
describe("ProcurementService - Audit & Budget", () => {
  it("gets audit trail", async () => {
    const result = await (await load()).getProcurementAuditTrail("PR-1");
    expect(result).toHaveLength(0);
  });
  it("gets budget summary", async () => {
    const result = await (await load()).getBudgetSummary();
    expect(result.total).toBe(100000);
  });
});

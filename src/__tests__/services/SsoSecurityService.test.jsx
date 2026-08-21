import { describe, it, expect, beforeEach } from "vitest";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

const B = "http://localhost:8081";
const server = setupServer(
  http.post(`${B}/api/auth/sso/configure`, () => HttpResponse.json({ id: "sso-1", name: "Okta" })),
  http.post(`${B}/api/auth/sso/initiate`, () => HttpResponse.json({ redirectUrl: "https://okta.com/auth" })),
  http.get(`${B}/api/auth/sso/providers`, () => HttpResponse.json([{ id: "sso-1", name: "Okta", enabled: true }])),
  http.post(`${B}/api/auth/sso/toggle/:id`, ({ request }) => HttpResponse.json({ id: "sso-1", enabled: false })),
  http.get(`${B}/api/auth/audit/risk/:userId`, () => HttpResponse.json({ riskScore: 15, level: "low" })),
  http.get(`${B}/api/auth/audit/user/:userId`, () => HttpResponse.json([{ action: "sso_login" }])),
);
beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
beforeEach(() => { sessionStorage.clear(); });
async function load() { return import("../../services/SsoSecurityService"); }

describe("SsoSecurityService", () => {
  it("configures SSO provider", async () => {
    const result = await (await load()).configureSsoProvider({ name: "Okta" });
    expect(result.id).toBe("sso-1");
  });
  it("initiates SSO login", async () => {
    const result = await (await load()).initiateSsoLogin("user@corp.com");
    expect(result.redirectUrl).toContain("okta.com");
  });
  it("gets all SSO providers", async () => {
    const result = await (await load()).getAllSsoProviders();
    expect(result).toHaveLength(1);
  });
  it("toggles SSO provider", async () => {
    const result = await (await load()).toggleSsoProvider("sso-1", false);
    expect(result.enabled).toBe(false);
  });
  it("evaluates user security risk", async () => {
    const result = await (await load()).evaluateUserSecurityRisk("u1");
    expect(result.riskScore).toBe(15);
  });
  it("gets user audit logs", async () => {
    const result = await (await load()).getUserAuditLogs("u1");
    expect(result).toHaveLength(1);
  });
  it("rejects on server error", async () => {
    server.use(http.get(`${B}/api/auth/sso/providers`, () => HttpResponse.json({}, { status: 500 })));
    await expect((await load()).getAllSsoProviders()).rejects.toThrow();
  });
});

import { screen } from "@testing-library/react";
import { it, expect, vi, beforeEach } from "vitest";
import { renderWithProviders } from "../utils/renderWithProviders";
import AppRouter from "../../routes/AppRoutes";

vi.mock("../../services/AuthService", () => ({
  loginUser: vi.fn(),
  getAuthorityVersion: vi.fn(),
  forgotPassword: vi.fn(),
  verifyOtp: vi.fn(),
  resetPassword: vi.fn(),
  incrementAuthorityVersion: vi.fn(),
  bumpGlobalAuthorityVersion: vi.fn(),
  getAuthorityAuditLogs: vi.fn(),
}));

vi.mock("../../services/HttpService", () => ({
  default: { get: vi.fn().mockResolvedValue({ data: [] }) },
  errorEmitter: new EventTarget(),
}));

beforeEach(() => {
  sessionStorage.clear();
});

// Non-parameterised routes carry pageData in component state only (never in the URL), so it must be
// forwarded to the rendered component as props. The register / verify-otp / reset-password pages
// depend on it: e.g. the "Free Supplier Account" CTAs pass { defaultRole: "Supplier" } and the
// forgot-password flow passes { email } / { email, otp }.
it("forwards pageData to non-parameterised route components", async () => {
  renderWithProviders(
    <AppRouter
      currentPage="verify-otp"
      onNavigate={() => {}}
      pageData={{ email: "doc@medtrack.com" }}
    />,
    { authValue: { user: null } }
  );

  // VerifyOtpForm surfaces the email it is verifying. The page is lazy-loaded, so give the
  // Suspense fallback generous time to resolve under full-suite CPU load.
  expect(
    await screen.findByText(/doc@medtrack\.com/, {}, { timeout: 5000 })
  ).toBeInTheDocument();
});

it("passes defaultRole through to the register page", async () => {
  renderWithProviders(
    <AppRouter
      currentPage="register"
      onNavigate={() => {}}
      pageData={{ defaultRole: "Supplier" }}
    />,
    { authValue: { user: null } }
  );

  // RegisterPage initialises its role selector from defaultRole, so a supplier signup CTA
  // actually lands on the supplier role instead of silently defaulting to "hospital".
  expect(
    await screen.findByDisplayValue("Supplier (Vendor & Orders)", {}, { timeout: 5000 })
  ).toBeInTheDocument();
});

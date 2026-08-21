import { describe, it, expect } from "vitest";
import { escapeHtml } from "../../utils/escapeHtml";

describe("escapeHtml", () => {
  it("escapes <, >, &, \" and '", () => {
    expect(escapeHtml(`<script>alert("pwned")</script>'`)).toBe(
      "&lt;script&gt;alert(&quot;pwned&quot;)&lt;/script&gt;&#39;"
    );
  });

  it("escapes an inline event-handler payload", () => {
    expect(escapeHtml(`<img src=x onerror="alert(1)">`)).toBe(
      "&lt;img src=x onerror=&quot;alert(1)&quot;&gt;"
    );
  });

  it("escapes ampersands before anything else (no double escaping)", () => {
    expect(escapeHtml("R&D <AT&T>")).toBe("R&amp;D &lt;AT&amp;T&gt;");
  });

  it("keeps safe text unchanged", () => {
    expect(escapeHtml("Clean medical notes, room 12-B.")).toBe(
      "Clean medical notes, room 12-B."
    );
  });

  it("coerces numbers to strings", () => {
    expect(escapeHtml(42)).toBe("42");
    expect(escapeHtml(0)).toBe("0");
  });

  it("treats null and undefined as empty strings", () => {
    expect(escapeHtml(null)).toBe("");
    expect(escapeHtml(undefined)).toBe("");
  });
});
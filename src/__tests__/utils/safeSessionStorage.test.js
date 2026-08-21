import { describe, it, expect, beforeEach } from "vitest";
import { readJson, writeJson, remove, storageAvailable } from "../../utils/safeSessionStorage";

beforeEach(() => { sessionStorage.clear(); });

describe("safeSessionStorage", () => {
  describe("writeJson", () => {
    it("stores a value and retrieves it with readJson", () => {
      writeJson("test_key", { hello: "world" });
      expect(readJson("test_key")).toEqual({ hello: "world" });
    });
    it("returns true on successful write", () => {
      expect(writeJson("test_key", { data: 123 })).toBe(true);
    });
    it("overwrites an existing value", () => {
      writeJson("test_key", { v: 1 });
      writeJson("test_key", { v: 2 });
      expect(readJson("test_key")).toEqual({ v: 2 });
    });
    it("stores arrays", () => {
      writeJson("arr", [1, 2, 3]);
      expect(readJson("arr")).toEqual([1, 2, 3]);
    });
    it("stores nested objects", () => {
      const deep = { a: { b: { c: { d: 42 } } } };
      writeJson("deep", deep);
      expect(readJson("deep")).toEqual(deep);
    });
    it("handles null values — readJson returns fallback", () => {
      writeJson("null_key", null);
      expect(readJson("null_key", "fallback")).toBe("fallback");
    });
    it("handles undefined values", () => {
      writeJson("undef_key", undefined);
      expect(readJson("undef_key", "fallback")).toBe("fallback");
    });
    it("handles empty string value", () => {
      writeJson("empty_str", "");
      expect(readJson("empty_str")).toBe("");
    });
    it("handles zero as a value", () => {
      writeJson("zero", 0);
      expect(readJson("zero")).toBe(0);
    });
    it("handles boolean values", () => {
      writeJson("bool_true", true);
      writeJson("bool_false", false);
      expect(readJson("bool_true")).toBe(true);
      expect(readJson("bool_false")).toBe(false);
    });
  });

  describe("readJson", () => {
    it("returns fallback when key does not exist", () => {
      expect(readJson("nonexistent")).toBeNull();
    });
    it("returns custom fallback when key does not exist", () => {
      expect(readJson("nonexistent", "default")).toBe("default");
    });
    it("returns fallback for malformed JSON", () => {
      sessionStorage.setItem("corrupt", "{invalid json!!!");
      expect(readJson("corrupt", "fallback")).toBe("fallback");
    });
    it("removes corrupt entries to prevent repeated failures", () => {
      sessionStorage.setItem("corrupt", "not-json");
      readJson("corrupt", "fallback");
      expect(sessionStorage.getItem("corrupt")).toBeNull();
    });
    it("returns fallback for JSON literal null", () => {
      sessionStorage.setItem("null_val", "null");
      expect(readJson("null_val", "fallback")).toBe("fallback");
    });
    it("parses valid JSON objects", () => {
      sessionStorage.setItem("valid", JSON.stringify({ key: "value" }));
      expect(readJson("valid")).toEqual({ key: "value" });
    });
    it("parses valid JSON strings", () => {
      sessionStorage.setItem("str", JSON.stringify("hello"));
      expect(readJson("str")).toBe("hello");
    });
    it("parses valid JSON numbers", () => {
      sessionStorage.setItem("num", JSON.stringify(42));
      expect(readJson("num")).toBe(42);
    });
  });

  describe("remove", () => {
    it("removes an existing key", () => {
      writeJson("to_remove", { data: 1 });
      expect(readJson("to_remove")).toEqual({ data: 1 });
      remove("to_remove");
      expect(readJson("to_remove")).toBeNull();
    });
    it("does not throw when removing a non-existent key", () => {
      expect(() => remove("never_existed")).not.toThrow();
    });
  });

  describe("storageAvailable", () => {
    it("is a boolean", () => { expect(typeof storageAvailable).toBe("boolean"); });
    it("is true in jsdom environment", () => { expect(storageAvailable).toBe(true); });
  });

  describe("user object round-trip (realistic scenario)", () => {
    it("stores and retrieves a complete user object as AuthContext does", () => {
      const user = { id: "demo-hosp-1", name: "Hospital Admin", email: "hospital@medtrack.com", phone: "555-0101", organization: "MedTrack General", role: "HOSPITAL", token: "demo-token-hospital" };
      writeJson("medtrack_user", user);
      const stored = readJson("medtrack_user");
      expect(stored).toEqual(user);
      expect(stored.token).toBe("demo-token-hospital");
      expect(stored.role).toBe("HOSPITAL");
    });
    it("stores and retrieves authority state as AuthContext does", () => {
      const authority = { authorityVersion: 3, permissions: ["manage_equipment", "view_reports"], role: "hospital", active: true };
      writeJson("medtrack_authority", authority);
      const stored = readJson("medtrack_authority");
      expect(stored.authorityVersion).toBe(3);
      expect(stored.permissions).toContain("manage_equipment");
    });
    it("handles logout cleanup scenario", () => {
      writeJson("medtrack_user", { id: "u1", token: "tok" });
      writeJson("medtrack_authority", { authorityVersion: 1, permissions: [] });
      remove("medtrack_user");
      remove("medtrack_authority");
      expect(readJson("medtrack_user")).toBeNull();
      expect(readJson("medtrack_authority")).toBeNull();
    });
  });
});

import { describe, it, expect } from "vitest";
import {
  PERMISSIONS,
  ALL_PERMISSIONS,
  ROLE_DEFAULT_PERMISSIONS,
  UNKNOWN_ROLE_PERMISSIONS,
  permissionsForRole,
  mergePermissions,
  hasPermissionIn,
  hasAnyPermissionIn,
  filterNavLinks,
  describePermissionDenial,
} from "../../security/permissions";

describe("PERMISSIONS", () => {
  it("defines every code the backend AuthorityService can issue", () => {
    expect(PERMISSIONS).toEqual({
      READ_BASIC: "READ_BASIC",
      READ_EQUIPMENT: "READ_EQUIPMENT",
      WRITE_EQUIPMENT: "WRITE_EQUIPMENT",
      READ_ORDERS: "READ_ORDERS",
      CREATE_ORDERS: "CREATE_ORDERS",
      READ_MAINTENANCE: "READ_MAINTENANCE",
      UPDATE_MAINTENANCE: "UPDATE_MAINTENANCE",
      MANAGE_USERS: "MANAGE_USERS",
      SUBMIT_DIAGNOSTICS: "SUBMIT_DIAGNOSTICS",
      UPDATE_ORDER_STATUS: "UPDATE_ORDER_STATUS",
      READ_SHIPMENTS: "READ_SHIPMENTS",
      WRITE_SHIPMENTS: "WRITE_SHIPMENTS",
      SEND_INVOICE: "SEND_INVOICE",
    });
  });

  it("ALL_PERMISSIONS is a flat de-duplicated list of the same codes", () => {
    expect(ALL_PERMISSIONS).toHaveLength(Object.keys(PERMISSIONS).length);
    expect(new Set(ALL_PERMISSIONS).size).toBe(ALL_PERMISSIONS.length);
    ALL_PERMISSIONS.forEach((code) => expect(PERMISSIONS[code]).toBe(code));
  });
});

describe("ROLE_DEFAULT_PERMISSIONS", () => {
  it("mirrors the backend AuthorityService ROLE_PERMISSIONS matrix", () => {
    expect(ROLE_DEFAULT_PERMISSIONS.hospital).toEqual([
      "READ_EQUIPMENT",
      "WRITE_EQUIPMENT",
      "READ_ORDERS",
      "CREATE_ORDERS",
      "READ_MAINTENANCE",
      "MANAGE_USERS",
    ]);
    expect(ROLE_DEFAULT_PERMISSIONS.technician).toEqual([
      "READ_EQUIPMENT",
      "READ_MAINTENANCE",
      "UPDATE_MAINTENANCE",
      "SUBMIT_DIAGNOSTICS",
    ]);
    expect(ROLE_DEFAULT_PERMISSIONS.supplier).toEqual([
      "READ_ORDERS",
      "UPDATE_ORDER_STATUS",
      "READ_SHIPMENTS",
      "WRITE_SHIPMENTS",
      "SEND_INVOICE",
    ]);
  });

  it("falls back to READ_BASIC for roles outside the matrix, like the backend", () => {
    expect(UNKNOWN_ROLE_PERMISSIONS).toEqual(["READ_BASIC"]);
  });
});

describe("permissionsForRole", () => {
  it("is case-insensitive", () => {
    expect(permissionsForRole("HOSPITAL")).toEqual(permissionsForRole("hospital"));
    expect(permissionsForRole("Technician")).toEqual(ROLE_DEFAULT_PERMISSIONS.technician);
  });

  it("returns READ_BASIC for undefined, null, or unknown roles", () => {
    expect(permissionsForRole(undefined)).toEqual(["READ_BASIC"]);
    expect(permissionsForRole(null)).toEqual(["READ_BASIC"]);
    expect(permissionsForRole("biomedical")).toEqual(["READ_BASIC"]);
  });
});

describe("mergePermissions", () => {
  it("treats the server's list as authoritative when present", () => {
    const revoked = ["READ_EQUIPMENT", "READ_MAINTENANCE"];
    expect(mergePermissions(revoked, "hospital")).toEqual(revoked);
  });

  it("falls back to the role matrix when the server list is empty or missing", () => {
    expect(mergePermissions([], "hospital")).toEqual(ROLE_DEFAULT_PERMISSIONS.hospital);
    expect(mergePermissions(undefined, "supplier")).toEqual(ROLE_DEFAULT_PERMISSIONS.supplier);
    expect(mergePermissions(null, "technician")).toEqual(ROLE_DEFAULT_PERMISSIONS.technician);
  });

  it("never leaves a session with zero permissions", () => {
    expect(mergePermissions([], undefined)).toEqual(["READ_BASIC"]);
    expect(mergePermissions([], "unknown-role")).toEqual(["READ_BASIC"]);
  });

  it("de-duplicates a server list that repeats codes", () => {
    expect(mergePermissions(["READ_ORDERS", "READ_ORDERS", "SEND_INVOICE"], "supplier")).toEqual([
      "READ_ORDERS",
      "SEND_INVOICE",
    ]);
  });
});

describe("hasPermissionIn / hasAnyPermissionIn", () => {
  const set = ["READ_EQUIPMENT", "UPDATE_MAINTENANCE"];

  it("checks a single code", () => {
    expect(hasPermissionIn(set, "READ_EQUIPMENT")).toBe(true);
    expect(hasPermissionIn(set, "SEND_INVOICE")).toBe(false);
  });

  it("grants when any requested code is held", () => {
    expect(hasAnyPermissionIn(set, ["SEND_INVOICE", "UPDATE_MAINTENANCE"])).toBe(true);
    expect(hasAnyPermissionIn(set, ["SEND_INVOICE", "CREATE_ORDERS"])).toBe(false);
  });

  it("treats an empty request as granted (no constraint)", () => {
    expect(hasAnyPermissionIn(set, [])).toBe(true);
    expect(hasAnyPermissionIn(set, undefined)).toBe(true);
  });
});

describe("filterNavLinks", () => {
  const can = (permission) => permission === "READ_ORDERS";
  const links = [
    { label: "Public", page: "blog" },
    { label: "Orders", page: "orders", permission: "READ_ORDERS" },
    { label: "Equipment", page: "equipment", permission: "READ_EQUIPMENT" },
  ];

  it("keeps ungated links and links the session holds, in order", () => {
    expect(filterNavLinks(links, can)).toEqual([
      { label: "Public", page: "blog" },
      { label: "Orders", page: "orders", permission: "READ_ORDERS" },
    ]);
  });

  it("drops links whose permission is missing", () => {
    const result = filterNavLinks(links, can);
    expect(result.some((link) => link.page === "equipment")).toBe(false);
  });

  it("survives non-array input", () => {
    expect(filterNavLinks(undefined, can)).toEqual([]);
    expect(filterNavLinks(null, can)).toEqual([]);
  });
});

describe("describePermissionDenial", () => {
  it("uses the friendly label for known permissions", () => {
    expect(describePermissionDenial("WRITE_EQUIPMENT")).toContain("Manage equipment");
    expect(describePermissionDenial("WRITE_EQUIPMENT")).toContain("WRITE_EQUIPMENT");
  });

  it("still names unknown codes", () => {
    expect(describePermissionDenial("BOGUS_CODE")).toContain("BOGUS_CODE");
  });
});

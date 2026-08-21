// Every source file under src/ must parse.
//
// Why this file exists
// --------------------
// Three pages on `main` could not be parsed, so `npm run build` produced no bundle at all and no
// deployment was possible:
//
//   src/pages/auth/BackendAuthenticationSecurityInfrastructurePage.jsx   (755:42)
//   src/pages/auth/EnterpriseZeroTrustSecurityGovernancePage.jsx         (833:42)
//   src/pages/hospital/ICUTelemetryOverwatchHubPage.jsx                  (980:149, 1273:78)
//
// All four sites were the same mistake: a relational operator written as JSX text.
//
//   <span>user.clearanceLevel >= 4 && device.isTpmVerified == true</span>
//   <strong>14.5 ACH (CDC Standard > 12)</strong>
//
// A `>` in JSX children is not an escaping nicety that renders oddly - it is a hard parse error, and
// the file never compiles. It is an easy mistake to ship because the surrounding lines look
// identical: `==`, `&&` and `<=` inside JSX text are all fine, so the author has no reason to
// suspect the one operator that is not. The three files were also written in the same sitting as
// each other, which is how four instances of one typo arrived together.
//
// scripts/check-syntax.js already catches this from `prebuild`, and CI runs it. What it does not
// cover is the contributor who runs `npm test`, sees green, and pushes: the test suite had no
// opinion on whether the tree it just tested could be built. That is not a hypothetical - the suite
// was green on 364 tests while the bundle was unbuildable, because a page that fails to parse is
// only imported by the routes that reference it, and unrouted pages are imported by nothing.
//
// So this suite duplicates the parse on purpose. It is cheap (well under a second for the whole
// tree), it reports every offending file in one pass rather than stopping at the first, and it puts
// the failure in front of whoever runs the tests.

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { describe, it, expect } from "vitest";
import * as parser from "@babel/parser";

const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(here, "..", "..", "..");
const sourceRoot = path.join(projectRoot, "src");

/** Directories that hold no first-party source. */
const SKIPPED_DIRECTORIES = new Set(["node_modules", "build", "dist", "coverage", ".git"]);

/**
 * The parser options have to match what the production build accepts, or this suite is either
 * stricter than the build (false failures) or looser (misses the breakage it exists to catch).
 * react-scripts compiles JSX with the automatic runtime and the standard preset-env plugin set, so
 * JSX plus the two proposal syntaxes the codebase uses is the right surface.
 */
const PARSER_OPTIONS = {
  sourceType: "module",
  errorRecovery: false,
  plugins: ["jsx", "optionalChaining", "nullishCoalescingOperator", "classProperties", "dynamicImport"],
};

function collectSourceFiles(directory, collected = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!SKIPPED_DIRECTORIES.has(entry.name)) {
        collectSourceFiles(path.join(directory, entry.name), collected);
      }
      continue;
    }
    if (/\.(js|jsx)$/.test(entry.name)) {
      collected.push(path.join(directory, entry.name));
    }
  }
  return collected;
}

const sourceFiles = collectSourceFiles(sourceRoot);

/** Parses one file and returns null on success, or a one-line description of the failure. */
function parseFailure(absolutePath) {
  const relative = path.relative(projectRoot, absolutePath);
  try {
    parser.parse(fs.readFileSync(absolutePath, "utf8"), { ...PARSER_OPTIONS, sourceFilename: relative });
    return null;
  } catch (error) {
    const at = error.loc ? `${error.loc.line}:${error.loc.column}` : "unknown position";
    return `${relative} (${at}) ${error.message.split("\n")[0]}`;
  }
}

describe("source tree parses", () => {
  it("finds the source tree to audit", () => {
    // A glob that silently matches nothing would make every assertion below vacuously true, which is
    // the failure mode that matters most for a whole-tree audit.
    expect(sourceFiles.length).toBeGreaterThan(300);
  });

  it("parses every JavaScript and JSX file under src/", () => {
    const failures = sourceFiles.map(parseFailure).filter(Boolean);

    // Asserting on the array rather than per-file means one run names every offender, which is what
    // made the original breakage tractable: the parser reports the *end* of an unbalanced JSX block,
    // so the reported line is often nowhere near the real mistake and you want the whole list.
    expect(failures).toEqual([]);
  });

  it("parses the three files whose relational operators broke the build", () => {
    // Named individually so a regression points at the specific defect rather than at "something in
    // the tree does not parse".
    const previouslyBroken = [
      "src/pages/auth/BackendAuthenticationSecurityInfrastructurePage.jsx",
      "src/pages/auth/EnterpriseZeroTrustSecurityGovernancePage.jsx",
      "src/pages/hospital/ICUTelemetryOverwatchHubPage.jsx",
    ];

    for (const relative of previouslyBroken) {
      const absolute = path.join(projectRoot, relative);
      expect(fs.existsSync(absolute), `${relative} exists`).toBe(true);
      expect(parseFailure(absolute), `${relative} parses`).toBeNull();
    }
  });

  it("keeps the operator that was escaped, rather than deleting the text around it", () => {
    // The cheap way to make an unparseable file parse is to delete the offending characters, which
    // silently changes what the console says. These four assertions pin the *content*: the ABAC and
    // DEA vault rules still state a clearance threshold, and the isolation panel still states the
    // CDC air-change and diuresis targets.
    const abac = fs.readFileSync(
      path.join(projectRoot, "src/pages/auth/BackendAuthenticationSecurityInfrastructurePage.jsx"),
      "utf8"
    );
    expect(abac).toContain("user.clearanceLevel >= 4 && device.isTpmVerified == true");

    const governance = fs.readFileSync(
      path.join(projectRoot, "src/pages/auth/EnterpriseZeroTrustSecurityGovernancePage.jsx"),
      "utf8"
    );
    expect(governance).toContain("user.clearanceLevel >= 4 && device.isHardwareTpm == true");

    const icu = fs.readFileSync(
      path.join(projectRoot, "src/pages/hospital/ICUTelemetryOverwatchHubPage.jsx"),
      "utf8"
    );
    expect(icu).toContain("CDC Standard &gt; 12");
    expect(icu).toContain("&gt; 100 mL/hr");
  });

  it("agrees with scripts/check-syntax.js about which files it audits", () => {
    // The prebuild script and this suite have to cover the same set, or one of them is theatre. Both
    // walk src/ for *.js and *.jsx; the script additionally accepts a subtree argument, which is why
    // the shared contract is asserted on the extensions and the skip list rather than on a count.
    const scriptSource = fs.readFileSync(path.join(projectRoot, "scripts", "check-syntax.js"), "utf8");
    expect(scriptSource).toMatch(/\\\.\(js\|jsx\)\$|\.jsx?/);
    for (const skipped of ["node_modules", "build"]) {
      expect(scriptSource, `check-syntax skips ${skipped}`).toContain(skipped);
    }
  });
});

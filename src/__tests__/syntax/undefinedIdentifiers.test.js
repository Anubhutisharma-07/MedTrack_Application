// Unit tests for the undefined-identifier analysis in scripts/lib/undefinedIdentifiers.js.
//
// Why this file exists
// --------------------
// The analysis is a build gate: it can stop a deployment. That cuts both ways, and the false
// positive is by far the more dangerous failure. A gate that occasionally flags correct code gets
// switched off within a week - and then the defect it was written for walks straight back in. So the
// bulk of the cases below are negative: legitimate constructs that must NOT be reported. Every one
// of them is a position where an `Identifier` node appears without resolving against scope, and
// getting any of them wrong produces a confident, wrong build failure.
//
// The positive cases are the defect the module exists for: the thirteen hub consoles that referenced
// `StatCard`, `SEVERITY_META` and friends after the shared-primitive extraction removed the local
// definitions and never added the imports.

import { createRequire } from "module";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { describe, it, expect } from "vitest";

// scripts/ is CommonJS and is executed by `prebuild` with no bundler in front of it, so it is loaded
// through createRequire rather than relying on Vite's interop guessing right.
const require_ = createRequire(import.meta.url);
const parser = require_("@babel/parser");
const { findUndefinedIdentifiers, collectBindings } = require_(
  "../../../scripts/lib/undefinedIdentifiers.js"
);

const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(here, "..", "..", "..");

/** The same plugin set scripts/check-syntax.js parses with. */
const PARSER_OPTIONS = {
  sourceType: "unambiguous",
  allowReturnOutsideFunction: true,
  errorRecovery: false,
  plugins: [
    "jsx",
    "classProperties",
    "classPrivateProperties",
    "classPrivateMethods",
    "objectRestSpread",
    "optionalChaining",
    "nullishCoalescingOperator",
    "dynamicImport",
    "topLevelAwait",
    "numericSeparator",
    "logicalAssignment",
  ],
};

/** Parses a source string and returns the undefined identifier names, in first-use order. */
function undefinedIn(source) {
  return findUndefinedIdentifiers(parser.parse(source, PARSER_OPTIONS)).map((entry) => entry.name);
}

describe("findUndefinedIdentifiers - the defect it exists for", () => {
  it("reports a component rendered without an import", () => {
    // The literal shape of the bug: the local StatCard was deleted by the extraction and the import
    // of the shared one was never added.
    expect(
      undefinedIn(`
        export default function Hub() {
          return <StatCard label="Beds" value={4} />;
        }
      `)
    ).toEqual(["StatCard"]);
  });

  it("reports a constant referenced in an expression without an import", () => {
    expect(
      undefinedIn(`
        export default function Hub() {
          const meta = SEVERITY_META.critical;
          return meta.label;
        }
      `)
    ).toEqual(["SEVERITY_META"]);
  });

  it("reports several missing names in first-use order", () => {
    expect(
      undefinedIn(`
        export default function Hub() {
          const meta = SEVERITY_META.high;
          return (
            <div>
              <TabsBar tabs={[]} />
              <SearchBox value="" />
              {meta.label}
            </div>
          );
        }
      `)
    ).toEqual(["SEVERITY_META", "TabsBar", "SearchBox"]);
  });

  it("reports each name once, with its first location and a reference count", () => {
    const found = findUndefinedIdentifiers(
      parser.parse(
        `export default function Hub() {
  return (
    <div>
      <InfoRow label="a" />
      <InfoRow label="b" />
      <InfoRow label="c" />
    </div>
  );
}`,
        PARSER_OPTIONS
      )
    );

    expect(found).toHaveLength(1);
    expect(found[0]).toMatchObject({ name: "InfoRow", line: 4, count: 3 });
  });

  it("stops reporting a name once the import is added", () => {
    expect(
      undefinedIn(`
        import { StatCard } from "../../components/common/StatCard";
        export default function Hub() {
          return <StatCard label="Beds" value={4} />;
        }
      `)
    ).toEqual([]);
  });

  it("accepts an aliased import under the name the call sites use", () => {
    // How the thirteen consoles were fixed: the shared module exports InspectionModal and
    // CompactStatCard, and the pages call them Modal and StatCard.
    expect(
      undefinedIn(`
        import { InspectionModal as Modal } from "../../components/common/Modal";
        import { CompactStatCard as StatCard } from "../../components/common/StatCard";
        export default function Hub() {
          return <Modal open><StatCard label="a" /></Modal>;
        }
      `)
    ).toEqual([]);
  });
});

describe("findUndefinedIdentifiers - positions that are not references", () => {
  it("ignores lowercase JSX tags, which are intrinsic elements", () => {
    expect(undefinedIn("const a = <div><span>hi</span><input /></div>;")).toEqual([]);
  });

  it("ignores JSX attribute names", () => {
    expect(undefinedIn('const a = <div className="x" data-testid="y" onClick={undefined} />;')).toEqual([]);
  });

  it("ignores the property half of a member expression", () => {
    expect(undefinedIn("const x = window.someUnknownProperty.andAnother;")).toEqual([]);
  });

  it("ignores the property half of an optional member expression", () => {
    expect(undefinedIn("const x = window?.maybe?.deeper;")).toEqual([]);
  });

  it("reports a computed member key, which is a reference", () => {
    expect(undefinedIn("const x = window[someKey];")).toEqual(["someKey"]);
  });

  it("ignores object literal keys", () => {
    expect(undefinedIn("const o = { alpha: 1, beta: 2, 'gamma-3': 4 };")).toEqual([]);
  });

  it("reports a computed object key", () => {
    expect(undefinedIn("const o = { [dynamicKey]: 1 };")).toEqual(["dynamicKey"]);
  });

  it("ignores class member names but reports a computed one", () => {
    expect(undefinedIn("class A { alpha = 1; beta() { return 2; } }")).toEqual([]);
    expect(undefinedIn("class A { [computedName] = 1; }")).toEqual(["computedName"]);
  });

  it("ignores labels", () => {
    expect(undefinedIn("outer: for (const x of []) { continue outer; }")).toEqual([]);
  });

  it("ignores import.meta", () => {
    expect(undefinedIn("const u = import.meta.url;")).toEqual([]);
  });

  it("ignores a re-export, whose local name belongs to the other module", () => {
    // The one false positive the first draft produced: src/hooks/useToast.js is a single line,
    // `export { useToast } from "../context/ToastContext"`, and useToast is never in this file's
    // scope by design.
    expect(undefinedIn('export { useToast } from "../context/ToastContext";')).toEqual([]);
    expect(undefinedIn('export { a as b } from "./mod";')).toEqual([]);
  });

  it("leaves an export of something never declared to the parser", () => {
    // The mirror case is a real defect, and this module never sees it: Babel refuses to parse a
    // local export with no declaration, so check-syntax already fails on it as a parse error
    // ("Export 'neverDeclared' is not defined"). Asserted here so the division of labour is
    // recorded rather than assumed.
    expect(() => parser.parse("export { neverDeclared };", PARSER_OPTIONS)).toThrow(
      /Export 'neverDeclared' is not defined/
    );
  });

  it("ignores a bound shorthand property and reports an unbound one", () => {
    expect(undefinedIn("const a = 1; const o = { a };")).toEqual([]);
    expect(undefinedIn("const o = { missingThing };")).toEqual(["missingThing"]);
  });
});

describe("findUndefinedIdentifiers - bindings it must honour", () => {
  it("honours every import form", () => {
    expect(
      undefinedIn(`
        import React from "react";
        import * as everything from "./everything";
        import { named, other as renamed } from "./named";
        const use = [React, everything, named, renamed];
      `)
    ).toEqual([]);
  });

  it("honours object, array, nested, default and rest patterns", () => {
    expect(
      undefinedIn(`
        const { a, b: renamed, c = 1, ...restObject } = source();
        const [d, [e], f = 2, ...restArray] = list();
        const { g: { h } } = nested();
        const used = [a, renamed, c, restObject, d, e, f, restArray, h];
      `)
    ).toEqual(["source", "list", "nested"]);
  });

  it("honours function parameters of every kind", () => {
    expect(
      undefinedIn(`
        function one(a, { b }, [c], d = 1, ...rest) { return [a, b, c, d, rest]; }
        const two = (e, { f: g }) => [e, g];
        const three = function (h) { return h; };
        const four = { method(i) { return i; } };
        const used = [one, two, three, four];
      `)
    ).toEqual([]);
  });

  it("honours a catch parameter", () => {
    expect(undefinedIn("try { risky(); } catch (error) { report(error); }")).toEqual(["risky", "report"]);
  });

  it("honours a for-of and a for-in binding", () => {
    expect(
      undefinedIn(`
        for (const item of []) { use(item); }
        for (const key in {}) { use(key); }
        function use() {}
      `)
    ).toEqual([]);
  });

  it("honours a function used before it is declared", () => {
    // Hoisting. A per-statement analysis would report this and be wrong.
    expect(undefinedIn("const value = later(); function later() { return 1; }")).toEqual([]);
  });

  it("honours a class declaration and its superclass", () => {
    expect(undefinedIn("class Base {} class Derived extends Base {} const x = new Derived();")).toEqual([]);
    expect(undefinedIn("class Derived extends Missing {}")).toEqual(["Missing"]);
  });

  it("honours a name declared in one function and used in another", () => {
    // The documented consequence of flat, per-file collection: this is out of scope at runtime and
    // is deliberately not reported. Pinned so the trade-off is a decision rather than a surprise.
    expect(
      undefinedIn(`
        function a() { const local = 1; return local; }
        function b() { return local; }
        const used = [a, b];
      `)
    ).toEqual([]);
  });

  it("honours a dotted JSX component name rooted at a binding", () => {
    expect(
      undefinedIn(`
        import Chart from "./Chart";
        const a = <Chart.Line data={[]} />;
      `)
    ).toEqual([]);
    expect(undefinedIn("const a = <Unimported.Line data={[]} />;")).toEqual(["Unimported"]);
  });
});

describe("findUndefinedIdentifiers - globals", () => {
  it("allows the browser and timer globals the pages actually use", () => {
    expect(
      undefinedIn(`
        const id = setInterval(() => {}, 1000);
        clearInterval(id);
        const blob = new Blob(["x"], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        document.createElement("a").href = url;
        window.addEventListener("keydown", () => {});
        sessionStorage.clear();
        console.error(JSON.stringify(Math.max(1, 2)));
      `)
    ).toEqual([]);
  });

  it("allows the vitest globals injected by globals: true", () => {
    expect(
      undefinedIn(`
        describe("x", () => {
          beforeAll(() => {});
          afterEach(() => {});
          it("y", () => { expect(vi.fn()).toBeTruthy(); });
        });
      `)
    ).toEqual([]);
  });

  it("allows DOM interface names by shape rather than by enumeration", () => {
    // There are several hundred of these and none is ever imported, so they are matched on shape.
    expect(
      undefinedIn(`
        const a = new HTMLAnchorElement();
        const b = document.createElement("a") instanceof HTMLInputElement;
        const c = CSSStyleSheet;
        const used = [a, b, c];
      `)
    ).toEqual([]);
  });

  it("does not treat an application identifier as a global by accident", () => {
    // The shape rule has to be narrow enough that it cannot swallow a real miss. It is anchored at
    // both ends, so an `HTML`-prefixed name that is not an `...Element` is still reported, and a
    // three-letter prefix one character away from `CSS` is not a match at all.
    expect(undefinedIn("const a = HTMLReportBuilder;")).toEqual(["HTMLReportBuilder"]);
    expect(undefinedIn("const a = CSVExport;")).toEqual(["CSVExport"]);
    expect(undefinedIn("const a = DOMAIN_WHITELIST;")).toEqual(["DOMAIN_WHITELIST"]);
  });

  it("honours a caller-supplied globals set", () => {
    const source = "const a = MY_AMBIENT_THING;";
    expect(undefinedIn(source)).toEqual(["MY_AMBIENT_THING"]);

    const withGlobal = findUndefinedIdentifiers(parser.parse(source, PARSER_OPTIONS), {
      globals: new Set(["MY_AMBIENT_THING"]),
    });
    expect(withGlobal).toEqual([]);
  });
});

describe("collectBindings", () => {
  it("collects across the whole file regardless of nesting", () => {
    const bound = collectBindings(
      parser.parse(
        `import { imported } from "./m";
         const topLevel = 1;
         function fn(param) { const inner = 2; return [param, inner]; }
         class Klass {}
         try {} catch (caught) {}`,
        PARSER_OPTIONS
      )
    );

    for (const name of ["imported", "topLevel", "fn", "param", "inner", "Klass", "caught"]) {
      expect(bound.has(name), `binds ${name}`).toBe(true);
    }
    expect(bound.has("neverDeclared")).toBe(false);
  });
});

describe("the source tree", () => {
  it("has no undefined identifiers", () => {
    // The guard itself, duplicated into the suite for the same reason the parse check is: `npm test`
    // should not be green on a tree that `npm run build` refuses.
    const skip = new Set(["node_modules", "build", "dist", "coverage", ".git"]);
    const offenders = [];

    (function walk(directory) {
      for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const absolute = path.join(directory, entry.name);
        if (entry.isDirectory()) {
          if (!skip.has(entry.name)) walk(absolute);
        } else if (/\.(js|jsx|mjs|cjs)$/.test(entry.name)) {
          let ast;
          try {
            ast = parser.parse(fs.readFileSync(absolute, "utf8"), PARSER_OPTIONS);
          } catch {
            return; // the parse suite owns this failure
          }
          const found = findUndefinedIdentifiers(ast);
          if (found.length > 0) {
            offenders.push(
              `${path.relative(projectRoot, absolute)}: ${found.map((f) => f.name).join(", ")}`
            );
          }
        }
      }
    })(path.join(projectRoot, "src"));

    expect(offenders).toEqual([]);
  });
});

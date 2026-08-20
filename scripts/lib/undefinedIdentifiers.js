#!/usr/bin/env node
/**
 * Finds identifiers a module references but never defines.
 *
 * Why this exists
 * ---------------
 * Thirteen hub consoles shipped to `main` rendering nothing but the ErrorBoundary fallback. The
 * extraction of the page-local UI primitives into src/components/common removed each page's own
 * `StatCard`, `SearchBox`, `InfoRow`, `Modal`, `Badge`, `TabsBar` and `SEVERITY_META`, and never
 * added the imports that replace them. Every one was a free variable, so the first render threw:
 *
 *   ReferenceError: SEVERITY_META is not defined
 *     at ColdChainCommandHub (src/pages/coldchain/ColdChainCommandHub.jsx:977:49)
 *
 * The file parses perfectly. `check-syntax` had nothing to say about it, because a free variable is
 * valid JavaScript right up to the moment it is evaluated.
 *
 * Something did eventually catch it: `react-scripts build` with `CI=true`, whose ESLint pass reports
 * `no-undef` and `react/jsx-no-undef`. Two problems with relying on that alone.
 *
 *   1. It is the *last* gate. `prebuild` runs check-syntax, then check-routes, and only then does
 *      webpack start. Each stage short-circuits the next, so on the commit that broke the build all
 *      three defects were present and only the parse errors were ever reported. Clearing one
 *      revealed the next, over three separate ~40s build cycles.
 *
 *   2. It costs ~40s of webpack work to learn something a syntax tree already knows.
 *
 * So this module answers the same question from the AST that check-syntax already builds, in about a
 * millisecond per file, and reports every offending file in one pass.
 *
 * What it deliberately does not do
 * --------------------------------
 * This is not a scope analyser. Bindings are collected per *file*, flattened: a name declared
 * anywhere in the module counts as defined everywhere in it. That under-reports - a variable
 * declared inside one function and referenced from another is not flagged - and it is the right
 * trade. The defect class here is "this name is defined nowhere in the file", which flat collection
 * catches exactly, and a build guard that produces even occasional false positives gets switched off
 * within a week. Precision over recall, on purpose. ESLint still runs in CI for the rest.
 */

'use strict';

/**
 * Names that are always available and are never imported or declared.
 *
 * Kept explicit rather than pulled from a `globals` package: the list is the only thing standing
 * between this check and a false positive, so it should be readable in review and versioned with
 * the script. Grouped by where they come from.
 */
const DEFAULT_GLOBALS = new Set([
  // language
  'undefined', 'NaN', 'Infinity', 'globalThis', 'arguments', 'eval',
  'Object', 'Function', 'Boolean', 'Symbol', 'Error', 'EvalError', 'RangeError', 'ReferenceError',
  'SyntaxError', 'TypeError', 'URIError', 'AggregateError', 'Number', 'BigInt', 'Math', 'Date',
  'String', 'RegExp', 'Array', 'Int8Array', 'Uint8Array', 'Uint8ClampedArray', 'Int16Array',
  'Uint16Array', 'Int32Array', 'Uint32Array', 'Float32Array', 'Float64Array', 'BigInt64Array',
  'BigUint64Array', 'Map', 'Set', 'WeakMap', 'WeakSet', 'WeakRef', 'ArrayBuffer', 'SharedArrayBuffer',
  'DataView', 'JSON', 'Promise', 'Reflect', 'Proxy', 'Intl', 'parseInt', 'parseFloat', 'isNaN',
  'isFinite', 'decodeURI', 'decodeURIComponent', 'encodeURI', 'encodeURIComponent', 'escape',
  'unescape', 'structuredClone', 'queueMicrotask', 'AbortController', 'AbortSignal',

  // timers and scheduling
  'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'setImmediate', 'clearImmediate',
  'requestAnimationFrame', 'cancelAnimationFrame', 'requestIdleCallback', 'cancelIdleCallback',

  // browser
  'window', 'document', 'navigator', 'location', 'history', 'screen', 'console', 'alert', 'confirm',
  'prompt', 'localStorage', 'sessionStorage', 'indexedDB', 'caches', 'crypto', 'performance',
  'fetch', 'Headers', 'Request', 'Response', 'FormData', 'URL', 'URLSearchParams', 'Blob', 'File',
  'FileReader', 'FileList', 'Image', 'Audio', 'Option', 'XMLHttpRequest', 'WebSocket', 'EventSource',
  'Event', 'CustomEvent', 'MessageChannel', 'MessagePort', 'BroadcastChannel', 'Worker',
  'ServiceWorker', 'Notification', 'IntersectionObserver', 'MutationObserver', 'ResizeObserver',
  'PerformanceObserver', 'getComputedStyle', 'matchMedia', 'scrollTo', 'scrollBy', 'open', 'close',
  'atob', 'btoa', 'TextEncoder', 'TextDecoder', 'ReadableStream', 'WritableStream', 'TransformStream',
  'DOMParser', 'XMLSerializer', 'Node', 'Element', 'HTMLElement', 'HTMLCanvasElement', 'CanvasGradient',
  'SVGElement', 'DocumentFragment', 'Range', 'Selection', 'CSS', 'ClipboardItem', 'DataTransfer',
  'MediaQueryList', 'Storage', 'Screen', 'Text',

  // DOM event constructors. Referenced by tests that construct a synthetic event and by anything
  // dispatching one; none of them is ever imported.
  'KeyboardEvent', 'MouseEvent', 'PointerEvent', 'TouchEvent', 'FocusEvent', 'InputEvent',
  'WheelEvent', 'DragEvent', 'ClipboardEvent', 'SubmitEvent', 'ProgressEvent', 'ErrorEvent',
  'MessageEvent', 'CloseEvent', 'StorageEvent', 'PopStateEvent', 'HashChangeEvent', 'EventTarget',

  // Node / CommonJS - the scripts under scripts/ and the config files at the root
  'require', 'module', 'exports', '__dirname', '__filename', 'process', 'Buffer', 'global',
  'URLPattern',

  // Vitest injects these when `globals: true` is set, which vitest.config.js does. A test file may
  // import them explicitly or rely on the injection; both are valid, so both have to pass.
  'describe', 'it', 'test', 'suite', 'expect', 'expectTypeOf', 'assert', 'vi', 'vitest',
  'beforeAll', 'beforeEach', 'afterAll', 'afterEach', 'onTestFailed', 'onTestFinished', 'bench',
]);

/**
 * DOM interface names are allowed by shape rather than by enumeration.
 *
 * There are several hundred `HTMLxxxElement` / `SVGxxxElement` / `CSSxxx` constructors, they are
 * never imported, and listing the handful this codebase happens to touch today guarantees a false
 * positive the first time someone reaches for one more. The shape is specific enough that it cannot
 * plausibly match an application identifier: nothing in src/ is named `HTMLSomething`.
 */
const GLOBAL_NAME_PATTERNS = [
  /^HTML[A-Za-z]*Element$/,
  /^SVG[A-Za-z]*Element$/,
  /^CSS[A-Z][A-Za-z]*$/,
  /^DOM[A-Z][A-Za-z]*$/,
];

function isGlobalByShape(name) {
  return GLOBAL_NAME_PATTERNS.some((pattern) => pattern.test(name));
}

/** Extracts every name bound by a binding pattern (identifier, object, array, default, rest). */
function collectPatternNames(node, into) {
  if (!node || typeof node !== 'object') {
    return;
  }
  switch (node.type) {
    case 'Identifier':
      into.add(node.name);
      break;
    case 'ObjectPattern':
      for (const property of node.properties || []) {
        if (property.type === 'RestElement') {
          collectPatternNames(property.argument, into);
        } else {
          collectPatternNames(property.value, into);
        }
      }
      break;
    case 'ArrayPattern':
      for (const element of node.elements || []) {
        collectPatternNames(element, into);
      }
      break;
    case 'AssignmentPattern':
      collectPatternNames(node.left, into);
      break;
    case 'RestElement':
      collectPatternNames(node.argument, into);
      break;
    default:
      break;
  }
}

/**
 * Generic AST walk. `visit` receives (node, parent, key) for every node object reachable from the
 * root, which is what lets a plain `Identifier` be classified by the position it sits in.
 */
function walk(node, visit, parent = null, key = null) {
  if (!node || typeof node !== 'object') {
    return;
  }
  if (Array.isArray(node)) {
    for (const child of node) {
      walk(child, visit, parent, key);
    }
    return;
  }
  if (typeof node.type !== 'string') {
    return;
  }

  visit(node, parent, key);

  for (const childKey of Object.keys(node)) {
    if (childKey === 'loc' || childKey === 'leadingComments' || childKey === 'trailingComments'
      || childKey === 'innerComments' || childKey === 'extra') {
      continue;
    }
    const child = node[childKey];
    if (child && typeof child === 'object') {
      walk(child, visit, node, childKey);
    }
  }
}

/** Every name the file binds, anywhere in it. Flat by design - see the header note. */
function collectBindings(ast) {
  const bound = new Set();

  walk(ast, (node) => {
    switch (node.type) {
      case 'ImportDefaultSpecifier':
      case 'ImportNamespaceSpecifier':
      case 'ImportSpecifier':
        collectPatternNames(node.local, bound);
        break;
      case 'VariableDeclarator':
        collectPatternNames(node.id, bound);
        break;
      case 'FunctionDeclaration':
      case 'FunctionExpression':
      case 'ClassDeclaration':
      case 'ClassExpression':
        if (node.id) {
          collectPatternNames(node.id, bound);
        }
        break;
      case 'CatchClause':
        if (node.param) {
          collectPatternNames(node.param, bound);
        }
        break;
      case 'LabeledStatement':
        if (node.label) {
          bound.add(node.label.name);
        }
        break;
      default:
        break;
    }

    // Parameters of anything callable, including arrow functions and class methods.
    if (Array.isArray(node.params)) {
      for (const param of node.params) {
        collectPatternNames(param, bound);
      }
    }
  });

  return bound;
}

/**
 * Whether an `Identifier` at (parent, key) is a *reference* to a value, as opposed to a name in a
 * position that never resolves against scope: a property key, a member access, a declared binding,
 * an import/export alias or a label.
 */
function isValueReference(parent, key) {
  if (!parent) {
    return false;
  }

  switch (parent.type) {
    // `a.b` / `a?.b` - `b` is a property name, not a binding.
    case 'MemberExpression':
    case 'OptionalMemberExpression':
      return key === 'object' || (key === 'property' && parent.computed);

    // `{ b: 1 }` - `b` is a key. `{ b }` is shorthand, and Babel points key and value at nodes with
    // the same name, so the shorthand case is allowed through: it is a reference in an object
    // literal and a binding in a destructuring pattern, and the binding pass already covers the
    // second, so admitting it here cannot produce a false positive.
    case 'ObjectProperty':
      return parent.shorthand || key === 'value' || (key === 'key' && parent.computed);
    case 'ObjectMethod':
    case 'ClassMethod':
    case 'ClassPrivateMethod':
    case 'ClassProperty':
    case 'ClassPrivateProperty':
      return key === 'key' && parent.computed;

    // Declarations: the declared name is a binding, the initialiser is a reference.
    case 'VariableDeclarator':
      return key === 'init';
    case 'FunctionDeclaration':
    case 'FunctionExpression':
    case 'ArrowFunctionExpression':
    case 'ClassDeclaration':
    case 'ClassExpression':
      return key === 'body' || key === 'superClass';
    case 'CatchClause':
      return key === 'body';

    // Imports bind; exports re-reference the local name only.
    case 'ImportDefaultSpecifier':
    case 'ImportNamespaceSpecifier':
    case 'ImportSpecifier':
    case 'ImportDeclaration':
      return false;
    case 'ExportSpecifier':
      return key === 'local';
    case 'ExportNamedDeclaration':
    case 'ExportAllDeclaration':
      return false;

    // Labels are their own namespace.
    case 'LabeledStatement':
    case 'BreakStatement':
    case 'ContinueStatement':
      return false;

    // `import.meta`, `new.target`
    case 'MetaProperty':
      return false;

    // `<div className=...>` - the attribute name is not a binding. (JSXIdentifier, but guarded here
    // too in case a parser revision emits Identifier.)
    case 'JSXAttribute':
    case 'JSXNamespacedName':
      return false;

    default:
      return true;
  }
}

/**
 * A JSX element name resolves against scope only when it is capitalised or dotted; `<div>` is an
 * intrinsic tag. Returns the identifier node that has to be in scope, or null.
 */
function jsxReferenceNode(name) {
  if (!name) {
    return null;
  }
  if (name.type === 'JSXIdentifier') {
    return /^[A-Z]/.test(name.name) ? name : null;
  }
  if (name.type === 'JSXMemberExpression') {
    let root = name.object;
    while (root && root.type === 'JSXMemberExpression') {
      root = root.object;
    }
    return root && root.type === 'JSXIdentifier' ? root : null;
  }
  return null;
}

/**
 * @param {object} ast     a Babel File/Program node
 * @param {object} options `globals` overrides the default allow-list
 * @returns {Array<{name: string, line: number, column: number, count: number}>}
 *   one entry per undefined name, at its first use, ordered by position
 */
function findUndefinedIdentifiers(ast, options = {}) {
  const globals = options.globals || DEFAULT_GLOBALS;
  const bound = collectBindings(ast);
  const found = new Map();

  // Identifier nodes that look like references but are not: currently the `local` name of a
  // re-export, `export { useToast } from "../context/ToastContext"`, which names an export of the
  // *other* module and never resolves against this file's scope.
  const notAReference = new Set();

  const record = (name, loc) => {
    if (!name || bound.has(name) || globals.has(name) || isGlobalByShape(name)) {
      return;
    }
    const existing = found.get(name);
    if (existing) {
      existing.count += 1;
      return;
    }
    found.set(name, {
      name,
      line: loc ? loc.start.line : 0,
      column: loc ? loc.start.column : 0,
      count: 1,
    });
  };

  walk(ast, (node, parent, key) => {
    // Visited before its own children, so marking the specifiers here is enough to suppress them.
    if (node.type === 'ExportNamedDeclaration' && node.source) {
      for (const specifier of node.specifiers || []) {
        if (specifier.local) {
          notAReference.add(specifier.local);
        }
      }
      return;
    }
    if (node.type === 'Identifier') {
      if (!notAReference.has(node) && isValueReference(parent, key)) {
        record(node.name, node.loc);
      }
      return;
    }
    if (node.type === 'JSXOpeningElement' || node.type === 'JSXClosingElement') {
      const reference = jsxReferenceNode(node.name);
      if (reference) {
        record(reference.name, reference.loc);
      }
    }
  });

  return [...found.values()].sort((a, b) => a.line - b.line || a.column - b.column);
}

module.exports = { findUndefinedIdentifiers, collectBindings, DEFAULT_GLOBALS };

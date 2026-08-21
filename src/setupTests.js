import "@testing-library/jest-dom";

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

Object.defineProperty(window, "scrollTo", {
  writable: true,
  value: () => {},
});

// AnimatedSection (used by CareersPage and JobApplicationPage) constructs an IntersectionObserver
// in a mount effect. jsdom does not implement it, so any test rendering those pages threw
// "ReferenceError: IntersectionObserver is not defined" inside React's act() and the render was
// aggregated into a blank failing test. A no-op observer keeps the scroll-animation component
// safe to render under test.
class MockIntersectionObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
}

Object.defineProperty(window, "IntersectionObserver", {
  writable: true,
  value: MockIntersectionObserver,
});

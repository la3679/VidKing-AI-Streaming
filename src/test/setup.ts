// Vitest global setup: registers jest-dom matchers (toBeInTheDocument, etc.)
// and ensures React Testing Library cleans up between tests.
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

afterEach(() => {
  cleanup();
});

// jsdom doesn't implement layout methods used by the UI; stub them.
if (typeof Element !== 'undefined' && !Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}

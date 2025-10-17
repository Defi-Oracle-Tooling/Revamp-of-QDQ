// Jest auto-mock for 'readline' to prevent blocking stdin in tests.
// Provides a minimal createInterface that immediately resolves questions with empty string.
import { EventEmitter } from 'events';

class MockReadline extends EventEmitter {
  question(prompt: string, cb: (answer: string) => void) {
    // return empty answer quickly; tests relying on defaults will proceed
    cb("");
  }
  close() {
    // noop
  }
}

export function createInterface() {
  return new MockReadline();
}

export default { createInterface };
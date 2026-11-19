import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, expect } from 'vitest';
import * as axeMatchers from 'vitest-axe/matchers';

expect.extend(axeMatchers);

// jsdom no implementa canvas; axe lo consulta para detectar ligaduras de iconos.
// El contraste de color no es medible en jsdom: se verifica con Lighthouse (plan de pruebas C.18).
HTMLCanvasElement.prototype.getContext = () => null;

afterEach(() => {
  cleanup();
});

import { describe, expect, it } from 'vitest';
import { SHARED_PACKAGE_NAME } from './index';

describe('paquete shared', () => {
  it('se puede importar', () => {
    expect(SHARED_PACKAGE_NAME).toBe('@saasomatic/shared');
  });
});

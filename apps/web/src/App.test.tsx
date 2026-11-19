import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import { App } from './App';

describe('App', () => {
  it('muestra el título de la aplicación', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1, name: 'SaaS-O-Matic' })).toBeInTheDocument();
  });

  it('no tiene violaciones de accesibilidad (axe)', async () => {
    const { container } = render(<App />);
    expect(await axe(container)).toHaveNoViolations();
  });
});

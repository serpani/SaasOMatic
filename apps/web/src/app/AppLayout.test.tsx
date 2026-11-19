import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import { mockFetch } from '../test/fetchMock';
import { renderApp } from '../test/renderApp';

describe('Estructura de la aplicación', () => {
  it('tiene enlace para saltar al contenido, navegación principal y selector de divisa', async () => {
    mockFetch();
    renderApp('/');
    expect(screen.getByRole('link', { name: 'Saltar al contenido' })).toHaveAttribute('href', '#main-content');
    expect(screen.getByRole('navigation', { name: 'Principal' })).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
    expect(await screen.findByLabelText('Divisa')).toBeInTheDocument();
  });

  it('página no encontrada con enlace de vuelta (axe sin violaciones)', async () => {
    mockFetch();
    const { container } = renderApp('/no-existe');
    expect(screen.getByRole('heading', { level: 1, name: 'Página no encontrada' })).toBeInTheDocument();
    expect(document.title).toBe('Página no encontrada · SaaS-O-Matic');
    expect(await axe(container)).toHaveNoViolations();
  });
});

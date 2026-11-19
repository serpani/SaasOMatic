import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import { apiError, json, mockFetch } from '../../../test/fetchMock';
import { dashboard } from '../../../test/fixtures';
import { renderApp } from '../../../test/renderApp';

const summary = () => screen.getByRole('region', { name: 'Resumen' });

describe('Dashboard — resumen sobre el buscador', () => {
  it('muestra clientes, simulaciones, facturación estimada, media y clientes por plan', async () => {
    mockFetch();
    renderApp('/');
    await screen.findByText('Facturación mensual estimada');
    const region = summary();
    expect(within(region).getByText('Clientes').nextElementSibling).toHaveTextContent('3');
    expect(within(region).getByText('Simulaciones guardadas').nextElementSibling).toHaveTextContent('5');
    expect(within(region).getByText(/269,40\s€/)).toBeInTheDocument();
    expect(within(region).getByText(/Última simulación de 2 clientes/)).toBeInTheDocument();
    expect(within(region).getByText(/134,70\s€/)).toBeInTheDocument();
    expect(within(region).getByText(/Basic 1 · Pro 2/)).toBeInTheDocument();
  });

  it('convierte los importes a la divisa seleccionada', async () => {
    mockFetch();
    const { user } = renderApp('/');
    await screen.findByText('Facturación mensual estimada');
    await screen.findByRole('option', { name: 'USD' });
    await user.selectOptions(screen.getByLabelText('Divisa'), 'USD');
    expect(within(summary()).getByText(/296,34\sUS\$/)).toBeInTheDocument();
  });

  it('si falla el resumen, el buscador sigue funcionando y se puede reintentar', async () => {
    let fail = true;
    mockFetch({ 'GET /dashboard': () => (fail ? apiError(500, 'INTERNAL_ERROR', 'Ha ocurrido un error inesperado.') : json(dashboard)) });
    const { user } = renderApp('/');
    expect(await screen.findByText('1 cliente encontrado')).toBeInTheDocument();
    const region = summary();
    expect(await within(region).findByRole('alert')).toHaveTextContent('Ha ocurrido un error inesperado.');

    fail = false;
    await user.click(within(region).getByRole('button', { name: 'Reintentar' }));
    expect(await within(region).findByText('Facturación mensual estimada')).toBeInTheDocument();
  });

  it('no tiene violaciones de accesibilidad (axe)', async () => {
    mockFetch();
    const { container } = renderApp('/');
    await screen.findByText('Facturación mensual estimada');
    await screen.findByText('1 cliente encontrado');
    expect(await axe(container)).toHaveNoViolations();
  });
});

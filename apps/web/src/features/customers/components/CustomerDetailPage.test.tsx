import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import { apiError, json, mockFetch } from '../../../test/fetchMock';
import { renderApp } from '../../../test/renderApp';

describe('Detalle del cliente', () => {
  it('muestra los datos, el plan con sus límites y el historial con importes', async () => {
    mockFetch();
    renderApp('/customers/1');

    expect(await screen.findByRole('heading', { level: 1, name: 'Fácil Software S.L.' })).toBeInTheDocument();
    expect(screen.getByText('B12345674')).toBeInTheDocument();
    expect(await screen.findByText('España (IVA 21 %)')).toBeInTheDocument();
    expect(screen.getByText('Basic: 50 GB y 10.000 llamadas/mes')).toBeInTheDocument();
    expect(await screen.findByText(/169,40\s€/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Nueva simulación' })).toHaveAttribute('href', '/customers/1/simulate');
  });

  it('historial vacío', async () => {
    mockFetch({ 'GET /customers/1/simulations': () => json([]) });
    renderApp('/customers/1');
    expect(await screen.findByText('Este cliente todavía no tiene simulaciones guardadas.')).toBeInTheDocument();
  });

  it('cliente inexistente → mensaje claro sin códigos técnicos', async () => {
    mockFetch({ 'GET /customers/1': () => apiError(404, 'CUSTOMER_NOT_FOUND', 'No existe el cliente indicado.') });
    renderApp('/customers/1');
    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('No existe el cliente indicado.');
    expect(alert).not.toHaveTextContent(/404|CUSTOMER_NOT_FOUND/);
  });

  it('no tiene violaciones de accesibilidad (axe)', async () => {
    mockFetch();
    const { container } = renderApp('/customers/1');
    await screen.findByText(/169,40\s€/);
    expect(await axe(container)).toHaveNoViolations();
  });
});

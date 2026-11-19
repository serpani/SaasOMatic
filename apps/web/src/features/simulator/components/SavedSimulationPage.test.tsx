import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import { apiError, json, mockFetch } from '../../../test/fetchMock';
import { pricingTiers, simulation } from '../../../test/fixtures';
import { renderApp } from '../../../test/renderApp';

const open = async (route = '/customers/1/simulations/7') => {
  const utils = renderApp(route);
  await screen.findByRole('heading', { level: 1, name: 'Simulación para Fácil Software S.L.' });
  return utils;
};

describe('Simulación guardada — solo lectura', () => {
  it('desde el historial, la tarjeta abre la simulación guardada', async () => {
    mockFetch();
    const { user } = renderApp('/customers/1');
    await user.click(await screen.findByRole('link', { name: /Ver simulación del/ }));
    expect(await screen.findByText(/Solo lectura/)).toBeInTheDocument();
  });

  it('muestra los datos guardados con todos los controles bloqueados y sin botón de guardar', async () => {
    mockFetch();
    await open();
    expect(screen.getByLabelText('Usuarios activos (deslizador)')).toBeDisabled();
    expect(screen.getByLabelText('Usuarios activos (deslizador)')).toHaveValue('15');
    expect(screen.getByLabelText('Usuarios activos', { selector: 'input:not([type="range"])' })).toHaveValue('15');
    expect(screen.getByLabelText('Usuarios activos', { selector: 'input:not([type="range"])' })).toBeDisabled();
    expect(screen.getByLabelText('Almacenamiento (GB)')).toHaveValue('80');
    expect(screen.getByLabelText('Almacenamiento (GB)')).toBeDisabled();
    expect(screen.getByLabelText('Llamadas a la API al mes')).toBeDisabled();
    expect(screen.queryByRole('button', { name: /Guardar/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Volver al cliente' })).toBeEnabled();
  });

  it('muestra los importes guardados aunque los tramos actuales hayan cambiado (foto inmutable)', async () => {
    const newPrices = pricingTiers.map((t) => ({ ...t, unitCents: 1 }));
    mockFetch({ 'GET /pricing-tiers': () => json(newPrices) });
    await open();
    expect(screen.getByTestId('quote-total')).toHaveTextContent(/169,40\s€/);
    expect(screen.getByRole('row', { name: /11 a 50 5 8,00\s€ 40,00\s€/ })).toBeInTheDocument();
  });

  it('muestra los avisos del plan de esa simulación', async () => {
    mockFetch();
    await open();
    expect(screen.getByText(/El almacenamiento estimado \(80 GB\) supera los 50 GB/)).toBeInTheDocument();
  });

  it('simulación inexistente → mensaje claro', async () => {
    mockFetch({ 'GET /simulations/7': () => apiError(404, 'SIMULATION_NOT_FOUND', 'No existe la simulación indicada.') });
    renderApp('/customers/1/simulations/7');
    expect(await screen.findByRole('alert')).toHaveTextContent('No existe la simulación indicada.');
  });

  it('una simulación de otro cliente no se muestra', async () => {
    mockFetch({ 'GET /simulations/7': () => json({ ...simulation, customerId: 99 }) });
    renderApp('/customers/1/simulations/7');
    expect(await screen.findByRole('alert')).toHaveTextContent('No existe la simulación indicada para este cliente.');
  });

  it('no tiene violaciones de accesibilidad (axe)', async () => {
    mockFetch();
    const { container } = await open();
    expect(await axe(container)).toHaveNoViolations();
  });
});

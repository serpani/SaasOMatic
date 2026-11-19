import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import { apiError, callsTo, json, mockFetch } from '../../../test/fetchMock';
import { simulation } from '../../../test/fixtures';
import { renderApp } from '../../../test/renderApp';

const total = () => screen.getByTestId('quote-total').textContent;

async function open() {
  const utils = renderApp('/customers/1/simulate');
  await screen.findByRole('heading', { level: 1, name: 'Simulación para Fácil Software S.L.' });
  return utils;
}

describe('Simulador interactivo', () => {
  it('recalcula la factura en tiempo real al mover el slider (B.7)', async () => {
    mockFetch();
    await open();
    const slider = screen.getByLabelText('Usuarios activos (deslizador)');

    fireEvent.change(slider, { target: { value: '15' } });
    expect(total()).toMatch(/169,40\s€/);
    expect(slider).toHaveAttribute('aria-valuetext', expect.stringMatching(/15 usuarios, total 169,40\s€/));
    expect(screen.getByRole('row', { name: /11 a 50 5 8,00\s€ 40,00\s€/ })).toBeInTheDocument();

    fireEvent.change(slider, { target: { value: '51' } });
    expect(screen.getByText(/425,00\s€/)).toBeInTheDocument();
  });

  it('el campo numérico y el slider están sincronizados', async () => {
    mockFetch();
    const { user } = await open();
    const input = screen.getByLabelText('Usuarios activos', { selector: 'input:not([type="range"])' });
    await user.clear(input);
    await user.type(input, '100');
    expect(screen.getByLabelText('Usuarios activos (deslizador)')).toHaveValue('100');
  });

  it('valores no válidos → error en el campo y no se puede guardar', async () => {
    mockFetch();
    const { user } = await open();
    const input = screen.getByLabelText('Usuarios activos', { selector: 'input:not([type="range"])' });
    await user.clear(input);
    await user.type(input, '10001');
    expect(input).toHaveAccessibleDescription(expect.stringContaining('entre 1 y 10.000'));
    expect(screen.getByRole('button', { name: 'Guardar simulación' })).toBeDisabled();
  });

  it('convierte la proyección a la divisa elegida', async () => {
    mockFetch();
    const { user } = await open();
    fireEvent.change(screen.getByLabelText('Usuarios activos (deslizador)'), { target: { value: '15' } });
    await screen.findByRole('option', { name: 'USD' });
    await user.selectOptions(screen.getByLabelText('Divisa'), 'USD');
    expect(total()).toMatch(/186,34\sUS\$/);
  });

  it('B.9 avisa si se supera el plan y permite guardar; tras guardar vuelve al detalle', async () => {
    const fetchMock = mockFetch({ 'POST /simulations': () => json({ ...simulation, planWarnings: [] }, 201) });
    const { user } = await open();
    const storage = screen.getByLabelText('Almacenamiento (GB)');
    await user.clear(storage);
    await user.type(storage, '80');
    expect(screen.getByText(/El almacenamiento estimado \(80 GB\) supera los 50 GB/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Guardar simulación' }));
    expect(await screen.findByText('Simulación guardada en el historial.')).toBeInTheDocument();
    const body = JSON.parse(String(callsTo(fetchMock, 'POST', '/simulations')[0]?.[1]?.body));
    expect(body).toEqual({ customerId: 1, activeUsers: 10, storageGb: 80, apiCalls: 0 });
  });

  it('si falla al guardar muestra el error y permite reintentar', async () => {
    mockFetch({ 'POST /simulations': () => apiError(500, 'INTERNAL_ERROR', 'Ha ocurrido un error inesperado.') });
    const { user } = await open();
    await user.click(screen.getByRole('button', { name: 'Guardar simulación' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Ha ocurrido un error inesperado.');
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
  });

  it('no tiene violaciones de accesibilidad, también con avisos (axe)', async () => {
    mockFetch();
    const { container, user } = await open();
    await user.type(screen.getByLabelText('Almacenamiento (GB)'), '999');
    expect(await axe(container)).toHaveNoViolations();
  });
});

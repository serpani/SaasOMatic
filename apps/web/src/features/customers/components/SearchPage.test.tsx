import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import { apiError, callsTo, json, mockFetch } from '../../../test/fetchMock';
import { customer } from '../../../test/fixtures';
import { renderApp } from '../../../test/renderApp';

describe('Buscador y dashboard', () => {
  it('muestra los clientes en tarjetas con enlace al detalle', async () => {
    mockFetch();
    renderApp('/');
    const link = await screen.findByRole('link', { name: 'Fácil Software S.L.' });
    expect(link).toHaveAttribute('href', '/customers/1');
    expect(screen.getByText('1 cliente encontrado')).toBeInTheDocument();
    expect(await screen.findByText('España')).toBeInTheDocument();
  });

  it('busca con debounce de 300 ms: una sola petición tras escribir varias letras', async () => {
    const fetchMock = mockFetch();
    const { user } = renderApp('/');
    await screen.findByText('1 cliente encontrado');

    await user.type(screen.getByLabelText(/Buscar por nombre/), 'acme');
    await waitFor(() => {
      const queries = callsTo(fetchMock, 'GET', '/customers').map(([url]) => new URL(String(url)).searchParams.get('q'));
      expect(queries).toEqual(['', 'acme']);
    });
  });

  it('estado vacío con enlace para dar de alta', async () => {
    mockFetch({ 'GET /customers': () => json({ items: [], total: 0, page: 1, pageSize: 12 }) });
    renderApp('/');
    expect(await screen.findByText('Todavía no hay clientes registrados.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Dar de alta un cliente' })).toBeInTheDocument();
  });

  it('error con mensaje claro y reintento', async () => {
    let fail = true;
    mockFetch({
      'GET /customers': () =>
        fail ? apiError(500, 'INTERNAL_ERROR', 'Ha ocurrido un error inesperado.') : json({ items: [customer], total: 1, page: 1, pageSize: 12 }),
    });
    const { user } = renderApp('/');
    expect(await screen.findByRole('alert')).toHaveTextContent('Ha ocurrido un error inesperado.');

    fail = false;
    await user.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByText('1 cliente encontrado')).toBeInTheDocument();
  });

  it('pagina los resultados', async () => {
    const fetchMock = mockFetch({
      'GET /customers': (_init, url) =>
        json({ items: [customer], total: 30, page: Number(url.searchParams.get('page')), pageSize: 12 }),
    });
    const { user } = renderApp('/');
    expect(await screen.findByText('Página 1 de 3')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Siguiente' }));
    expect(await screen.findByText('Página 2 de 3')).toBeInTheDocument();
    expect(callsTo(fetchMock, 'GET', '/customers').at(-1)?.[0]).toContain('page=2');
  });

  it('en la carga inicial no mueve el foco (el primer Tab llega a «Saltar al contenido»)', async () => {
    mockFetch();
    const { user } = renderApp('/');
    expect(screen.getByRole('heading', { level: 1, name: 'Clientes' })).not.toHaveFocus();
    await user.tab();
    expect(screen.getByRole('link', { name: 'Saltar al contenido' })).toHaveFocus();
  });

  it('al navegar a otra vista pone el foco en su título', async () => {
    mockFetch();
    const { user } = renderApp('/');
    await user.click(within(screen.getByRole('navigation', { name: 'Principal' })).getByRole('link', { name: 'Nuevo cliente' }));
    expect(await screen.findByRole('heading', { level: 1, name: 'Nuevo cliente' })).toHaveFocus();
  });

  it('no tiene violaciones de accesibilidad (axe)', async () => {
    mockFetch();
    const { container } = renderApp('/');
    await screen.findByText('1 cliente encontrado');
    expect(await axe(container)).toHaveNoViolations();
  });
});

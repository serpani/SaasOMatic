import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import { apiError, callsTo, json, mockFetch } from '../../../test/fetchMock';
import { customer } from '../../../test/fixtures';
import { renderApp } from '../../../test/renderApp';

async function fillForm(user: ReturnType<typeof renderApp>['user'], taxId: string) {
  await screen.findByLabelText('Nombre de la empresa');
  await user.type(screen.getByLabelText('Nombre de la empresa'), 'Fácil Software S.L.');
  await user.selectOptions(screen.getByLabelText('País'), 'ES');
  await user.type(screen.getByLabelText('Identificador fiscal'), taxId);
  await user.type(screen.getByLabelText('Email de contacto'), 'ventas@facil.es');
  await user.selectOptions(screen.getByLabelText('Plan'), 'basic');
}

describe('Alta de cliente', () => {
  it('solo ofrece los países y planes que devuelve la API', async () => {
    mockFetch();
    renderApp('/customers/new');
    const country = await screen.findByLabelText('País');
    expect([...(country as HTMLSelectElement).options].map((o) => o.value)).toEqual(['', 'ES', 'FR', 'SE', 'US']);
    expect(screen.getByRole('option', { name: 'Basic (50 GB, 10.000 llamadas/mes)' })).toBeInTheDocument();
  });

  it('valida en el navegador, asocia cada error a su campo y pone el foco en el primero', async () => {
    const fetchMock = mockFetch();
    const { user } = renderApp('/customers/new');
    await user.click(await screen.findByRole('button', { name: 'Guardar' }));

    const name = screen.getByLabelText('Nombre de la empresa');
    expect(name).toHaveAttribute('aria-invalid', 'true');
    expect(name).toHaveAccessibleDescription('Error: Introduce el nombre de la empresa.');
    expect(name).toHaveFocus();
    expect(callsTo(fetchMock, 'POST', '/customers')).toHaveLength(0);
  });

  it('B.2 NIF español con letra errónea → mensaje comprensible sin llamar a la API', async () => {
    const fetchMock = mockFetch();
    const { user } = renderApp('/customers/new');
    await fillForm(user, '12345678A');
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(screen.getByLabelText('Identificador fiscal')).toHaveAccessibleDescription(
      expect.stringContaining('Revisa los números y la letra'),
    );
    expect(callsTo(fetchMock, 'POST', '/customers')).toHaveLength(0);
  });

  it('alta correcta → navega al detalle con confirmación', async () => {
    const fetchMock = mockFetch({ 'POST /customers': () => json(customer, 201) });
    const { user } = renderApp('/customers/new');
    await fillForm(user, 'b-12345674');
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(await screen.findByText('Cliente dado de alta correctamente.')).toBeInTheDocument();
    const body = JSON.parse(String(callsTo(fetchMock, 'POST', '/customers')[0]?.[1]?.body));
    expect(body).toEqual({
      companyName: 'Fácil Software S.L.',
      taxId: 'b-12345674',
      email: 'ventas@facil.es',
      countryCode: 'ES',
      planCode: 'basic',
    });
  });

  it('B.3 cliente ya existente → aviso en el campo y enlace al cliente', async () => {
    mockFetch({
      'POST /customers': () =>
        apiError(409, 'CUSTOMER_ALREADY_EXISTS', 'Ya existe un cliente con este identificador fiscal.', {
          field: 'taxId',
          customerId: 1,
        }),
    });
    const { user } = renderApp('/customers/new');
    await fillForm(user, 'B12345674');
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    expect(await screen.findByRole('link', { name: 'Ver el cliente existente' })).toHaveAttribute('href', '/customers/1');
    expect(screen.getByLabelText('Identificador fiscal')).toHaveAccessibleDescription(
      expect.stringContaining('Ya existe un cliente'),
    );
  });

  it('muestra en su campo los errores que devuelve el backend (422)', async () => {
    mockFetch({
      'POST /customers': () =>
        apiError(422, 'COUNTRY_NOT_SUPPORTED', 'País no admitido.', [{ field: 'countryCode', message: 'País no admitido.' }]),
    });
    const { user } = renderApp('/customers/new');
    await fillForm(user, 'B12345674');
    await user.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(await screen.findByText('Error: País no admitido.')).toBeInTheDocument();
  });

  it('no tiene violaciones de accesibilidad, tampoco con errores (axe)', async () => {
    mockFetch();
    const { container, user } = renderApp('/customers/new');
    await user.click(await screen.findByRole('button', { name: 'Guardar' }));
    expect(await axe(container)).toHaveNoViolations();
  });
});

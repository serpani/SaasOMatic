import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import { callsTo, mockFetch } from '../../../test/fetchMock';
import { renderApp } from '../../../test/renderApp';

/** Comprobación del identificador fiscal mientras se rellena el alta, sin esperar a «Guardar». */
async function setup(country = 'ES') {
  const fetchMock = mockFetch();
  const utils = renderApp('/customers/new');
  const taxId = await screen.findByLabelText('Identificador fiscal');
  if (country) await utils.user.selectOptions(screen.getByLabelText('País'), country);
  return { ...utils, fetchMock, taxId };
}

describe('Alta de cliente — validación del identificador fiscal en el momento', () => {
  it('al salir del campo con un NIF erróneo muestra el error, sin pulsar Guardar ni llamar a la API', async () => {
    const { user, taxId, fetchMock } = await setup();
    await user.type(taxId, '12345678A');
    await user.tab();

    expect(taxId).toHaveAttribute('aria-invalid', 'true');
    expect(taxId).toHaveAccessibleDescription(expect.stringContaining('Error: El identificador fiscal no es válido'));
    expect(callsTo(fetchMock, 'POST', '/customers')).toHaveLength(0);
  });

  it('con un identificador correcto confirma el tipo y cómo se guardará', async () => {
    const { user, taxId } = await setup();
    await user.type(taxId, 'b-1234567 4');

    expect(taxId).not.toHaveAttribute('aria-invalid');
    expect(taxId).toHaveAccessibleDescription(
      expect.stringContaining('Correcto: CIF válido, carácter de control correcto. Se guardará como B12345674.'),
    );
  });

  it('tras un error, se actualiza mientras se corrige', async () => {
    const { user, taxId } = await setup();
    await user.type(taxId, '12345678A');
    await user.tab();
    expect(taxId).toHaveAttribute('aria-invalid', 'true');

    await user.clear(taxId);
    await user.type(taxId, '12345678Z');
    expect(taxId).not.toHaveAttribute('aria-invalid');
    expect(screen.getByText(/Correcto: DNI válido/)).toBeInTheDocument();
  });

  it('al cambiar el país vuelve a comprobar el identificador', async () => {
    const { user, taxId } = await setup();
    await user.type(taxId, '12345678A');
    await user.tab();
    expect(taxId).toHaveAttribute('aria-invalid', 'true');

    await user.selectOptions(screen.getByLabelText('País'), 'FR');
    expect(taxId).not.toHaveAttribute('aria-invalid');
    expect(screen.getByText(/Fuera de España solo se comprueba el formato/)).toBeInTheDocument();
  });

  it('sin país seleccionado avisa de que hace falta para comprobarlo', async () => {
    const { user, taxId } = await setup('');
    await user.type(taxId, '12345678Z');
    expect(screen.getByText('Nota: Selecciona el país para comprobar el identificador fiscal.')).toBeInTheDocument();
  });

  it('pasar por un campo vacío con el teclado no muestra errores hasta pulsar Guardar', async () => {
    const { user } = await setup();
    await user.click(screen.getByLabelText('Email de contacto'));
    await user.tab();
    expect(screen.getByLabelText('Email de contacto')).not.toHaveAttribute('aria-invalid');
    await user.click(screen.getByRole('button', { name: 'Guardar' }));
    expect(screen.getByLabelText('Email de contacto')).toHaveAttribute('aria-invalid', 'true');
  });

  it('los demás campos también se validan al salir de ellos', async () => {
    const { user } = await setup();
    await user.type(screen.getByLabelText('Email de contacto'), 'no-es-email');
    await user.tab();
    expect(screen.getByLabelText('Email de contacto')).toHaveAccessibleDescription('Error: El email de contacto no es válido.');
  });

  it('no tiene violaciones de accesibilidad con la confirmación visible (axe)', async () => {
    const { user, taxId, container } = await setup();
    await user.type(taxId, 'B12345674');
    expect(await axe(container)).toHaveNoViolations();
  });
});

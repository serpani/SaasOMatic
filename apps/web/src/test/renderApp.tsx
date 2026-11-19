import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { AppLayout } from '../app/AppLayout';
import { AppProviders } from '../app/AppProviders';
import { AppRoutes } from '../app/AppRoutes';

/** Monta la aplicación completa (proveedores, layout y rutas) en la ruta indicada. */
export function renderApp(route = '/') {
  const user = userEvent.setup();
  const utils = render(
    <MemoryRouter initialEntries={[route]}>
      <AppProviders>
        <AppLayout>
          <AppRoutes />
        </AppLayout>
      </AppProviders>
    </MemoryRouter>,
  );
  return { user, ...utils };
}

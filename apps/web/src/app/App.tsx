import { BrowserRouter } from 'react-router';
import { AppLayout } from './AppLayout';
import { AppProviders } from './AppProviders';
import { AppRoutes } from './AppRoutes';

export function App() {
  return (
    <BrowserRouter>
      <AppProviders>
        <AppLayout>
          <AppRoutes />
        </AppLayout>
      </AppProviders>
    </BrowserRouter>
  );
}

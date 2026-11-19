import { Link, Route, Routes } from 'react-router';
import { CustomerDetailPage } from '../features/customers/components/CustomerDetailPage';
import { NewCustomerPage } from '../features/customers/components/NewCustomerPage';
import { SearchPage } from '../features/customers/components/SearchPage';
import { SimulatorPage } from '../features/simulator/components/SimulatorPage';
import { PageHeading } from '../shared/ui/PageHeading';

function NotFoundPage() {
  return (
    <>
      <PageHeading title="Página no encontrada" />
      <p>
        La página que buscas no existe. <Link to="/">Volver al buscador de clientes</Link>
      </p>
    </>
  );
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<SearchPage />} />
      <Route path="/customers/new" element={<NewCustomerPage />} />
      <Route path="/customers/:id" element={<CustomerDetailPage />} />
      <Route path="/customers/:id/simulate" element={<SimulatorPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

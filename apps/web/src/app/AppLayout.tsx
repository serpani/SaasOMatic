import type { ReactNode } from 'react';
import { Link, NavLink } from 'react-router';
import { CurrencyNotice } from '../features/currency/components/CurrencyNotice';
import { CurrencySelector } from '../features/currency/components/CurrencySelector';

/** Estructura común: enlace para saltar al contenido, cabecera con navegación y divisa, y contenido. */
export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <a className="skip-link" href="#main-content">
        Saltar al contenido
      </a>
      <header className="app-header">
        <div className="app-header__inner">
          <Link to="/" className="app-header__brand">
            <span className="app-header__logo" aria-hidden="true">
              S
            </span>
            SaaS-O-Matic
          </Link>
          <nav aria-label="Principal">
            <ul className="app-nav">
              <li>
                <NavLink to="/" end>
                  Clientes
                </NavLink>
              </li>
              <li>
                <NavLink to="/customers/new">Nuevo cliente</NavLink>
              </li>
            </ul>
          </nav>
          <CurrencySelector />
        </div>
      </header>
      <main id="main-content" className="app-main" tabIndex={-1}>
        <CurrencyNotice />
        {children}
      </main>
    </>
  );
}

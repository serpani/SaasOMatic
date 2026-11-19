import type { ReactNode } from 'react';

// Fondos con contraste ≥ 4.5:1 frente al texto blanco de las iniciales.
const AVATAR_COLORS = ['#4f46e5', '#0f766e', '#b45309', '#be185d', '#7c3aed', '#0369a1'];

const initials = (name: string) =>
  name
    .replace(/[()]/g, '')
    .split(/\s+/)
    .filter((word) => /^\p{L}/u.test(word))
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('');

const colorFor = (name: string) =>
  AVATAR_COLORS[[...name].reduce((sum, char) => sum + char.charCodeAt(0), 0) % AVATAR_COLORS.length];

/** Iniciales de la empresa en un cuadro de color. Es decorativo: el nombre ya aparece en texto al lado. */
export function Avatar({ name, size }: { name: string; size?: 'lg' }) {
  return (
    <span className={`avatar${size ? ` avatar--${size}` : ''}`} style={{ background: colorFor(name) }} aria-hidden="true">
      {initials(name)}
    </span>
  );
}

const PinIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
    <path d="M8 1a5 5 0 0 0-5 5c0 3.5 5 9 5 9s5-5.5 5-9a5 5 0 0 0-5-5Zm0 7a2 2 0 1 1 0-4 2 2 0 0 1 0 4Z" />
  </svg>
);

const LayersIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
    <path d="M8 1 1 4.5 8 8l7-3.5L8 1Zm-5.6 6.2L1 8l7 3.5L15 8l-1.4-.8L8 10 2.4 7.2Zm0 3.5L1 11.5 8 15l7-3.5-1.4-.8L8 13.5l-5.6-2.8Z" />
  </svg>
);

/** País con icono; el texto es el dato, el icono solo acompaña. */
export function CountryChip({ children }: { children: ReactNode }) {
  return (
    <span className="chip">
      <PinIcon />
      <span>{children}</span>
    </span>
  );
}

/** Plan con un tono por nivel. El nombre del plan siempre va en texto (no se depende solo del color). */
export function PlanChip({ code, children }: { code: string; children: ReactNode }) {
  return (
    <span className={`chip chip--${code}`}>
      <LayersIcon />
      <span>{children}</span>
    </span>
  );
}

export function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="9" cy="9" r="6" />
      <path d="m14 14 4 4" strokeLinecap="round" />
    </svg>
  );
}

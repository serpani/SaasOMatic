import type { Quote } from '@saasomatic/shared';

/**
 * Barra con el reparto de usuarios por tramo. Es un apoyo visual: la misma información está en la tabla
 * del desglose, por eso se oculta a los lectores de pantalla y cada color se repite en la fila de su tramo.
 */
export function TierBar({ tiers }: { tiers: Quote['tierBreakdown'] }) {
  const total = tiers.reduce((sum, t) => sum + t.users, 0);
  if (total === 0) return null;

  return (
    <div className="tier-bar" aria-hidden="true">
      {tiers.map((t, index) => (
        <span
          key={t.minUsers}
          className={`tier-bar__segment tier-dot--${index % 3}`}
          style={{ flexGrow: t.users / total }}
        />
      ))}
    </div>
  );
}

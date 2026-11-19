import { formatInteger, MAX_ACTIVE_USERS, MIN_ACTIVE_USERS } from '@saasomatic/shared';
import { FormField } from '../../../shared/ui/FormField';

interface UsageControlsProps {
  inputs: { usersText: string; storageText: string; apiCallsText: string };
  users: number;
  totalLabel: string;
  errors: { users?: string; storageGb?: string; apiCalls?: string };
  onUsers: (value: string) => void;
  onStorage: (value: string) => void;
  onApiCalls: (value: string) => void;
  /** Simulación guardada: todos los controles bloqueados (fieldset disabled). */
  readOnly?: boolean;
}

/** Slider + campo numérico sincronizados para los usuarios, y campos de almacenamiento y llamadas. */
export function UsageControls(props: UsageControlsProps) {
  const { inputs, users, totalLabel, errors, onUsers, onStorage, onApiCalls, readOnly = false } = props;
  return (
    <fieldset className="card usage" disabled={readOnly}>
      <legend className="usage__legend">Consumo estimado</legend>
      <div className="usage__users">
        <div className="usage__users-head">
          <label htmlFor="users-slider">Usuarios activos (deslizador)</label>
          {/* Lectura visual grande; el valor ya lo anuncia el propio deslizador. */}
          <span className="usage__readout" aria-hidden="true">
            {formatInteger(users)}
          </span>
        </div>
        <input
          id="users-slider"
          type="range"
          min={MIN_ACTIVE_USERS}
          max={MAX_ACTIVE_USERS}
          step={1}
          value={users}
          onChange={(e) => onUsers(e.target.value)}
          aria-valuetext={`${formatInteger(users)} usuarios, total ${totalLabel}`}
        />
        <div className="usage__scale" aria-hidden="true">
          <span>1</span>
          <span>10.000</span>
        </div>
      </div>
      <FormField label="Usuarios activos" error={errors.users} hint="Entre 1 y 10.000.">
        <input inputMode="numeric" value={inputs.usersText} onChange={(e) => onUsers(e.target.value)} />
      </FormField>
      <div className="usage__pair">
        <FormField label="Almacenamiento (GB)" error={errors.storageGb}>
          <input inputMode="numeric" value={inputs.storageText} onChange={(e) => onStorage(e.target.value)} />
        </FormField>
        <FormField label="Llamadas a la API al mes" error={errors.apiCalls}>
          <input inputMode="numeric" value={inputs.apiCallsText} onChange={(e) => onApiCalls(e.target.value)} />
        </FormField>
      </div>
    </fieldset>
  );
}

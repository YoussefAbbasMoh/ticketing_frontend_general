import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { t } from '../../i18n';
import { authInputClass } from './authFieldClasses';

/**
 * Password field with inline show/hide control (logical end, RTL-aware).
 */
/* eslint-disable react/prop-types -- JS callers; props are stable internal API */
export default function AuthPasswordInput({
  lang,
  id,
  name,
  value,
  onChange,
  disabled,
  autoComplete,
  placeholder,
  required,
  inputClassName,
  'aria-invalid': ariaInvalid = undefined,
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        name={name}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        required={required}
        autoComplete={autoComplete}
        disabled={disabled}
        aria-invalid={ariaInvalid}
        className={`${inputClassName || authInputClass} pe-11`}
        placeholder={placeholder}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        disabled={disabled}
        className="absolute end-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-app-input text-app-text-tertiary transition-colors hover:bg-app-surface-variant hover:text-app-text disabled:cursor-not-allowed disabled:opacity-50"
        aria-label={visible ? t(lang, 'hidePassword') : t(lang, 'showPassword')}
      >
        {visible ? (
          <Eye className="h-5 w-5" aria-hidden strokeWidth={2} />
        ) : (
          <EyeOff className="h-5 w-5" aria-hidden strokeWidth={2} />
        )}
      </button>
    </div>
  );
}

import React from 'react';
import { Loader2 } from 'lucide-react';
import './Button.css';

export default function Button({
  children,
  variant = 'primary',
  loading = false,
  icon: Icon,
  className = '',
  ...props
}) {
  return (
    <button
      className={`btn btn--${variant} ${className}`}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <Loader2 className="btn__icon btn__icon--spin" size={16} />
      ) : Icon ? (
        <Icon className="btn__icon" size={16} />
      ) : null}
      {children}
    </button>
  );
}
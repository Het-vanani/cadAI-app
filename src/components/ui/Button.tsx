import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  active?: boolean;       // glows when a tool is selected
  disabled?: boolean;
  title?: string;         // tooltip on hover
  variant?: 'ghost' | 'solid';
  size?: 'sm' | 'md';
  className?: string;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  active = false,
  disabled = false,
  title,
  variant = 'ghost',
  size = 'md',
  className = '',
}) => {
  const base = 'flex items-center justify-center rounded transition-all duration-150 cursor-pointer select-none';

  const sizes = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-sm',
  };

  const variants = {
    ghost: active
      ? 'bg-zinc-700 text-white shadow-sm ring-1 ring-zinc-500'
      : 'text-slate-400 hover:text-white hover:bg-panel-hover',
    solid: 'bg-zinc-700 hover:bg-zinc-600 text-white shadow-sm',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title || undefined}
      className={`${base} ${sizes[size]} ${variants[variant]} ${disabled ? 'opacity-40 cursor-not-allowed' : ''} ${className}`}
    >
      {children}
    </button>
  );
};
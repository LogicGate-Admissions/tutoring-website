import Link from 'next/link';
import { cn } from '@/shared/utils/cn';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

type ButtonProps = {
  children: React.ReactNode;
  href?: string;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  variant?: ButtonVariant;
  className?: string;
  onClick?: () => void;
};

/**
 * Shared button component.
 *
 * If href is provided, it renders as a Next.js Link.
 * If href is not provided, it renders as a normal button.
 */
export function Button({
  children,
  href,
  type = 'button',
  disabled = false,
  variant = 'primary',
  className,
  onClick,
}: ButtonProps) {
  const buttonClassName = cn(
    'inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-medium transition',
    'focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2',
    disabled && 'cursor-not-allowed opacity-50',
    variant === 'primary' && 'bg-slate-950 text-white hover:bg-slate-800',
    variant === 'secondary' &&
      'border border-slate-300 bg-white text-slate-950 hover:bg-slate-50',
    variant === 'ghost' && 'text-slate-700 hover:bg-slate-100',
    variant === 'danger' && 'bg-rose-600 text-white hover:bg-rose-500',
    className
  );

  if (href) {
    return (
      <Link href={href} className={buttonClassName}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={buttonClassName}
    >
      {children}
    </button>
  );
}

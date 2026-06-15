/**
 * File purpose: Shared user avatar for tutor/student photos.
 *
 * When a profile photo exists we show it as a circular/cornered face image.
 * If a user has not uploaded one yet, we fall back to their initials so the
 * UI still feels personal and stable.
 */

import { cn } from '@/shared/utils/cn';

type ProfileAvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

type ProfileAvatarProps = {
  name: string;
  photoUrl?: string;
  size?: ProfileAvatarSize;
  rounded?: 'full' | 'soft';
  className?: string;
};

const sizeClasses: Record<ProfileAvatarSize, string> = {
  xs: 'h-7 w-7 text-[0.65rem]',
  sm: 'h-9 w-9 text-xs',
  md: 'h-12 w-12 text-sm',
  lg: 'h-16 w-16 text-lg',
  xl: 'h-20 w-20 text-2xl',
};

export function ProfileAvatar({
  name,
  photoUrl,
  size = 'md',
  rounded = 'soft',
  className,
}: ProfileAvatarProps) {
  const baseClassName = cn(
    'shrink-0 overflow-hidden bg-slate-950 font-semibold text-white ring-1 ring-black/5',
    sizeClasses[size],
    rounded === 'full' ? 'rounded-full' : 'rounded-2xl',
    className,
  );

  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={name ? `${name} profile photo` : 'Profile photo'}
        className={cn(baseClassName, 'object-cover')}
      />
    );
  }

  return (
    <div className={cn(baseClassName, 'flex items-center justify-center')}>
      {getInitials(name)}
    </div>
  );
}

function getInitials(name: string) {
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return initials || 'LG';
}

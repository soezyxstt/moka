import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { typography } from '@/components/custom/typography';

type SectionHeaderProps = {
  title: ReactNode;
  description?: ReactNode;
  align?: 'left' | 'center';
  onDark?: boolean;
  titleClassName?: string;
  className?: string;
};

export function SectionHeader({ title, description, align = 'left', onDark = false, titleClassName, className }: SectionHeaderProps) {
  const centered = align === 'center';
  return (
    <div className={cn('space-y-3', centered && 'text-center', className)}>
      <typography.h1 className={cn(onDark && 'text-canvas', titleClassName)}>{title}</typography.h1>
      {description ? (
        <typography.p className={cn('max-w-2xl', onDark && 'text-on-media/85', centered && 'mx-auto')}>{description}</typography.p>
      ) : null}
    </div>
  );
}

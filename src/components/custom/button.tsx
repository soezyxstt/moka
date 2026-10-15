import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import { Button as PrimitiveButton } from '@/components/ui/button';

const buttonVariants = cva('rounded-md text-canvas disabled:pointer-events-none outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 aria-invalid:border-destructive whitespace-nowrap font-medium transition-all flex items-center', {
  variants: {
    variant: {
      default:
        "bg-primary text-primary-foreground shadow-none hover:bg-primary/90",
      destructive:
        "bg-destructive text-canvas shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20",
      outline:
        "border border-brand bg-transparent text-brand shadow-xs hover:bg-brand hover:text-canvas",
      ghost:
        "hover:bg-accent hover:text-accent-foreground",
      link: "text-primary underline-offset-4 hover:underline",
    },
    size: {
      default: 'h-9 px-4 py-2',
      sm: 'h-8 rounded-md gap-1.5 px-3',
      lg: 'h-10 rounded-md px-6',
      icon: 'size-9',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
  },
})

export function Button({
  className,
  variant,
  children,
  size, ...props }:
  React.ComponentProps<typeof PrimitiveButton> &
  VariantProps<typeof buttonVariants>) {
  return (
    <PrimitiveButton variant={variant ?? 'default'} size={size ?? 'default'} className={cn('flex justify-start gap-0 text-base disabled:opacity-100', buttonVariants({ variant, size, className }))} {...props}>{children}</PrimitiveButton>
  )
}

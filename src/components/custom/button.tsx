import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva('rounded-md text-white disabled:pointer-events-none outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 aria-invalid:border-destructive whitespace-nowrap font-medium transition-all flex items-center', {
  variants: {
    variant: {
      default:
        "shadow-xs bg-dgb hover:bg-dgb/90 disabled:bg-dgb-600",
      destructive:
        "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20",
      outline:
        "border bg-transparent shadow-xs hover:bg-dgb hover:text-white border-dgb",
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
  React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants>) {
  return (
    <button className={cn(buttonVariants({ variant, size, className }))} {...props}>{children}</button>
  )
}
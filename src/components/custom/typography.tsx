import { cn } from '@/lib/utils';
import { type HTMLProps } from 'react'

type TitleProps = HTMLProps<HTMLHeadingElement>;
type ParagraphProps = HTMLProps<HTMLParagraphElement>;

function t1({ children, className, ...props }: TitleProps) {
  return <h3 className={cn("uppercase text-highlight-400 font-manrope text-base font-bold", className)} {...props}>
    {children}
  </h3>
}


function h1({ children, className, ...props }: TitleProps) {
  return <h2 className={cn("text-4xl font-semibold font-manrope", className)} {...props}>
    {children}
  </h2>
}


function p({ children, className, ...props }: ParagraphProps) {
  return <p className={cn("text-base font-normal font-inter leading-relaxed text-body", className)} {...props}>
    {children}
  </p>
}

export const typography = { t1, h1, p }

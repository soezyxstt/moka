import { Inter, Manrope } from 'next/font/google';


export const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope-next',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
  style: ['normal'],
})

export const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter-next',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
  style: ['normal', 'italic'],
})
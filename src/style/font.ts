import { Inter, Montserrat } from 'next/font/google';


export const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat-next',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800', '900'],
  style: ['normal', 'italic'],
})

export const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter-next',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800', '900'],
  style: ['normal', 'italic'],
})
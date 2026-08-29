import { typography } from '@/components/custom/typography';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Instagram, Youtube, Twitter } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

const faqs = [
  {
    "question": "Bagaimana cara menghubungi MOKA Garut untuk kolaborasi?",
    "answer": "Kami selalu terbuka untuk usaha kreatif baru. Untuk pertanyaan kemitraan atau kolaborasi, silakan isi Formulir Pertanyaan Kolaborasi kami di halaman Hubungi Kami, dan tim kami akan meninjau dan menghubungi jika ada kecocokan."
  },
  {
    "question": "Di mana saya dapat menemukan informasi tentang kampanye dan rilis MOKA Garut?",
    "answer": "Anda dapat menemukan informasi mengenai kampanye dan rilis MOKA Garut, termasuk kegiatan dan prestasi terkait Duta Pariwisata Mojang Jajaka Garut, melalui situs web resmi Dinas Pariwisata dan Kebudayaan (Disparbud) Kabupaten Garut (disparbud.garutkab.go.id) serta publikasi berita lokal. Pantau juga media sosial resmi yang mungkin dimiliki oleh MOKA Garut atau Paguyuban Mojang Jajaka Garut untuk informasi terbaru."
  },
  {
    "question": "Bagaimana cara menghubungi dukungan pelanggan Anda?",
    "answer": "Untuk menghubungi dukungan atau layanan pelanggan MOKA Garut, Anda disarankan untuk merujuk ke halaman 'Hubungi Kami' di situs web resmi mereka, sebagaimana yang disebutkan untuk pertanyaan kolaborasi. Jika MOKA Garut yang Anda maksud adalah terkait dengan entitas Mojang Jajaka Garut, Anda juga bisa mencoba mencari informasi kontak melalui Dinas Pariwisata dan Kebudayaan Kabupaten Garut atau Paguyuban Mojang Jajaka Garut. Untuk layanan Moka POS (jika itu yang dimaksud), mereka memiliki saluran dukungan pelanggan sendiri seperti call center di 1500970 atau email support@mokapos.com."
  },
  {
    "question": "Bagaimana cara bergabung dan berpartisipasi dalam acara dan kegiatan Anda?",
    "answer": "Untuk mengetahui cara bergabung dan berpartisipasi dalam acara dan kegiatan yang diselenggarakan oleh MOKA Garut, khususnya yang berkaitan dengan kegiatan seperti Pasanggiri Mojang Jajaka Garut, Anda sebaiknya memantau pengumuman resmi dari Paguyuban Mojang Jajaka Kabupaten Garut atau Dinas Pariwisata dan Kebudayaan Kabupaten Garut. Informasi pendaftaran, syarat, dan jadwal kegiatan biasanya akan dipublikasikan melalui situs web resmi instansi tersebut, media sosial, atau media lokal."
  }
]

export default function ProfileGrid() {
  return (
    <main className='min-h-screen bg-[url(/tumpeng.jpg)] bg-cover bg-center bg-no-repeat relative'>
      <div className="absolute top-0 left-0 w-full h-full z-0 bg-dgb-50/95" />
      <section className="isolate px-8 md:px-20 md:py-32 py-24 flex justify-between gap-8">

        <div className="space-y-8">

          <h2 className="font-montserrat text-5xl md:text-7xl uppercase font-medium">Contact Us</h2>
          <div className="flex md:gap-20 gap-8 max-sm:flex-col">
            <typography.p className="">
              For any inquiries. collaborations, or just to say hello, we&apos;d love to hear from you! Reach out. and let&apos;s connect
            </typography.p>
            <div className="space-y-12">
              <div className="space-y-2">
                <typography.t1>Head Office</typography.t1>
                <typography.p className="">
                  JUUN.J SAMSUNG CORPORATION
                  2806, Narnbusunhwang-Ro, Gangnam-Cu, Seoul,
                  Republic of Korea
                </typography.p>
              </div>

              <div className="space-y-2">
                <typography.t1>Email</typography.t1>
                <typography.p className="uppercase">Paguyuban Mojang Jajaka Kabupaten Garut</typography.p>
                <typography.p className="">mojangjajakakabgarut@gmail.com</typography.p>
              </div>

              <div className="space-y-2">
                <typography.t1>Social Media</typography.t1>
                <Link
                  target='_blank'
                  href='https://instagram.com/mokagarut'
                  className="flex items-center hover:text-dgb"
                >
                  <Instagram className='w-4 h-4' />
                  <typography.p className="ml-2 hover:text-dgb">@mokagarut</typography.p>
                </Link>

                <Link
                  target='_blank'
                  href='https://twitter.com/mokagarut'
                  className="flex items-center hover:text-dgb"
                >
                  <Twitter className='w-4 h-4' />
                  <typography.p className="ml-2 hover:text-dgb">@mokagarut</typography.p>
                </Link>

                <Link
                  target='_blank'
                  href='https://youtube.com/@mokagarut'
                  className="flex items-center hover:text-dgb"
                >
                  <Youtube className='w-4 h-4' />
                  <typography.p className="ml-2 hover:text-dgb">@mokagarut</typography.p>
                </Link>
              </div>
            </div>
          </div>

          <typography.h1 className='uppercase font-montserrat font-medium max-w-[calc(24*16px)] mt-20'>Frequently Asked Questions</typography.h1>
          <div className="">
            <Accordion type='single' collapsible className="w-full md:w-3/4 font-montserrat">
              {faqs.map((faq, i) => (
                <AccordionItem value={'faq-' + i} key={faq.question} className='border-black border-b-[0.5px]'>
                  <AccordionTrigger className='font-normal'>{faq.question}</AccordionTrigger>
                  <AccordionContent className='text-[#404040]'>
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>

        <Image
          src='/kang-nurman.png'
          alt='Kang Nurman'
          width={500}
          height={500}
          className='h-full max-w-2xs object-cover max-sm:hidden'
        />
      </section>
    </main>
  )
}
// src/components/NewsCard.tsx
import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge'; // Adjust path if your ui components are elsewhere
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export interface NewsItem {
  title: string;
  description: string;
  imageUrl: string;
  date: Date;
  link: string;
  type?: 'file' | 'link';
}

interface NewsCardProps {
  news: NewsItem;
}

export const NewsCard: React.FC<NewsCardProps> = ({ news }) => {
  const { title, description, imageUrl, date, link, type } = news;

  // Get badge text (formatted date) and variant
  const { badgeText, color } = getBadgeInfo(date);

  return (
    <article className="overflow-hidden flex flex-col h-full">
      <div className="relative w-full aspect-[16/9] mb-4">
        <Image
          src={imageUrl}
          alt={title}
          fill
          className="object-cover rounded-lg"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        />
      </div>
      <div className="flex flex-col flex-grow"> {/* Padding kept from previous approved version */}

        {/* MODIFIED SECTION: Date is now inside the Badge */}
        <div className="mb-2"> {/* Wrapper for the badge, provides bottom margin */}
          <Badge className={cn("text-[10px] text-ink whitespace-nowrap", color)}>
            {badgeText}
          </Badge>
        </div>
        {/* END OF MODIFIED SECTION */}

        {/* Styles for title, description, and link are PRESERVED */}
        <h3 className="font-manrope font-medium mb-3 text-neutral-800 line-clamp-2">
          <Link href={link} className="hover:text-brand transition-colors duration-200" target='_blank' rel="noopener noreferrer">
            {title}
          </Link>
        </h3>
        <p className="text-sm leading-6 text-body font-inter dark:text-neutral-400 mb-4 line-clamp-4 flex-grow">
          {description}
        </p>
        <div className="mt-auto pt-2">
          {type !== 'file' ? (<Link
            href={link}
            target='_blank'
            rel="noopener noreferrer"
            className="text-sm font-medium text-brand hover:underline focus:outline-none rounded-sm flex items-center gap-1"
          >
            Selengkapnya <ArrowRight className='w-4 -rotate-45' />
          </Link>)
            :
            (<AlertDialog>
              <AlertDialogTrigger
                className="text-sm font-medium text-brand hover:underline focus:outline-none rounded-sm flex items-center gap-1"
              >
                Selengkapnya <ArrowRight className='w-4 -rotate-45' />
              </AlertDialogTrigger>
              <AlertDialogContent className=''>
                <AlertDialogHeader>
                  <AlertDialogTitle>Apakah Anda yakin?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tekan tombol lanjut untuk mendownload file {title}.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  <AlertDialogAction asChild className='bg-primary text-primary-foreground'>
                    <Link href={link} download>Lanjut</Link>
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>)}
        </div>
      </div>
    </article>
  );
};

// src/utils/badgeUtils.ts (or at the top of your NewsCard.tsx)
export const getBadgeInfo = (newsDate: Date): {
  badgeText: string; // This will be the formatted date
  color: 'bg-transparent px-0 text-muted-foreground' | 'bg-highlight text-ink' | 'bg-muted text-muted-foreground' | 'border border-brand bg-transparent text-brand';
} => {
  if (!newsDate || !(newsDate instanceof Date) || isNaN(newsDate.getTime())) {
    return {
      badgeText: '-',
      color: 'bg-transparent px-0 text-muted-foreground',
    }
  }
  const today = new Date();

  // Normalize dates for comparison
  const currentDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const itemDate = new Date(newsDate.getFullYear(), newsDate.getMonth(), newsDate.getDate());

  // Calculate difference in days
  // diffDays > 0 means itemDate is in the past
  // diffDays === 0 means itemDate is today
  // diffDays < 0 means itemDate is in the future
  const diffDays = Math.floor((currentDate.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24));

  let color: 'bg-transparent px-0 text-muted-foreground' | 'bg-highlight text-ink' | 'bg-muted text-muted-foreground' | 'border border-brand bg-transparent text-brand';

  if (diffDays < 0) { // Future news
    color = 'border border-brand bg-transparent text-brand';
  } else if (diffDays === 0) { // Today's news
    color = 'bg-highlight text-ink';
  } else if (diffDays <= 30) { // News within the last 7 days (1-7 days ago)
    color = 'bg-highlight text-ink';
  } else if (diffDays <= 180) { // News between 8 and 30 days ago
    color = 'bg-muted text-muted-foreground';
  } else { // Older news (more than 30 days ago)
    color = 'bg-transparent px-0 text-muted-foreground';
  }

  // Format date as "DD MONTH_ALLCAPS, YYYY" (e.g., "10 MAY, 2025")
  const day = newsDate.getDate();
  const month = newsDate.toLocaleString('en-US', { month: 'long' }).toUpperCase();
  const year = newsDate.getFullYear();
  const formattedDateString = `${day} ${month}, ${year}`;

  return { badgeText: formattedDateString, color };
};

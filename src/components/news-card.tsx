// src/components/NewsCard.tsx
import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge'; // Adjust path if your ui components are elsewhere
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface NewsItem {
  title: string;
  description: string;
  imageUrl: string;
  date: Date;
  link: string;
}

interface NewsCardProps {
  news: NewsItem;
}

export const NewsCard: React.FC<NewsCardProps> = ({ news }) => {
  const { title, description, imageUrl, date, link } = news;

  // Get badge text (formatted date) and variant
  const { badgeText,  color} = getBadgeInfo(date);

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
          <Badge className={cn("text-[10px] text-black whitespace-nowrap", color)}> {/* Date is inside the badge. text-xs for better fit. */}
            {badgeText}
          </Badge>
        </div>
        {/* END OF MODIFIED SECTION */}

        {/* Styles for title, description, and link are PRESERVED */}
        <h3 className="font-montserrat font-medium mb-3 text-gray-800 line-clamp-2">
          <Link href={link} className="hover:text-dgb dark:hover:text-dgb transition-colors duration-200" target='_blank'>
            {title}
          </Link>
        </h3>
        <p className="text-xs text-[#505050] font-montserrat dark:text-neutral-400 mb-4 line-clamp-4 flex-grow">
          {description}
        </p>
        <div className="mt-auto pt-2">
          <Link
            href={link}
            target='_blank'
            className="text-sm font-medium text-dgb hover:underline focus:outline-none focus:ring-2 focus:ring-dgb focus:ring-offset-2 dark:focus:ring-offset-neutral-900 rounded-sm flex items-center gap-1"
          >
            Selengkapnya <ArrowRight className='w-4 -rotate-45' />
          </Link>
        </div>
      </div>
    </article>
  );
};

// src/utils/badgeUtils.ts (or at the top of your NewsCard.tsx)
export const getBadgeInfo = (newsDate: Date): {
  badgeText: string; // This will be the formatted date
  color: 'bg-transparent px-0' | 'bg-[#adfa1d]' | 'bg-[#444] text-[#eee]' | 'border border-dgb bg-transparent'; // Standard Shadcn/ui badge variants
} => {
  if (!newsDate || !(newsDate instanceof Date) || isNaN(newsDate.getTime())) {
    return {
      badgeText: '-',
      color: 'bg-transparent px-0', // Default to transparent if date is invalid
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

  let color: 'bg-transparent px-0' | 'bg-[#adfa1d]' | 'bg-[#444] text-[#eee]' | 'border border-dgb bg-transparent';

  if (diffDays < 0) { // Future news
    color = 'border border-dgb bg-transparent'; // Prominent (e.g., primary color)
  } else if (diffDays === 0) { // Today's news
    color = 'bg-[#adfa1d]'; // Prominent
  } else if (diffDays <= 7) { // News within the last 7 days (1-7 days ago)
    color = 'bg-[#adfa1d]'; // Still prominent
  } else if (diffDays <= 30) { // News between 8 and 30 days ago
    color = 'bg-[#444] text-[#eee]'; // Less prominent (e.g., gray or secondary color)
  } else { // Older news (more than 30 days ago)
    color = 'bg-transparent px-0'; // Muted (e.g., just a border)
  }

  // Format date as "DD MONTH_ALLCAPS, YYYY" (e.g., "10 MAY, 2025")
  const day = newsDate.getDate();
  const month = newsDate.toLocaleString('en-US', { month: 'long' }).toUpperCase();
  const year = newsDate.getFullYear();
  const formattedDateString = `${day} ${month}, ${year}`;

  return { badgeText: formattedDateString, color };
};
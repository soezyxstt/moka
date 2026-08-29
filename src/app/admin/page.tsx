// app/your-protected-page/page.tsx
import { cookies } from 'next/headers'; // This works only in Server Components/Server Actions/Route Handlers
import PasswordPrompt from '@/components/PasswordPrompt'; // Adjust path if needed
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import InputForm from './input-form';
import { prisma } from '../server/prisma';

// This is a Server Component. It runs on the server.
export default async function ProtectedPage() {
  const cookieStore = await cookies(); // Get the cookie store on the server
  const hasAccessCookie = cookieStore.get(process.env.PASSWORD_COOKIE_NAME || 'hasPageAccess');
  const hasAccess = hasAccessCookie?.value === 'true';
  const semifinalists = await prisma.semifinalist.findMany({
    orderBy: {
      name: 'asc', // Sort by name in ascending order
    }
  })

  // Group semifinalists by category
  const categories = semifinalists.reduce((acc, semifinalist) => {
    const category = acc.find(cat => cat.abrev === semifinalist.category);
    if (category) {
      category.list.push(semifinalist);
    } else {
      acc.push({
        abrev: semifinalist.category,
        list: [semifinalist],
      });
    }
    return acc;
  }, [] as {
    abrev: string;
    list: typeof semifinalists;
  }[]);

  if (!hasAccess) {
    // If access is denied, render the Client Component for the password prompt.
    // This component will then handle submitting the password and triggering router.refresh().
    return <PasswordPrompt />;
  }

  // If hasAccess is true, render your protected content (which can also be a Server Component)
  return (
    <main className="min-h-screen overflow-hidden bg-[url(/babancong.png)] bg-fixed bg-size-[auto_100lvh] relative bg-center px-6 pt-24 md:px-20 md:pt-32 pb-8 font-montserrat text-white">
      <div className='w-full h-full pointer-events-none fixed z-0 bg-radial-[at_50%_50%] from-transparent to-90% to-dgb-800 left-0 top-0' />
      <div className="isolate relative z-10 bg-white/5 backdrop-blur-md rounded-3xl p-6 md:p-8">
        <Accordion type="single" collapsible className='isolate'>
          {categories.map((category) => (
            <AccordionItem key={category.abrev} value={category.abrev}>
              <AccordionTrigger className="text-lg font-semibold">
                {category.abrev}
              </AccordionTrigger>
              <AccordionContent>
                <Table>
                  <TableHeader className='**:text-white'>
                    <TableRow>
                      <TableHead>Nama</TableHead>
                      <TableHead>Total Pemasukan</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {category.list.map((finalist) => (
                      <TableRow key={finalist.name}>
                        <TableCell>
                          {finalist.name}
                        </TableCell>
                        <TableCell>
                          <InputForm name={finalist.name} incomes={finalist.incomes} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
      
    </main>
  );
}
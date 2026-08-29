'use server';

import { actionClient } from '@/lib/safe-action';
import { z } from 'zod';
import { prisma } from '../server/prisma';

const incomeSubmissionSchema = z.object({
  name: z.string(),
  incomes: z.number(),
});

export const updateSemifinalistIncome = actionClient
  .inputSchema(incomeSubmissionSchema)
  .action(async ({ parsedInput: { name, incomes } }) => {
    const data = await prisma.semifinalist.update({
      where: { name },
      data: { incomes },
    });

    if (!data) {
      throw new Error('Failed to update finalist data');
    }
  });

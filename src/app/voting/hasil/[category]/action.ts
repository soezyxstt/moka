"use server";

import { prisma } from '@/app/server/prisma';

export async function getSemifinalistData(category: string) {
  const data = await prisma.semifinalist.findMany({
    where: {
      category: category as "JD" | "MD" | "MR" | "JR", // Filter by the provided category
    },
    orderBy: {
      name: 'asc', // Sort by name in ascending order
    },
    select: {
      name: true,
      incomes: true,
      category: true,
    },
  });

  const totalIncomes = data.reduce((sum, item) => sum + item.incomes, 0);

  return data.map((item) => ({
    name: item.name,
    vote: Math.round(item.incomes / totalIncomes * 10000)/100, // Calculate percentage of total incomes
  }))
}
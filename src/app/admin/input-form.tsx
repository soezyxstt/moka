"use client";

import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { useAction } from "next-safe-action/hooks";
import { updateSemifinalistIncome } from './action';
import { toast } from 'sonner';

export default function InputForm({ name, incomes }: { name: string, incomes: number }) {
  const [input, setInput] = useState(incomes);
  const { execute } = useAction(updateSemifinalistIncome, {
    onSuccess: () => {
      toast.success(`Pemasukan ${name} berhasil diperbarui!`);
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : `Gagal memperbarui pemasukan ${name}.`);
    },
  })
  return (
    <div className="flex gap-2 h-8">
      <Input type='number' value={input} onChange={(v) => setInput(Number(v.currentTarget.value))} />
      <div className="bg-green-500 rounded-md grid place-items-center h-8 w-16 cursor-pointer" onClick={() => {
        execute({ name, incomes: input })
      }}>
        {">"}
      </div>
    </div>
  );
}
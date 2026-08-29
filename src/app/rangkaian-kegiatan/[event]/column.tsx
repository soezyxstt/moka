"use client"

import { ColumnDef } from "@tanstack/react-table"

export type Standing = {
  id?: string
  name: string
  title?: string
}

export const standingColumn: ColumnDef<Standing>[] = [
  {
    accessorKey: "index",
    header: "No.",
    cell: ({ row }) => <div className="pl-2">{row.index + 1}</div>
  },
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "title",
    header: "Title",
    cell: ({ row }) => <div className="">{row.original.title ?? "-"}</div>
  }
]
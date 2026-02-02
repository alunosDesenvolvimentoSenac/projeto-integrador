"use client"

import * as React from "react" // 1. Importar React para usar useState
import {
  SortingState, // 2. Importar tipos e funções de ordenação
  getSortedRowModel,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { getColumns, Equipamento } from "./columns"

interface DataTableProps {
  data: Equipamento[]
  salasOptions: { id: number, nome: string, codigo: string }[]
}

export function DataTable({ data, salasOptions }: DataTableProps) {
  // 3. DEFINIR O ESTADO INICIAL DE ORDENAÇÃO
  // id: "nomeSala" deve ser IGUAL ao accessorKey definido no columns.tsx
  // desc: false significa ASCENDENTE (A-Z)
  const [sorting, setSorting] = React.useState<SortingState>([
    {
      id: "codigoSala",
      desc: false, 
    },
  ])

  const columns = getColumns(salasOptions)

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    // 4. ADICIONAR O MODELO DE ORDENAÇÃO
    getSortedRowModel: getSortedRowModel(), 
    onSortingChange: setSorting, // Permite que o usuário mude a ordem clicando
    state: {
      sorting, // Passa o estado atual
    },
  })

  return (
    <div className="rounded-md border overflow-hidden bg-white">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="whitespace-nowrap">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="whitespace-nowrap">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  Nenhum registro encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
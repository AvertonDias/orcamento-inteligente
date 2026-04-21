
"use client";

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Transaction, DEFAULT_CATEGORIES } from '@/app/lib/types';
import { formatCurrency, formatDate } from '@/app/lib/formatters';
import { ArrowUpCircle, ArrowDownCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TransactionTableProps {
  transactions: Transaction[];
  onUpdate: (id: string, updates: Partial<Transaction>) => void;
  onDelete: (id: string) => void;
}

export function TransactionTable({ transactions, onUpdate, onDelete }: TransactionTableProps) {
  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-lg bg-white/50">
        <p className="text-muted-foreground mb-2 font-medium">Nenhuma transação encontrada</p>
        <p className="text-sm text-muted-foreground">Importe um arquivo CSV para começar a organizar seu orçamento.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border bg-white shadow-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-muted/30">
          <TableRow>
            <TableHead className="w-[120px]">Data</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead className="w-[180px]">Categoria</TableHead>
            <TableHead className="w-[120px]">Valor</TableHead>
            <TableHead className="w-[80px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((t) => (
            <TableRow key={t.id} className="group transition-colors">
              <TableCell className="font-medium text-sm text-muted-foreground">
                {formatDate(t.date)}
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  {t.type === 'receita' ? (
                    <ArrowUpCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                  ) : (
                    <ArrowDownCircle className="h-4 w-4 text-rose-500 shrink-0" />
                  )}
                  <Input
                    value={t.description}
                    onChange={(e) => onUpdate(t.id, { description: e.target.value })}
                    className="border-none bg-transparent h-8 p-0 focus-visible:ring-0 focus-visible:bg-white px-2 hover:bg-muted/50 rounded"
                  />
                </div>
              </TableCell>
              <TableCell>
                <Select
                  value={t.category}
                  onValueChange={(val) => onUpdate(t.id, { category: val })}
                >
                  <SelectTrigger className="h-8 border-none bg-transparent hover:bg-muted/50 focus:ring-0 shadow-none">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEFAULT_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell className={`font-semibold ${t.type === 'receita' ? 'text-emerald-600' : 'text-rose-600'}`}>
                {t.type === 'despesa' ? '-' : '+'} {formatCurrency(t.amount)}
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  className="opacity-0 group-hover:opacity-100 h-8 w-8 text-muted-foreground hover:text-destructive transition-opacity"
                  onClick={() => onDelete(t.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

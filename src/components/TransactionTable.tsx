
"use client";

import React, { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Transaction } from '@/app/lib/types';
import { formatCurrency, formatDate } from '@/app/lib/formatters';
import { 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Trash2, 
  Ban, 
  History, 
  Landmark, 
  CreditCard, 
  User,
  Calendar,
  Tag
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface TransactionTableProps {
  transactions: Transaction[];
  onUpdate: (id: string, updates: Partial<Transaction>) => void;
  onDelete: (id: string) => void;
  onIgnoreSimilar?: (description: string) => void;
  onUpdateSimilarCategory?: (description: string, category: string) => void;
  isIgnoredList?: boolean;
  categories: string[];
}

export function TransactionTable({ 
  transactions, 
  onUpdate, 
  onDelete, 
  onIgnoreSimilar,
  onUpdateSimilarCategory,
  isIgnoredList = false,
  categories
}: TransactionTableProps) {
  const [pendingCategoryUpdate, setPendingCategoryUpdate] = useState<{ id: string, description: string, category: string } | null>(null);

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-lg bg-white/50">
        <p className="text-muted-foreground mb-2 font-medium">Nenhuma transação encontrada</p>
        <p className="text-sm text-muted-foreground">Importe um arquivo CSV para começar a organizar seu orçamento.</p>
      </div>
    );
  }

  const handleCategorySelection = (id: string, description: string, newCategory: string) => {
    setPendingCategoryUpdate({ id, description, category: newCategory });
  };

  const getBankIcon = (bank?: string) => {
    switch (bank) {
      case 'bb':
        return <Landmark className="h-3 w-3 text-primary" />;
      case 'nubank':
        return <CreditCard className="h-3 w-3 text-accent" />;
      default:
        return <User className="h-3 w-3 text-slate-400" />;
    }
  };

  const getBankName = (bank?: string) => {
    switch (bank) {
      case 'bb': return 'BB';
      case 'nubank': return 'Nubank';
      default: return 'Manual';
    }
  };

  return (
    <>
      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <div className="bg-slate-50/80 px-4 py-2 border-b text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center">
          <span className="flex-1">Detalhes da Transação</span>
          <span className="w-[120px] text-right">Valor</span>
        </div>

        <div className="divide-y divide-slate-100">
          {transactions.map((t) => (
            <div 
              key={t.id} 
              className={`p-4 hover:bg-slate-50/50 transition-colors group relative ${t.isIgnored ? 'opacity-60 grayscale-[0.5]' : ''}`}
            >
              <div className="flex gap-4 items-start">
                <div className="mt-1 shrink-0">
                  {t.type === 'receita' ? (
                    <ArrowUpCircle className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <ArrowDownCircle className="h-5 w-5 text-rose-500" />
                  )}
                </div>

                <div className="flex-1 min-w-0 space-y-2">
                  <div className="w-full">
                    <textarea
                      value={t.description}
                      onChange={(e) => onUpdate(t.id, { description: e.target.value })}
                      className="w-full border-none bg-transparent h-auto p-0 font-semibold text-slate-800 focus-visible:ring-0 focus-visible:bg-white px-1 -ml-1 rounded transition-all text-base overflow-hidden resize-none min-h-[1.5em]"
                      disabled={isIgnoredList}
                      rows={1}
                      onInput={(e) => {
                        const target = e.currentTarget;
                        target.style.height = 'auto';
                        target.style.height = target.scrollHeight + 'px';
                      }}
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{formatDate(t.date)}</span>
                    </div>
                    
                    <div className="flex items-center gap-1.5 shrink-0 bg-slate-100 px-2 py-0.5 rounded-full">
                      {getBankIcon(t.bank)}
                      <span className="font-medium">{getBankName(t.bank)}</span>
                    </div>

                    <div className="flex items-center gap-1 min-w-[140px]">
                      <Tag className="h-3.5 w-3.5 shrink-0" />
                      <Select
                        value={t.category}
                        onValueChange={(val) => handleCategorySelection(t.id, t.description, val)}
                        disabled={isIgnoredList}
                      >
                        <SelectTrigger className="h-6 border-none bg-transparent hover:bg-slate-100 focus:ring-0 shadow-none text-xs font-medium px-1">
                          <SelectValue placeholder="Categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end justify-between self-stretch shrink-0 min-w-[130px]">
                  <div className={`font-bold text-lg tracking-tight ${t.type === 'receita' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {t.type === 'despesa' ? '-' : '+'} {formatCurrency(t.amount)}
                  </div>

                  <div className="flex items-center gap-1">
                    <TooltipProvider>
                      {!isIgnoredList ? (
                        <>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-400 hover:text-orange-500 hover:bg-orange-50"
                                onClick={() => onUpdate(t.id, { isIgnored: true })}
                              >
                                <Ban className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Ignorar transação</TooltipContent>
                          </Tooltip>

                          {onIgnoreSimilar && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-slate-400 hover:text-orange-600 hover:bg-orange-100"
                                  onClick={() => onIgnoreSimilar(t.description)}
                                >
                                  <History className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Ignorar similares sempre</TooltipContent>
                            </Tooltip>
                          )}
                        </>
                      ) : (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-slate-400 hover:text-primary hover:bg-primary/10"
                              onClick={() => onUpdate(t.id, { isIgnored: false })}
                            >
                              <ArrowUpCircle className="h-4 w-4 rotate-180" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Restaurar transação</TooltipContent>
                        </Tooltip>
                      )}
                    </TooltipProvider>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-400 hover:text-destructive hover:bg-destructive/10"
                      onClick={() => onDelete(t.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <AlertDialog open={!!pendingCategoryUpdate} onOpenChange={(open) => !open && setPendingCategoryUpdate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Atualizar transações semelhantes?</AlertDialogTitle>
            <AlertDialogDescription>
              Deseja atualizar a categoria de todas as transações com a descrição "{pendingCategoryUpdate?.description}" para "{pendingCategoryUpdate?.category}" ou apenas esta?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              if (pendingCategoryUpdate) {
                onUpdate(pendingCategoryUpdate.id, { category: pendingCategoryUpdate.category });
              }
              setPendingCategoryUpdate(null);
            }}>
              Apenas esta
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (pendingCategoryUpdate) {
                onUpdate(pendingCategoryUpdate.id, { category: pendingCategoryUpdate.category });
                onUpdateSimilarCategory?.(pendingCategoryUpdate.description, pendingCategoryUpdate.category);
              }
              setPendingCategoryUpdate(null);
            }}>
              Todas as ocorrências
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

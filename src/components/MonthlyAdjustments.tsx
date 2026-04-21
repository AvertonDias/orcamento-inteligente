
"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Plus, 
  Minus,
  Trash2, 
  Calculator, 
  Receipt, 
  X, 
  ListOrdered,
  ChevronDown,
  Search,
  Check
} from 'lucide-react';
import { formatCurrency } from '@/app/lib/formatters';
import { useFirestore, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Transaction } from '@/app/lib/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

interface AdjustmentItem {
  name: string;
  value: number;
  type: 'plus' | 'minus';
}

interface AdjustmentTable {
  id: string;
  name: string;
  baseValue: number;
  items: AdjustmentItem[];
}

interface MonthlyAdjustmentsProps {
  yearMonth: string;
  transactions: Transaction[];
}

export function MonthlyAdjustments({ yearMonth, transactions }: MonthlyAdjustmentsProps) {
  const { user } = useUser();
  const db = useFirestore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedForBase, setSelectedForBase] = useState<string[]>([]);
  const [selectedForItems, setSelectedForItems] = useState<string[]>([]);
  const [isBasePickerOpen, setIsBasePickerOpen] = useState(false);
  const [isItemsPickerOpen, setIsItemsPickerOpen] = useState<string | null>(null); // Table ID

  const adjustmentRef = useMemoFirebase(() => {
    if (!db || !user || !yearMonth) return null;
    return doc(db, 'users', user.uid, 'adjustments', yearMonth);
  }, [db, user, yearMonth]);

  const { data: adjustmentData, isLoading } = useDoc(adjustmentRef);
  const tables: AdjustmentTable[] = adjustmentData?.tables || [];

  const filteredTransactions = transactions.filter(t => 
    t.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = (newTables: AdjustmentTable[]) => {
    if (!adjustmentRef) return;
    setDoc(adjustmentRef, { tables: newTables }, { merge: true });
  };

  const addTable = () => {
    const newTable: AdjustmentTable = {
      id: Math.random().toString(36).substring(2, 9),
      name: 'Novo Cartão/Conta',
      baseValue: 0,
      items: [{ name: '', value: 0, type: 'minus' }]
    };
    handleSave([...tables, newTable]);
  };

  const removeTable = (tableId: string) => {
    handleSave(tables.filter(t => t.id !== tableId));
  };

  const updateTable = (tableId: string, updates: Partial<AdjustmentTable>) => {
    handleSave(tables.map(t => t.id === tableId ? { ...t, ...updates } : t));
  };

  const addItem = (tableId: string) => {
    const table = tables.find(t => t.id === tableId);
    if (!table) return;
    updateTable(tableId, { items: [...table.items, { name: '', value: 0, type: 'minus' }] });
  };

  const removeItem = (tableId: string, itemIndex: number) => {
    const table = tables.find(t => t.id === tableId);
    if (!table) return;
    const newItems = [...table.items];
    newItems.splice(itemIndex, 1);
    updateTable(tableId, { items: newItems });
  };

  const updateItem = (tableId: string, itemIndex: number, updates: Partial<AdjustmentItem>) => {
    const table = tables.find(t => t.id === tableId);
    if (!table) return;
    const newItems = [...table.items];
    newItems[itemIndex] = { ...newItems[itemIndex], ...updates };
    updateTable(tableId, { items: newItems });
  };

  const handleBulkAddBase = (tableId: string) => {
    const selectedTransactions = transactions.filter(t => selectedForBase.includes(t.id));
    const total = selectedTransactions.reduce((acc, t) => acc + t.amount, 0);
    const firstName = selectedTransactions[0]?.description || 'Soma de Lançamentos';
    const name = selectedTransactions.length > 1 ? `Soma: ${firstName} +${selectedTransactions.length - 1}` : firstName;
    
    updateTable(tableId, { baseValue: total, name });
    setSelectedForBase([]);
    setIsBasePickerOpen(false);
  };

  const handleBulkAddItems = (tableId: string) => {
    const table = tables.find(t => t.id === tableId);
    if (!table) return;

    const selectedTransactions = transactions.filter(t => selectedForItems.includes(t.id));
    const newItems: AdjustmentItem[] = selectedTransactions.map(t => ({
      name: t.description,
      value: t.amount,
      type: 'minus'
    }));

    // Filter out empty placeholder item if it exists
    const existingItems = table.items.filter(item => item.name !== '' || item.value !== 0);
    
    updateTable(tableId, { items: [...existingItems, ...newItems] });
    setSelectedForItems([]);
    setIsItemsPickerOpen(null);
  };

  if (isLoading) return null;

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-slate-800">
          <Calculator className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-bold tracking-tight">Calculadoras e Ajustes do Mês</h2>
        </div>
        <Button onClick={addTable} variant="outline" size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Criar Tabela de Ajuste
        </Button>
      </div>

      {tables.length === 0 ? (
        <div className="text-center py-20 bg-white/40 border-2 border-dashed rounded-xl">
          <Receipt className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Nenhum ajuste personalizado neste mês.</p>
          <Button onClick={addTable} variant="link" className="mt-2">Clique aqui para criar uma tabela (ex: Cartão de Crédito)</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {tables.map((table) => {
            const finalTotal = table.items.reduce((acc, item) => {
              const val = item.value || 0;
              return item.type === 'plus' ? acc + val : acc - val;
            }, table.baseValue);

            return (
              <Card key={table.id} className="border-none shadow-lg overflow-hidden bg-white">
                <CardHeader className="bg-slate-50/80 border-b py-3 flex flex-row items-center justify-between">
                  <Input 
                    value={table.name} 
                    onChange={(e) => updateTable(table.id, { name: e.target.value })}
                    className="h-8 border-none bg-transparent font-bold text-slate-700 focus-visible:ring-0 p-0 w-auto"
                  />
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-400" onClick={() => removeTable(table.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-3 mb-6">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Valor Base (Fatura / Inicial)</label>
                    <div className="flex items-center gap-2 bg-sky-50 p-3 rounded-lg border border-sky-100">
                      <Dialog open={isBasePickerOpen} onOpenChange={setIsBasePickerOpen}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 px-2 text-sky-700 hover:bg-sky-100 gap-2 shrink-0">
                            <ListOrdered className="h-4 w-4" />
                            <span>Escolher do Extrato</span>
                            <ChevronDown className="h-3 w-3 opacity-50" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle>Escolher do Extrato</DialogTitle>
                            <DialogDescription>Selecione um ou mais lançamentos para compor o valor base.</DialogDescription>
                          </DialogHeader>
                          <div className="py-4 space-y-4">
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input 
                                placeholder="Pesquisar..." 
                                value={searchTerm} 
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9"
                              />
                            </div>
                            <ScrollArea className="h-64 border rounded-md p-2">
                              {filteredTransactions.map((t) => (
                                <div key={t.id} className="flex items-center space-x-3 p-2 hover:bg-slate-50 rounded-md cursor-pointer" onClick={() => {
                                  if (selectedForBase.includes(t.id)) {
                                    setSelectedForBase(selectedForBase.filter(id => id !== t.id));
                                  } else {
                                    setSelectedForBase([...selectedForBase, t.id]);
                                  }
                                }}>
                                  <Checkbox checked={selectedForBase.includes(t.id)} />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold truncate">{t.description}</p>
                                    <p className="text-[10px] text-muted-foreground">{new Date(t.date).toLocaleDateString()}</p>
                                  </div>
                                  <div className="text-xs font-black">{formatCurrency(t.amount)}</div>
                                </div>
                              ))}
                            </ScrollArea>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => { setSelectedForBase([]); setIsBasePickerOpen(false); }}>Cancelar</Button>
                            <Button disabled={selectedForBase.length === 0} onClick={() => handleBulkAddBase(table.id)}>
                              Confirmar ({selectedForBase.length})
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      <div className="flex-1" />

                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-sky-400">R$</span>
                        <Input 
                          type="number" 
                          value={table.baseValue} 
                          onChange={(e) => updateTable(table.id, { baseValue: parseFloat(e.target.value) || 0 })}
                          className="w-32 h-8 text-right font-bold text-sky-700 bg-white border-sky-200 pl-6"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between px-1">
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ajustes (Somas e Deduções)</label>
                       
                       <Dialog open={isItemsPickerOpen === table.id} onOpenChange={(open) => !open && setIsItemsPickerOpen(null)}>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 text-[10px] font-bold text-primary hover:bg-primary/5 gap-1" onClick={() => setIsItemsPickerOpen(table.id)}>
                            <Plus className="h-3 w-3" />
                            Importar do Extrato
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle>Importar Ajustes</DialogTitle>
                            <DialogDescription>Selecione os lançamentos que deseja adicionar à tabela.</DialogDescription>
                          </DialogHeader>
                          <div className="py-4 space-y-4">
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                              <Input 
                                placeholder="Pesquisar..." 
                                value={searchTerm} 
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9"
                              />
                            </div>
                            <ScrollArea className="h-64 border rounded-md p-2">
                              {filteredTransactions.map((t) => (
                                <div key={t.id} className="flex items-center space-x-3 p-2 hover:bg-slate-50 rounded-md cursor-pointer" onClick={() => {
                                  if (selectedForItems.includes(t.id)) {
                                    setSelectedForItems(selectedForItems.filter(id => id !== t.id));
                                  } else {
                                    setSelectedForItems([...selectedForItems, t.id]);
                                  }
                                }}>
                                  <Checkbox checked={selectedForItems.includes(t.id)} />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold truncate">{t.description}</p>
                                    <p className="text-[10px] text-muted-foreground">{new Date(t.date).toLocaleDateString()}</p>
                                  </div>
                                  <div className="text-xs font-black">{formatCurrency(t.amount)}</div>
                                </div>
                              ))}
                            </ScrollArea>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => { setSelectedForItems([]); setIsItemsPickerOpen(null); }}>Cancelar</Button>
                            <Button disabled={selectedForItems.length === 0} onClick={() => handleBulkAddItems(table.id)}>
                              Adicionar ({selectedForItems.length})
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>

                    {table.items.map((item, idx) => (
                      <div key={idx} className="flex flex-col gap-2 p-2 rounded-lg border border-slate-100 bg-slate-50/30 group">
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className={cn(
                              "h-8 w-8 shrink-0", 
                              item.type === 'plus' ? "text-emerald-500 bg-emerald-50" : "text-rose-500 bg-rose-50"
                            )}
                            onClick={() => updateItem(table.id, idx, { type: item.type === 'plus' ? 'minus' : 'plus' })}
                          >
                            {item.type === 'plus' ? <Plus className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
                          </Button>

                          <div className="flex-1 flex items-center gap-2">
                            <Input 
                              placeholder="Descrição..." 
                              value={item.name} 
                              onChange={(e) => updateItem(table.id, idx, { name: e.target.value })}
                              className="flex-1 h-8 text-sm bg-white"
                            />
                            
                            <DropdownMenu onOpenChange={(open) => !open && setSearchTerm('')}>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-primary shrink-0">
                                  <Search className="h-3.5 w-3.5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="w-80" align="end">
                                <DropdownMenuLabel>Escolher do Extrato</DropdownMenuLabel>
                                <div className="px-2 pb-2">
                                  <div className="relative">
                                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                    <Input 
                                      placeholder="Filtrar por nome..." 
                                      value={searchTerm}
                                      onChange={(e) => setSearchTerm(e.target.value)}
                                      className="h-8 pl-8 text-xs bg-slate-50"
                                      onKeyDown={(e) => e.stopPropagation()}
                                    />
                                  </div>
                                </div>
                                <DropdownMenuSeparator />
                                <ScrollArea className="h-60">
                                  {filteredTransactions.length === 0 ? (
                                    <div className="p-4 text-center text-xs text-muted-foreground">Nenhuma transação encontrada.</div>
                                  ) : (
                                    filteredTransactions.map((t) => (
                                      <DropdownMenuItem 
                                        key={t.id} 
                                        onClick={() => updateItem(table.id, idx, { name: t.description, value: t.amount })}
                                        className="flex flex-col items-start gap-1 py-2 cursor-pointer"
                                      >
                                        <span className="font-semibold text-xs line-clamp-1">{t.description}</span>
                                        <div className="flex justify-between w-full text-[10px] opacity-70">
                                          <span>{new Date(t.date).toLocaleDateString('pt-BR')}</span>
                                          <span className="font-bold">{formatCurrency(t.amount)}</span>
                                        </div>
                                      </DropdownMenuItem>
                                    ))
                                  )}
                                </ScrollArea>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          <div className="relative shrink-0">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">R$</span>
                            <Input 
                              type="number" 
                              placeholder="0,00" 
                              value={item.value} 
                              onChange={(e) => updateItem(table.id, idx, { value: parseFloat(e.target.value) || 0 })}
                              className="w-24 h-8 text-right pl-6 text-sm bg-white"
                            />
                          </div>

                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 text-slate-300 hover:text-rose-500" 
                            onClick={() => removeItem(table.id, idx)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Button variant="ghost" size="sm" className="w-full mt-4 h-8 text-slate-400 hover:text-primary gap-1 border border-dashed border-slate-200" onClick={() => addItem(table.id)}>
                    <Plus className="h-3 w-3" /> Novo Item Manual
                  </Button>

                  <div className="mt-6 pt-4 border-t flex items-center justify-between">
                    <div className="text-xs text-slate-400 font-medium uppercase tracking-tight">Saldo Final Calculado</div>
                    <div className="text-xl font-black text-slate-900">
                      {formatCurrency(finalTotal)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}

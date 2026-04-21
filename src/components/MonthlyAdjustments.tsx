
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Calculator, Receipt, X } from 'lucide-react';
import { formatCurrency } from '@/app/lib/formatters';
import { useFirestore, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';

interface AdjustmentItem {
  name: string;
  value: number;
}

interface AdjustmentTable {
  id: string;
  name: string;
  baseValue: number;
  items: AdjustmentItem[];
}

interface MonthlyAdjustmentsProps {
  yearMonth: string; // Formato: "YYYY-MM"
}

export function MonthlyAdjustments({ yearMonth }: MonthlyAdjustmentsProps) {
  const { user } = useUser();
  const db = useFirestore();

  const adjustmentRef = useMemoFirebase(() => {
    if (!db || !user || !yearMonth) return null;
    return doc(db, 'users', user.uid, 'adjustments', yearMonth);
  }, [db, user, yearMonth]);

  const { data: adjustmentData, isLoading } = useDoc(adjustmentRef);
  const tables: AdjustmentTable[] = adjustmentData?.tables || [];

  const handleSave = (newTables: AdjustmentTable[]) => {
    if (!adjustmentRef) return;
    setDoc(adjustmentRef, { tables: newTables }, { merge: true });
  };

  const addTable = () => {
    const newTable: AdjustmentTable = {
      id: Math.random().toString(36).substring(2, 9),
      name: 'Novo Cartão/Conta',
      baseValue: 0,
      items: [{ name: '', value: 0 }]
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
    updateTable(tableId, { items: [...table.items, { name: '', value: 0 }] });
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
        <div className="text-center py-10 bg-white/40 border-2 border-dashed rounded-xl">
          <Receipt className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Nenhum ajuste personalizado neste mês.</p>
          <Button onClick={addTable} variant="link" className="mt-2">Clique aqui para criar uma tabela (ex: Cartão de Crédito)</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {tables.map((table) => {
            const itemsTotal = table.items.reduce((acc, item) => acc + (item.value || 0), 0);
            const finalTotal = table.baseValue - itemsTotal;

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
                  <div className="flex items-center justify-between mb-4 bg-sky-50 p-3 rounded-lg border border-sky-100">
                    <span className="text-sm font-semibold text-sky-900 uppercase tracking-wider">Valor Base (Fatura)</span>
                    <Input 
                      type="number" 
                      value={table.baseValue} 
                      onChange={(e) => updateTable(table.id, { baseValue: parseFloat(e.target.value) || 0 })}
                      className="w-32 h-8 text-right font-bold text-sky-700 bg-white border-sky-200"
                    />
                  </div>

                  <div className="space-y-2">
                    {table.items.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 group">
                        <Input 
                          placeholder="Ex: Compra do João" 
                          value={item.name} 
                          onChange={(e) => updateItem(table.id, idx, { name: e.target.value })}
                          className="flex-1 h-8 text-sm"
                        />
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">R$</span>
                          <Input 
                            type="number" 
                            placeholder="0,00" 
                            value={item.value} 
                            onChange={(e) => updateItem(table.id, idx, { value: parseFloat(e.target.value) || 0 })}
                            className="w-24 h-8 text-right pl-6 text-sm"
                          />
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100" onClick={() => removeItem(table.id, idx)}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  <Button variant="ghost" size="sm" className="w-full mt-2 h-8 text-slate-400 hover:text-primary gap-1" onClick={() => addItem(table.id)}>
                    <Plus className="h-3 w-3" /> Adicionar Dedução
                  </Button>

                  <div className="mt-6 pt-4 border-t flex items-center justify-between">
                    <div className="text-xs text-slate-400 font-medium uppercase">Saldo Final (Seu Gasto)</div>
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

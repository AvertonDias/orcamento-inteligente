
"use client";

import React, { useState, useMemo } from 'react';
import { DashboardSummary } from '@/components/DashboardSummary';
import { TransactionTable } from '@/components/TransactionTable';
import { CSVImporter } from '@/components/CSVImporter';
import { TransactionFilters } from '@/components/TransactionFilters';
import { FinanceChart } from '@/components/FinanceChart';
import { AnnualSummaryView } from '@/components/AnnualSummaryView';
import { Transaction } from '@/app/lib/types';
import { Toaster } from '@/components/ui/toaster';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PieChart, List, LayoutDashboard, Settings, User, BarChart3, Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export default function Home() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState<number | 'all'>('all');

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const dateObj = new Date(t.date);
      const matchesMonth = selectedMonth === 'all' || dateObj.getMonth() === selectedMonth;
      const matchesSearch = t.description.toLowerCase().includes(search.toLowerCase()) || 
                            t.category.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
      const matchesType = typeFilter === 'all' || t.type === typeFilter;
      return matchesMonth && matchesSearch && matchesCategory && matchesType;
    });
  }, [transactions, selectedMonth, search, categoryFilter, typeFilter]);

  const handleImport = (newTransactions: Transaction[]) => {
    setTransactions((prev) => [...newTransactions, ...prev]);
  };

  const handleUpdate = (id: string, updates: Partial<Transaction>) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  };

  const handleDelete = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  const clearFilters = () => {
    setSearch('');
    setCategoryFilter('all');
    setTypeFilter('all');
    setSelectedMonth('all');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      <header className="bg-white border-b sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary p-1.5 rounded-lg">
              <LayoutDashboard className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-primary">
              Orçamento Inteligente
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <CSVImporter onImport={handleImport} />
            <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity">
              <User className="h-4 w-4 text-primary" />
            </div>
          </div>
        </div>
      </header>

      {/* Barra de Navegação de Meses (Estilo Excel Tabs) */}
      <div className="bg-slate-800 text-white overflow-x-auto no-scrollbar border-b">
        <div className="max-w-7xl mx-auto px-4 flex">
          <button
            onClick={() => setSelectedMonth('all')}
            className={cn(
              "px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 border-transparent hover:bg-slate-700",
              selectedMonth === 'all' && "border-primary bg-slate-700 text-primary-foreground"
            )}
          >
            Todos
          </button>
          {MONTHS.map((month, index) => (
            <button
              key={month}
              onClick={() => setSelectedMonth(index)}
              className={cn(
                "px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 border-transparent hover:bg-slate-700",
                selectedMonth === index && "border-primary bg-slate-700 text-primary-foreground"
              )}
            >
              {month}
            </button>
          ))}
        </div>
      </div>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8">
        <Tabs defaultValue="dashboard" className="space-y-8">
          <div className="flex items-center justify-between border-b pb-4">
            <TabsList className="grid w-full max-w-[400px] grid-cols-2">
              <TabsTrigger value="dashboard" className="flex items-center gap-2">
                <List className="h-4 w-4" />
                Lançamentos
              </TabsTrigger>
              <TabsTrigger value="annual" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Resumo Anual
              </TabsTrigger>
            </TabsList>
            
            <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarIcon className="h-4 w-4" />
              <span>
                {selectedMonth === 'all' ? 'Exibindo todo o período' : `Mês: ${MONTHS[selectedMonth as number]}`}
              </span>
            </div>
          </div>

          <TabsContent value="dashboard" className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <PieChart className="h-4 w-4 text-primary" />
                  Resumo {selectedMonth === 'all' ? 'Geral' : `de ${MONTHS[selectedMonth as number]}`}
                </h2>
              </div>
              <DashboardSummary transactions={filteredTransactions} />
            </section>

            <div className="grid gap-8 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-4">
                <TransactionFilters 
                  search={search}
                  setSearch={setSearch}
                  category={categoryFilter}
                  setCategory={setCategoryFilter}
                  type={typeFilter}
                  setType={setTypeFilter}
                  onClear={clearFilters}
                />
                <TransactionTable 
                  transactions={filteredTransactions} 
                  onUpdate={handleUpdate} 
                  onDelete={handleDelete}
                />
              </div>

              <aside className="space-y-8">
                <section className="space-y-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Settings className="h-4 w-4 text-primary" />
                    Análise por Categoria
                  </h2>
                  <FinanceChart transactions={filteredTransactions} />
                </section>

                <div className="bg-primary/5 p-6 rounded-xl border border-primary/10">
                  <h3 className="font-semibold text-primary mb-2">Dica Financeira</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Navegue pelos meses acima para comparar seu desempenho. A constância na categorização ajuda a IA a ser mais precisa.
                  </p>
                </div>
              </aside>
            </div>
          </TabsContent>

          <TabsContent value="annual" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            <AnnualSummaryView transactions={transactions} />
          </TabsContent>
        </Tabs>
      </main>

      <Toaster />
      
      <footer className="bg-white border-t py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Orçamento Inteligente - Gestão Financeira Moderna
        </div>
      </footer>
    </div>
  );
}

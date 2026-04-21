
"use client";

import React, { useState, useEffect } from 'react';
import { DashboardSummary } from '@/components/DashboardSummary';
import { TransactionTable } from '@/components/TransactionTable';
import { CSVImporter } from '@/components/CSVImporter';
import { TransactionFilters } from '@/components/TransactionFilters';
import { FinanceChart } from '@/components/FinanceChart';
import { Transaction } from '@/app/lib/types';
import { Toaster } from '@/components/ui/toaster';
import { PieChart, List, LayoutDashboard, Settings, User } from 'lucide-react';

export default function Home() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // Filter transactions based on UI state
  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch = t.description.toLowerCase().includes(search.toLowerCase()) || 
                          t.category.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
    const matchesType = typeFilter === 'all' || t.type === typeFilter;
    return matchesSearch && matchesCategory && matchesType;
  });

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
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary p-1.5 rounded-lg">
              <LayoutDashboard className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-xl font-bold font-headline tracking-tight text-primary">
              Orçamento Inteligente
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <CSVImporter onImport={handleImport} />
            <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center cursor-pointer">
              <User className="h-4 w-4 text-primary" />
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar-like layout on large screens */}
      <div className="flex-1 flex flex-col md:flex-row max-w-7xl mx-auto w-full px-4 py-8 gap-8">
        
        {/* Main Content */}
        <div className="flex-1 space-y-8 animate-in fade-in duration-500">
          
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <PieChart className="h-4 w-4 text-primary" />
                Resumo do Período
              </h2>
            </div>
            <DashboardSummary transactions={filteredTransactions} />
          </section>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* List and Filters */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <List className="h-4 w-4 text-primary" />
                  Transações
                </h2>
              </div>

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

            {/* Sidebar Charts */}
            <aside className="space-y-8">
              <section className="space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Settings className="h-4 w-4 text-primary" />
                  Análise
                </h2>
                <FinanceChart transactions={filteredTransactions} />
              </section>

              <div className="bg-primary/5 p-6 rounded-xl border border-primary/10">
                <h3 className="font-semibold text-primary mb-2">Dica Inteligente</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Sua categorização automática é feita via IA. Ajuste as categorias para treinar sua visão financeira!
                </p>
              </div>
            </aside>
          </div>
        </div>
      </div>

      <Toaster />
      
      <footer className="bg-white border-t py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Orçamento Inteligente - Gestão Financeira Moderna
        </div>
      </footer>
    </div>
  );
}

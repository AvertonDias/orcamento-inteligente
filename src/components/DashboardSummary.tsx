
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Wallet, PieChart } from 'lucide-react';
import { formatCurrency } from '@/app/lib/formatters';
import { Transaction } from '@/app/lib/types';

interface DashboardSummaryProps {
  transactions: Transaction[];
}

export function DashboardSummary({ transactions }: DashboardSummaryProps) {
  const income = transactions
    .filter(t => t.type === 'receita')
    .reduce((acc, t) => acc + t.amount, 0);

  const expenses = transactions
    .filter(t => t.type === 'despesa')
    .reduce((acc, t) => acc + t.amount, 0);

  const balance = income - expenses;

  const stats = [
    {
      title: 'Receitas',
      value: income,
      icon: TrendingUp,
      color: 'text-emerald-500',
      bg: 'bg-emerald-50'
    },
    {
      title: 'Despesas',
      value: expenses,
      icon: TrendingDown,
      color: 'text-rose-500',
      bg: 'bg-rose-50'
    },
    {
      title: 'Saldo Atual',
      value: balance,
      icon: Wallet,
      color: balance >= 0 ? 'text-blue-500' : 'text-rose-600',
      bg: 'bg-blue-50'
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {stats.map((stat, idx) => (
        <Card key={idx} className="overflow-hidden border-none shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <div className={`p-2 rounded-full ${stat.bg}`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stat.color}`}>
              {formatCurrency(stat.value)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Refletindo o total das transações filtradas
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

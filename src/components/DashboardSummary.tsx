
"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
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
      title: 'Saldo',
      value: balance,
      icon: Wallet,
      color: balance >= 0 ? 'text-blue-500' : 'text-rose-600',
      bg: 'bg-blue-50'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
      {stats.map((stat, idx) => (
        <Card key={idx} className="overflow-hidden border-none shadow-sm sm:shadow-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 sm:p-4 pb-1 sm:pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-slate-500">{stat.title}</CardTitle>
            <div className={`p-1.5 sm:p-2 rounded-full ${stat.bg}`}>
              <stat.icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className={`text-xl sm:text-2xl font-bold ${stat.color} truncate`}>
              {formatCurrency(stat.value)}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

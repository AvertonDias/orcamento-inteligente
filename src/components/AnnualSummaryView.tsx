
"use client";

import React, { useMemo } from 'react';
import { Transaction } from '@/app/lib/types';
import { formatCurrency } from '@/app/lib/formatters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';

interface AnnualSummaryViewProps {
  transactions: Transaction[];
}

const MONTHS = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
];

export function AnnualSummaryView({ transactions }: AnnualSummaryViewProps) {
  const monthlyData = useMemo(() => {
    const data = MONTHS.map((month, index) => ({
      name: month,
      receita: 0,
      despesa: 0,
      saldo: 0,
      monthIndex: index
    }));

    transactions.forEach(t => {
      const date = new Date(t.date);
      if (!isNaN(date.getTime())) {
        const monthIndex = date.getMonth();
        if (t.type === 'receita') {
          data[monthIndex].receita += t.amount;
        } else {
          data[monthIndex].despesa += t.amount;
        }
      }
    });

    return data.map(d => ({
      ...d,
      saldo: d.receita - d.despesa
    }));
  }, [transactions]);

  const totals = useMemo(() => {
    return monthlyData.reduce((acc, curr) => ({
      receita: acc.receita + curr.receita,
      despesa: acc.despesa + curr.despesa,
      saldo: acc.saldo + curr.saldo
    }), { receita: 0, despesa: 0, saldo: 0 });
  }, [monthlyData]);

  const categoryData = useMemo(() => {
    const categories: Record<string, number> = {};
    transactions.forEach(t => {
      if (t.type === 'despesa') {
        categories[t.category] = (categories[t.category] || 0) + t.amount;
      }
    });
    return Object.entries(categories)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [transactions]);

  return (
    <div className="space-y-8">
      {/* Cards de Totais Anuais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Receita Total Anual</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totals.receita)}</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Despesa Total Anual</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-rose-600">{formatCurrency(totals.despesa)}</p>
          </CardContent>
        </Card>
        <Card className="bg-white border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Saldo Anual</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${totals.saldo >= 0 ? 'text-blue-600' : 'text-rose-700'}`}>
              {formatCurrency(totals.saldo)}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-primary text-primary-foreground border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase opacity-80">Maior Despesa</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {categoryData[0]?.name || 'N/A'}
            </p>
            <p className="text-xs opacity-80">{categoryData[0] ? formatCurrency(categoryData[0].value) : ''}</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico Mensal */}
      <Card className="border-none shadow-md overflow-hidden bg-white">
        <CardHeader>
          <CardTitle className="text-lg font-bold">Fluxo de Caixa por Mês</CardTitle>
        </CardHeader>
        <CardContent className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#888', fontSize: 12 }} />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#888', fontSize: 12 }} 
                tickFormatter={(val) => `R$ ${val >= 1000 ? (val/1000).toFixed(0) + 'k' : val}`}
              />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                formatter={(value: number) => formatCurrency(value)}
              />
              <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 500 }} />
              <Bar name="Receita" dataKey="receita" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} barSize={20} />
              <Bar name="Despesa" dataKey="despesa" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} barSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Detalhamento por Mês */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {monthlyData.filter(d => d.receita > 0 || d.despesa > 0).map((m, idx) => (
          <Card key={idx} className="bg-white border-none shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="bg-slate-50/50 border-b py-3 px-4">
              <CardTitle className="text-sm font-bold text-primary flex justify-between">
                <span>{m.name}</span>
                <span className={m.saldo >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                  {m.saldo >= 0 ? '+' : ''}{formatCurrency(m.saldo)}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Receitas:</span>
                <span className="font-medium text-emerald-600">{formatCurrency(m.receita)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Despesas:</span>
                <span className="font-medium text-rose-600">{formatCurrency(m.despesa)}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
